using Abp.Zero.EntityFrameworkCore;
using Elicom.Authorization.Roles;
using Elicom.Authorization.Users;
using Elicom.Entities;
using Elicom.MultiTenancy;
using Microsoft.EntityFrameworkCore;

namespace Elicom.EntityFrameworkCore;

public class ElicomDbContext
    : AbpZeroDbContext<Tenant, Role, User, ElicomDbContext>
{
    /* Define a DbSet for each entity of the application */
    public DbSet<Category> Categories { get; set; }
    public DbSet<Product> Products { get; set; }

    public DbSet<Store> Stores { get; set; }

    public DbSet<StoreProduct> StoreProducts { get; set; }



    public ElicomDbContext(DbContextOptions<ElicomDbContext> options)
        : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Product>(b =>
        {
            b.HasOne(p => p.Category)
             .WithMany(c => c.Products)
             .HasForeignKey(p => p.CategoryId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Store>(b =>
        {
            b.HasOne<User>()
             .WithMany() // one user can have multiple stores, or .WithOne() if only one store per user
             .HasForeignKey(s => s.OwnerId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Store>(b =>
        {
            b.HasOne(s => s.Owner)
             .WithMany() // user can have multiple stores
             .HasForeignKey(s => s.OwnerId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<StoreProduct>(b =>
        {
            b.HasOne(sp => sp.Store)
             .WithMany()
             .HasForeignKey(sp => sp.StoreId)
             .OnDelete(DeleteBehavior.Restrict);

            b.HasOne(sp => sp.Product)
             .WithMany()
             .HasForeignKey(sp => sp.ProductId)
             .OnDelete(DeleteBehavior.Restrict);

            b.HasIndex(sp => new { sp.StoreId, sp.ProductId }).IsUnique();
        });


    }

}
