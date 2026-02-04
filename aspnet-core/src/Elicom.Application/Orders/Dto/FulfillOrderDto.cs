using System;
using System.ComponentModel.DataAnnotations;

namespace Elicom.Orders.Dto
{
    public class FulfillOrderDto
    {
        [Required]
        public Guid Id { get; set; }

        [Required]
        public DateTime ShipmentDate { get; set; }

        [Required]
        public string CarrierId { get; set; }

        [Required]
        public string TrackingCode { get; set; }
    }
}
