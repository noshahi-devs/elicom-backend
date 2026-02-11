using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Runtime.Session;
using Elicom.Entities;
using Elicom.Transactions.Dto;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Elicom.Transactions
{
    [AbpAuthorize]
    public class TransactionAppService : ElicomAppServiceBase, ITransactionAppService
    {
        private readonly IRepository<WalletTransaction, Guid> _walletTransactionRepository;
        private readonly IRepository<Wallet, Guid> _walletRepository;

        public TransactionAppService(
            IRepository<WalletTransaction, Guid> walletTransactionRepository,
            IRepository<Wallet, Guid> walletRepository)
        {
            _walletTransactionRepository = walletTransactionRepository;
            _walletRepository = walletRepository;
        }

        public async Task<PagedResultDto<TransactionDto>> GetHistory(PagedAndSortedResultRequestDto input)
        {
            var userId = AbpSession.GetUserId();
            var wallet = await _walletRepository.FirstOrDefaultAsync(w => w.UserId == userId);

            if (wallet == null)
            {
                return new PagedResultDto<TransactionDto>(0, new List<TransactionDto>());
            }

            var query = _walletTransactionRepository.GetAll().Where(t => t.WalletId == wallet.Id);

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderByDescending(t => t.CreationTime)
                .Skip(input.SkipCount)
                .Take(input.MaxResultCount)
                .ToListAsync();

            return new PagedResultDto<TransactionDto>(
                totalCount,
                items.Select(t => MapToDto(t)).ToList()
            );
        }

        [AbpAuthorize(Authorization.PermissionNames.Pages_GlobalPay_Admin)]
        public async Task<PagedResultDto<TransactionDto>> GetAll(PagedAndSortedResultRequestDto input)
        {
            var query = _walletTransactionRepository.GetAll();

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderByDescending(t => t.CreationTime)
                .Skip(input.SkipCount)
                .Take(input.MaxResultCount)
                .ToListAsync();

            return new PagedResultDto<TransactionDto>(
                totalCount,
                items.Select(t => MapToDto(t)).ToList()
            );
        }

        private TransactionDto MapToDto(WalletTransaction t)
        {
            string category = "Unknown";
            string type = t.MovementType;

            // Map Backend Types to Frontend Categories
            if (type == "Deposit") category = "Deposit";
            else if (type == "Debit") category = "Withdrawal"; // Or Card Purchase
            else if (type.Contains("Transfer")) category = "Transfer";

            // Attempt to detect Card use from description or type if needed
            // if (t.Description.Contains("Card")) category = "Card";

            return new TransactionDto
            {
                Id = t.Id,
                CardId = null, // WalletTransaction doesn't have CardId
                Amount = Math.Abs(t.Amount), // Frontend handles sign based on type/context usually, or we provide absolute
                MovementType = t.Amount < 0 ? "Debit" : "Credit",
                Category = category,
                ReferenceId = t.ReferenceId,
                Description = t.Description,
                CreationTime = t.CreationTime
            };
        }
    }
}
