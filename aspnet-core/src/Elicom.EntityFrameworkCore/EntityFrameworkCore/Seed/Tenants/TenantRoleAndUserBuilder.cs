using Abp.Authorization;
using Abp.Authorization.Roles;
using Abp.Authorization.Users;
using Abp.MultiTenancy;
using Elicom.Authorization;
using Elicom.Authorization.Roles;
using Elicom.Authorization.Users;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Linq;

namespace Elicom.EntityFrameworkCore.Seed.Tenants;

public class TenantRoleAndUserBuilder
{
    private readonly ElicomDbContext _context;
    private readonly int _tenantId;

    public TenantRoleAndUserBuilder(ElicomDbContext context, int tenantId)
    {
        _context = context;
        _tenantId = tenantId;
    }

    public void Create()
    {
        CreateRolesAndUsers();
    }

    private void CreateRolesAndUsers()
    {
        var passwordHasher = new PasswordHasher<User>(new OptionsWrapper<PasswordHasherOptions>(new PasswordHasherOptions()));

        // 1. Ensure Roles exist for this tenant
        var adminRole = EnsureRole(StaticRoleNames.Tenants.Admin);
        var supplierRole = EnsureRole(StaticRoleNames.Tenants.Supplier);
        var resellerRole = EnsureRole(StaticRoleNames.Tenants.Reseller);
        var buyerRole = EnsureRole(StaticRoleNames.Tenants.Buyer);
        var sellerRole = EnsureRole(StaticRoleNames.Tenants.Seller);

        // 2. Ensure Admin user exists for this tenant
        var adminUser = _context.Users.IgnoreQueryFilters().FirstOrDefault(u => u.TenantId == _tenantId && u.UserName == AbpUserBase.AdminUserName);
        if (adminUser == null)
        {
            adminUser = User.CreateTenantAdminUser(_tenantId, "admin@defaulttenant.com");
            adminUser.Password = passwordHasher.HashPassword(adminUser, "123qwe");
            adminUser.IsEmailConfirmed = true;
            adminUser.IsActive = true;

            _context.Users.Add(adminUser);
            _context.SaveChanges();

            // Assign Admin role
            _context.UserRoles.Add(new UserRole(_tenantId, adminUser.Id, adminRole.Id));
            _context.SaveChanges();
        }

        // 3. Create platform-specific test users
        CreateVerifiedPlatformUsers(passwordHasher);

        // 4. Grant permissions to roles
        GrantPermissions();
    }

    private Role EnsureRole(string roleName)
    {
        var role = _context.Roles.IgnoreQueryFilters().FirstOrDefault(r => r.TenantId == _tenantId && r.Name == roleName);
        if (role == null)
        {
            role = _context.Roles.Add(new Role(_tenantId, roleName, roleName) { IsStatic = true }).Entity;
            _context.SaveChanges();
        }
        return role;
    }

    private void GrantPermissions()
    {
        // Get roles again to ensure we have tracking entities
        var roles = _context.Roles.IgnoreQueryFilters().Where(r => r.TenantId == _tenantId).ToList();
        
        var supplierRole = roles.FirstOrDefault(r => r.Name == StaticRoleNames.Tenants.Supplier);
        if (supplierRole != null)
        {
            GrantPermissionIfNotExists(supplierRole, PermissionNames.Pages_PrimeShip);
            GrantPermissionIfNotExists(supplierRole, PermissionNames.Pages_Reseller_Marketplace);
            GrantPermissionIfNotExists(supplierRole, PermissionNames.Pages_GlobalPay);
            GrantPermissionIfNotExists(supplierRole, PermissionNames.Pages_Stores);
            GrantPermissionIfNotExists(supplierRole, PermissionNames.Pages_Stores_Create);
            GrantPermissionIfNotExists(supplierRole, PermissionNames.Pages_Stores_Edit);
            GrantPermissionIfNotExists(supplierRole, PermissionNames.Pages_SmartStore_Seller);
            GrantPermissionIfNotExists(supplierRole, PermissionNames.Pages_StoreProducts);
            GrantPermissionIfNotExists(supplierRole, PermissionNames.Pages_StoreProducts_Create);
            GrantPermissionIfNotExists(supplierRole, PermissionNames.Pages_StoreProducts_Edit);
            GrantPermissionIfNotExists(supplierRole, PermissionNames.Pages_Supplier_Products);
        }

        var resellerRole = roles.FirstOrDefault(r => r.Name == StaticRoleNames.Tenants.Reseller);
        if (resellerRole != null)
        {
            GrantPermissionIfNotExists(resellerRole, PermissionNames.Pages_PrimeShip);
            GrantPermissionIfNotExists(resellerRole, PermissionNames.Pages_Reseller_Store);
            GrantPermissionIfNotExists(resellerRole, PermissionNames.Pages_SmartStore_Seller);
            GrantPermissionIfNotExists(resellerRole, PermissionNames.Pages_GlobalPay);
            GrantPermissionIfNotExists(resellerRole, PermissionNames.Pages_Stores);
            GrantPermissionIfNotExists(resellerRole, PermissionNames.Pages_Stores_Create);
            GrantPermissionIfNotExists(resellerRole, PermissionNames.Pages_Stores_Edit);
            GrantPermissionIfNotExists(resellerRole, PermissionNames.Pages_StoreProducts);
            GrantPermissionIfNotExists(resellerRole, PermissionNames.Pages_StoreProducts_Create);
            GrantPermissionIfNotExists(resellerRole, PermissionNames.Pages_StoreProducts_Edit);
        }

        var sellerRole = roles.FirstOrDefault(r => r.Name == StaticRoleNames.Tenants.Seller);
        if (sellerRole != null)
        {
            GrantPermissionIfNotExists(sellerRole, PermissionNames.Pages_PrimeShip);
            GrantPermissionIfNotExists(sellerRole, PermissionNames.Pages_Stores);
            GrantPermissionIfNotExists(sellerRole, PermissionNames.Pages_Stores_Create);
            GrantPermissionIfNotExists(sellerRole, PermissionNames.Pages_SmartStore_Seller);
        }

        var buyerRole = roles.FirstOrDefault(r => r.Name == StaticRoleNames.Tenants.Buyer);
        if (buyerRole != null)
        {
            GrantPermissionIfNotExists(buyerRole, PermissionNames.Pages_PrimeShip);
        }
    }

