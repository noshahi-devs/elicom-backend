using Abp.Application.Services;
using Elicom.SupplierOrders.Dto;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Elicom.SupplierOrders
{
    public interface ISupplierOrderAppService : IApplicationService
    {
        // Create a supplier order (seller buys from supplier)
        Task<SupplierOrderDto> Create(CreateSupplierOrderDto input);

        // Get a supplier order by ID
        Task<SupplierOrderDto> Get(Guid id);
    }
}
