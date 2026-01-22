using System.Collections.Generic;
using System.Threading.Tasks;
using Abp.Application.Services;
using Elicom.Cards.Dto;

namespace Elicom.Cards
{
    public interface ICardAppService : IApplicationService
    {
        Task<VirtualCardDto> CreateVirtualCard(CreateVirtualCardInput input);

        Task<List<VirtualCardDto>> GetUserCards();

        Task<UserBalanceDto> GetBalance();
    }
}
