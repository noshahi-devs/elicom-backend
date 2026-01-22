# Easy Finora - Backend API Implementation Plan

## 📋 Overview
This document provides step-by-step implementation guide for all APIs required by Easy Finora frontend.

**Process**: Implement → Test → Mark as Ready → Hand over to Frontend

---

## ✅ Already Implemented APIs

### 1. Authentication APIs
- [x] Login (`TokenAuthController.Authenticate`)
- [x] Register (`AccountAppService.RegisterGlobalPayUser`)
- [x] Email Verification
- **Status**: ✅ Tested & Ready

---

## 🔨 APIs to Implement

## Priority 1: Core Deposit Functionality

### API 1: Get P2P Bank Accounts
**Endpoint**: `GET /api/services/app/Deposit/GetP2PBankAccounts`

#### Implementation Steps:
1. **Create DTO** (`Application/Deposit/Dto/BankAccountDto.cs`):
   ```csharp
   public class BankAccountDto
   {
       public int Id { get; set; }
       public string Country { get; set; }
       public string Currency { get; set; }
       public string AccountNumber { get; set; }
       public string AccountHolder { get; set; }
       public string BankName { get; set; }
       public string BranchName { get; set; }
       public string Iban { get; set; }
       public string BankAddress { get; set; }
       public string ReceiverNumber { get; set; }
       public string Flag { get; set; }
       public string Region { get; set; }
       public DateTime? LastPaymentDate { get; set; }
   }
   ```

2. **Create Entity** (`Core/Deposit/BankAccount.cs`):
   ```csharp
   public class BankAccount : Entity<int>
   {
       public string Country { get; set; }
       public string Currency { get; set; }
       // ... all properties
   }
   ```

3. **Add to DbContext** (`EntityFrameworkCore/ElicomDbContext.cs`):
   ```csharp
   public DbSet<BankAccount> BankAccounts { get; set; }
   ```

4. **Create Service Interface** (`Application/Deposit/IDepositAppService.cs`):
   ```csharp
   Task<List<BankAccountDto>> GetP2PBankAccounts();
   ```

5. **Implement Service** (`Application/Deposit/DepositAppService.cs`):
   ```csharp
   public async Task<List<BankAccountDto>> GetP2PBankAccounts()
   {
       var accounts = await _bankAccountRepository.GetAllListAsync();
       return ObjectMapper.Map<List<BankAccountDto>>(accounts);
   }
   ```

6. **Seed Data** (Add bank accounts to database)

7. **Test**:
   - [ ] Unit test in `Elicom.Tests`
   - [ ] Swagger test
   - [ ] Postman test with auth token

**Status**: ⚠️ Not Started

---

### API 2: Submit P2P Deposit
**Endpoint**: `POST /api/services/app/Deposit/SubmitP2PDeposit`

#### Implementation Steps:
1. **Create DTO** (`Application/Deposit/Dto/SubmitP2PDepositInput.cs`):
   ```csharp
   public class SubmitP2PDepositInput
   {
       public int BankAccountId { get; set; }
       public decimal Amount { get; set; }
       public bool PaymentConfirmed { get; set; }
       public IFormFile ProofFile { get; set; }
   }
   
   public class DepositResultDto
   {
       public long DepositId { get; set; }
       public string Status { get; set; }
       public string Message { get; set; }
   }
   ```

2. **Create Entity** (`Core/Deposit/Deposit.cs`):
   ```csharp
   public class Deposit : FullAuditedEntity<long>, IMustHaveTenant
   {
       public int TenantId { get; set; }
       public long UserId { get; set; }
       public decimal Amount { get; set; }
       public string Currency { get; set; }
       public string Method { get; set; } // P2P, Crypto
       public string Status { get; set; } // Pending, Approved, Rejected
       public int? BankAccountId { get; set; }
       public string ProofFilePath { get; set; }
       public DateTime? ApprovedDate { get; set; }
       public long? ApprovedBy { get; set; }
   }
   ```

3. **Add to DbContext**

4. **Implement Service**:
   ```csharp
   public async Task<DepositResultDto> SubmitP2PDeposit(SubmitP2PDepositInput input)
   {
       // Validate amount
       if (input.Amount < 10)
           throw new UserFriendlyException("Minimum deposit is $10");
       
       // Save proof file
       var filePath = await SaveProofFile(input.ProofFile);
       
       // Create deposit record
       var deposit = new Deposit
       {
           UserId = AbpSession.GetUserId(),
           Amount = input.Amount,
           Method = "P2P",
           Status = "Pending",
           BankAccountId = input.BankAccountId,
           ProofFilePath = filePath
       };
       
       await _depositRepository.InsertAsync(deposit);
       await CurrentUnitOfWork.SaveChangesAsync();
       
       return new DepositResultDto
       {
           DepositId = deposit.Id,
           Status = "Pending",
           Message = "Deposit submitted successfully"
       };
   }
   ```

