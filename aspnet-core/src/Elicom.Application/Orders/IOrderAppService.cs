using Abp.Application.Services;
using Elicom.Orders.Dto;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Elicom.Orders
{
    public interface IOrderAppService : IApplicationService
    {
        Task<OrderDto> Create(CreateOrderDto input);
        Task<OrderDto> Get(Guid id);
        Task<List<OrderDto>> GetAll();
        Task<List<OrderDto>> GetAllForCustomer(long userId);
        Task<List<OrderDto>> GetByStore(Guid storeId);

        Task<OrderDto> MarkAsProcessing(MarkOrderProcessingDto input);
        Task<OrderDto> LinkWholesaleOrder(LinkWholesaleOrderDto input);
        Task<OrderDto> MarkAsDelivered(MarkOrderDeliveredDto input);
        Task<OrderDto> UpdateStatus(UpdateOrderStatusDto input);
    }
}
