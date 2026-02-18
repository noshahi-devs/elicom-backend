using Abp.Application.Services;
using Abp.Domain.Repositories;
using Abp.UI;
using Elicom.Entities;
using Elicom.Wallets;
using Elicom.Orders.Dto;
using Elicom.SupplierOrders.Dto;
using Abp.Net.Mail;
using Abp.Authorization;
using Elicom.Authorization;
using Abp.Domain.Uow;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Elicom.Cards;
using Abp.BackgroundJobs;
using Elicom.BackgroundJobs;
using Elicom.Orders.BackgroundJobs;

namespace Elicom.Orders
{
    public class OrderAppService : ElicomAppServiceBase, IOrderAppService
    {
        private readonly IRepository<Order, Guid> _orderRepository;
        private readonly IRepository<CartItem, Guid> _cartItemRepository;
        private readonly IRepository<SupplierOrder, Guid> _supplierOrderRepository;
        private readonly IRepository<StoreProduct, Guid> _storeProductRepository;
        private readonly IRepository<Carrier, int> _carrierRepository;
        private readonly IRepository<AppTransaction, long> _appTransactionRepository;
        private readonly IWalletManager _walletManager;
        private readonly IEmailSender _emailSender;
        private readonly ICardAppService _cardAppService;
        private readonly ISmartStoreWalletManager _smartStoreWalletManager;
        private readonly IBackgroundJobManager _backgroundJobManager;

        private const long PlatformAdminId = 1; // The system account that holds Escrow funds

        public OrderAppService(
            IRepository<Order, Guid> orderRepository,
            IRepository<CartItem, Guid> cartItemRepository,
            IRepository<SupplierOrder, Guid> supplierOrderRepository,
            IRepository<StoreProduct, Guid> storeProductRepository,
            IRepository<Carrier, int> carrierRepository,
            IRepository<AppTransaction, long> appTransactionRepository,
            IWalletManager walletManager,
            IEmailSender emailSender,
            ICardAppService cardAppService,
            ISmartStoreWalletManager smartStoreWalletManager,
            IBackgroundJobManager backgroundJobManager)
        {
            _orderRepository = orderRepository;
            _cartItemRepository = cartItemRepository;
            _supplierOrderRepository = supplierOrderRepository;
            _storeProductRepository = storeProductRepository;
            _carrierRepository = carrierRepository;
            _appTransactionRepository = appTransactionRepository;
            _walletManager = walletManager;
            _emailSender = emailSender;
            _cardAppService = cardAppService;
            _smartStoreWalletManager = smartStoreWalletManager;
            _backgroundJobManager = backgroundJobManager;
        }

