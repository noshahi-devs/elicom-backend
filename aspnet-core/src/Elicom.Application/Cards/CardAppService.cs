using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Domain.Uow;
using Abp.Runtime.Session;
using Abp.UI;
using Elicom.Authorization.Users;
using Elicom.Cards.Dto;

using Elicom.Entities;
using Microsoft.EntityFrameworkCore;

namespace Elicom.Cards
{
    [AbpAuthorize]
    public class CardAppService : ElicomAppServiceBase, ICardAppService
    {
        private readonly IRepository<VirtualCard, long> _cardRepository;
        private readonly IRepository<DepositRequest, Guid> _depositRepository;
        private readonly IRepository<WithdrawRequest, long> _withdrawRepository;
        private readonly IRepository<CardApplication, Guid> _applicationRepository;
        private readonly UserManager _userManager;

        public CardAppService(
            IRepository<VirtualCard, long> cardRepository,
            IRepository<DepositRequest, Guid> depositRepository,
            IRepository<WithdrawRequest, long> withdrawRepository,
            IRepository<CardApplication, Guid> applicationRepository,
            UserManager userManager)
        {
            _cardRepository = cardRepository;
            _depositRepository = depositRepository;
            _withdrawRepository = withdrawRepository;
            _applicationRepository = applicationRepository;
            _userManager = userManager;
        }

        public async Task<UserBalanceDto> GetBalance()
        {
            var userId = AbpSession.GetUserId();

            var totalBalance = await _cardRepository.GetAll()
                .Where(c => c.UserId == userId)
                .SumAsync(c => c.Balance);

            var pendingDeposit = await _depositRepository.GetAll()
                .Where(r => r.UserId == userId && r.Status == "Pending")
                .SumAsync(r => r.Amount);

            var pendingWithdrawal = await _withdrawRepository.GetAll()
                .Where(r => r.UserId == userId && r.Status == "Pending")
                .SumAsync(r => r.Amount);

            return new UserBalanceDto
            {
                TotalBalance = totalBalance,
                PendingDeposit = pendingDeposit,
                PendingWithdrawal = pendingWithdrawal,
                Currency = "USD"
            };
        }

        [AbpAllowAnonymous]
        public async Task<CardValidationResultDto> ValidateCard(ValidateCardInput input)
        {
            // Clean card number (remove spaces)
            var cleanCardNumber = input.CardNumber?.Replace(" ", "") ?? "";

            // Cross-tenant lookup: Ignore filters to find the card in any tenant (usually Tenant 3)
            using (UnitOfWorkManager.Current.DisableFilter(AbpDataFilters.MayHaveTenant, AbpDataFilters.MustHaveTenant))
            {
                var card = await _cardRepository.GetAll()
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(c => c.CardNumber == cleanCardNumber);

                if (card == null)
                {
                    return new CardValidationResultDto { IsValid = false, Message = "Card not found." };
                }

                if (card.Cvv != input.Cvv || card.ExpiryDate != input.ExpiryDate)
                {
                    return new CardValidationResultDto { IsValid = false, Message = "Invalid CVV or Expiry Date." };
                }

                if (card.Status != "Active")
                {
                    return new CardValidationResultDto { IsValid = false, Message = $"Card is {card.Status}." };
                }

                if (card.Balance < input.Amount)
                {
                    return new CardValidationResultDto 
                    { 
                        IsValid = false, 
                        Message = "Insufficient balance.",
                        AvailableBalance = card.Balance
                    };
                }

                return new CardValidationResultDto 
                { 
                    IsValid = true, 
                    Message = "Card verified successfully.",
                    AvailableBalance = card.Balance
                };
            }
        }

