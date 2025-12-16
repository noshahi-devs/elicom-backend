using AutoMapper;
using Elicom.Entities;
using Elicom.Stores.Dto;

public class StoreMapProfile : Profile
{
    public StoreMapProfile()
    {
        CreateMap<Store, StoreDto>();
        CreateMap<CreateStoreDto, Store>();
        CreateMap<UpdateStoreDto, Store>();
    }
}
