# 🎯 PRIME SHIP ADMIN USER - QUICK SOLUTION

## ✅ **CODE ALREADY UPDATED!**

The seeder code in `TenantRoleAndUserBuilder.cs` (line 146) already creates:
- **Email**: `admin@primeshipuk.com`
- **Password**: `Noshahi.000`
- **Role**: Admin

## 🚀 **EASIEST SOLUTION:**

### **Option 1: Use Backend API to Register** ⭐ RECOMMENDED

1. Go to: `http://localhost:4300/auth/register`
2. Register as **Seller** with:
   - Email: `admin@primeshipuk.com`
   - Password: `Noshahi.000`
3. Then manually update role in database:

```sql
USE ElicomDb;

-- Update user role to Admin
UPDATE AbpUserRoles 
SET RoleId = (SELECT Id FROM AbpRoles WHERE TenantId = 2 AND Name = 'Admin')
WHERE UserId = (SELECT Id FROM AbpUsers WHERE EmailAddress = 'admin@primeshipuk.com');
```

### **Option 2: Use Existing User**

Just use: `engr.adeelnoshahi@gmail.com` / `Noshahi.000`

Then update role:
```sql
UPDATE AbpUserRoles 
SET RoleId = (SELECT Id FROM AbpRoles WHERE TenantId = 2 AND Name = 'Admin')
WHERE UserId = (SELECT Id FROM AbpUsers WHERE EmailAddress = 'engr.adeelnoshahi@gmail.com');
```

## 📝 **NEXT STEPS:**

1. Run one of the SQL scripts above
2. Restart backend
3. Login and test!

**Status**: ✅ Seeder code ready, just need to run SQL update
