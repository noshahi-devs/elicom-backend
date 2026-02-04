using System;
using System.ComponentModel.DataAnnotations;

namespace Elicom.Orders.Dto
{
    public class VerifyOrderDto
    {
        [Required]
        public Guid Id { get; set; }
    }
}
