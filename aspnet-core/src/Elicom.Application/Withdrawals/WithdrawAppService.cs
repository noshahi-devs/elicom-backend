using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Runtime.Session;
using Abp.UI;
using Elicom.Authorization;
using Elicom.Cards;
using Elicom.Entities;
using Elicom.Withdrawals.Dto;
using Elicom.Wallets;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Elicom.Withdrawals
{
    [AbpAuthorize]
    public class WithdrawAppService : ElicomAppServiceBase, IWithdrawAppService
    {
        private readonly IRepository<WithdrawRequest, long> _withdrawRepository;
        private readonly IRepository<VirtualCard, long> _cardRepository;
        private readonly IRepository<AppTransaction, long> _transactionRepository;
        private readonly IWalletManager _walletManager;

        public WithdrawAppService(
            IRepository<WithdrawRequest, long> withdrawRepository,
            IRepository<VirtualCard, long> cardRepository,
            IWalletManager walletManager,
            IRepository<AppTransaction, long> transactionRepository)
        {
            _withdrawRepository = withdrawRepository;
            _cardRepository = cardRepository;
            _walletManager = walletManager;
            _transactionRepository = transactionRepository;
        }

        public async Task<WithdrawRequestDto> SubmitWithdrawRequest(CreateWithdrawRequestInput input)
        {
            var userId = AbpSession.GetUserId();

            // 1. Verify card ownership and balance
            var card = await _cardRepository.GetAsync(input.CardId);
            if (card.UserId != userId)
            {
                throw new UserFriendlyException("You do not own this card.");
            }

            if (card.Balance < input.Amount)
            {
                throw new UserFriendlyException("Insufficient balance on the virtual card.");
            }

            // 2. Create withdrawal request
            var request = new WithdrawRequest
            {
                UserId = userId,
                CardId = input.CardId,
                Amount = input.Amount,
                Method = input.Method,
                PaymentDetails = input.PaymentDetails,
                LocalAmount = input.LocalAmount,
                LocalCurrency = input.LocalCurrency,
                Status = "Pending"
            };

            var id = await _withdrawRepository.InsertAndGetIdAsync(request);
            
            // Map manually for now or use AutoMapper if profile exists
            return new WithdrawRequestDto
            {
                Id = id,
                UserId = userId,
                CardId = input.CardId,
                Amount = input.Amount,
                Method = input.Method,
                PaymentDetails = input.PaymentDetails,
                LocalAmount = input.LocalAmount,
                LocalCurrency = input.LocalCurrency,
                Status = "Pending",
                CreationTime = request.CreationTime
            };
        }

        public async Task<PagedResultDto<WithdrawRequestDto>> GetMyWithdrawRequests(PagedAndSortedResultRequestDto input)
        {
            var userId = AbpSession.GetUserId();
            var query = _withdrawRepository.GetAll().Where(r => r.UserId == userId);

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderByDescending(r => r.CreationTime)
                .Skip(input.SkipCount)
                .Take(input.MaxResultCount)
                .ToListAsync();

            return new PagedResultDto<WithdrawRequestDto>(
                totalCount,
                items.Select(r => new WithdrawRequestDto
                {
                    Id = r.Id,
                    UserId = r.UserId,
                    CardId = r.CardId,
                    Amount = r.Amount,
                    Method = r.Method,
                    PaymentDetails = r.PaymentDetails,
                    Status = r.Status,
                    AdminRemarks = r.AdminRemarks,
                    LocalAmount = r.LocalAmount,
                    LocalCurrency = r.LocalCurrency,
                    PaymentProof = r.PaymentProof,
                    CreationTime = r.CreationTime
                }).ToList()
            );
        }

        [AbpAuthorize(PermissionNames.Pages_GlobalPay_Admin)]
        public async Task ApproveWithdraw(ApproveWithdrawRequestInput input)
        {
            var request = await _withdrawRepository.GetAsync(input.Id);
            if (request.Status != "Pending")
            {
                throw new UserFriendlyException("Only pending requests can be approved.");
            }

            // 1. Deduct from card balance
            var card = await _cardRepository.GetAsync(request.CardId);
            if (card.Balance < request.Amount)
            {
                throw new UserFriendlyException("Insufficient balance on the card to fulfill this withdrawal.");
            }

            card.Balance -= request.Amount;

            // 1.5 Sync Master Wallet
            await _walletManager.TryDebitAsync(
                request.UserId,
                request.Amount,
                request.Id.ToString(),
                $"Withdrawal Approved - Reference: {request.Id}"
            );

            // 2. Record Transaction
            await _transactionRepository.InsertAsync(new AppTransaction
            {
                UserId = request.UserId,
                CardId = request.CardId,
                Amount = request.Amount,
                MovementType = "Debit",
                Category = "Withdrawal",
                ReferenceId = request.Id.ToString(),
                Description = $"Withdrawal Approved for Card {request.CardId}"
            });

            // 3. Update status
            request.Status = "Approved";
            request.AdminRemarks = input.AdminRemarks;
            request.PaymentProof = input.PaymentProof;
        }

        [AbpAuthorize(PermissionNames.Pages_GlobalPay_Admin)]
        public async Task RejectWithdraw(ApproveWithdrawRequestInput input)
        {
            var request = await _withdrawRepository.GetAsync(input.Id);
            if (request.Status != "Pending")
            {
                throw new UserFriendlyException("Only pending requests can be rejected.");
            }

            request.Status = "Rejected";
            request.AdminRemarks = input.AdminRemarks;
        }

        [AbpAuthorize(PermissionNames.Pages_GlobalPay_Admin)]
        public async Task<PagedResultDto<WithdrawRequestDto>> GetAllWithdrawRequests(PagedAndSortedResultRequestDto input)
        {
            var query = _withdrawRepository.GetAll().Include(r => r.User);

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderByDescending(r => r.CreationTime)
                .Skip(input.SkipCount)
                .Take(input.MaxResultCount)
                .ToListAsync();

            return new PagedResultDto<WithdrawRequestDto>(
                totalCount,
                items.Select(r => new WithdrawRequestDto
                {
                    Id = r.Id,
                    UserId = r.UserId,
                    UserName = r.User != null ? r.User.UserName : "Unknown",
                    CardId = r.CardId,
                    Amount = r.Amount,
                    Method = r.Method,
                    PaymentDetails = r.PaymentDetails,
                    Status = r.Status,
                    AdminRemarks = r.AdminRemarks,
                    LocalAmount = r.LocalAmount,
                    LocalCurrency = r.LocalCurrency,
                    HasProof = !string.IsNullOrEmpty(r.PaymentProof),
                    PaymentProof = null, // Lazy load for performance
                    CreationTime = r.CreationTime
                }).ToList()
            );
        }

        [AbpAuthorize(PermissionNames.Pages_GlobalPay_Admin)]
        public async Task<string> GetPaymentProof(long id)
        {
            var request = await _withdrawRepository.GetAsync(id);
            return request.PaymentProof;
        }
    }
}
