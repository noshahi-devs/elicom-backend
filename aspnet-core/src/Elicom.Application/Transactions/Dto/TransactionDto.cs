using Abp.Application.Services.Dto;
using System;

namespace Elicom.Transactions.Dto
{
    public class TransactionDto : EntityDto<long>
    {
        public long? CardId { get; set; }
        public decimal Amount { get; set; }
        public string TransactionType { get; set; }
        public string Category { get; set; }
        public string ReferenceId { get; set; }
        public string Description { get; set; }
        public DateTime CreationTime { get; set; }
    }
}
