using System;

namespace Elicom.Cards.Dto
{
    public class CardApplicationDto
    {
        public Guid Id { get; set; }
        public string FullName { get; set; }
        public string ContactNumber { get; set; }
        public string Address { get; set; }
        public string CardType { get; set; }
        public string DocumentBase64 { get; set; }
        public string DocumentType { get; set; }
        public string Status { get; set; }
        public DateTime AppliedDate { get; set; }
        public DateTime? ReviewedDate { get; set; }
        public string ReviewNotes { get; set; }
    }
}
