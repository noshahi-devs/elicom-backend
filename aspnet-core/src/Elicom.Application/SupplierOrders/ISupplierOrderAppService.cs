using Abp.Application.Services;
using Elicom.SupplierOrders.Dto;
using System;
using System.Threading.Tasks;

namespace Elicom.SupplierOrders
{
    public interface ISupplierOrderAppService : IApplicationService
    {
        Task<SupplierOrderDto> Create(CreateSupplierOrderDto input);
        Task<SupplierOrderDto> Get(Guid id);
    }
}
