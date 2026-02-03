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

namespace Elicom.Orders
{
    public class OrderAppService : ElicomAppServiceBase, IOrderAppService
    {
        private readonly IRepository<Order, Guid> _orderRepository;
        private readonly IRepository<CartItem, Guid> _cartItemRepository;
        private readonly IRepository<SupplierOrder, Guid> _supplierOrderRepository;
        private readonly IRepository<StoreProduct, Guid> _storeProductRepository;
        private readonly IWalletManager _walletManager;
        private readonly IEmailSender _emailSender;
        private readonly ICardAppService _cardAppService;

        private const long PlatformAdminId = 1; // The system account that holds Escrow funds

        public OrderAppService(
            IRepository<Order, Guid> orderRepository,
            IRepository<CartItem, Guid> cartItemRepository,
            IRepository<SupplierOrder, Guid> supplierOrderRepository,
            IRepository<StoreProduct, Guid> storeProductRepository,
            IWalletManager walletManager,
            IEmailSender emailSender,
            ICardAppService cardAppService)
        {
            _orderRepository = orderRepository;
            _cartItemRepository = cartItemRepository;
            _supplierOrderRepository = supplierOrderRepository;
            _storeProductRepository = storeProductRepository;
            _walletManager = walletManager;
            _emailSender = emailSender;
            _cardAppService = cardAppService;
        }

