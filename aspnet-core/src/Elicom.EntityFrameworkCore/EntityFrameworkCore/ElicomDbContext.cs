using Abp.Zero.EntityFrameworkCore;
using Elicom.Authorization.Roles;
using Elicom.Authorization.Users;
using Elicom.Entities;
using Elicom.MultiTenancy;
using Microsoft.EntityFrameworkCore;

namespace Elicom.EntityFrameworkCore
{
    public class ElicomDbContext
        : AbpZeroDbContext<Tenant, Role, User, ElicomDbContext>
    {
        /* DbSets */
        public DbSet<Category> Categories { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<Store> Stores { get; set; }
        public DbSet<StoreProduct> StoreProducts { get; set; }
        public DbSet<CustomerProfile> CustomerProfiles { get; set; }


        public ElicomDbContext(DbContextOptions<ElicomDbContext> options)
            : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            /* ---------------- Product ↔ Category ---------------- */
            builder.Entity<Product>(b =>
            {
                b.HasOne(p => p.Category)
                 .WithMany(c => c.Products)
                 .HasForeignKey(p => p.CategoryId)
                 .OnDelete(DeleteBehavior.Restrict);
            });

            /* ---------------- Store ↔ User (Owner) ---------------- */
            builder.Entity<Store>(b =>
            {
                b.HasOne(s => s.Owner)
                 .WithMany() // one user can own multiple stores
                 .HasForeignKey(s => s.OwnerId)
                 .OnDelete(DeleteBehavior.Restrict);
            });

            /* ---------------- Store ↔ Product (Join Table) ---------------- */
            builder.Entity<StoreProduct>(b =>
            {
                b.HasOne(sp => sp.Store)
                 .WithMany(s => s.StoreProducts)
                 .HasForeignKey(sp => sp.StoreId)
                 .OnDelete(DeleteBehavior.Restrict);

                b.HasOne(sp => sp.Product)
                 .WithMany(p => p.StoreProducts)
                 .HasForeignKey(sp => sp.ProductId)
                 .OnDelete(DeleteBehavior.Restrict);

                // One product can be listed once per store
                b.HasIndex(sp => new { sp.StoreId, sp.ProductId }).IsUnique();
            });

            builder.Entity<CustomerProfile>(b =>
            {
                b.ToTable("CustomerProfiles");
                b.HasIndex(x => x.UserId).IsUnique();

                b.HasOne(x => x.User)
                 .WithMany()
                 .HasForeignKey(x => x.UserId)
                 .OnDelete(DeleteBehavior.Cascade);
            });


        }
    }
}
