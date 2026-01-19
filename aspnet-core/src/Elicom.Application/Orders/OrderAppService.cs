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

        public async Task<OrderDto> Create(CreateOrderDto input)
        {
            // 1️⃣ Load cart items
            var cartItems = await _cartItemRepository.GetAll()
                .Include(ci => ci.StoreProduct)
                    .ThenInclude(sp => sp.Product)
                .Include(ci => ci.StoreProduct)
                    .ThenInclude(sp => sp.Store)
                .Where(ci =>
                    ci.CustomerProfileId == input.CustomerProfileId &&
                    ci.Status == "Active"
                )
                .ToListAsync();

            if (!cartItems.Any())
                throw new UserFriendlyException("Cart is empty");

            // 2️⃣ Calculate totals
            var subTotal = cartItems.Sum(i => i.Price * i.Quantity);

            // 3️⃣ Create Order
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

            // 4️⃣ Copy Cart → OrderItems
            foreach (var cartItem in cartItems)
            {
                order.OrderItems.Add(new OrderItem
                {
                    StoreProductId = cartItem.StoreProductId,
                    ProductId = cartItem.StoreProduct.ProductId,

                    Quantity = cartItem.Quantity,
                    PriceAtPurchase = cartItem.Price,
                    OriginalPrice = cartItem.OriginalPrice,
                    DiscountPercentage = cartItem.ResellerDiscountPercentage,

                    ProductName = cartItem.StoreProduct.Product.Name,
                    StoreName = cartItem.StoreProduct.Store.Name
                });
            }

            await _orderRepository.InsertAsync(order);
            await CurrentUnitOfWork.SaveChangesAsync();

            // 5️⃣ Clear cart
            foreach (var item in cartItems)
            {
                await _cartItemRepository.DeleteAsync(item.Id);
            }

            return ObjectMapper.Map<OrderDto>(order);
        }

        public async Task<OrderDto> Get(Guid id)
        {
            var order = await _orderRepository.GetAll()
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == id);

            return ObjectMapper.Map<OrderDto>(order);
        }

        public async Task<List<OrderDto>> GetAllForCustomer(Guid customerProfileId)
        {
            var orders = await _orderRepository.GetAll()
                .Include(o => o.OrderItems)
                .Where(o => o.CustomerProfileId == customerProfileId)
                .ToListAsync();

            return ObjectMapper.Map<List<OrderDto>>(orders);
        }

        // Mark As Shipped

        public async Task<OrderDto> MarkAsShipped(UpdateOrderShippingDto input)
        {
            var order = await _orderRepository.GetAsync(input.Id);

            if (order == null)
                throw new UserFriendlyException("Order not found");

            if (order.Status != "Pending")
                throw new UserFriendlyException("Only pending orders can be shipped");

            order.Status = "Shipped";
            order.TrackingId = input.TrackingId;

            await _orderRepository.UpdateAsync(order);
            await CurrentUnitOfWork.SaveChangesAsync();

            return ObjectMapper.Map<OrderDto>(order);
        }

    }
}
