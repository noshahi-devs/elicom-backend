using Abp.Application.Services;
using Abp.Domain.Repositories;
using Abp.UI;
using Elicom.Entities;
using Elicom.Wallets;
using Elicom.Orders.Dto;
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
        private readonly IWalletManager _walletManager;

        public OrderAppService(
            IRepository<Order, Guid> orderRepository,
            IRepository<CartItem, Guid> cartItemRepository,
            IRepository<SupplierOrder, Guid> supplierOrderRepository,
            IWalletManager walletManager)
        {
            _orderRepository = orderRepository;
            _cartItemRepository = cartItemRepository;
            _supplierOrderRepository = supplierOrderRepository;
            _walletManager = walletManager;
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
                SourcePlatform = "SmartStore",
                OrderItems = new List<OrderItem>()
            };

            // ESCROW TRANSACTION: Try to debit the wallet
            // We use the User associated with the CustomerProfile
            // Note: In a real app, we should fetch the User ID from the Customer Profile or Current User
            var user = await GetCurrentUserAsync(); 
            
            bool debitSuccess = await _walletManager.TryDebitAsync(
                user.Id, 
                order.TotalAmount, 
                order.OrderNumber, 
                "Order Placement (Escrow Hold)"
            );

            if (!debitSuccess)
            {
                throw new UserFriendlyException("Insufficient funds in Wallet to place this order.");
            }

            order.PaymentStatus = "Paid (Escrow)";

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
                    ResellerId = user.Id, // The person who owns the store (the reseller)
                    SupplierId = supplierId.Value,
                    OrderId = order.Id,
                    Status = "Purchased",
                    TotalPurchaseAmount = group.Sum(gi => gi.StoreProduct.Product.SupplierPrice * gi.Quantity),
                    SourcePlatform = "SmartStore",
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

            // --- AUTOMATION: Profit Distribution ---
            var supplierOrders = await _supplierOrderRepository.GetAll()
                .Include(so => so.Items)
                .Where(so => so.OrderId == order.Id)
                .ToListAsync();

            foreach (var so in supplierOrders)
            {
                // 1. Pay Supplier (Wholesale Price)
                await _walletManager.DepositAsync(
                    so.SupplierId,
                    so.TotalPurchaseAmount,
                    so.ReferenceCode,
                    $"Sale settlement for {order.OrderNumber}"
                );

                // 2. Pay Reseller (Retail - Wholesale Profit)
                // Calculate profit for items in THIS supplier order
                decimal resellerProfit = 0;
                foreach (var item in so.Items)
                {
                    // Find corresponding buyer order item to get retail price paid
                    var buyerItem = order.OrderItems.FirstOrDefault(oi => oi.ProductId == item.ProductId);
                    if (buyerItem != null)
                    {
                        resellerProfit += (buyerItem.PriceAtPurchase - item.PurchasePrice) * item.Quantity;
                    }
                }

                if (resellerProfit > 0)
                {
                    await _walletManager.DepositAsync(
                        so.ResellerId,
                        resellerProfit,
                        order.OrderNumber,
                        $"Profit from Sale {order.OrderNumber}"
                    );
                }

                so.Status = "Settled";
                await _supplierOrderRepository.UpdateAsync(so);
            }

            await _orderRepository.UpdateAsync(order);
            await CurrentUnitOfWork.SaveChangesAsync();

            return ObjectMapper.Map<OrderDto>(order);
        }
    }
}
