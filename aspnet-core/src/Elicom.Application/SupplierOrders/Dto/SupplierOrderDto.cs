using Abp.Application.Services.Dto;
using System;
using System.Collections.Generic;

namespace Elicom.SupplierOrders.Dto
{
    public class SupplierOrderDto : EntityDto<Guid>
    {
        public string ReferenceCode { get; set; }
        public long ResellerId { get; set; }
        public decimal TotalPurchaseAmount { get; set; }
        public string WarehouseAddress { get; set; }
        public string Status { get; set; }

        public Guid? OrderId { get; set; }

        public List<SupplierOrderItemDto> Items { get; set; }
    }
}
