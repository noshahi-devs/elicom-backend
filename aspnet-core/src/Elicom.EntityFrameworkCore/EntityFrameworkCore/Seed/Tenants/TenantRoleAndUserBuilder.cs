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
        // Admin role

        var adminRole = _context.Roles.IgnoreQueryFilters().FirstOrDefault(r => r.TenantId == _tenantId && r.Name == StaticRoleNames.Tenants.Admin);
        if (adminRole == null)
        {
            adminRole = _context.Roles.Add(new Role(_tenantId, StaticRoleNames.Tenants.Admin, StaticRoleNames.Tenants.Admin) { IsStatic = true }).Entity;
            _context.SaveChanges();
        }

        // Grant all permissions to admin role

        var grantedPermissions = _context.Permissions.IgnoreQueryFilters()
            .OfType<RolePermissionSetting>()
            .Where(p => p.TenantId == _tenantId && p.RoleId == adminRole.Id)
            .Select(p => p.Name)
            .ToList();

        var permissions = PermissionFinder
            .GetAllPermissions(new ElicomAuthorizationProvider())
            .Where(p => p.MultiTenancySides.HasFlag(MultiTenancySides.Tenant) &&
                        !grantedPermissions.Contains(p.Name))
            .ToList();

        if (permissions.Any())
        {
            _context.Permissions.AddRange(
                permissions.Select(permission => new RolePermissionSetting
                {
                    TenantId = _tenantId,
                    Name = permission.Name,
                    IsGranted = true,
                    RoleId = adminRole.Id
                })
            );
            _context.SaveChanges();
        }

        // Supplier role
        var supplierRole = _context.Roles.IgnoreQueryFilters().FirstOrDefault(r => r.TenantId == _tenantId && r.Name == StaticRoleNames.Tenants.Supplier);
        if (supplierRole == null)
        {
            supplierRole = _context.Roles.Add(new Role(_tenantId, StaticRoleNames.Tenants.Supplier, StaticRoleNames.Tenants.Supplier) { IsStatic = true }).Entity;
            _context.SaveChanges();
        }
        else if (supplierRole.IsDefault)
        {
            supplierRole.IsDefault = false;
            _context.SaveChanges();
        }

        // Reseller role
        var resellerRole = _context.Roles.IgnoreQueryFilters().FirstOrDefault(r => r.TenantId == _tenantId && r.Name == StaticRoleNames.Tenants.Reseller);
        if (resellerRole == null)
        {
            resellerRole = _context.Roles.Add(new Role(_tenantId, StaticRoleNames.Tenants.Reseller, StaticRoleNames.Tenants.Reseller) { IsStatic = true }).Entity;
            _context.SaveChanges();
        }
        else if (resellerRole.IsDefault)
        {
            resellerRole.IsDefault = false;
            _context.SaveChanges();
        }

        // Buyer role
        var buyerRole = _context.Roles.IgnoreQueryFilters().FirstOrDefault(r => r.TenantId == _tenantId && r.Name == StaticRoleNames.Tenants.Buyer);
        if (buyerRole == null)
        {
            _context.Roles.Add(new Role(_tenantId, StaticRoleNames.Tenants.Buyer, StaticRoleNames.Tenants.Buyer) { IsStatic = true });
            _context.SaveChanges();
        }

        // Admin user

        var adminUser = _context.Users.IgnoreQueryFilters().FirstOrDefault(u => u.TenantId == _tenantId && u.UserName == AbpUserBase.AdminUserName);
        if (adminUser == null)
        {
            adminUser = User.CreateTenantAdminUser(_tenantId, "admin@defaulttenant.com");
            adminUser.Password = new PasswordHasher<User>(new OptionsWrapper<PasswordHasherOptions>(new PasswordHasherOptions())).HashPassword(adminUser, "123qwe");
            adminUser.IsEmailConfirmed = true;
            adminUser.IsActive = true;

            _context.Users.Add(adminUser);
            _context.SaveChanges();

            // Assign Admin role to admin user
            _context.UserRoles.Add(new UserRole(_tenantId, adminUser.Id, adminRole.Id));
            _context.SaveChanges();
        }

        // Create verified test users for each platform
        CreateVerifiedTestUser();

        // Grant permissions to specific roles
        GrantPermissions();
    }

    private void GrantPermissions()
    {
        var supplierRole = _context.Roles.IgnoreQueryFilters().FirstOrDefault(r => r.TenantId == _tenantId && r.Name == StaticRoleNames.Tenants.Supplier);
        if (supplierRole != null)
        {
            GrantPermissionIfNotExists(supplierRole, PermissionNames.Pages_PrimeShip);
            GrantPermissionIfNotExists(supplierRole, PermissionNames.Pages_Reseller_Marketplace);
            GrantPermissionIfNotExists(supplierRole, PermissionNames.Pages_GlobalPay); // For wallet/card access

            // Store permissions for Supplier
            GrantPermissionIfNotExists(supplierRole, PermissionNames.Pages_Stores);
            GrantPermissionIfNotExists(supplierRole, PermissionNames.Pages_Stores_Create);
            GrantPermissionIfNotExists(supplierRole, PermissionNames.Pages_Stores_Edit);
            GrantPermissionIfNotExists(supplierRole, PermissionNames.Pages_SmartStore_Seller);
            GrantPermissionIfNotExists(supplierRole, PermissionNames.Pages_StoreProducts);
            GrantPermissionIfNotExists(supplierRole, PermissionNames.Pages_StoreProducts_Create);
            GrantPermissionIfNotExists(supplierRole, PermissionNames.Pages_StoreProducts_Edit);
            GrantPermissionIfNotExists(supplierRole, PermissionNames.Pages_Supplier_Products);
        }

        var resellerRole = _context.Roles.IgnoreQueryFilters().FirstOrDefault(r => r.TenantId == _tenantId && r.Name == StaticRoleNames.Tenants.Reseller);
        if (resellerRole != null)
        {
            GrantPermissionIfNotExists(resellerRole, PermissionNames.Pages_PrimeShip); // Allow wholesale purchases
            GrantPermissionIfNotExists(resellerRole, PermissionNames.Pages_Reseller_Store);
            GrantPermissionIfNotExists(resellerRole, PermissionNames.Pages_SmartStore_Seller);
            GrantPermissionIfNotExists(resellerRole, PermissionNames.Pages_GlobalPay);

            // Store management for Resellers
            GrantPermissionIfNotExists(resellerRole, PermissionNames.Pages_Stores);
            GrantPermissionIfNotExists(resellerRole, PermissionNames.Pages_Stores_Create);
            GrantPermissionIfNotExists(resellerRole, PermissionNames.Pages_Stores_Edit);
            GrantPermissionIfNotExists(resellerRole, PermissionNames.Pages_StoreProducts);
            GrantPermissionIfNotExists(resellerRole, PermissionNames.Pages_StoreProducts_Create);
            GrantPermissionIfNotExists(resellerRole, PermissionNames.Pages_StoreProducts_Edit);
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

    private void CreateVerifiedTestUser()
    {
        var passwordHasher = new PasswordHasher<User>(new OptionsWrapper<PasswordHasherOptions>(new PasswordHasherOptions()));
        string testEmail = "";
        string userName = "";
        string roleToAssign = StaticRoleNames.Tenants.Reseller;

        // Determine test user based on tenant
        if (_tenantId == 1) // Prime Ship
        {
            // Create Admin
            CreateUser("admin@primeshipuk.com", "PS_admin@primeshipuk.com", StaticRoleNames.Tenants.Admin, passwordHasher);

            // Create Seller
            testEmail = "noshahis@primeshipuk.com";
            userName = "PS_noshahis@primeshipuk.com";
            roleToAssign = StaticRoleNames.Tenants.Reseller;
            CreateUser(testEmail, userName, roleToAssign, passwordHasher);

            // Create Customer
            testEmail = "noshahic@primeshipuk.com";
            userName = "PS_noshahic@primeshipuk.com";
            roleToAssign = StaticRoleNames.Tenants.Buyer;
            CreateUser(testEmail, userName, roleToAssign, passwordHasher);
        }
        else if (_tenantId == 2) // Prime Ship
        {
            testEmail = "noshahi@primeshipuk.com";
            userName = "PS_noshahi@primeshipuk.com";
            roleToAssign = StaticRoleNames.Tenants.Supplier;
            CreateUser(testEmail, userName, roleToAssign, passwordHasher);
            
            // Create Admin user for Prime Ship
            CreateUser("admin@primeshipuk.com", "PS_admin@primeshipuk.com", StaticRoleNames.Tenants.Admin, passwordHasher);
        }

        else if (_tenantId == 3) // Easy Finora
        {
            testEmail = "noshahi@easyfinora.com";
            userName = "GP_noshahi@easyfinora.com";
            roleToAssign = StaticRoleNames.Tenants.Admin; // Grant Admin Access
            CreateUser(testEmail, userName, roleToAssign, passwordHasher);

            // Also add finora.com variant just in case
            CreateUser("noshahi@finora.com", "GP_noshahi@finora.com", StaticRoleNames.Tenants.Admin, passwordHasher);
        }
    }

    private void CreateUser(string email, string userName, string roleName, PasswordHasher<User> passwordHasher)
    {
        var existingUser = _context.Users.IgnoreQueryFilters().FirstOrDefault(u => u.TenantId == _tenantId && u.UserName == userName);
        
        // Create if not exists
        if (existingUser == null)
        {
            var testUser = new User
            {
                TenantId = _tenantId,
                UserName = userName,
                Name = "Test",
                Surname = "User",
                EmailAddress = email,
                IsEmailConfirmed = true,
                IsActive = true,
                PhoneNumber = "+923001234567",
                Country = "Pakistan"
            };

            testUser.SetNormalizedNames();
            testUser.Password = passwordHasher.HashPassword(testUser, "Noshahi.000"); // Known password
            _context.Users.Add(testUser);
            _context.SaveChanges();
            existingUser = testUser;
        }
        else 
        {
            // Update existing user password specifically for troubleshooting
            if (userName.Contains("noshahi"))
            {
                existingUser.Password = passwordHasher.HashPassword(existingUser, "Noshahi.000");
                existingUser.IsEmailConfirmed = true;
                existingUser.IsActive = true;
                _context.Update(existingUser);
                _context.SaveChanges();

                // FORCE ROLE ASSIGNMENT for troubleshooting
                var defaultRoleForUser = roleName;
                var roleToFix = _context.Roles.IgnoreQueryFilters().FirstOrDefault(r => r.TenantId == _tenantId && r.Name == defaultRoleForUser);
                if (roleToFix != null)
                {
                    var userRoleExists = _context.UserRoles.IgnoreQueryFilters().Any(ur => ur.UserId == existingUser.Id && ur.RoleId == roleToFix.Id);
                    if (!userRoleExists)
                    {
                        _context.UserRoles.Add(new UserRole(_tenantId, existingUser.Id, roleToFix.Id));
                        _context.SaveChanges();
                    }
                }
            }
        }

        // Assign/Update role
        var role = _context.Roles.IgnoreQueryFilters().FirstOrDefault(r => r.TenantId == _tenantId && r.Name == roleName);
        if (role != null && existingUser != null)
        {
            var userRole = _context.UserRoles.IgnoreQueryFilters().FirstOrDefault(ur => ur.UserId == existingUser.Id && ur.RoleId == role.Id);
            if (userRole == null)
            {
                _context.UserRoles.Add(new UserRole(_tenantId, existingUser.Id, role.Id));
                _context.SaveChanges();
            }
        }
    }
}
