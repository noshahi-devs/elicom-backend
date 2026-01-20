using Abp.Application.Services.Dto;
using System;

namespace Elicom.GlobalPay.Dto
{
    public class DepositRequestDto : EntityDto<Guid>
    {
        public long UserId { get; set; }
        public string UserName { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; }
        public string Country { get; set; }
        public string DestinationAccount { get; set; }
        public string ProofImage { get; set; }
        public string Status { get; set; }
        public string AdminRemarks { get; set; }
        public DateTime CreationTime { get; set; }
    }

    public class CreateDepositRequestInput
    {
        public decimal Amount { get; set; }
        public string Country { get; set; }
        public string ProofImage { get; set; } // Base64 or URL after upload
    }

    public class ApproveDepositRequestInput
    {
        public Guid Id { get; set; }
        public string AdminRemarks { get; set; }
    }
}
