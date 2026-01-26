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
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

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

        private const long PlatformAdminId = 1; // The system account that holds Escrow funds

        public OrderAppService(
            IRepository<Order, Guid> orderRepository,
            IRepository<CartItem, Guid> cartItemRepository,
            IRepository<SupplierOrder, Guid> supplierOrderRepository,
            IRepository<StoreProduct, Guid> storeProductRepository,
            IWalletManager walletManager,
            IEmailSender emailSender)
        {
            _orderRepository = orderRepository;
            _cartItemRepository = cartItemRepository;
            _supplierOrderRepository = supplierOrderRepository;
            _storeProductRepository = storeProductRepository;
            _walletManager = walletManager;
            _emailSender = emailSender;
        }

        // Create order from cart
        public async Task<OrderDto> Create(CreateOrderDto input)
        {
            var cartItems = await _cartItemRepository.GetAll()
                .Include(ci => ci.StoreProduct)
                    .ThenInclude(sp => sp.Product)
                .Include(ci => ci.StoreProduct)
                    .ThenInclude(sp => sp.Store)
                .Where(ci =>
                    ci.CustomerProfileId == input.CustomerProfileId &&
                    ci.Status == "Active")
                .ToListAsync();

            if (!cartItems.Any())
                throw new UserFriendlyException("Cart is empty");

            var subTotal = cartItems.Sum(i => i.Price * i.Quantity);

            var order = new Order
            {
                CustomerProfileId = input.CustomerProfileId,
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
            if (input.PaymentMethod == "Wallet" || order.SourcePlatform == "SmartStore")
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
                // In a real app, verify with gateway here
                order.PaymentStatus = "Paid (External)";
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

            // --- AUTOMATION: Create Supplier Orders ---
            // Group cart items by the Product's SupplierId
            var groupedItems = cartItems.GroupBy(ci => ci.StoreProduct.Product.SupplierId);

            foreach (var group in groupedItems)
            {
                var supplierId = group.Key;
                if (!supplierId.HasValue) continue; // Skip if no supplier (shouldn't happen)

                var supplierOrder = new SupplierOrder
                {
                    ReferenceCode = $"SUP-{order.OrderNumber}-{supplierId}",
                    ResellerId = user.Id, 
                    SupplierId = supplierId.Value,
                    OrderId = order.Id,
                    Status = "Pending", // Sourcing Purchase starts as Pending
                    TotalPurchaseAmount = group.Sum(gi => gi.StoreProduct.Product.SupplierPrice * gi.Quantity),
                    SourcePlatform = "Primeship",
                    Items = new List<SupplierOrderItem>()
                };

                foreach (var gi in group)
                {
                    supplierOrder.Items.Add(new SupplierOrderItem
                    {
                        ProductId = gi.StoreProduct.ProductId,
                        Quantity = gi.Quantity,
                        PurchasePrice = gi.StoreProduct.Product.SupplierPrice
                    });
                }

                await _supplierOrderRepository.InsertAsync(supplierOrder);
            }

            foreach (var ci in cartItems)
            {
                await _cartItemRepository.DeleteAsync(ci.Id);
            }

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

        // Get all orders for customer
        public async Task<List<OrderDto>> GetAllForCustomer(Guid customerProfileId)
        {
            var orders = await _orderRepository.GetAll()
                .Include(o => o.OrderItems)
                .Where(o => o.CustomerProfileId == customerProfileId)
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

        public async Task<Elicom.SupplierOrders.Dto.SupplierOrderDto> MarkAsVerified(Abp.Application.Services.Dto.EntityDto<Guid> input)
        {
            var order = await _supplierOrderRepository.GetAll()
                .Include(so => so.Items)
                .FirstOrDefaultAsync(so => so.Id == input.Id);
                
            if (order == null) throw new UserFriendlyException("Order not found");

            order.Status = "Verified";
            await _supplierOrderRepository.UpdateAsync(order);
            await CurrentUnitOfWork.SaveChangesAsync();

            return ObjectMapper.Map<Elicom.SupplierOrders.Dto.SupplierOrderDto>(order);
        }

        public async Task<List<Elicom.SupplierOrders.Dto.SupplierOrderDto>> GetAllForSupplier()
        {
            var orders = await _supplierOrderRepository.GetAll()
                .Include(so => so.Items)
                .OrderByDescending(so => so.CreationTime)
                .ToListAsync();

            return ObjectMapper.Map<List<Elicom.SupplierOrders.Dto.SupplierOrderDto>>(orders);
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

            await _orderRepository.UpdateAsync(order);
            await CurrentUnitOfWork.SaveChangesAsync();

            return ObjectMapper.Map<OrderDto>(order);
        }
    }
}
