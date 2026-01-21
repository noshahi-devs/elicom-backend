using Abp.MultiTenancy;
using Elicom.Editions;
using Elicom.MultiTenancy;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace Elicom.EntityFrameworkCore.Seed.Tenants;

public class DefaultTenantBuilder
{
    private readonly ElicomDbContext _context;

    public DefaultTenantBuilder(ElicomDbContext context)
    {
        _context = context;
    }

    public void Create()
    {
        CreateDefaultTenant();
    }

    private void CreateDefaultTenant()
    {
        // 1. Default Tenant (Smart Store)
        var defaultTenant = _context.Tenants.IgnoreQueryFilters().FirstOrDefault(t => t.TenancyName == AbpTenantBase.DefaultTenantName);
        if (defaultTenant == null)
        {
            defaultTenant = new Tenant(AbpTenantBase.DefaultTenantName, AbpTenantBase.DefaultTenantName) { Id = 1 };
            SeedTenant(defaultTenant);
        }

        // 2. Prime Ship Tenant
        var primeShipTenant = _context.Tenants.IgnoreQueryFilters().FirstOrDefault(t => t.TenancyName == "primeship");
        if (primeShipTenant == null)
        {
            primeShipTenant = new Tenant("primeship", "Prime Ship") { Id = 2 };
            SeedTenant(primeShipTenant);
        }

        // 3. Global Pay Tenant
        var globalPayTenant = _context.Tenants.IgnoreQueryFilters().FirstOrDefault(t => t.TenancyName == "globalpay");
        if (globalPayTenant == null)
        {
            globalPayTenant = new Tenant("globalpay", "Global Pay") { Id = 3 };
            SeedTenant(globalPayTenant);
        }
    }

    private void SeedTenant(Tenant tenant)
    {
        var defaultEdition = _context.Editions.IgnoreQueryFilters().FirstOrDefault(e => e.Name == EditionManager.DefaultEditionName);
        if (defaultEdition != null)
        {
            tenant.EditionId = defaultEdition.Id;
        }

        _context.Tenants.Add(tenant);
        _context.SaveChanges();
    }
}
