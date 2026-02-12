DECLARE @Email NVARCHAR(256) = 'adeel.solvefy@gmail.com';
DECLARE @UserId BIGINT;

SELECT @UserId = Id
FROM AbpUsers
WHERE EmailAddress = @Email;

IF @UserId IS NULL
BEGIN
    PRINT 'User not found';
    RETURN;
END

BEGIN TRY
    BEGIN TRANSACTION;

    -- 1️⃣ Delete WalletTransactions
    DELETE WT
    FROM WalletTransactions WT
    INNER JOIN Wallets W ON WT.WalletId = W.Id
    WHERE W.UserId = @UserId;

    -- 2️⃣ Delete Wallets
    DELETE FROM Wallets 
    WHERE UserId = @UserId;

    -- 3️⃣ Delete User Roles
    DELETE FROM AbpUserRoles 
    WHERE UserId = @UserId;

    -- 4️⃣ Delete Stores
    DELETE FROM Stores 
    WHERE OwnerId = @UserId 
       OR SupportEmail = @Email;

    -- 5️⃣ Delete Support Tickets
    DELETE FROM SupportTickets
    WHERE UserId = @UserId;

    -- 6️⃣ Finally delete User
    DELETE FROM AbpUsers 
    WHERE Id = @UserId;

    COMMIT TRANSACTION;

    PRINT 'User deleted successfully';
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT ERROR_MESSAGE();
END CATCH;
