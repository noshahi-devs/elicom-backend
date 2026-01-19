using System;

namespace Elicom.Orders.Dto
{
    public class CreateOrderDto
    {
        public Guid CustomerProfileId { get; set; }

        public string PaymentMethod { get; set; }

        public string ShippingAddress { get; set; }
        public string Country { get; set; }
        public string State { get; set; }
        public string City { get; set; }
        public string PostalCode { get; set; }

        public decimal ShippingCost { get; set; }
        public decimal Discount { get; set; }
    }
}
