using Abp.AutoMapper;
using Abp.Modules;
using Abp.Reflection.Extensions;
using Elicom.Authorization;
using Elicom.Categories.Dto;
using Elicom.Products.Dto;

namespace Elicom;

[DependsOn(
    typeof(ElicomCoreModule),
    typeof(AbpAutoMapperModule))]
public class ElicomApplicationModule : AbpModule
{
    public override void PreInitialize()
    {
        Configuration.Authorization.Providers.Add<ElicomAuthorizationProvider>();
        Configuration.Modules.AbpAutoMapper().Configurators.Add(config =>

        {
            config.AddProfile<CategoryMapProfile>();
            config.AddProfile<ProductMapProfile>();
            config.AddProfile<StoreMapProfile>();
        });
    }

    public override void Initialize()
    {
        var thisAssembly = typeof(ElicomApplicationModule).GetAssembly();

        IocManager.RegisterAssemblyByConvention(thisAssembly);

        Configuration.Modules.AbpAutoMapper().Configurators.Add(
            // Scan the assembly for classes which inherit from AutoMapper.Profile
            cfg => cfg.AddMaps(thisAssembly)
        );

    }
}
