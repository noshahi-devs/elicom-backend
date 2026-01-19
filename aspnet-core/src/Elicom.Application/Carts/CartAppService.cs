using Abp.Application.Services;
using Abp.Domain.Repositories;
using AutoMapper;
using Elicom.Entities;
using Elicom.Carts.Dto;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Elicom.Carts
{
    public class CartAppService : ApplicationService, ICartAppService
    {
        private readonly IRepository<CartItem, Guid> _cartRepository;
        private readonly IRepository<StoreProduct, Guid> _storeProductRepository;

        public CartAppService(
            IRepository<CartItem, Guid> cartRepository,
            IRepository<StoreProduct, Guid> storeProductRepository)
        {
            _cartRepository = cartRepository;
            _storeProductRepository = storeProductRepository;
        }

        public async Task<CartItemDto> AddToCart(CreateCartItemDto input)
        {
            var storeProduct = await _storeProductRepository
                .GetAllIncluding(sp => sp.Product, sp => sp.Store)
                .FirstOrDefaultAsync(sp => sp.Id == input.StoreProductId);

            if (storeProduct == null)
                throw new Abp.UI.UserFriendlyException("Store product not found.");

            var cartItem = ObjectMapper.Map<CartItem>(input);

            // Snapshot prices
            cartItem.OriginalPrice = storeProduct.ResellerPrice;
            cartItem.ResellerDiscountPercentage = storeProduct.ResellerDiscountPercentage;
            cartItem.Price = storeProduct.ResellerPrice * (1 - storeProduct.ResellerDiscountPercentage / 100m);

            await _cartRepository.InsertAsync(cartItem);

            return ObjectMapper.Map<CartItemDto>(cartItem);
        }

        public async Task<List<CartItemDto>> GetCartItems(Guid customerProfileId)
        {
            var items = await _cartRepository.GetAll()
                .Include(c => c.StoreProduct)
                    .ThenInclude(sp => sp.Product)
                .Include(c => c.StoreProduct)
                    .ThenInclude(sp => sp.Store)
                .Where(c => c.CustomerProfileId == customerProfileId && c.Status == "Active")
                .ToListAsync();

            return ObjectMapper.Map<List<CartItemDto>>(items);
        }

        public async Task RemoveFromCart(Guid cartItemId)
        {
            await _cartRepository.DeleteAsync(cartItemId);
        }

        public async Task ClearCart(Guid customerProfileId)
        {
            var items = await _cartRepository.GetAllListAsync(c => c.CustomerProfileId == customerProfileId);

            foreach (var item in items)
            {
                await _cartRepository.DeleteAsync(item);
            }
        }
    }
}
