using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Domain.Repositories;
using Elicom.Categories.Dto;
using Elicom.Entities;
using Elicom.Products.Dto;
using Microsoft.EntityFrameworkCore;
using Abp.UI;
using Abp.Authorization;
using Elicom;

namespace Elicom.Public
{
    [RemoteService]
    [AbpAllowAnonymous]
    public class PublicAppService : ElicomAppServiceBase, IPublicAppService
    {
        private readonly IRepository<Category, Guid> _categoryRepository;
        private readonly IRepository<Product, Guid> _productRepository;

        public PublicAppService(
            IRepository<Category, Guid> categoryRepository,
            IRepository<Product, Guid> productRepository)
        {
            _categoryRepository = categoryRepository;
            _productRepository = productRepository;
        }

        public async Task<ListResultDto<CategoryDto>> GetCategories()
        {
            var categories = await _categoryRepository.GetAllListAsync();
            return new ListResultDto<CategoryDto>(ObjectMapper.Map<List<CategoryDto>>(categories));
        }

        public async Task<ListResultDto<ProductDto>> GetProducts()
        {
            var products = await _productRepository.GetAll()
                .Include(p => p.Category)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            return new ListResultDto<ProductDto>(ObjectMapper.Map<List<ProductDto>>(products));
        }
        public async Task<ProductDto> GetProductBySlug(string slug)
        {
            var product = await _productRepository.GetAll()
                .Include(p => p.Category)
                .FirstOrDefaultAsync(p => p.Slug == slug);

            if (product == null)
                throw new UserFriendlyException("Product not found");

            return ObjectMapper.Map<ProductDto>(product);
        }

        public async Task<ProductDto> GetProductBySku(string sku)
        {
            var product = await _productRepository.GetAll()
                .Include(p => p.Category)
                .FirstOrDefaultAsync(p => p.SKU == sku || p.Name.Contains(sku));

            if (product == null)
                throw new UserFriendlyException("Product not found");

            return ObjectMapper.Map<ProductDto>(product);
        }

        public async Task<List<ProductDto>> GetProductsBySearch(string term)
        {
            var products = await _productRepository.GetAll()
                .Include(p => p.Category)
                .Where(p => p.Name.Contains(term) || p.SKU.Contains(term))
                .Take(10)
                .ToListAsync();

            return ObjectMapper.Map<List<ProductDto>>(products);
        }
    }

    public interface IPublicAppService : IApplicationService
    {
        Task<ListResultDto<CategoryDto>> GetCategories();
        Task<ListResultDto<ProductDto>> GetProducts();
        Task<ProductDto> GetProductBySlug(string slug);
        Task<ProductDto> GetProductBySku(string sku);
        Task<List<ProductDto>> GetProductsBySearch(string term);
    }
}
