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

        Task<OrderDto> Fulfill(FulfillOrderDto input);
        Task<OrderDto> Verify(VerifyOrderDto input);
        Task<OrderDto> Deliver(Guid id);
        Task<OrderDto> Cancel(Guid id);
        Task<List<CarrierDto>> GetCarriers();
    }
}
