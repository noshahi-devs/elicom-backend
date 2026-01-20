using Elicom.Wallets;
using Elicom.Wallets.Dto;
using Shouldly;
using System.Threading.Tasks;
using Xunit;

namespace Elicom.Tests.Wallets
{
    public class WalletAppService_Tests : ElicomTestBase
    {
        private readonly IWalletAppService _walletAppService;

        public WalletAppService_Tests()
        {
            _walletAppService = Resolve<IWalletAppService>();
        }

        [Fact]
        public async Task Should_Auto_Create_Wallet_On_Get()
        {
            // Act
            var wallet = await _walletAppService.GetMyWallet();

            // Assert
            wallet.ShouldNotBeNull();
            wallet.Balance.ShouldBe(0);
            wallet.Currency.ShouldBe("PKR");
        }

        [Fact]
        public async Task Should_Deposit_Funds()
        {
            // Act
            await _walletAppService.Deposit(new DepositInput
            {
                Amount = 1000,
                Method = "JazzCash"
            });

            var wallet = await _walletAppService.GetMyWallet();

            // Assert
            wallet.Balance.ShouldBe(1000);
        }

        [Fact]
        public async Task Should_Accumulate_Balance()
        {
            // Act
            await _walletAppService.Deposit(new DepositInput { Amount = 500, Method = "EasyPaisa" });
            await _walletAppService.Deposit(new DepositInput { Amount = 200, Method = "JazzCash" });

            var wallet = await _walletAppService.GetMyWallet();

            // Assert
            wallet.Balance.ShouldBe(700);
        }
    }
}
