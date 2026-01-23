using Abp.Application.Services.Dto;
using System;

namespace Elicom.Transactions.Dto
{
    public class TransactionDto : EntityDto<Guid>
    {
        public long? CardId { get; set; }
        public decimal Amount { get; set; }
        public string TransactionType { get; set; } // "Deposit" or "Debit"
        public string Category { get; set; } // "Deposit", "Transfer", "Withdrawal"
        public string ReferenceId { get; set; }
        public string Description { get; set; }
        public DateTime CreationTime { get; set; }
    }
}
