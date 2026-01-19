using AutoMapper;
using Elicom.Entities;
using Elicom.OrderItems.Dto;
using Elicom.Orders.Dto;

namespace Elicom.Orders
{
    public class OrderMapProfile : Profile
    {
        public OrderMapProfile()
        {
            CreateMap<Order, OrderDto>();
            CreateMap<OrderItem, OrderItemDto>();
        }
    }
}
