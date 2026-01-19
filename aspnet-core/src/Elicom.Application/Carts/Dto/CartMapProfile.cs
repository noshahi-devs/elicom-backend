using AutoMapper;
using Elicom.Entities;

namespace Elicom.Carts.Dto
{
    public class CartMapProfile : Profile
    {
        public CartMapProfile()
        {
            CreateMap<CartItem, CartItemDto>()
                .ForMember(dest => dest.ProductTitle, opt => opt.MapFrom(src => src.StoreProduct.Product.Name))
                .ForMember(dest => dest.ProductImage, opt => opt.MapFrom(src => src.StoreProduct.Product.Images))
                .ForMember(dest => dest.StoreName, opt => opt.MapFrom(src => src.StoreProduct.Store.Name));

            CreateMap<CreateCartItemDto, CartItem>()
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => "Active"));
        }
    }
}
