using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using AutoMapper.Internal.Mappers;
using Elicom.Authorization;
using Elicom.Entities;
using Elicom.Products.Dto;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Elicom.Products
{
    //[AbpAuthorize(PermissionNames.Pages_Products)]
    public class ProductAppService : ElicomAppServiceBase, IProductAppService
    {
        private readonly IRepository<Product, Guid> _productRepo;

        public ProductAppService(IRepository<Product, Guid> productRepo)
        {
            _productRepo = productRepo;
        }

        public async Task<ListResultDto<ProductDto>> GetAll()
        {
            var products = await _productRepo
                .GetAllIncluding(p => p.Category)
                .ToListAsync();

            return new ListResultDto<ProductDto>(
                ObjectMapper.Map<List<ProductDto>>(products)
            );
        }

        public async Task<ListResultDto<ProductDto>> GetByCategory(Guid categoryId)
        {
            var products = await _productRepo
                .GetAllIncluding(p => p.Category)
                .Where(p => p.CategoryId == categoryId)
                .ToListAsync();

            return new ListResultDto<ProductDto>(
                ObjectMapper.Map<List<ProductDto>>(products)
            );
        }

        [AbpAuthorize(PermissionNames.Pages_Products_Create)]
        public async Task<ProductDto> Create(CreateProductDto input)
        {
            var product = ObjectMapper.Map<Product>(input);
            product.TenantId = input.TenantId ?? AbpSession.TenantId; // Use DTO tenantId if provided
            
            await _productRepo.InsertAsync(product);
            return ObjectMapper.Map<ProductDto>(product);
        }

        [AbpAuthorize(PermissionNames.Pages_Products_Edit)]
        public async Task<ProductDto> Update(UpdateProductDto input)
        {
            var product = await _productRepo.GetAsync(input.Id);
            ObjectMapper.Map(input, product);
            
            // Ensure TenantId is preserved or updated from DTO
            if (input.TenantId.HasValue)
            {
                product.TenantId = input.TenantId;
            }
            else if (!product.TenantId.HasValue)
            {
                product.TenantId = AbpSession.TenantId;
            }

            return ObjectMapper.Map<ProductDto>(product);
        }

        [AbpAuthorize(PermissionNames.Pages_Products_Delete)]
        public async Task Delete(Guid id)
        {
            await _productRepo.DeleteAsync(id);
        }
    }

}
