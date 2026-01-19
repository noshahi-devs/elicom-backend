using Abp.Domain.Entities;
using Abp.Domain.Entities.Auditing;
using System;

namespace Elicom.Entities
{
    public class SupplierOrder : FullAuditedEntity<Guid>
    {
        public Guid OrderId { get; set; }            // Original order
        public long ResellerId { get; set; }         // Seller who buys
        public decimal PurchasePrice { get; set; }   // Amount reseller paid
        public string WarehouseAddress { get; set; } // Seller warehouse
        public string PurchaseId { get; set; }       // Acts as tracking id
        public string Status { get; set; }           // Purchased, Shipped, Delivered, Refunded

        public virtual Order Order { get; set; }     // Navigation
    }
}
