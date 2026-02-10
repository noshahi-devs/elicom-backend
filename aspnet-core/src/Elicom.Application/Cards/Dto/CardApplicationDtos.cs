using System;

namespace Elicom.Cards.Dto
{
    public class SubmitCardApplicationInput
    {
        public string FullName { get; set; }
        public string ContactNumber { get; set; }
        public string Address { get; set; }
        public string CardType { get; set; }
        public string DocumentBase64 { get; set; }
    }

    public class CardApplicationDto
    {
        public long Id { get; set; }
        public long UserId { get; set; }
        public string UserName { get; set; }
        public string FullName { get; set; }
        public string ContactNumber { get; set; }
        public string Address { get; set; }
        public string CardType { get; set; }
        public string DocumentBase64 { get; set; }
        public string Status { get; set; }
        public string AdminRemarks { get; set; }
        public DateTime CreationTime { get; set; }
        public DateTime? DecisionDate { get; set; }
    }

    public class RejectCardApplicationInput
    {
        public long Id { get; set; }
        public string AdminRemarks { get; set; }
    }
}
