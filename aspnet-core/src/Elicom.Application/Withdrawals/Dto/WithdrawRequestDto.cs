using Abp.Application.Services.Dto;
using System;

namespace Elicom.Withdrawals.Dto
{
    public class WithdrawRequestDto : EntityDto<long>
    {
        public long UserId { get; set; }
        public string UserName { get; set; }
        public long CardId { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; }
        public string Method { get; set; }
        public string PaymentDetails { get; set; }
        public string Status { get; set; }
        public string AdminRemarks { get; set; }
        public DateTime CreationTime { get; set; }
    }

    public class CreateWithdrawRequestInput
    {
        public long CardId { get; set; }
        public decimal Amount { get; set; }
        public string Method { get; set; }
        public string PaymentDetails { get; set; }
    }

    public class ApproveWithdrawRequestInput
    {
        public long Id { get; set; }
        public string AdminRemarks { get; set; }
    }
}