        [AbpAllowAnonymous]
        public async Task ProcessPayment(ProcessCardPaymentInput input)
        {
            var cleanCardNumber = input.CardNumber?.Replace(" ", "") ?? "";

            using (UnitOfWorkManager.Current.DisableFilter(AbpDataFilters.MayHaveTenant, AbpDataFilters.MustHaveTenant))
            {
                var card = await _cardRepository.GetAll()
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(c => c.CardNumber == cleanCardNumber);

                if (card == null || card.Cvv != input.Cvv || card.ExpiryDate != input.ExpiryDate)
                {
                    throw new UserFriendlyException("Verification failed during payment processing.");
                }

                if (card.Balance < input.Amount)
                {
                    throw new UserFriendlyException("Insufficient balance on the card.");
                }

                // Deduct balance
                card.Balance -= input.Amount;
                await _cardRepository.UpdateAsync(card);

                // Record transaction
                // Note: We'd typically create a WalletTransaction here, 
                // but since Wallets and VirtualCards are slightly different models in this codebase,
                // we'll focus on the card balance for this specific EasyFinora integration.
            }
        }

        public async Task<VirtualCardDto> CreateVirtualCard(CreateVirtualCardInput input)
        {
            // Validate card type
            if (!Enum.IsDefined(typeof(CardType), input.CardType))
            {
                throw new UserFriendlyException("Invalid card type.");
            }

            // Get current user
            var user = await _userManager.GetUserByIdAsync(AbpSession.GetUserId());

            // Generate card details
            var card = new VirtualCard
            {
                UserId = user.Id,
                CardNumber = GenerateCardNumber(input.CardType),
                CardType = input.CardType,
                HolderName = $"{user.Name} {user.Surname}".ToUpper(),
                ExpiryDate = DateTime.Now.AddYears(3).ToString("MM/yy"),
                Cvv = GenerateCVV(),
                Balance = 0,
                Currency = "USD",
                Status = "Active"
            };

            // Save to database
            var cardId = await _cardRepository.InsertAndGetIdAsync(card);

            // Map to DTO
            return new VirtualCardDto
            {
                CardId = cardId,
                CardNumber = FormatCardNumber(card.CardNumber),
                CardType = card.CardType,
                HolderName = card.HolderName,
                ExpiryDate = card.ExpiryDate,
                Cvv = card.Cvv,
                Balance = card.Balance,
                Currency = card.Currency,
                Status = card.Status
            };
        }

        public async Task<List<VirtualCardDto>> GetUserCards()
        {
            var userId = AbpSession.GetUserId();
            var cards = await _cardRepository.GetAllListAsync(c => c.UserId == userId);

            // Mask card numbers for security and map to DTO
            var dtos = cards.Select(card => new VirtualCardDto
            {
                CardId = card.Id,
                CardNumber = MaskCardNumber(FormatCardNumber(card.CardNumber)),
                CardType = card.CardType,
                HolderName = card.HolderName,
                ExpiryDate = card.ExpiryDate,
                Cvv = "***", // Hide CVV in list view
                Balance = card.Balance,
                Currency = card.Currency,
                Status = card.Status
            }).ToList();

            return dtos;
        }


