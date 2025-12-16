using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using AutoMapper;
using Elicom.Authorization;
using Elicom.Categories.Dto;
using Elicom.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Elicom.Categories
{
    [AbpAuthorize(PermissionNames.Pages_Categories)]
    public class CategoryAppService : ApplicationService, ICategoryAppService
    {
        private readonly IRepository<Category, Guid> _categoryRepository;
        private readonly IMapper _mapper;

        public CategoryAppService(IRepository<Category, Guid> categoryRepository, IMapper mapper)
        {
            _categoryRepository = categoryRepository;
            _mapper = mapper;
        }

        public async Task<CategoryDto> Get(Guid id)
        {
            var entity = await _categoryRepository.GetAsync(id);
            return _mapper.Map<CategoryDto>(entity);
        }

        public async Task<ListResultDto<CategoryDto>> GetAll()
        {
            var categories = await _categoryRepository.GetAllListAsync();
            return new ListResultDto<CategoryDto>(_mapper.Map<List<CategoryDto>>(categories));
        }

        [AbpAuthorize(PermissionNames.Pages_Categories_Create)]
        public async Task<CategoryDto> Create(CreateCategoryDto input)
        {
            var entity = _mapper.Map<Category>(input);
            await _categoryRepository.InsertAsync(entity);
            return _mapper.Map<CategoryDto>(entity);
        }

        [AbpAuthorize(PermissionNames.Pages_Categories_Edit)]
        public async Task<CategoryDto> Update(UpdateCategoryDto input)
        {
            var entity = await _categoryRepository.GetAsync(input.Id);
            _mapper.Map(input, entity);
            return _mapper.Map<CategoryDto>(entity);
        }

        [AbpAuthorize(PermissionNames.Pages_Categories_Delete)]
        public async Task Delete(Guid id)
        {
            await _categoryRepository.DeleteAsync(id);
        }
    }
}