        // Create order from cart
        public async Task<OrderDto> Create(CreateOrderDto input)
        {
            // STEP 1: Fetch cart items (quick query)
            List<CartItem> cartItems;
            using (UnitOfWorkManager.Current.DisableFilter(AbpDataFilters.MayHaveTenant, AbpDataFilters.MustHaveTenant))
            {
                Logger.Info($"[OrderAppService] Create Order for UserId: {input.UserId}");
                
                cartItems = await _cartItemRepository.GetAll()
                    .Include(ci => ci.StoreProduct)
                        .ThenInclude(sp => sp.Product)
                    .Include(ci => ci.StoreProduct)
                        .ThenInclude(sp => sp.Store)
                    .Where(ci =>
                        ci.UserId == input.UserId &&
                        ci.Status == "Active")
                    .ToListAsync();

                Logger.Info($"[OrderAppService] Found {cartItems.Count} cart items for UserId: {input.UserId}");
                foreach(var c in cartItems) {
                    Logger.Info($" - CartItem: {c.Id}, StoreProductId: {c.StoreProductId}");
                }
            }

            if (!cartItems.Any())
                throw new UserFriendlyException("Cart is empty");

            var user = await UserManager.FindByIdAsync(input.UserId.ToString());
            if (user == null)
                throw new UserFriendlyException("User not found.");

            var subTotal = cartItems.Sum(i => i.Price * i.Quantity);
            var totalAmount = subTotal + input.ShippingCost - input.Discount;

            // STEP 2: Process Payment OUTSIDE transaction (this can take 16+ seconds)
            var isExternalPayment = new[] { "finora", "mastercard", "discover", "amex", "visa", "bank_transfer", "crypto", "google_pay" }
                .Any(p => input.PaymentMethod?.ToLower().Contains(p) == true);

            string paymentStatus = "Pending";

            if (input.PaymentMethod == "Wallet" || (input.SourcePlatform == "SmartStore" && !isExternalPayment))
            {
                // Wallet payment - validate balance
                var balance = await _walletManager.GetBalanceAsync(user.Id);
                if (balance < totalAmount)
                {
                    throw new UserFriendlyException("Insufficient funds in Wallet to place this order.");
                }
                paymentStatus = "Held in Escrow"; // Will transfer in transaction
            }
            else if (input.PaymentMethod?.ToLower().Contains("finora") == true)
            {
                // External Payment - Process BEFORE creating order
                Logger.Info($"[OrderAppService] Processing Finora payment for amount: {totalAmount}");
                
                var validationResult = await _cardAppService.ValidateCard(new ValidateCardInput
                {
                    CardNumber = input.CardNumber,
                    Cvv = input.Cvv,
                    ExpiryDate = input.ExpiryDate,
                    Amount = totalAmount
                });

                if (!validationResult.IsValid)
                {
                    throw new UserFriendlyException($"Finora Payment Failed: {validationResult.Message}");
                }

                // Process Payment (this is the slow part - 16+ seconds)
                await _cardAppService.ProcessPayment(new ProcessCardPaymentInput
                {
                    CardNumber = input.CardNumber,
                    Cvv = input.Cvv,
                    ExpiryDate = input.ExpiryDate,
                    Amount = totalAmount,
                    ReferenceId = $"ORD-{DateTime.Now:yyyyMMddHHmmss}", // Temp reference
                    Description = $"Payment for order"
                });

                paymentStatus = "Paid (Easy Finora)";
                Logger.Info($"[OrderAppService] Finora payment successful");
            }
            else
            {
                // Other External Payment
                paymentStatus = "Paid (External)";
            }

            // STEP 3: Create Order in Database Transaction (fast)
            Order order;
            using (UnitOfWorkManager.Current.DisableFilter(AbpDataFilters.MayHaveTenant, AbpDataFilters.MustHaveTenant))
            {
                order = new Order
                {
                    UserId = input.UserId,
                    OrderNumber = $"ORD-{DateTime.Now:yyyyMMddHHmmss}",
                    PaymentMethod = input.PaymentMethod,

                    ShippingAddress = input.ShippingAddress,
                    Country = input.Country,
                    State = input.State,
                    City = input.City,
                    PostalCode = input.PostalCode,
                    
                    RecipientName = input.RecipientName,
                    RecipientPhone = input.RecipientPhone,
                    RecipientEmail = input.RecipientEmail,

                    SubTotal = subTotal,
                    ShippingCost = input.ShippingCost,
                    Discount = input.Discount,
                    TotalAmount = totalAmount,

                    Status = "Pending",
                    PaymentStatus = paymentStatus,
                    SourcePlatform = input.SourcePlatform ?? "SmartStore",
                    OrderItems = new List<OrderItem>()
                };

                order.Id = Guid.NewGuid();
                await _orderRepository.InsertAsync(order);

                // Process wallet transfer if needed (inside transaction for consistency)
                if (input.PaymentMethod == "Wallet" || (order.SourcePlatform == "SmartStore" && !isExternalPayment))
                {
                    await _walletManager.TransferAsync(
                        user.Id, 
                        PlatformAdminId, 
                        order.TotalAmount, 
                        $"Escrow Hold for Order {order.OrderNumber}"
                    );
                }

                // Create supplier orders and order items
                foreach (var group in cartItems.GroupBy(ci => ci.StoreProduct.Product.SupplierId))
                {
                    var supplierId = group.Key.GetValueOrDefault();
                    var supplierOrder = new SupplierOrder
                    {
                        SupplierId = supplierId,
                        OrderId = order.Id,
                        ReferenceCode = $"SUP-{DateTime.Now:yyyyMMddHHmmss}-{supplierId}",
                        Status = "Purchased",
                        TotalPurchaseAmount = group.Sum(ci => ci.StoreProduct.Product.SupplierPrice * ci.Quantity),
                        CustomerName = user.Name,
                        ShippingAddress = input.ShippingAddress,
                        SourcePlatform = order.SourcePlatform,
                        Items = new List<SupplierOrderItem>()
                    };

                    foreach (var ci in group)
                    {
                        supplierOrder.Items.Add(new SupplierOrderItem
                        {
                            ProductId = ci.StoreProduct.ProductId,
                            Quantity = ci.Quantity,
                            PurchasePrice = ci.StoreProduct.Product.SupplierPrice
                        });

                        order.OrderItems.Add(new OrderItem
                        {
                            StoreProductId = ci.StoreProductId,
                            ProductId = ci.StoreProduct.ProductId,
                            Quantity = ci.Quantity,
                            PriceAtPurchase = ci.Price,
                            ProductName = ci.StoreProduct.Product.Name,
                            StoreName = ci.StoreProduct.Store.Name
                        });
                    }
                    await _supplierOrderRepository.InsertAsync(supplierOrder);
                }

                await CurrentUnitOfWork.SaveChangesAsync();

                // Clear cart
                foreach (var ci in cartItems)
                {
                    await _cartItemRepository.DeleteAsync(ci.Id);
                }

                await CurrentUnitOfWork.SaveChangesAsync();
            }

            // STEP 4: Send emails AFTER transaction completes (now via Background Job)
            await _backgroundJobManager.EnqueueAsync<OrderEmailJob, OrderEmailJobArgs>(new OrderEmailJobArgs { OrderId = order.Id });

            return ObjectMapper.Map<OrderDto>(order);
        }

