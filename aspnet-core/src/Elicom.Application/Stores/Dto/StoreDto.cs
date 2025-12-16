using Abp.Application.Services.Dto;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Elicom.Stores.Dto
{
    public class StoreDto : EntityDto<Guid>
    {
        public string Name { get; set; }
        public long OwnerId { get; set; }
        public string Description { get; set; }
        public string Slug { get; set; }
        public bool Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

}
