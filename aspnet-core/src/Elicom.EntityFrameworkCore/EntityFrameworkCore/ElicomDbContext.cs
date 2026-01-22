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
        public DbSet<CartItem> CartItems { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }

        public DbSet<Wallet> Wallets { get; set; }
        public DbSet<WalletTransaction> WalletTransactions { get; set; }
        public DbSet<SupplierOrder> SupplierOrders { get; set; }
        public DbSet<SupplierOrderItem> SupplierOrderItems { get; set; }
        public DbSet<DepositRequest> DepositRequests { get; set; }
        public DbSet<Cards.VirtualCard> VirtualCards { get; set; }
        public DbSet<WithdrawRequest> WithdrawRequests { get; set; }
        public DbSet<AppTransaction> AppTransactions { get; set; }

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

            /* ---------------- CartItem Configuration ---------------- */
            builder.Entity<CartItem>(b =>
            {
                b.ToTable("CartItems");

                // Relationship with CustomerProfile
                b.HasOne(c => c.CustomerProfile)
                 .WithMany() // Or .WithMany(cp => cp.CartItems) if you add a collection to CustomerProfile
                 .HasForeignKey(c => c.CustomerProfileId)
                 .OnDelete(DeleteBehavior.Cascade); // If profile is deleted, delete cart

                // Relationship with StoreProduct
                b.HasOne(c => c.StoreProduct)
                 .WithMany()
                 .HasForeignKey(c => c.StoreProductId)
                 .OnDelete(DeleteBehavior.Restrict); // Prevent deleting a product if it's in someone's cart

                // Optional: Ensure precise decimals for currency
                b.Property(c => c.Price).HasColumnType("decimal(18,2)");
                b.Property(c => c.OriginalPrice).HasColumnType("decimal(18,2)");
                b.Property(c => c.ResellerDiscountPercentage).HasColumnType("decimal(18,2)");
            });

            // Re-pasting your existing CustomerProfile to ensure it stays intact
            builder.Entity<CustomerProfile>(b =>
            {
                b.ToTable("CustomerProfiles");
                b.HasIndex(x => x.UserId).IsUnique();

                b.HasOne(x => x.User)
                 .WithMany()
                 .HasForeignKey(x => x.UserId)
                 .OnDelete(DeleteBehavior.Cascade);
            });


            /* ---------------- Wallet Configuration ---------------- */
            builder.Entity<Wallet>(b =>
            {
                b.HasOne(w => w.User)
                 .WithOne()
                 .HasForeignKey<Wallet>(w => w.UserId)
                 .OnDelete(DeleteBehavior.Cascade);

                b.Property(w => w.Balance).HasColumnType("decimal(18,2)");
                b.Property(w => w.RowVersion).IsRowVersion();
            });

            builder.Entity<WalletTransaction>(b =>
            {
                b.HasOne(wt => wt.Wallet)
                 .WithMany()
                 .HasForeignKey(wt => wt.WalletId)
                 .OnDelete(DeleteBehavior.Restrict);

                b.Property(wt => wt.Amount).HasColumnType("decimal(18,2)");
            });
        }
    }
}