        // Get single order
        public async Task<OrderDto> Get(Guid id)
        {
            var order = await _orderRepository.GetAll()
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == id);

            return ObjectMapper.Map<OrderDto>(order);
        }

        // Get all orders (Admin - fetches all retail orders)
        public async Task<List<OrderDto>> GetAll()
        {
            using (UnitOfWorkManager.Current.DisableFilter(AbpDataFilters.MayHaveTenant))
            {
                var orders = await _orderRepository.GetAll()
                    .Include(o => o.OrderItems)
                    .OrderByDescending(o => o.CreationTime)
                    .ToListAsync();

                return ObjectMapper.Map<List<OrderDto>>(orders);
            }
        }

        // Get all orders for customer
        public async Task<List<OrderDto>> GetAllForCustomer(long userId)
        {
            using (UnitOfWorkManager.Current.DisableFilter(AbpDataFilters.MayHaveTenant))
            {
                var orders = await _orderRepository.GetAll()
                    .Include(o => o.OrderItems)
                    .Where(o => o.UserId == userId)
                    .ToListAsync();

                return ObjectMapper.Map<List<OrderDto>>(orders);
            }
        }

        [AbpAuthorize(PermissionNames.Pages_SmartStore_Seller)]
        public async Task<List<OrderDto>> GetByStore(Guid storeId)
        {
            var orders = await _orderRepository.GetAll()
                .Include(o => o.OrderItems)
                .Where(o => o.OrderItems.Any(oi => _storeProductRepository.GetAll().Any(sp => sp.Id == oi.StoreProductId && sp.StoreId == storeId)))
                .OrderByDescending(o => o.CreationTime)
                .ToListAsync();

            return ObjectMapper.Map<List<OrderDto>>(orders);
        }


        [AbpAuthorize(PermissionNames.Pages_SmartStore_Seller)]
        public async Task<OrderDto> Fulfill(FulfillOrderDto input)
        {
            var order = await _orderRepository.GetAsync(input.Id);
            if (order == null)
                throw new UserFriendlyException("Order not found");

            if (order.Status != "Pending")
                throw new UserFriendlyException("Only pending orders can be fulfilled");

            // Role Guard: Ensure only the order's seller can fulfill it
            // (Simplification: Checking if ANY item in the order belongs to the seller)
            var user = await GetCurrentUserAsync();
            var sellerItems = await _orderRepository.GetAll()
                .Where(o => o.Id == order.Id)
                .SelectMany(o => o.OrderItems)
                .Select(oi => oi.StoreProductId)
                .ToListAsync();

            var anySellerItem = await _storeProductRepository.GetAll()
                .AnyAsync(sp => sellerItems.Contains(sp.Id) && sp.Store.OwnerId == user.Id);

            if (!anySellerItem && !IsGranted(PermissionNames.Pages_PrimeShip_Admin))
                 throw new UserFriendlyException("You are not authorized to fulfill this order.");

            order.ShipmentDate = input.ShipmentDate;
            order.CarrierId = input.CarrierId;
            order.TrackingCode = input.TrackingCode;
            order.Status = "PendingVerification";

            await _orderRepository.UpdateAsync(order);
            await CurrentUnitOfWork.SaveChangesAsync();

            return ObjectMapper.Map<OrderDto>(order);
        }