5. **File Upload Helper**:
   ```csharp
   private async Task<string> SaveProofFile(IFormFile file)
   {
       var uploadsFolder = Path.Combine(_env.WebRootPath, "uploads", "proofs");
       Directory.CreateDirectory(uploadsFolder);
       
       var fileName = $"{Guid.NewGuid()}_{file.FileName}";
       var filePath = Path.Combine(uploadsFolder, fileName);
       
       using (var stream = new FileStream(filePath, FileMode.Create))
       {
           await file.CopyToAsync(stream);
       }
       
       return $"/uploads/proofs/{fileName}";
   }
   ```

6. **Test**:
   - [ ] Unit test
   - [ ] File upload test
   - [ ] Database verification

**Status**: ⚠️ Not Started

---

### API 3: Submit Crypto Deposit
**Endpoint**: `POST /api/services/app/Deposit/SubmitCryptoDeposit`

#### Implementation Steps:
1. **Create DTO** (`Application/Deposit/Dto/SubmitCryptoDepositInput.cs`):
   ```csharp
   public class SubmitCryptoDepositInput
   {
       public decimal Amount { get; set; }
       public string WalletAddress { get; set; }
       public IFormFile TransactionProofFile { get; set; }
   }
   ```

2. **Implement Service** (similar to P2P but with Method = "Crypto")

3. **Test**:
   - [ ] Unit test
   - [ ] File upload test

**Status**: ⚠️ Not Started

---

### API 4: Get Crypto Wallet Address
**Endpoint**: `GET /api/services/app/Deposit/GetCryptoWalletAddress`

#### Implementation Steps:
1. **Create DTO**:
   ```csharp
   public class CryptoWalletDto
   {
       public string WalletAddress { get; set; }
       public string Network { get; set; }
       public string QrCodeUrl { get; set; }
   }
   ```

2. **Implement Service**:
   ```csharp
   public async Task<CryptoWalletDto> GetCryptoWalletAddress()
   {
       // For now, return hardcoded wallet
       // Later: Get from settings or generate per user
       return new CryptoWalletDto
       {
           WalletAddress = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
           Network = "Bitcoin",
           QrCodeUrl = GenerateQRCode("bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh")
       };
   }
   ```

3. **Test**:
   - [ ] Unit test
   - [ ] QR code generation

**Status**: ⚠️ Not Started

---

## Priority 2: User Profile & Balance

### API 5: Get User Profile
**Endpoint**: `GET /api/services/app/User/GetCurrentUser`

#### Implementation Steps:
1. **Create DTO**:
   ```csharp
   public class UserProfileDto
   {
       public long Id { get; set; }
       public string UserName { get; set; }
       public string EmailAddress { get; set; }
       public string Name { get; set; }
       public string Surname { get; set; }
       public string PhoneNumber { get; set; }
       public string Country { get; set; }
       public decimal Balance { get; set; }
       public string Currency { get; set; }
       public bool IsEmailConfirmed { get; set; }
   }
   ```

2. **Implement Service**:
   ```csharp
   public async Task<UserProfileDto> GetCurrentUser()
   {
       var userId = AbpSession.GetUserId();
       var user = await UserManager.GetUserByIdAsync(userId);
       var balance = await _userBalanceRepository
           .FirstOrDefaultAsync(b => b.UserId == userId);
       
       return new UserProfileDto
       {
           Id = user.Id,
           UserName = user.UserName,
           EmailAddress = user.EmailAddress,
           Name = user.Name,
           Surname = user.Surname,
           PhoneNumber = user.PhoneNumber,
           Balance = balance?.Amount ?? 0,
           Currency = "USD",
           IsEmailConfirmed = user.IsEmailConfirmed
       };
   }
   ```

3. **Create UserBalance Entity** if not exists

4. **Test**:
   - [ ] Unit test
   - [ ] Verify balance calculation

**Status**: ⚠️ Not Started

---

### API 6: Get User Balance
**Endpoint**: `GET /api/services/app/User/GetBalance`

#### Implementation Steps:
1. **Create DTO**:
   ```csharp
   public class UserBalanceDto
   {
       public decimal Balance { get; set; }
       public string Currency { get; set; }
       public decimal PendingDeposits { get; set; }
       public decimal AvailableBalance { get; set; }
   }
   ```

