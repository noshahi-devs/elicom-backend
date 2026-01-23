using Abp.Application.Services;
using Elicom.Wallets.Dto;
using System.Threading.Tasks;

namespace Elicom.Wallets
{
    public interface IWalletAppService : IApplicationService
    {
        Task<WalletDto> GetMyWallet();
        Task Deposit(DepositInput input);
        Task Transfer(TransferInput input);
    }
}
