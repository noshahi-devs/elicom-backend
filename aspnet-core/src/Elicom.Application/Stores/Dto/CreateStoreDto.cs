using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;


namespace Elicom.Stores.Dto
{
    public class CreateStoreDto
    {
        [Required]
        public string Name { get; set; }

        [Required]
        public long OwnerId { get; set; } // Can be current logged-in user

        public string Description { get; set; }
        public string Slug { get; set; }
        public bool Status { get; set; }
    }

}