2. **Implement Service**:
   ```csharp
   public async Task<UserBalanceDto> GetBalance()
   {
       var userId = AbpSession.GetUserId();
       var balance = await _userBalanceRepository
           .FirstOrDefaultAsync(b => b.UserId == userId);
       var pendingDeposits = await _depositRepository
           .GetAll()
           .Where(d => d.UserId == userId && d.Status == "Pending")
           .SumAsync(d => d.Amount);
       
       return new UserBalanceDto
       {
           Balance = balance?.Amount ?? 0,
           Currency = "USD",
           PendingDeposits = pendingDeposits,
           AvailableBalance = (balance?.Amount ?? 0) - pendingDeposits
       };
   }
   ```

3. **Test**:
   - [ ] Unit test
   - [ ] Verify calculations

**Status**: ⚠️ Not Started

---

## Priority 3: Transaction History

### API 7: Get Deposit History
**Endpoint**: `GET /api/services/app/Deposit/GetDepositHistory`

#### Implementation Steps:
1. **Create DTO**:
   ```csharp
   public class DepositHistoryDto
   {
       public long Id { get; set; }
       public decimal Amount { get; set; }
       public string Currency { get; set; }
       public string Method { get; set; }
       public string Status { get; set; }
       public DateTime CreatedDate { get; set; }
       public DateTime? ApprovedDate { get; set; }
       public string BankAccount { get; set; }
       public string ProofUrl { get; set; }
   }
   
   public class PagedDepositHistoryDto : PagedResultDto<DepositHistoryDto>
   {
   }
   ```

2. **Implement Service**:
   ```csharp
   public async Task<PagedDepositHistoryDto> GetDepositHistory(
       int skipCount, int maxResultCount, string status = null)
   {
       var userId = AbpSession.GetUserId();
       var query = _depositRepository.GetAll()
           .Where(d => d.UserId == userId);
       
       if (!string.IsNullOrEmpty(status))
           query = query.Where(d => d.Status == status);
       
       var totalCount = await query.CountAsync();
       var items = await query
           .OrderByDescending(d => d.CreationTime)
           .Skip(skipCount)
           .Take(maxResultCount)
           .ToListAsync();
       
       return new PagedDepositHistoryDto
       {
           TotalCount = totalCount,
           Items = ObjectMapper.Map<List<DepositHistoryDto>>(items)
       };
   }
   ```

3. **Test**:
   - [ ] Unit test
   - [ ] Pagination test

**Status**: ⚠️ Not Started

---

## 📊 Implementation Checklist

### Phase 1: Core Deposit (Week 1)
- [ ] API 1: Get P2P Bank Accounts
  - [ ] Create entities
  - [ ] Create DTOs
  - [ ] Implement service
  - [ ] Seed data
  - [ ] Unit tests
  - [ ] Swagger test
  - [ ] ✅ Mark as ready for frontend

- [ ] API 2: Submit P2P Deposit
  - [ ] Create entities
  - [ ] Create DTOs
  - [ ] Implement file upload
  - [ ] Implement service
  - [ ] Unit tests
  - [ ] Integration test
  - [ ] ✅ Mark as ready for frontend

- [ ] API 3: Submit Crypto Deposit
  - [ ] Create DTOs
  - [ ] Implement service
  - [ ] Unit tests
  - [ ] ✅ Mark as ready for frontend

- [ ] API 4: Get Crypto Wallet
  - [ ] Create DTOs
  - [ ] Implement service
  - [ ] QR code generation
  - [ ] Unit tests
  - [ ] ✅ Mark as ready for frontend

### Phase 2: User Profile (Week 2)
- [ ] API 5: Get User Profile
- [ ] API 6: Get User Balance
- [ ] Create UserBalance entity
- [ ] Tests
- [ ] ✅ Mark as ready for frontend

### Phase 3: History & Dashboard (Week 3)
- [ ] API 7: Get Deposit History
- [ ] API 8: Get Transaction History
- [ ] API 9: Get Dashboard Summary
- [ ] Tests
- [ ] ✅ Mark as ready for frontend

### Phase 4: Card Management (Future)
- [ ] API 10: Get User Cards
- [ ] API 11: Add Card
- [ ] Tests
- [ ] ✅ Mark as ready for frontend

---

## 🧪 Testing Requirements

### For Each API:
1. **Unit Tests** (`Elicom.Tests`)
   - Test service logic
   - Test validation
   - Test error handling

2. **Integration Tests**
   - Test with database
   - Test file uploads
   - Test authentication

3. **Manual Testing**
   - Swagger UI test
   - Postman collection test
   - Verify response format matches frontend requirements

4. **Sign-off**
   - [ ] All tests passing
   - [ ] Code reviewed
   - [ ] Documentation updated
   - [ ] ✅ Ready for frontend integration

---

## 📝 Notes

- All APIs must use `[AbpAuthorize]` attribute
- All APIs must validate tenant context
- File uploads must validate file type and size
- All monetary amounts use `decimal` type
- All dates use UTC timezone
- Error messages must be user-friendly

---

**Next Step**: Start with Phase 1 - Core Deposit APIs
