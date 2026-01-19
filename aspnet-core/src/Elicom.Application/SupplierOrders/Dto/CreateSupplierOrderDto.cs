using System.Collections.Generic;

namespace Elicom.SupplierOrders.Dto
{
    public class CreateSupplierOrderDto
    {
        public long ResellerId { get; set; }
        public string WarehouseAddress { get; set; }

        public List<CreateSupplierOrderItemDto> Items { get; set; }
    }
}
