using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Elicom.Carts.Dto;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Elicom.Carts
{
    public interface ICartAppService : IApplicationService
    {
        Task<CartItemDto> AddToCart(CreateCartItemDto input);
        Task<List<CartItemDto>> GetCartItems(Guid customerProfileId);
        Task RemoveFromCart(Guid cartItemId);
        Task ClearCart(Guid customerProfileId);
    }
}
