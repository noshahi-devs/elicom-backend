-- ========================================
-- PRIME SHIP ADMIN FIX - SQL SCRIPT
-- ========================================
-- This script updates noshahi@primeshipuk.com to have Admin role
-- Run this in SQL Server Management Studio or Azure Data Studio

USE ElicomDb;
GO

-- Step 1: Find the user
DECLARE @UserId BIGINT;
DECLARE @AdminRoleId INT;
DECLARE @TenantId INT = 2; -- Prime Ship

-- Get user ID
SELECT @UserId = Id 
FROM AbpUsers 
WHERE TenantId = @TenantId 
  AND EmailAddress = 'noshahi@primeshipuk.com';

-- Get Admin role ID for Tenant 2
SELECT @AdminRoleId = Id 
FROM AbpRoles 
WHERE TenantId = @TenantId 
  AND Name = 'Admin';

-- Display current info
PRINT '========================================';
PRINT 'CURRENT STATUS:';
PRINT '========================================';
PRINT 'User ID: ' + CAST(@UserId AS VARCHAR(20));
PRINT 'Admin Role ID: ' + CAST(@AdminRoleId AS VARCHAR(20));

-- Show current roles
SELECT 
    u.EmailAddress,
    r.Name AS RoleName,
    ur.RoleId
FROM AbpUsers u
INNER JOIN AbpUserRoles ur ON u.Id = ur.UserId
INNER JOIN AbpRoles r ON ur.RoleId = r.Id
WHERE u.Id = @UserId;

-- Step 2: Remove existing roles
DELETE FROM AbpUserRoles 
WHERE UserId = @UserId;

PRINT '';
PRINT 'Removed existing roles';

-- Step 3: Add Admin role
INSERT INTO AbpUserRoles (TenantId, UserId, RoleId, CreationTime, CreatorUserId)
VALUES (@TenantId, @UserId, @AdminRoleId, GETDATE(), NULL);

PRINT 'Added Admin role';

-- Step 4: Verify the change
PRINT '';
PRINT '========================================';
PRINT 'NEW STATUS:';
PRINT '========================================';

SELECT 
    u.EmailAddress,
    u.UserName,
    r.Name AS RoleName,
    u.IsActive,
    u.IsEmailConfirmed
FROM AbpUsers u
INNER JOIN AbpUserRoles ur ON u.Id = ur.UserId
INNER JOIN AbpRoles r ON ur.RoleId = r.Id
WHERE u.Id = @UserId;

PRINT '';
PRINT '✅ SUCCESS! User now has Admin role.';
PRINT '';
PRINT 'Next steps:';
PRINT '1. Restart the backend (dotnet run)';
PRINT '2. Login again at http://localhost:4300/auth/login';
PRINT '3. Try creating a category';
GO
