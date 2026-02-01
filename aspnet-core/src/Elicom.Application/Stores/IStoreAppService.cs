using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Elicom.Stores.Dto;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Elicom.Stores
{
    public interface IStoreAppService : IApplicationService
    {
        Task<StoreDto> Get(Guid id);
        Task<ListResultDto<StoreDto>> GetAll();
        Task<StoreDto> Create(CreateStoreDto input);
        Task<StoreDto> Update(UpdateStoreDto input);
        Task Delete(Guid id);
        Task Approve(Guid id);
        Task Reject(Guid id);
    }
}
