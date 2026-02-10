using System;

namespace Elicom.Cards.Dto
{
    public class ApproveApplicationInput
    {
        public Guid ApplicationId { get; set; }
        public string ReviewNotes { get; set; } // Optional
    }
}
