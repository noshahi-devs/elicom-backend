using Abp.Application.Services;
using Abp.Domain.Repositories;
using Abp.UI;
using Elicom.Entities;
using Elicom.Orders.Dto;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Elicom.Orders
{
    public class OrderAppService : ApplicationService, IOrderAppService
    {
        private readonly IRepository<Order, Guid> _orderRepository;
        private readonly IRepository<CartItem, Guid> _cartItemRepository;

        public OrderAppService(
            IRepository<Order, Guid> orderRepository,
            IRepository<CartItem, Guid> cartItemRepository)
        {
            _orderRepository = orderRepository;
            _cartItemRepository = cartItemRepository;
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
                OrderItems = new List<OrderItem>()
            };

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

        // Seller marks order as processing
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

        // Store/Admin marks order as delivered
        public async Task<OrderDto> MarkAsDelivered(MarkOrderDeliveredDto input)
        {
            var order = await _orderRepository.GetAsync(input.Id);
            if (order == null)
                throw new UserFriendlyException("Order not found");

            if (order.Status != "Processing")
                throw new UserFriendlyException("Only processed orders can be delivered");

            order.DeliveryTrackingNumber = input.DeliveryTrackingNumber;
            order.Status = "Delivered";
            order.PaymentStatus = "Completed";

            await _orderRepository.UpdateAsync(order);
            await CurrentUnitOfWork.SaveChangesAsync();

            return ObjectMapper.Map<OrderDto>(order);
        }
    }
}
