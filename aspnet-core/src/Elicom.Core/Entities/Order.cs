using Abp.Domain.Entities.Auditing;
using System;
using System.Collections.Generic;

namespace Elicom.Entities
{
    public class Order : FullAuditedEntity<Guid>
    {
        // Customer info
        public Guid CustomerProfileId { get; set; }
        public virtual CustomerProfile CustomerProfile { get; set; }

        // Order details
        public string OrderNumber { get; set; }
        public string Status { get; set; } = "Pending"; // Pending → Processing → Delivered
        public string PaymentStatus { get; set; } = "Pending";
        public string PaymentMethod { get; set; }

        // Amounts
        public decimal SubTotal { get; set; }
        public decimal ShippingCost { get; set; }
        public decimal Discount { get; set; }
        public decimal TotalAmount { get; set; }

        // Shipping address snapshot
        public string ShippingAddress { get; set; }
        public string Country { get; set; }
        public string State { get; set; }
        public string City { get; set; }
        public string PostalCode { get; set; }

        // Seller sets after purchasing from supplier
        public string SupplierReference { get; set; }

        // Store/Admin sets when delivering to buyer
        public string DeliveryTrackingNumber { get; set; }

        public virtual ICollection<OrderItem> OrderItems { get; set; }
    }
}
