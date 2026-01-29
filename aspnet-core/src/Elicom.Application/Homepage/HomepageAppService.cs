using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Domain.Repositories;
using Abp.UI;
using Elicom.Entities;
using Elicom.Homepage.Dto;
using Microsoft.EntityFrameworkCore;
using Abp.Domain.Uow;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Elicom.Homepage
{
    public class HomepageAppService : ApplicationService
    {
        private readonly IRepository<Product, Guid> _productRepository;
        private readonly IRepository<StoreProduct, Guid> _storeProductRepository;
        private readonly IRepository<Category, Guid> _categoryRepository;


        public HomepageAppService(
            IRepository<Product, Guid> productRepository,
            IRepository<StoreProduct, Guid> storeProductRepository,
            IRepository<Category, Guid> categoryRepository)

        {
            _productRepository = productRepository;
            _storeProductRepository = storeProductRepository;
                _categoryRepository = categoryRepository;

        }


        public async Task<PagedResultDto<ProductCardDto>> GetAllProductsForCards(
            PagedAndSortedResultRequestDto input)
        {
            // 1️⃣ Base query (ONLY product-level filtering)
            using (UnitOfWorkManager.Current.DisableFilter(AbpDataFilters.MayHaveTenant))
            {
                var baseQuery = _productRepository
                    .GetAll()
                    .Where(p => p.Status)
                    .Where(p => p.StoreProducts.Any()); // important

                // 2️⃣ Correct total count (DISTINCT PRODUCTS)
                var totalCount = await baseQuery.CountAsync();

                // 3️⃣ Fetch paged products with required joins
                var products = await baseQuery
                    .Include(p => p.Category)
                    .Include(p => p.StoreProducts)
                        .ThenInclude(sp => sp.Store)
                    .OrderByDescending(p => p.CreatedAt)
                    .Skip(input.SkipCount)
                    .Take(input.MaxResultCount)
                    .ToListAsync();

                // 4️⃣ Map to ProductCardDto
                var items = products.Select(p =>
                {
                    // For now: pick first store listing
                    var storeProduct = p.StoreProducts.First();

                    var images = p.Images?
                        .Split(',', StringSplitOptions.RemoveEmptyEntries);

                    var finalPrice =
                        storeProduct.ResellerPrice *
                        (1 - storeProduct.ResellerDiscountPercentage / 100m);

                    return new ProductCardDto
                    {
                        ProductId = p.Id,
                        StoreProductId = storeProduct.Id,

                        CategoryId = p.CategoryId,
                        CategoryName = p.Category.Name,

                        Title = p.Name,

                        Image1 = images?.FirstOrDefault(),
                        Image2 = images?.Skip(1).FirstOrDefault(),

                        OriginalPrice = storeProduct.ResellerPrice,
                        ResellerDiscountPercentage = storeProduct.ResellerDiscountPercentage,
                        Price = finalPrice,

                        StoreName = storeProduct.Store.Name,
                        Slug = p.Slug
                    };
                }).ToList();

                // 5️⃣ Return paged result
                return new PagedResultDto<ProductCardDto>(totalCount, items);
            }
        }

        public async Task<ProductDetailDto> GetProductDetail(Guid productId, Guid storeProductId)
        {
            using (UnitOfWorkManager.Current.DisableFilter(AbpDataFilters.MayHaveTenant))
            {
                var product = await _productRepository
                    .GetAll()
                    .Include(p => p.Category)
                    .Include(p => p.StoreProducts)
                        .ThenInclude(sp => sp.Store)
                    .FirstOrDefaultAsync(p => p.Id == productId);

                if (product == null)
                    throw new UserFriendlyException("Product not found.");

                var storeProduct = product.StoreProducts.FirstOrDefault(sp => sp.Id == storeProductId);
                if (storeProduct == null)
                    throw new UserFriendlyException("Product is not available in the selected store.");

                // Other stores selling the same product
                var otherStores = product.StoreProducts
                    .Where(sp => sp.Id != storeProductId)
                    .Select(sp => new OtherStoreDto
                    {
                        StoreId = sp.StoreId,
                        StoreName = sp.Store.Name,
                        ResellerPrice = sp.ResellerPrice,
                        ResellerDiscountPercentage = sp.ResellerDiscountPercentage,
                        Price = sp.ResellerPrice * (1 - sp.ResellerDiscountPercentage / 100),
                        StockQuantity = sp.StockQuantity
                    })
                    .ToList();

                var images = product.Images?.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList();
                var sizes = product.SizeOptions?.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList();
                var colors = product.ColorOptions?.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList();

                return new ProductDetailDto
                {
                    ProductId = product.Id,
                    Title = product.Name,
                    Slug = product.Slug,
                    Description = product.Description,
                    BrandName = product.BrandName,
                    Images = images,
                    SizeOptions = sizes,
                    ColorOptions = colors,

                    Category = new CategoryInfoDto
                    {
                        CategoryId = product.CategoryId,
                        Name = product.Category.Name,
                        Slug = product.Category.Slug
                    },

                    Store = new StoreInfoDto
                    {
                        StoreId = storeProduct.StoreId,
                        StoreName = storeProduct.Store.Name,
                        StoreDescription = storeProduct.Store.Description,
                        StoreSlug = storeProduct.Store.Slug,
                        ResellerPrice = storeProduct.ResellerPrice,
                        ResellerDiscountPercentage = storeProduct.ResellerDiscountPercentage,
                        Price = storeProduct.ResellerPrice * (1 - storeProduct.ResellerDiscountPercentage / 100),
                        StockQuantity = storeProduct.StockQuantity
                    },

                    OtherStores = otherStores,
                    TotalOtherStores = otherStores.Count
                };
            }
        }

        public async Task<List<HomepageCategoryDto>> GetCategoriesWithListedProducts()
        {
            using (UnitOfWorkManager.Current.DisableFilter(AbpDataFilters.MayHaveTenant))
            {
                var categories = await _categoryRepository.GetAll()
                    .Where(c => c.Products.Any(p => p.Status && p.StoreProducts.Any()))
                    .Select(c => new HomepageCategoryDto
                    {
                        CategoryId = c.Id,
                        Name = c.Name,
                        Slug = c.Slug,
                        ImageUrl = c.ImageUrl,
                        // Use SelectMany to flatten products and filter before counting
                        TotalProducts = c.Products
                            .Count(p => p.Status && p.StoreProducts.Any())
                    })
                    .ToListAsync();

                return categories;
            }
        }

        public async Task<List<ProductCardDto>> GetProductListingsAcrossStores(Guid productId)
        {
            using (UnitOfWorkManager.Current.DisableFilter(AbpDataFilters.MayHaveTenant))
            {
                // Fetch the product with its category
                var product = await _productRepository
                    .GetAll()
                    .Include(p => p.Category)
                    .FirstOrDefaultAsync(p => p.Id == productId);

                if (product == null)
                    throw new Abp.UI.UserFriendlyException("Product not found.");

                // Fetch all store listings for this product
                var storeProducts = await _storeProductRepository
                    .GetAll()
                    .Include(sp => sp.Store)
                    .Where(sp => sp.ProductId == productId && sp.Status)
                    .ToListAsync();

                // Map each store product to ProductCardDto
                var productCards = storeProducts.Select(sp =>
                {
                    var images = product.Images?.Split(',', StringSplitOptions.RemoveEmptyEntries);

                    var finalPrice = sp.ResellerPrice * (1 - sp.ResellerDiscountPercentage / 100m);

                    return new ProductCardDto
                    {
                        ProductId = product.Id,
                        StoreProductId = sp.Id,
                        CategoryId = product.CategoryId,
                        CategoryName = product.Category.Name,

                        Title = product.Name,
                        Image1 = images?.FirstOrDefault(),
                        Image2 = images?.Skip(1).FirstOrDefault(),

                        OriginalPrice = sp.ResellerPrice,
                        ResellerDiscountPercentage = sp.ResellerDiscountPercentage,
                        Price = finalPrice,

                        StoreName = sp.Store.Name,
                        Slug = product.Slug
                    };
                }).ToList();

                return productCards;
            }
        }


        public async Task<List<ProductCardDto>> GetProductsByStore(Guid storeId)
        {
            using (UnitOfWorkManager.Current.DisableFilter(AbpDataFilters.MayHaveTenant))
            {
                // Fetch all store products for this store
                var storeProducts = await _storeProductRepository
                    .GetAll()
                    .Include(sp => sp.Product)
                        .ThenInclude(p => p.Category)
                    .Include(sp => sp.Store)
                    .Where(sp => sp.StoreId == storeId && sp.Status && sp.Product.Status)
                    .ToListAsync();

                // Map to ProductCardDto
                var products = storeProducts.Select(sp =>
                {
                    var product = sp.Product;
                    var images = product.Images?.Split(',', StringSplitOptions.RemoveEmptyEntries);

                    var finalPrice = sp.ResellerPrice * (1 - sp.ResellerDiscountPercentage / 100m);

                    return new ProductCardDto
                    {
                        ProductId = product.Id,
                        StoreProductId = sp.Id,
                        CategoryId = product.CategoryId,
                        CategoryName = product.Category.Name,

                        Title = product.Name,
                        Image1 = images?.FirstOrDefault(),
                        Image2 = images?.Skip(1).FirstOrDefault(),

                        OriginalPrice = sp.ResellerPrice,
                        ResellerDiscountPercentage = sp.ResellerDiscountPercentage,
                        Price = finalPrice,

                        StoreName = sp.Store.Name,
                        Slug = product.Slug
                    };
                }).ToList();

                return products;
            }
        }


    }
}
