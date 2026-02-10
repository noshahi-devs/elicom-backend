using System;

namespace Elicom.Cards.Dto
{
    public class RejectApplicationInput
    {
        public Guid ApplicationId { get; set; }
        public string ReviewNotes { get; set; } // Required for rejection
    }
}
