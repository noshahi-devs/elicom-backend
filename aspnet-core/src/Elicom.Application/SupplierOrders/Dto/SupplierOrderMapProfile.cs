using AutoMapper;
using Elicom.Entities;
using Elicom.SupplierOrders.Dto;

namespace Elicom.SupplierOrders
{
    public class SupplierOrderMapProfile : Profile
    {
        public SupplierOrderMapProfile()
        {
            CreateMap<SupplierOrder, SupplierOrderDto>();
            CreateMap<SupplierOrderItem, SupplierOrderItemDto>()
                .ForMember(dto => dto.ProductName, opt => opt.MapFrom(src => src.Product.Name));

            CreateMap<CreateSupplierOrderDto, SupplierOrder>();
            CreateMap<CreateSupplierOrderItemDto, SupplierOrderItem>();
        }
    }
}
