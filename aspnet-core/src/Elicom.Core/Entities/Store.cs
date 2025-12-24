using Abp.Domain.Entities;
using Elicom.Authorization.Users;
using System;
using System.Collections.Generic;

namespace Elicom.Entities
{
    public class Store : Entity<Guid>
    {
        public string Name { get; set; }
        public long OwnerId { get; set; } // <-- long to match User.Id
        public string Description { get; set; }
        public string Slug { get; set; }
        public bool Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public virtual User Owner { get; set; }

        public virtual ICollection<StoreProduct> StoreProducts { get; set; }

    }
}
