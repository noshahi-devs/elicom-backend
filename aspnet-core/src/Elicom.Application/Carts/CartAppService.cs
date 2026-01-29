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
            // Check if item already exists in cart for this user
            var existingItem = await _cartRepository.GetAll()
                .FirstOrDefaultAsync(c => c.UserId == input.UserId && 
                                         c.StoreProductId == input.StoreProductId && 
                                         c.Status == "Active");

            if (existingItem != null)
            {
                existingItem.Quantity += input.Quantity;
                await _cartRepository.UpdateAsync(existingItem);
                return ObjectMapper.Map<CartItemDto>(existingItem);
            }

            var storeProduct = await _storeProductRepository
                .GetAllIncluding(sp => sp.Product, sp => sp.Store)
                .FirstOrDefaultAsync(sp => sp.Id == input.StoreProductId);

            if (storeProduct == null)
                throw new Abp.UI.UserFriendlyException("Store product not found.");

            var cartItem = ObjectMapper.Map<CartItem>(input);
            cartItem.Status = "Active";

            // Snapshot prices
            cartItem.OriginalPrice = storeProduct.ResellerPrice;
            cartItem.ResellerDiscountPercentage = storeProduct.ResellerDiscountPercentage;
            cartItem.Price = storeProduct.ResellerPrice * (1 - storeProduct.ResellerDiscountPercentage / 100m);

            await _cartRepository.InsertAsync(cartItem);

            return ObjectMapper.Map<CartItemDto>(cartItem);
        }

        public async Task<List<CartItemDto>> GetCartItems(long userId)
        {
            var items = await _cartRepository.GetAll()
                .Include(c => c.StoreProduct)
                    .ThenInclude(sp => sp.Product)
                .Include(c => c.StoreProduct)
                    .ThenInclude(sp => sp.Store)
                .Where(c => c.UserId == userId && c.Status == "Active")
                .ToListAsync();

            return ObjectMapper.Map<List<CartItemDto>>(items);
        }

        public async Task RemoveFromCart(Guid cartItemId)
        {
            await _cartRepository.DeleteAsync(cartItemId);
        }

        public async Task RemoveFromCartByProduct(long userId, Guid storeProductId)
        {
            var item = await _cartRepository.GetAll()
                .FirstOrDefaultAsync(c => c.UserId == userId && c.StoreProductId == storeProductId && c.Status == "Active");

            if (item != null)
            {
                await _cartRepository.DeleteAsync(item);
            }
        }

        public async Task ClearCart(long userId)
        {
            var items = await _cartRepository.GetAllListAsync(c => c.UserId == userId);

            foreach (var item in items)
            {
                await _cartRepository.DeleteAsync(item);
            }
        }
    }
}
