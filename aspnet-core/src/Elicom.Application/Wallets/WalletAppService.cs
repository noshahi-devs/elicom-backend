using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.UI;
using Elicom.Entities;
using Elicom.Wallets.Dto;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Elicom.Wallets
{
    [AbpAuthorize]
    public class WalletAppService : ElicomAppServiceBase, IWalletAppService
    {
        private readonly IWalletManager _walletManager;
        private readonly IRepository<Wallet, Guid> _walletRepository;
        private readonly IRepository<WalletTransaction, Guid> _transactionRepository;

        public WalletAppService(
            IWalletManager walletManager,
            IRepository<Wallet, Guid> walletRepository,
            IRepository<WalletTransaction, Guid> transactionRepository)
        {
            _walletManager = walletManager;
            _walletRepository = walletRepository;
            _transactionRepository = transactionRepository;
        }

        public async Task<WalletDto> GetMyWallet()
        {
            var user = await GetCurrentUserAsync();
            var wallet = await _walletRepository.FirstOrDefaultAsync(w => w.UserId == user.Id);
            
            // Auto-create if missing (failsafe)
            if (wallet == null)
            {
                wallet = new Wallet { UserId = user.Id, Balance = 0, Currency = "PKR" };
                await _walletRepository.InsertAsync(wallet);
                await CurrentUnitOfWork.SaveChangesAsync();
            }

            return ObjectMapper.Map<WalletDto>(wallet);
        }

        public async Task Deposit(DepositInput input)
        {
            var user = await GetCurrentUserAsync();
            // In a real app, integrate with Payment Gateway here.
            // For now, assume payment success and credit wallet.
            
            await _walletManager.DepositAsync(
                user.Id, 
                input.Amount, 
                $"DEP-{DateTime.Now.Ticks}", 
                $"Deposit via {input.Method}"
            );
        }

        public async Task Transfer(TransferInput input)
        {
            var sender = await GetCurrentUserAsync();
            
            // Find receiver user by email
            var receiver = await UserManager.FindByEmailAsync(input.RecipientEmail);
            if (receiver == null)
            {
                throw new UserFriendlyException($"Recipient user with email {input.RecipientEmail} not found.");
            }

            await _walletManager.TransferAsync(
                sender.Id,
                receiver.Id,
                input.Amount,
                input.Description ?? "Wallet Transfer"
            );
        }

        public async Task<ListResultDto<WalletTransactionDto>> GetTransactions()
        {
            var user = await GetCurrentUserAsync();
            var wallet = await _walletRepository.FirstOrDefaultAsync(w => w.UserId == user.Id);
            if (wallet == null) return new ListResultDto<WalletTransactionDto>();

            var transactions = await _transactionRepository.GetAll()
                .Where(t => t.WalletId == wallet.Id)
                .OrderByDescending(t => t.CreationTime)
                .ToListAsync();

            return new ListResultDto<WalletTransactionDto>(
                ObjectMapper.Map<List<WalletTransactionDto>>(transactions)
            );
        }
    }
}
