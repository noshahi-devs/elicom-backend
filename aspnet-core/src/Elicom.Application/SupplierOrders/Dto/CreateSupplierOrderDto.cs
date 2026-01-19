using System;
using System.ComponentModel.DataAnnotations;

namespace Elicom.SupplierOrders.Dto
{
    public class CreateSupplierOrderDto
    {
        [Required]
        public Guid OrderId { get; set; }

        [Required]
        public long ResellerId { get; set; }

        [Required]
        public decimal PurchasePrice { get; set; }

        [Required]
        public string WarehouseAddress { get; set; }

        // Optional tracking / purchase ID
        public string PurchaseId { get; set; }
    }
}
