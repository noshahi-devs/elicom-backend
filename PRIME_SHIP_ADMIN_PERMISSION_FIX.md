# 🔧 PRIME SHIP - ADMIN PERMISSION FIX

**Issue**: 403 Forbidden when creating categories  
**Cause**: User `noshahi@primeshipuk.com` has Supplier role instead of Admin role  
**Solution**: Update user role to Admin

---

## ✅ **FIX APPLIED:**

### **File Modified:**
`TenantRoleAndUserBuilder.cs`

### **Change:**
```csharp
// BEFORE (Line 142):
roleToAssign = StaticRoleNames.Tenants.Supplier;

// AFTER (Line 142):
roleToAssign = StaticRoleNames.Tenants.Admin; // Grant Admin Access
```

---

## 🔄 **HOW TO APPLY THE FIX:**

### **Option 1: Re-run Database Seeder** ⭐ RECOMMENDED
```powershell
cd aspnet-core/src/Elicom.Migrator
dotnet run
```

This will:
1. Update the existing user's role from Supplier to Admin
2. Grant all admin permissions

### **Option 2: Manual SQL Update** (Quick Fix)
```sql
-- Find the user
SELECT * FROM AbpUsers WHERE EmailAddress = 'noshahi@primeshipuk.com';

-- Find Admin role for Tenant 2
SELECT * FROM AbpRoles WHERE TenantId = 2 AND Name = 'Admin';

-- Update user role (replace IDs with actual values from above queries)
UPDATE AbpUserRoles 
SET RoleId = (SELECT Id FROM AbpRoles WHERE TenantId = 2 AND Name = 'Admin')
WHERE UserId = (SELECT Id FROM AbpUsers WHERE EmailAddress = 'noshahi@primeshipuk.com');

-- OR if no role exists, insert it:
INSERT INTO AbpUserRoles (TenantId, UserId, RoleId, CreationTime)
VALUES (
    2,
    (SELECT Id FROM AbpUsers WHERE EmailAddress = 'noshahi@primeshipuk.com'),
    (SELECT Id FROM AbpRoles WHERE TenantId = 2 AND Name = 'Admin'),
    GETDATE()
);
```

### **Option 3: Delete and Recreate Database** (Nuclear Option)
```powershell
# 1. Drop database
# 2. Run migrator
cd aspnet-core/src/Elicom.Migrator
dotnet run

# 3. Restart backend
cd ../Elicom.Web.Host
dotnet run
```

---

## 🎯 **VERIFICATION:**

After applying the fix:

1. **Restart the backend** (if using Option 1 or 3)
2. **Login again** at http://localhost:4300/auth/login
   - Email: `noshahi@primeshipuk.com`
   - Password: `Noshahi.000`
3. **Test category creation** at http://localhost:4300/admin/categories

---

## 📝 **WHAT CHANGED:**

### **Before:**
- Prime Ship user had **Supplier** role
- Suppliers cannot create categories (403 Forbidden)

### **After:**
- Prime Ship user has **Admin** role
- Admins have all permissions including category/product management

---

## 🔍 **COMPARISON WITH EASY FINORA:**

| Platform | Tenant | Email | Role |
|----------|--------|-------|------|
| **Easy Finora** | 3 | noshahi@finora.com | **Admin** ✅ |
| **Prime Ship** (Before) | 2 | noshahi@primeshipuk.com | Supplier ❌ |
| **Prime Ship** (After) | 2 | noshahi@primeshipuk.com | **Admin** ✅ |

---

## ⚡ **QUICK FIX COMMAND:**

```powershell
# Run this in the migrator directory:
cd d:\Adeel\Learning\elicom-backend\aspnet-core\src\Elicom.Migrator
dotnet run
```

Then restart your backend and try again!

---

**Status**: ✅ Code Fixed  
**Next Step**: Run migrator to update database
