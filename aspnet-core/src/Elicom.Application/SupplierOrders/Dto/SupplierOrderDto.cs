using Abp.Application.Services.Dto;
using System;

namespace Elicom.SupplierOrders.Dto
{
    public class SupplierOrderDto : EntityDto<Guid>
    {
        public Guid OrderId { get; set; }
        public long ResellerId { get; set; }
        public decimal PurchasePrice { get; set; }
        public string WarehouseAddress { get; set; }
        public string PurchaseId { get; set; }
        public string Status { get; set; }
    }
}
