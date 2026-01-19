using Abp.Domain.Entities.Auditing;
using System;
using System.Collections.Generic;

namespace Elicom.Entities
{
    public class Order : FullAuditedEntity<Guid>
    {
        public Guid CustomerProfileId { get; set; }

        public string OrderNumber { get; set; }
        public string Status { get; set; } = "Pending";
        public string PaymentStatus { get; set; } = "Pending";
        public string PaymentMethod { get; set; }

        public decimal SubTotal { get; set; }
        public decimal ShippingCost { get; set; }
        public decimal Discount { get; set; }
        public decimal TotalAmount { get; set; }

        // Snapshot Address
        public string ShippingAddress { get; set; }
        public string Country { get; set; }
        public string State { get; set; }
        public string City { get; set; }
        public string PostalCode { get; set; }

        // New Fields for Reselling
        public Guid? SupplierOrderId { get; set; } // Link to supplier order if exists
        public string SupplierTrackingNumber { get; set; }


        public virtual CustomerProfile CustomerProfile { get; set; }
        public virtual ICollection<OrderItem> OrderItems { get; set; }
        public virtual SupplierOrder SupplierOrder { get; set; }

    }
}
