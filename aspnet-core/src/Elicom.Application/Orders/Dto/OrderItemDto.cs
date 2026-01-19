using Abp.Application.Services.Dto;
using System;

namespace Elicom.OrderItems.Dto
{
    public class OrderItemDto : EntityDto<Guid>
    {
        public Guid OrderId { get; set; }
        public Guid StoreProductId { get; set; }
        public Guid ProductId { get; set; }
        public string ProductName { get; set; }
        public string StoreName { get; set; }
        public int Quantity { get; set; }
        public decimal PriceAtPurchase { get; set; }
    }
}
