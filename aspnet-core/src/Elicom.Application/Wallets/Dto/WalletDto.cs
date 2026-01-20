using Abp.Application.Services.Dto;

namespace Elicom.Wallets.Dto
{
    public class WalletDto : EntityDto<System.Guid>
    {
        public decimal Balance { get; set; }
        public string Currency { get; set; }
    }
}