        // Create order from cart
        public async Task<OrderDto> Create(CreateOrderDto input)
        {
            List<CartItem> cartItems;
            using (CurrentUnitOfWork.DisableFilter(AbpDataFilters.MayHaveTenant))
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

            var subTotal = cartItems.Sum(i => i.Price * i.Quantity);

            var order = new Order
            {
                UserId = input.UserId,
                OrderNumber = $"ORD-{DateTime.Now:yyyyMMddHHmmss}",
                PaymentMethod = input.PaymentMethod,

                ShippingAddress = input.ShippingAddress,
                Country = input.Country,
                State = input.State,
                City = input.City,
                PostalCode = input.PostalCode,

                SubTotal = subTotal,
                ShippingCost = input.ShippingCost,
                Discount = input.Discount,
                TotalAmount = subTotal + input.ShippingCost - input.Discount,

                Status = "Pending",
                PaymentStatus = "Pending",
                SourcePlatform = input.SourcePlatform ?? "SmartStore",
                OrderItems = new List<OrderItem>()
            };

            var user = await GetCurrentUserAsync(); 

            // ESCROW TRANSACTION: Move money from Buyer to Platform Admin (Escrow Hold)
            // Skip wallet check if using external payment methods like "finora" or cards
            var isExternalPayment = new[] { "finora", "mastercard", "discover", "amex", "visa", "bank_transfer", "crypto", "google_pay" }
                .Any(p => input.PaymentMethod?.ToLower().Contains(p) == true);

            if (input.PaymentMethod == "Wallet" || (order.SourcePlatform == "SmartStore" && !isExternalPayment))
            {
                var balance = await _walletManager.GetBalanceAsync(user.Id);
                if (balance < order.TotalAmount)
                {
                    throw new UserFriendlyException("Insufficient funds in Wallet to place this order.");
                }

                await _walletManager.TransferAsync(
                    user.Id, 
                    PlatformAdminId, 
                    order.TotalAmount, 
                    $"Escrow Hold for Order {order.OrderNumber}"
                );

                order.PaymentStatus = "Held in Escrow";
            }
            else
            {
                // External Payment (Card, Crypto, etc.)
                if (input.PaymentMethod?.ToLower().Contains("finora") == true)
                {
                    // Real verification using CardAppService
                    var validationResult = await _cardAppService.ValidateCard(new ValidateCardInput
                    {
                        CardNumber = input.CardNumber,
                        Cvv = input.Cvv,
                        ExpiryDate = input.ExpiryDate,
                        Amount = order.TotalAmount
                    });

                    if (!validationResult.IsValid)
                    {
                        throw new UserFriendlyException($"Finora Payment Failed: {validationResult.Message}");
                    }

                    // Process Payment
                    await _cardAppService.ProcessPayment(new ProcessCardPaymentInput
                    {
                        CardNumber = input.CardNumber,
                        Cvv = input.Cvv,
                        ExpiryDate = input.ExpiryDate,
                        Amount = order.TotalAmount,
                        ReferenceId = order.OrderNumber,
                        Description = $"Payment for Order {order.OrderNumber}"
                    });

                    order.PaymentStatus = "Paid (Easy Finora)";
                }
                else
                {
                    // Other External Payment (Card, Crypto, etc.)
                    // In a real app, verify with gateway here
                    order.PaymentStatus = "Paid (External)";
                }
            }

            foreach (var ci in cartItems)
            {
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

            await _orderRepository.InsertAsync(order);
            await CurrentUnitOfWork.SaveChangesAsync();

            foreach (var ci in cartItems)
            {
                await _cartItemRepository.DeleteAsync(ci.Id);
            }

            // --- NOTIFICATIONS ---
            await SendOrderPlacementEmails(order, cartItems);

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
            var orders = await _orderRepository.GetAll()
                .Include(o => o.OrderItems)
                .OrderByDescending(o => o.CreationTime)
                .ToListAsync();

            return ObjectMapper.Map<List<OrderDto>>(orders);
        }

        // Get all orders for customer
        public async Task<List<OrderDto>> GetAllForCustomer(long userId)
        {
            var orders = await _orderRepository.GetAll()
                .Include(o => o.OrderItems)
                .Where(o => o.UserId == userId)
                .ToListAsync();

            return ObjectMapper.Map<List<OrderDto>>(orders);
        }

        public async Task<List<OrderDto>> GetByStore(Guid storeId)
        {
            var orders = await _orderRepository.GetAll()
                .Include(o => o.OrderItems)
                .Where(o => o.OrderItems.Any(oi => _storeProductRepository.GetAll().Any(sp => sp.Id == oi.StoreProductId && sp.StoreId == storeId)))
                .OrderByDescending(o => o.CreationTime)
                .ToListAsync();

            return ObjectMapper.Map<List<OrderDto>>(orders);
        }

        public async Task<OrderDto> MarkAsProcessing(MarkOrderProcessingDto input)
        {
            var order = await _orderRepository.GetAsync(input.Id);
            if (order == null)
                throw new UserFriendlyException("Order not found");

            if (order.Status != "Pending")
                throw new UserFriendlyException("Only pending orders can be processed");

            order.SupplierReference = input.SupplierReference;
            order.Status = "Processing";

            await _orderRepository.UpdateAsync(order);
            await CurrentUnitOfWork.SaveChangesAsync();

            return ObjectMapper.Map<OrderDto>(order);
        }

        [AbpAuthorize(PermissionNames.Pages_SmartStore_Seller)]
        public async Task<OrderDto> LinkWholesaleOrder(LinkWholesaleOrderDto input)
        {
            var user = await GetCurrentUserAsync();

            // 1. Find the wholesale order (Prime Ship)
            var wholesaleOrder = await _supplierOrderRepository.GetAll()
                .FirstOrDefaultAsync(so => so.ReferenceCode == input.WholesaleReferenceCode);

            if (wholesaleOrder == null)
                throw new UserFriendlyException("Wholesale Reference Code not found in Prime Ship.");

            if (wholesaleOrder.ResellerId != user.Id)
                throw new UserFriendlyException("This wholesale order does not belong to you.");

            // 2. Find the retail order (Smart Store)
            var retailOrder = await _orderRepository.GetAsync(input.OrderId);
            if (retailOrder == null)
                throw new UserFriendlyException("Retail Order not found.");

            // 3. Link them
            retailOrder.SupplierReference = input.WholesaleReferenceCode;
            retailOrder.Status = "Processing"; // Moving to processing since it's bought from warehouse

            wholesaleOrder.OrderId = retailOrder.Id;
            wholesaleOrder.Status = "LinkedToOrder";

            await _orderRepository.UpdateAsync(retailOrder);
            await _supplierOrderRepository.UpdateAsync(wholesaleOrder);
            await CurrentUnitOfWork.SaveChangesAsync();

            return ObjectMapper.Map<OrderDto>(retailOrder);
        }

        // Store/Admin marks order as delivered
        public async Task<OrderDto> MarkAsDelivered(MarkOrderDeliveredDto input)
        {
            var order = await _orderRepository.GetAll()
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == input.Id);

            if (order == null)
                throw new UserFriendlyException("Order not found");

            if (order.Status != "Processing")
                throw new UserFriendlyException("Only processed orders can be delivered");

            order.DeliveryTrackingNumber = input.DeliveryTrackingNumber;
            order.Status = "Delivered";
            order.PaymentStatus = "Completed";

            await FinalizeOrder(order);

            await _orderRepository.UpdateAsync(order);
            await CurrentUnitOfWork.SaveChangesAsync();

            return ObjectMapper.Map<OrderDto>(order);
        }