        [AbpAuthorize(PermissionNames.Pages_PrimeShip_Admin)]
        public async Task<OrderDto> Verify(VerifyOrderDto input)
        {
            var order = await _orderRepository.GetAsync(input.Id);
            if (order == null)
                throw new UserFriendlyException("Order not found");

            if (order.Status != "PendingVerification")
                throw new UserFriendlyException("Order is not in PendingVerification state");

            order.Status = "Verified";

            // Transaction Generation
            var storeItems = await _orderRepository.GetAll()
                .Where(o => o.Id == order.Id)
                .SelectMany(o => o.OrderItems)
                .Select(oi => new { oi.PriceAtPurchase, oi.Quantity, oi.StoreProductId })
                .ToListAsync();

            foreach (var item in storeItems)
            {
                var storeProduct = await _storeProductRepository.GetAll()
                    .Include(sp => sp.Store)
                    .FirstOrDefaultAsync(sp => sp.Id == item.StoreProductId);

                if (storeProduct != null)
                {
                    var sellerAmount = item.PriceAtPurchase * item.Quantity;
                    var feeAmount = sellerAmount * 0.1m; // 10% Platform Fee example

                    // Seller Sale Transaction (Pending)
                    await _appTransactionRepository.InsertAsync(new AppTransaction
                    {
                        UserId = storeProduct.Store.OwnerId,
                        Amount = sellerAmount - feeAmount,
                        MovementType = "Credit",
                        Category = "Sale",
                        ReferenceId = order.OrderNumber,
                        OrderId = order.Id,
                        Status = "Pending",
                        Description = $"Proceeds from Order {order.OrderNumber} (Less Fee)"
                    });

                    // Platform Fee Transaction (Approved/Internal)
                    await _appTransactionRepository.InsertAsync(new AppTransaction
                    {
                        UserId = PlatformAdminId,
                        Amount = feeAmount,
                        MovementType = "Credit",
                        Category = "Fee",
                        ReferenceId = order.OrderNumber,
                        OrderId = order.Id,
                        Status = "Approved",
                        Description = $"Platform Fee from Order {order.OrderNumber}"
                    });

                    // NEW: Dedicated SmartStore Wallet Persistence
                    await _smartStoreWalletManager.CreditAsync(
                        storeProduct.Store.OwnerId,
                        sellerAmount - feeAmount,
                        order.OrderNumber,
                        $"Proceeds from Verified Order {order.OrderNumber}"
                    );
                }
            }

            await _orderRepository.UpdateAsync(order);
            await CurrentUnitOfWork.SaveChangesAsync();

            // Notify Seller
            // (Implementation omitted for brevity, similar to SendOrderPlacementEmails)

            return ObjectMapper.Map<OrderDto>(order);
        }

        [AbpAuthorize(PermissionNames.Pages_PrimeShip_Admin)]
        public async Task<OrderDto> Deliver(Guid id)
        {
            var order = await _orderRepository.GetAsync(id);
            if (order == null)
                throw new UserFriendlyException("Order not found");

            if (order.Status != "Verified")
                throw new UserFriendlyException("Order must be Verified before it can be marked as Delivered");

            order.Status = "Delivered";
            order.PaymentStatus = "Completed";

            // Payment Release: Approve all Pending transactions for this OrderId
            var pendingTransactions = await _appTransactionRepository.GetAll()
                .Where(t => t.OrderId == id && t.Status == "Pending")
                .ToListAsync();

            foreach (var trans in pendingTransactions)
            {
                trans.Status = "Approved";
                
                // Also update the actual wallet balance
                await _walletManager.DepositAsync(
                    trans.UserId,
                    trans.Amount,
                    trans.ReferenceId,
                    $"Payment Release: {trans.Description}"
                );
            }

            await _orderRepository.UpdateAsync(order);
            await CurrentUnitOfWork.SaveChangesAsync();

            return ObjectMapper.Map<OrderDto>(order);
        }