        public async Task<CardApplicationDto> SubmitCardApplication(SubmitCardApplicationInput input)
        {
            var userId = AbpSession.GetUserId();
            
            // Check if there is already a pending application
            var existingPending = await _applicationRepository.FirstOrDefaultAsync(x => x.UserId == userId && x.Status == CardApplicationStatus.Pending);
            if (existingPending != null)
            {
                throw new UserFriendlyException("You already have a pending card application.");
            }

            // Validate inputs
            if (string.IsNullOrWhiteSpace(input.FullName) || input.FullName.Length < 3)
                throw new UserFriendlyException("Full name must be at least 3 characters");

            if (string.IsNullOrWhiteSpace(input.ContactNumber) || input.ContactNumber.Length < 10)
                throw new UserFriendlyException("Contact number must be at least 10 digits");

            if (string.IsNullOrWhiteSpace(input.Address) || input.Address.Length < 10)
                throw new UserFriendlyException("Address must be at least 10 characters");

            if (!Enum.IsDefined(typeof(CardType), input.CardType))
                throw new UserFriendlyException("Invalid card type");

            if (string.IsNullOrWhiteSpace(input.DocumentBase64))
                throw new UserFriendlyException("Document is required");

            if (input.DocumentType != null && !new[] { "pdf", "jpg", "jpeg", "png" }.Contains(input.DocumentType.ToLower()))
                throw new UserFriendlyException("Document must be PDF, JPG, JPEG, or PNG");

            var application = new CardApplication
            {
                UserId = userId,
                TenantId = AbpSession.TenantId ?? 1,
                FullName = input.FullName.Trim(),
                ContactNumber = input.ContactNumber.Trim(),
                Address = input.Address.Trim(),
                CardType = input.CardType,
                DocumentBase64 = input.DocumentBase64,
                DocumentType = input.DocumentType?.ToLower(),
                Status = CardApplicationStatus.Pending,
                AppliedDate = DateTime.UtcNow
            };

            var applicationId = await _applicationRepository.InsertAndGetIdAsync(application);

            return new CardApplicationDto
            {
                Id = applicationId,
                FullName = application.FullName,
                ContactNumber = application.ContactNumber,
                Address = application.Address,
                CardType = application.CardType,
                DocumentType = application.DocumentType,
                Status = application.Status.ToString(),
                AppliedDate = application.AppliedDate
            };
        }

        public async Task<List<CardApplicationDto>> GetMyApplications()
        {
            var userId = AbpSession.GetUserId();
            var applications = await _applicationRepository.GetAllListAsync(a => a.UserId == userId);

            return applications.Select(a => new CardApplicationDto
            {
                Id = a.Id,
                FullName = a.FullName,
                ContactNumber = a.ContactNumber,
                Address = a.Address,
                CardType = a.CardType,
                DocumentType = a.DocumentType,
                Status = a.Status.ToString(),
                AppliedDate = a.AppliedDate,
                ReviewedDate = a.ReviewedDate,
                ReviewNotes = a.ReviewNotes
            }).ToList();
        }

        [AbpAuthorize(Authorization.PermissionNames.Pages_Users)] 
        public async Task<List<CardApplicationDto>> GetCardApplications()
        {
            try
            {
                using (UnitOfWorkManager.Current.DisableFilter(AbpDataFilters.MayHaveTenant, AbpDataFilters.MustHaveTenant))
                {
                    var applications = await _applicationRepository.GetAll()
                        .Include(a => a.User)
                        .OrderByDescending(a => a.CreationTime)
                        .ToListAsync();

                    return applications.Select(a => new CardApplicationDto
                    {
                        Id = a.Id,
                        FullName = a.FullName,
                        ContactNumber = a.ContactNumber,
                        Address = a.Address,
                        CardType = a.CardType,
                        DocumentBase64 = a.DocumentBase64, 
                        DocumentType = a.DocumentType,
                        Status = a.Status.ToString(),
                        AppliedDate = a.AppliedDate,
                        ReviewedDate = a.ReviewedDate,
                        ReviewNotes = a.ReviewNotes,
                        UserName = a.User?.UserName ?? "Unknown"
                    }).ToList();
                }
            }
            catch (Exception ex)
            {
                throw new UserFriendlyException($"Error: {ex.Message} | Session: T:{AbpSession.TenantId} U:{AbpSession.UserId} | Inner: {ex.InnerException?.Message}");
            }
        }

        [AbpAuthorize("Admin")]
        public async Task<List<CardApplicationDto>> GetPendingApplications()
        {
            try
            {
                var applications = await _applicationRepository.GetAllListAsync(a => a.Status == CardApplicationStatus.Pending);

                return applications.Select(a => new CardApplicationDto
                {
                    Id = a.Id,
                    FullName = a.FullName,
                    ContactNumber = a.ContactNumber,
                    Address = a.Address,
                    CardType = a.CardType,
                    DocumentBase64 = a.DocumentBase64,
                    DocumentType = a.DocumentType,
                    Status = a.Status.ToString(),
                    AppliedDate = a.AppliedDate
                }).ToList();
            }
            catch (Exception ex)
            {
                throw new UserFriendlyException($"Error: {ex.Message} | Inner: {ex.InnerException?.Message}");
            }
        }

