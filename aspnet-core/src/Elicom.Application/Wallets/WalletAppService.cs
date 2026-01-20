using Abp.Application.Services;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Elicom.Entities;
using Elicom.Wallets.Dto;
using System;
using System.Threading.Tasks;

namespace Elicom.Wallets
{
    [AbpAuthorize]
    public class WalletAppService : ElicomAppServiceBase, IWalletAppService
    {
        private readonly IWalletManager _walletManager;
        private readonly IRepository<Wallet, Guid> _walletRepository;

        public WalletAppService(
            IWalletManager walletManager,
            IRepository<Wallet, Guid> walletRepository)
        {
            _walletManager = walletManager;
            _walletRepository = walletRepository;
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
    }
}
