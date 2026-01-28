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
            CreateMap<SupplierOrder, OrderDto>()
                .ForMember(dest => dest.OrderNumber, opts => opts.MapFrom(src => src.ReferenceCode))
                .ForMember(dest => dest.TotalAmount, opts => opts.MapFrom(src => src.TotalPurchaseAmount));
            CreateMap<OrderItem, OrderItemDto>();
        }
    }
}
