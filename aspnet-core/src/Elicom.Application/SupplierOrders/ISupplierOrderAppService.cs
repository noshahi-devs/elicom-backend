using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Elicom.SupplierOrders.Dto;
using System;
using System.Threading.Tasks;

namespace Elicom.SupplierOrders
{
    public interface ISupplierOrderAppService : IApplicationService
    {
        Task<ListResultDto<SupplierOrderDto>> GetMyOrders();
        Task<SupplierOrderDto> Create(CreateSupplierOrderDto input);
        Task<SupplierOrderDto> Get(Guid id);
        Task MarkAsShipped(Guid id);
        Task MarkAsDelivered(Guid id);
    }
}