        [AbpAuthorize("Admin")]
        public async Task<VirtualCardDto> ApproveCardApplication(ApproveApplicationInput input)
        {
            try
            {
                using (UnitOfWorkManager.Current.DisableFilter(AbpDataFilters.MayHaveTenant, AbpDataFilters.MustHaveTenant))
                {
                    var application = await _applicationRepository.GetAsync(input.Id);

                    if (application.Status != CardApplicationStatus.Pending)
                        throw new UserFriendlyException("Application is not pending");

                    application.Status = CardApplicationStatus.Approved;
                    application.ReviewedDate = DateTime.UtcNow;
                    application.ReviewedBy = AbpSession.GetUserId();
                    application.ReviewNotes = input.AdminRemarks;

                    var user = await _userManager.GetUserByIdAsync(application.UserId);
                    var card = new VirtualCard
                    {
                        UserId = user.Id,
                        TenantId = application.TenantId,
                        CardNumber = GenerateCardNumber(application.CardType),
                        CardType = application.CardType,
                        HolderName = application.FullName.ToUpper(),
                        ExpiryDate = DateTime.Now.AddYears(3).ToString("MM/yy"),
                        Cvv = GenerateCVV(),
                        Balance = 0,
                        Currency = "USD",
                        Status = "Active"
                    };

                    var cardId = await _cardRepository.InsertAndGetIdAsync(card);
                    application.GeneratedCardId = cardId;

                    await _applicationRepository.UpdateAsync(application);

                    return new VirtualCardDto
                    {
                        CardId = cardId,
                        CardNumber = FormatCardNumber(card.CardNumber),
                        CardType = card.CardType,
                        HolderName = card.HolderName,
                        ExpiryDate = card.ExpiryDate,
                        Cvv = card.Cvv,
                        Balance = card.Balance,
                        Currency = card.Currency,
                        Status = card.Status
                    };
                }
            }
            catch (Exception ex)
            {
                throw new UserFriendlyException($"Error: {ex.Message}");
            }
        }


        [AbpAuthorize("Admin")]
        public async Task RejectCardApplication(RejectApplicationInput input)
        {
            try
            {
                var application = await _applicationRepository.GetAsync(input.Id);

                if (application.Status != CardApplicationStatus.Pending)
                    throw new UserFriendlyException("Application is not pending");

                if (string.IsNullOrWhiteSpace(input.AdminRemarks))
                    throw new UserFriendlyException("Rejection reason is required");

                application.Status = CardApplicationStatus.Rejected;
                application.ReviewedDate = DateTime.UtcNow;
                application.ReviewedBy = AbpSession.GetUserId();
                application.ReviewNotes = input.AdminRemarks;

                await _applicationRepository.UpdateAsync(application);
            }
            catch (Exception ex)
            {
                throw new UserFriendlyException($"Error: {ex.Message} | Inner: {ex.InnerException?.Message}");
            }
        }


        private string GenerateCardNumber(CardType cardType)
        {
            var prefix = cardType == CardType.Visa ? "4" : cardType == CardType.MasterCard ? "5" : "3";
            var random = new Random();
            var digits = string.Join("", Enumerable.Range(0, 15).Select(_ => random.Next(0, 10)));
            return prefix + digits;
        }

        private string GenerateCVV()
        {
            var random = new Random();
            return random.Next(100, 999).ToString();
        }

        private string FormatCardNumber(string cardNumber)
        {
            if (cardNumber.Length != 16) return cardNumber;
            return $"{cardNumber.Substring(0, 4)} {cardNumber.Substring(4, 4)} {cardNumber.Substring(8, 4)} {cardNumber.Substring(12, 4)}";
        }

        private string MaskCardNumber(string formattedCardNumber)
        {
            var parts = formattedCardNumber.Split(' ');
            if (parts.Length != 4) return formattedCardNumber;
            return $"{parts[0]} **** **** {parts[3]}";
        }
    }
}