        public async Task<OrderDto> Cancel(Guid id)
        {
            var order = await _orderRepository.GetAsync(id);
            if (order == null)
                throw new UserFriendlyException("Order not found");

            if (order.Status == "Delivered" || order.Status == "Cancelled")
                throw new UserFriendlyException($"Cannot cancel an order that is already {order.Status}");

            // Refund logic if payment was held in escrow
            if (order.PaymentStatus == "Held in Escrow")
            {
                await _walletManager.TransferAsync(
                    PlatformAdminId,
                    order.UserId,
                    order.TotalAmount,
                    $"Refund for Cancelled Order {order.OrderNumber}"
                );
                order.PaymentStatus = "Refunded (Escrow)";
            }

            order.Status = "Cancelled";
            await _orderRepository.UpdateAsync(order);
            await CurrentUnitOfWork.SaveChangesAsync();

            return ObjectMapper.Map<OrderDto>(order);
        }

        public async Task<List<CarrierDto>> GetCarriers()
        {
            var carriers = await _carrierRepository.GetAll()
                .Where(c => c.IsActive)
                .ToListAsync();

            return ObjectMapper.Map<List<CarrierDto>>(carriers);
        }


        private async Task SendEmailAsync(string to, string subject, string body)
        {
            try
            {
                var mail = new System.Net.Mail.MailMessage("no-reply@primeshipuk.com", to)
                {
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = true
                };
                await _emailSender.SendAsync(mail);
            }
            catch (Exception ex)
            {
                Logger.Error($"Email error to {to}: {ex.Message}");
            }
        }

        private async Task FinalizeOrder(Order order)
        {
            // --- ESCROW RELEASE: Release funds from Admin to Seller ---
            // 1. Group items by their Store Owner
            var itemsWithStore = await _orderRepository.GetAll()
                .Where(o => o.Id == order.Id)
                .SelectMany(o => o.OrderItems)
                .Select(oi => new
                {
                    oi.PriceAtPurchase,
                    oi.Quantity,
                    oi.StoreProductId
                })
                .ToListAsync();

            // We need to fetch the Store owners for these items
            var sellerPayments = new Dictionary<long, decimal>();
            foreach (var item in itemsWithStore)
            {
                var storeProduct = await _storeProductRepository.GetAll()
                    .Include(sp => sp.Store)
                    .FirstOrDefaultAsync(sp => sp.Id == item.StoreProductId);

                if (storeProduct != null && storeProduct.Store != null)
                {
                    var ownerId = storeProduct.Store.OwnerId;
                    var amount = item.PriceAtPurchase * item.Quantity;

                    if (sellerPayments.ContainsKey(ownerId))
                        sellerPayments[ownerId] += amount;
                    else
                        sellerPayments[ownerId] = amount;
                }
            }

            // 2. Transfer from Admin to each Seller
            foreach (var sellerPay in sellerPayments)
            {
                await _walletManager.TransferAsync(
                    PlatformAdminId,
                    sellerPay.Key,
                    sellerPay.Value,
                    $"Escrow Release (Retail Sale): {order.OrderNumber}"
                );
            }

            // --- SUPPLEIR SETTLEMENT (Internal Sync) ---
            var supplierOrders = await _supplierOrderRepository.GetAll()
                .Include(so => so.Items)
                .Where(so => so.OrderId == order.Id)
                .ToListAsync();

            foreach (var so in supplierOrders)
            {
                // In the Manual Bridge model, the Seller already purchased/paid the Supplier in PrimeShip.
                // We just mark this record as Settled to close the sync loop.
                so.Status = "Settled";
                await _supplierOrderRepository.UpdateAsync(so);

                // Notify Admin
                try
                {
                    var mail = new System.Net.Mail.MailMessage(
                        "no-reply@primeshipuk.com",
                        "noshahidevelopersinc@gmail.com"
                    )
                    {
                        Subject = $"[SmartStore] Order Finalized: {order.OrderNumber}",
                        Body = $"Retail order {order.OrderNumber} has been delivered and funds released to Seller(s).",
                        IsBodyHtml = false
                    };
                    await _emailSender.SendAsync(mail);
                }
                catch (Exception ex)
                {
                    Logger.Error("Email failed: " + ex.Message);
                }
            }
        }
    }
}
