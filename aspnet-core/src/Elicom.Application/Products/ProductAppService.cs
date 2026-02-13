using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using AutoMapper.Internal.Mappers;
using Elicom.Authorization;
using Elicom.Entities;
using Elicom.Products.Dto;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
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
        private readonly IBlobStorageService _blobStorageService;

        public ProductAppService(
            IRepository<Product, Guid> productRepo,
            IBlobStorageService blobStorageService)
        {
            _productRepo = productRepo;
            _blobStorageService = blobStorageService;
        }

        public async Task<ListResultDto<ProductDto>> GetAll()
        {
            using (UnitOfWorkManager.Current.DisableFilter(Abp.Domain.Uow.AbpDataFilters.MayHaveTenant))
            {
                var products = await _productRepo
                    .GetAllIncluding(p => p.Category)
                    .ToListAsync();

                return new ListResultDto<ProductDto>(
                    ObjectMapper.Map<List<ProductDto>>(products)
                );
            }
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

        [HttpGet]
        public async Task<ListResultDto<ProductDto>> Search(string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return new ListResultDto<ProductDto>();
            }

            var lowercaseQuery = query.ToLower();

            // Ignore filters to see global wholesale products
            List<Product> products;
            using (CurrentUnitOfWork.DisableFilter(Abp.Domain.Uow.AbpDataFilters.MayHaveTenant, Abp.Domain.Uow.AbpDataFilters.MustHaveTenant))
            {
                products = await _productRepo
                    .GetAllIncluding(p => p.Category)
                    .Where(p => p.Name.ToLower().Contains(lowercaseQuery) ||
                                (p.SKU != null && p.SKU.ToLower().Contains(lowercaseQuery)) ||
                                (p.Description != null && p.Description.ToLower().Contains(lowercaseQuery)))
                    .ToListAsync();
            }

            return new ListResultDto<ProductDto>(
                ObjectMapper.Map<List<ProductDto>>(products)
            );
        }

        [AbpAuthorize(PermissionNames.Pages_Products_Create)]
        public async Task<ProductDto> Create(CreateProductDto input)
        {
            input.Images = await ProcessImages(input.Images);
            var product = ObjectMapper.Map<Product>(input);
            product.TenantId = input.TenantId ?? AbpSession.TenantId; // Use DTO tenantId if provided
            
            await _productRepo.InsertAsync(product);
            return ObjectMapper.Map<ProductDto>(product);
        }

        [AbpAuthorize(PermissionNames.Pages_Products_Edit)]
        public async Task<ProductDto> Update(UpdateProductDto input)
        {
            input.Images = await ProcessImages(input.Images);
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

        private async Task<string> ProcessImages(string imagesJson)
        {
            if (string.IsNullOrEmpty(imagesJson)) return imagesJson;

            try
            {
                var images = Newtonsoft.Json.JsonConvert.DeserializeObject<List<string>>(imagesJson);
                if (images == null) return imagesJson;

                bool changed = false;
                for (int i = 0; i < images.Count; i++)
                {
                    if (IsBase64(images[i]))
                    {
                        var fileName = $"prod-{Guid.NewGuid()}.png";
                        images[i] = await _blobStorageService.UploadImageAsync(images[i], fileName);
                        changed = true;
                    }
                }

                return changed ? Newtonsoft.Json.JsonConvert.SerializeObject(images) : imagesJson;
            }
            catch (Exception ex)
            {
                Logger.Error("Error processing product images", ex);
                return imagesJson;
            }
        }

        private bool IsBase64(string base64String)
        {
            if (string.IsNullOrEmpty(base64String)) return false;
            return base64String.Contains("base64,") || base64String.Length > 1000;
        }

        [AbpAuthorize(PermissionNames.Pages_Products_Delete)]
        public async Task Delete(Guid id)
        {
            await _productRepo.DeleteAsync(id);
        }
    }

}
