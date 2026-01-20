using AutoMapper;
using Elicom.Entities;
using Elicom.GlobalPay.Dto;

namespace Elicom.GlobalPay
{
    public class DepositRequestMapProfile : Profile
    {
        public DepositRequestMapProfile()
        {
            CreateMap<DepositRequest, DepositRequestDto>()
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.User.UserName));
            
            CreateMap<CreateDepositRequestInput, DepositRequest>();
        }
    }
}
