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

        Task<CardValidationResultDto> ValidateCard(ValidateCardInput input);

        Task ProcessPayment(ProcessCardPaymentInput input);
    }

    public class ValidateCardInput
    {
        public string CardNumber { get; set; }
        public string ExpiryDate { get; set; }
        public string Cvv { get; set; }
        public decimal Amount { get; set; }
    }

    public class CardValidationResultDto
    {
        public bool IsValid { get; set; }
        public string Message { get; set; }
        public decimal AvailableBalance { get; set; }
    }

    public class ProcessCardPaymentInput : ValidateCardInput
    {
        public string ReferenceId { get; set; } // Order ID
        public string Description { get; set; }
    }
}