    private void GrantPermissionIfNotExists(Role role, string permissionName)
    {
        if (!_context.Permissions.OfType<RolePermissionSetting>().Any(p => p.TenantId == _tenantId && p.RoleId == role.Id && p.Name == permissionName))
        {
            _context.Permissions.Add(new RolePermissionSetting
            {
                TenantId = _tenantId,
                Name = permissionName,
                IsGranted = true,
                RoleId = role.Id
            });
            _context.SaveChanges();
        }
    }

    private void CreateVerifiedPlatformUsers(PasswordHasher<User> passwordHasher)
    {
        if (_tenantId == 1) // Smart Store
        {
            CreateUser("noshahis@smartstoreus.com", "SS_noshahis@smartstoreus.com", StaticRoleNames.Tenants.Supplier, passwordHasher);
            CreateUser("noshahir@smartstoreus.com", "SS_noshahir@smartstoreus.com", StaticRoleNames.Tenants.Reseller, passwordHasher);
            CreateUser("noshahic@smartstoreus.com", "SS_noshahic@smartstoreus.com", StaticRoleNames.Tenants.Buyer, passwordHasher);
        }
        else if (_tenantId == 2) // Prime Ship
        {
            // Primary user noshahi@primeshipuk.com - Admin to manage categories
            CreateUser("noshahi@primeshipuk.com", "PS_noshahi@primeshipuk.com", StaticRoleNames.Tenants.Admin, passwordHasher);
            
            // Secondary Supplier/Reseller users
            CreateUser("noshahis@primeshipuk.com", "PS_noshahis@primeshipuk.com", StaticRoleNames.Tenants.Supplier, passwordHasher);
            CreateUser("admin@primeshipuk.com", "PS_admin@primeshipuk.com", StaticRoleNames.Tenants.Admin, passwordHasher);
        }
        else if (_tenantId == 3) // Easy Finora
        {
            CreateUser("noshahi@easyfinora.com", "GP_noshahi@easyfinora.com", StaticRoleNames.Tenants.Admin, passwordHasher);
            CreateUser("noshahi@finora.com", "GP_noshahi@finora.com", StaticRoleNames.Tenants.Admin, passwordHasher);
        }
    }

    private void CreateUser(string email, string userName, string roleName, PasswordHasher<User> passwordHasher)
    {
        var existingUser = _context.Users.IgnoreQueryFilters().FirstOrDefault(u => u.TenantId == _tenantId && u.UserName == userName);
        
        if (existingUser == null)
        {
            var user = new User
            {
                TenantId = _tenantId,
                UserName = userName,
                Name = "Noshahi",
                Surname = "Platform User",
                EmailAddress = email,
                IsEmailConfirmed = true,
                IsActive = true,
                PhoneNumber = "0000000000",
                Country = "United Kingdom"
            };

            user.SetNormalizedNames();
            user.Password = passwordHasher.HashPassword(user, "Noshahi.000");
            _context.Users.Add(user);
            _context.SaveChanges();
            existingUser = user;
        }
        else
        {
            // Ensure active and password is correct for these specific users
            existingUser.IsActive = true;
            existingUser.IsEmailConfirmed = true;
            existingUser.Password = passwordHasher.HashPassword(existingUser, "Noshahi.000");
            _context.Update(existingUser);
            _context.SaveChanges();
        }

        // Assign role
        var role = _context.Roles.IgnoreQueryFilters().FirstOrDefault(r => r.TenantId == _tenantId && r.Name == roleName);
        if (role != null)
        {
            var hasRole = _context.UserRoles.IgnoreQueryFilters().Any(ur => ur.UserId == existingUser.Id && ur.RoleId == role.Id);
            if (!hasRole)
            {
                _context.UserRoles.Add(new UserRole(_tenantId, existingUser.Id, role.Id));
                _context.SaveChanges();
            }
        }
    }
}
