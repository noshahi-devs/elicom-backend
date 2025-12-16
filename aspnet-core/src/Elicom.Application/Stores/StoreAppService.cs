using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Elicom.Authorization;
using Elicom.Entities;
using Elicom.Stores.Dto;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Elicom.Stores
{    

    [AbpAuthorize(PermissionNames.Pages_Stores)]
    public class StoreAppService : ElicomAppServiceBase, IStoreAppService
    {
        private readonly IRepository<Store, Guid> _storeRepo;

        public StoreAppService(IRepository<Store, Guid> storeRepo)
        {
            _storeRepo = storeRepo;
        }

        public async Task<ListResultDto<StoreDto>> GetAll()
        {
            var stores = await _storeRepo.GetAll().ToListAsync();
            return new ListResultDto<StoreDto>(ObjectMapper.Map<List<StoreDto>>(stores));
        }

        public async Task<StoreDto> Get(Guid id)
        {
            var store = await _storeRepo.GetAsync(id);
            return ObjectMapper.Map<StoreDto>(store);
        }

        [AbpAuthorize(PermissionNames.Pages_Stores_Create)]
        public async Task<StoreDto> Create(CreateStoreDto input)
        {
            var store = ObjectMapper.Map<Store>(input);
            await _storeRepo.InsertAsync(store);
            return ObjectMapper.Map<StoreDto>(store);
        }

        [AbpAuthorize(PermissionNames.Pages_Stores_Edit)]
        public async Task<StoreDto> Update(UpdateStoreDto input)
        {
            var store = await _storeRepo.GetAsync(input.Id);
            ObjectMapper.Map(input, store);
            return ObjectMapper.Map<StoreDto>(store);
        }

        [AbpAuthorize(PermissionNames.Pages_Stores_Delete)]
        public async Task Delete(Guid id)
        {
            await _storeRepo.DeleteAsync(id);
        }
    }

}
