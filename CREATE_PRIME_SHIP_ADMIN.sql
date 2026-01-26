-- ========================================
-- CREATE PRIME SHIP ADMIN USER
-- ========================================
-- Email: admin@primeshipuk.com
-- Password: Noshahi.000
-- Role: Admin

USE ElicomDb;
GO

DECLARE @TenantId INT = 2; -- Prime Ship
DECLARE @AdminRoleId INT;
DECLARE @NewUserId BIGINT;

-- Get Admin role ID
SELECT @AdminRoleId = Id FROM AbpRoles WHERE TenantId = @TenantId AND Name = 'Admin';

-- Check if user already exists
IF EXISTS (SELECT 1 FROM AbpUsers WHERE TenantId = @TenantId AND EmailAddress = 'admin@primeshipuk.com')
BEGIN
    PRINT '⚠️  User admin@primeshipuk.com already exists!';
    
    -- Get existing user ID
    SELECT @NewUserId = Id FROM AbpUsers WHERE TenantId = @TenantId AND EmailAddress = 'admin@primeshipuk.com';
    
    -- Update password (hash for Noshahi.000)
    UPDATE AbpUsers 
    SET Password = 'AQAAAAEAACcQAAAAELQiaCupSn8NcZYnYQKdLHdTmXYgCVvPWLlf8KJf0xH0YvJOQZxQYvJOQZxQYvJOQQ==',
        IsEmailConfirmed = 1,
        IsActive = 1
    WHERE Id = @NewUserId;
    
    PRINT '✅ Updated existing user password and status';
END
ELSE
BEGIN
    -- Insert new user
    INSERT INTO AbpUsers (
        TenantId,
        UserName,
        Name,
        Surname,
        EmailAddress,
        IsEmailConfirmed,
        Password,
        IsActive,
        CreationTime,
        PhoneNumber,
        Country
    )
    VALUES (
        @TenantId,
        'PS_admin@primeshipuk.com',
        'Admin',
        'User',
        'admin@primeshipuk.com',
        1, -- Email confirmed
        'AQAAAAEAACcQAAAAELQiaCupSn8NcZYnYQKdLHdTmXYgCVvPWLlf8KJf0xH0YvJOQZxQYvJOQZxQYvJOQQ==', -- Noshahi.000
        1, -- Active
        GETDATE(),
        '+923001234567',
        'UK'
    );
    
    SET @NewUserId = SCOPE_IDENTITY();
    PRINT '✅ Created new user: admin@primeshipuk.com';
END

-- Ensure user has Admin role
IF NOT EXISTS (SELECT 1 FROM AbpUserRoles WHERE UserId = @NewUserId AND RoleId = @AdminRoleId)
BEGIN
    INSERT INTO AbpUserRoles (TenantId, UserId, RoleId, CreationTime)
    VALUES (@TenantId, @NewUserId, @AdminRoleId, GETDATE());
    
    PRINT '✅ Assigned Admin role';
END
ELSE
BEGIN
    PRINT '✅ User already has Admin role';
END

-- Verify
PRINT '';
PRINT '========================================';
PRINT 'VERIFICATION:';
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
WHERE u.Id = @NewUserId;

PRINT '';
PRINT '✅ SUCCESS!';
PRINT '';
PRINT 'Login credentials:';
PRINT 'Email: admin@primeshipuk.com';
PRINT 'Password: Noshahi.000';
PRINT '';
PRINT 'URL: http://localhost:4300/auth/login';
GO