        // Admin can update order status to any valid status
        public async Task<OrderDto> UpdateStatus(UpdateOrderStatusDto input)
        {
            var order = await _orderRepository.GetAll()
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == input.Id);

            if (order == null)
                throw new UserFriendlyException("Order not found");

            // Validate status
            var validStatuses = new[] { "Pending", "Verified", "Processing", "Shipped", "Delivered", "Cancelled" };
            if (!validStatuses.Contains(input.Status, StringComparer.OrdinalIgnoreCase))
                throw new UserFriendlyException($"Invalid status. Valid statuses are: {string.Join(", ", validStatuses)}");

            order.Status = input.Status;

            if (!string.IsNullOrEmpty(input.DeliveryTrackingNumber))
            {
                order.DeliveryTrackingNumber = input.DeliveryTrackingNumber;
            }

            // If marking as delivered, also update payment status
            if (input.Status.Equals("Delivered", StringComparison.OrdinalIgnoreCase))
            {
                order.PaymentStatus = "Completed";
                await FinalizeOrder(order);
            }

            await _orderRepository.UpdateAsync(order);
            await CurrentUnitOfWork.SaveChangesAsync();

            return ObjectMapper.Map<OrderDto>(order);
        }

        private async Task SendOrderPlacementEmails(Order order, List<CartItem> cartItems)
        {
            try
            {
                var customerEmail = (await GetCurrentUserAsync()).EmailAddress;
                var adminEmail = "noshahidevelopersinc@gmail.com";
                
                // 1. Email to CUSTOMER
                var customerBody = $@"
                    <h2>Order Confirmed!</h2>
                    <p>Dear Customer, your order <b>{order.OrderNumber}</b> has been placed successfully.</p>
                    <p>Total Amount: {order.TotalAmount:C}</p>
                    <p>We are processing your items and will notify you once shipped.</p>";
                
                await SendEmailAsync(customerEmail, $"Order Confirmed: {order.OrderNumber}", customerBody);

                // 2. Email to ADMIN
                var adminBody = $@"
                    <h2>New Order Alert</h2>
                    <p>Order <b>{order.OrderNumber}</b> has been placed on SmartStore.</p>
                    <p>Amount: {order.TotalAmount:C}</p>
                    <p>Check the admin dashboard for details.</p>";
                
                await SendEmailAsync(adminEmail, $"[ALERT] New Order: {order.OrderNumber}", adminBody);

                // 3. Email to each SELLER
                var storeGroups = cartItems.GroupBy(ci => ci.StoreProduct.StoreId);
                foreach (var group in storeGroups)
                {
                    var store = group.First().StoreProduct.Store;
                    var owner = await UserManager.FindByIdAsync(store.OwnerId.ToString());
                    if (owner != null)
                    {
                        var sellerBody = $@"
                            <h2>You have a New Order!</h2>
                            <p>Store: <b>{store.Name}</b></p>
                            <p>Order: <b>{order.OrderNumber}</b></p>
                            <p>Please log in to your Seller Portal to fulfill this order.</p>";
                        
                        await SendEmailAsync(owner.EmailAddress, $"New Sale: {order.OrderNumber}", sellerBody);
                    }
                }
            }
            catch (Exception ex)
            {
                Logger.Error("Failed to send order placement emails", ex);
            }
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
