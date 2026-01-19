using Abp.Application.Services.Dto;
using Elicom.OrderItems.Dto;
using System;
using System.Collections.Generic;

namespace Elicom.Orders.Dto
{
    public class OrderDto : EntityDto<Guid>
    {
        public string OrderNumber { get; set; }
        public string Status { get; set; }
        public string PaymentStatus { get; set; }
        public string PaymentMethod { get; set; }

        public decimal SubTotal { get; set; }
        public decimal ShippingCost { get; set; }
        public decimal Discount { get; set; }
        public decimal TotalAmount { get; set; }

        public string ShippingAddress { get; set; }
        public string Country { get; set; }
        public string State { get; set; }
        public string City { get; set; }
        public string PostalCode { get; set; }

        public List<OrderItemDto> OrderItems { get; set; }
    }
}
