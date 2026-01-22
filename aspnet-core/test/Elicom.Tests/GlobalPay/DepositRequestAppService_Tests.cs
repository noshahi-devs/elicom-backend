using System;
using System.Linq;
using System.Threading.Tasks;
using Elicom.Cards;
using Elicom.Cards.Dto;
using Elicom.Entities;
using Elicom.GlobalPay;
using Elicom.GlobalPay.Dto;
using Shouldly;
using Xunit;

namespace Elicom.Tests.GlobalPay
{
    public class DepositRequestAppService_Tests : ElicomTestBase
    {
        private readonly IDepositRequestAppService _depositRequestAppService;
        private readonly ICardAppService _cardAppService;

        public DepositRequestAppService_Tests()
        {
            _depositRequestAppService = Resolve<IDepositRequestAppService>();
            _cardAppService = Resolve<ICardAppService>();
        }

        [Fact]
        public async Task Should_Create_Deposit_Request_For_Card()
        {
            // Arrange
            LoginAsDefaultTenantAdmin();

            // 1. Create a card first
            var card = await _cardAppService.CreateVirtualCard(new CreateVirtualCardInput { CardType = "Visa" });

            var input = new CreateDepositRequestInput
            {
                Amount = 100,
                CardId = card.CardId,
                Country = "Pakistan",
                Method = "P2P",
                ProofImage = "ss_proof.jpg"
            };

            // Act
            var result = await _depositRequestAppService.Create(input);

            // Assert
            result.ShouldNotBeNull();
            result.Amount.ShouldBe(100);
            result.CardId.ShouldBe(card.CardId);
            result.Method.ShouldBe("P2P");
            result.Status.ShouldBe("Pending");
            result.SourcePlatform.ShouldBe("GlobalPay"); // Default tenant in tests
        }

        [Fact]
        public async Task Should_Update_Card_Balance_On_Approval()
        {
            // Arrange
            LoginAsDefaultTenantAdmin();

            // 1. Create a card
            var card = await _cardAppService.CreateVirtualCard(new CreateVirtualCardInput { CardType = "Visa" });
            card.Balance.ShouldBe(0);

            // 2. Create deposit request
            var deposit = await _depositRequestAppService.Create(new CreateDepositRequestInput
            {
                Amount = 500,
                CardId = card.CardId,
                Country = "Pakistan",
                Method = "Crypto",
                ProofImage = "crypto_ss.jpg"
            });

            // 3. Approve request
            await _depositRequestAppService.Approve(new ApproveDepositRequestInput
            {
                Id = deposit.Id,
                AdminRemarks = "Approved by agent"
            });

            // Act
            var cards = await _cardAppService.GetUserCards();
            var updatedCard = cards.First(c => c.CardId == card.CardId);

            // Assert
            updatedCard.Balance.ShouldBe(500);
            
            var requests = await _depositRequestAppService.GetMyRequests(new Abp.Application.Services.Dto.PagedAndSortedResultRequestDto());
            requests.Items.First(r => r.Id == deposit.Id).Status.ShouldBe("Approved");
        }
    }
}
