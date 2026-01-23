using System.ComponentModel.DataAnnotations;

namespace Elicom.Wallets.Dto
{
    public class TransferInput
    {
        [Required]
        public string RecipientEmail { get; set; }

        [Required]
        [Range(1, double.MaxValue)]
        public decimal Amount { get; set; }

        public string Description { get; set; }
    }
}
