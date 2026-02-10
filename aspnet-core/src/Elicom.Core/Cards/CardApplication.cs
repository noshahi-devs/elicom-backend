using System;
using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;

namespace Elicom.Cards
{
    public class CardApplication : FullAuditedEntity<long>, IMustHaveTenant
    {
        public int TenantId { get; set; }
        public long UserId { get; set; }
        
        [System.ComponentModel.DataAnnotations.Schema.ForeignKey("UserId")]
        public virtual Elicom.Authorization.Users.User User { get; set; }
        
        public string FullName { get; set; }
        public string ContactNumber { get; set; }
        public string Address { get; set; }
        public string CardType { get; set; } // Visa, MasterCard, etc.
        public string DocumentBase64 { get; set; } // Storing the base64 string for now
        
        public string Status { get; set; } // Pending, Approved, Rejected
        public string AdminRemarks { get; set; }
        public DateTime? DecisionDate { get; set; }
    }
}
