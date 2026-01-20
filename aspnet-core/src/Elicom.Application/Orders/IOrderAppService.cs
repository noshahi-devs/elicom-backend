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
        Task<List<OrderDto>> GetAllForCustomer(Guid customerProfileId);

        Task<OrderDto> MarkAsProcessing(MarkOrderProcessingDto input);
        Task<OrderDto> LinkWholesaleOrder(LinkWholesaleOrderDto input);
        Task<OrderDto> MarkAsDelivered(MarkOrderDeliveredDto input);
    }
}
