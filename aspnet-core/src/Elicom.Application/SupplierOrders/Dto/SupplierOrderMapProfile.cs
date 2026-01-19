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
            CreateMap<CreateSupplierOrderDto, SupplierOrder>();
            CreateMap<UpdateSupplierOrderDto, SupplierOrder>();
        }
    }
}
