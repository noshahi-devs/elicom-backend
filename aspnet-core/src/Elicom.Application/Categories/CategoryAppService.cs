using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Domain.Uow;
using AutoMapper;
using Elicom.Authorization;
using Elicom.Categories.Dto;
using Elicom.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Abp.UI;
using Microsoft.EntityFrameworkCore;

namespace Elicom.Categories
{
    public class CategoryAppService : ApplicationService, ICategoryAppService
    {
        private readonly IRepository<Category, Guid> _categoryRepository;
        private readonly IRepository<Product, Guid> _productRepository;
        private readonly IMapper _mapper;

        public CategoryAppService(
            IRepository<Category, Guid> categoryRepository,
            IRepository<Product, Guid> productRepository,
            IMapper mapper)
        {
            _categoryRepository = categoryRepository;
            _productRepository = productRepository;
            _mapper = mapper;
        }

        [AbpAuthorize(PermissionNames.Pages_Categories)]
        public async Task<CategoryDto> Get(Guid id)
        {
            var entity = await _categoryRepository.GetAsync(id);
            return _mapper.Map<CategoryDto>(entity);
        }

        public async Task<ListResultDto<CategoryDto>> GetAll(int maxResultCount = 100)
        {
            using (UnitOfWorkManager.Current.DisableFilter(AbpDataFilters.MayHaveTenant))
            {
                var query = _categoryRepository.GetAll();
                if (maxResultCount > 0)
                {
                    query = query.Take(maxResultCount);
                }
                
                var categories = await query.ToListAsync();
                return new ListResultDto<CategoryDto>(_mapper.Map<List<CategoryDto>>(categories));
            }
        }

        [AbpAuthorize(PermissionNames.Pages_Categories_Create)]
        public async Task<CategoryDto> Create(CreateCategoryDto input)
        {
            var entity = _mapper.Map<Category>(input);
            entity.TenantId = input.TenantId ?? AbpSession.TenantId;
            
            await _categoryRepository.InsertAsync(entity);
            return _mapper.Map<CategoryDto>(entity);
        }

        [AbpAuthorize(PermissionNames.Pages_Categories_Edit)]
        public async Task<CategoryDto> Update(UpdateCategoryDto input)
        {
            var entity = await _categoryRepository.GetAsync(input.Id);
            _mapper.Map(input, entity);
            
            if (input.TenantId.HasValue)
            {
                entity.TenantId = input.TenantId;
            }
            else if (!entity.TenantId.HasValue)
            {
                entity.TenantId = AbpSession.TenantId;
            }

            return _mapper.Map<CategoryDto>(entity);
        }

        public async Task<ListResultDto<CategoryLookupDto>> GetLookup()
        {
            using (UnitOfWorkManager.Current.DisableFilter(AbpDataFilters.MayHaveTenant))
            {
                // Optimization: Database-side grouping to avoid memory bottleneck
                // We project to a simplified object first to minimize data transfer
                var categoryGroups = await _categoryRepository.GetAll()
                    .Where(c => c.Name != null)
                    .GroupBy(c => c.Name.Trim())
                    .Select(g => g.FirstOrDefault())
                    .OrderBy(c => c.Name)
                    .ToListAsync();

                var result = categoryGroups
                    .Where(c => c != null)
                    .Select(c => {
                        var dto = _mapper.Map<CategoryLookupDto>(c);
                        // Fallback for missing or invalid slugs
                        if (string.IsNullOrEmpty(dto.Slug) || dto.Slug == "string" || dto.Slug == "null")
                        {
                            dto.Slug = System.Text.RegularExpressions.Regex.Replace(c.Name?.ToLower() ?? "category", @"[^a-z0-9]+", "-").Trim('-');
                        }
                        return dto;
                    })
                    .ToList();

                return new ListResultDto<CategoryLookupDto>(result);
            }
        }

        [AbpAuthorize(PermissionNames.Pages_Categories_Delete)]
        public async Task Delete(Guid id, bool forceDelete = false)
        {
            try
            {
                // Check if any products reference this category
                var productsCount = await _productRepository.CountAsync(p => p.CategoryId == id);
                
                if (productsCount > 0)
                {
                    if (!forceDelete)
                    {
                        throw new UserFriendlyException(
                            $"Cannot delete this category because it has {productsCount} product(s) associated with it. " +
                            "Please reassign or delete those products first."
                        );
                    }
                    
                    // Force delete: Delete all products in this category first
                    var products = await _productRepository.GetAllListAsync(p => p.CategoryId == id);
                    foreach (var product in products)
                    {
                        await _productRepository.DeleteAsync(product);
                    }
                    
                    Logger.Info($"Force deleted {productsCount} product(s) from category {id}");
                }
                
                await _categoryRepository.DeleteAsync(id);
            }
            catch (UserFriendlyException)
            {
                throw; // Re-throw user-friendly exceptions
            }
            catch (Exception ex)
            {
                Logger.Error("Error deleting category", ex);
                throw new UserFriendlyException("An error occurred while deleting the category. Please try again.");
            }
        }
    }
}
