using Elicom.Entities;
using Elicom.Orders;
using Elicom.Orders.Dto;
using Elicom.Wallets;
using Shouldly;
using System;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace Elicom.Tests.Orders
{
    public class OrderAppService_Tests : ElicomTestBase
    {
        private readonly IOrderAppService _orderAppService;
        private readonly IWalletManager _walletManager;

        public OrderAppService_Tests()
        {
            _orderAppService = Resolve<IOrderAppService>();
            _walletManager = Resolve<IWalletManager>();
        }

        [Fact]
        public async Task Should_Deduct_Funds_When_Order_Placed()
        {
            var uowManager = Resolve<Abp.Domain.Uow.IUnitOfWorkManager>();
            
            using (var uow = uowManager.Begin())
            {
                // Arrange
                var user = await GetCurrentUserAsync();
                await _walletManager.DepositAsync(user.Id, 5000, "TEST-DEP", "Test Deposit");
                await uowManager.Current.SaveChangesAsync(); // Commit deposit

                // 1. Check Initial Balance
                (await _walletManager.GetBalanceAsync(user.Id)).ShouldBe(5000);

                // 2. Debit
                bool result = await _walletManager.TryDebitAsync(user.Id, 1000, "ORD-TEST", "Order Payment");
                await uowManager.Current.SaveChangesAsync();

                // Assert
                result.ShouldBeTrue();
                (await _walletManager.GetBalanceAsync(user.Id)).ShouldBe(4000);
                
                await uow.CompleteAsync();
            }
        }

        [Fact]
        public async Task Should_Fail_Debit_If_Insufficient_Funds()
        {
            var uowManager = Resolve<Abp.Domain.Uow.IUnitOfWorkManager>();
            using (var uow = uowManager.Begin())
            {
                var user = await GetCurrentUserAsync();
                // Balance is 0 by default

                bool result = await _walletManager.TryDebitAsync(user.Id, 1000, "FAIL-TEST", "Bad Order");

                result.ShouldBeFalse();
                await uow.CompleteAsync();
            }
        }
        [Fact]
        public async Task Should_Create_Order_And_Forward_To_Suppliers()
        {
            var uowManager = Resolve<Abp.Domain.Uow.IUnitOfWorkManager>();
            using (var uow = uowManager.Begin())
            {
                LoginAsDefaultTenantAdmin();
                var user = await GetCurrentUserAsync();

                // 1. Setup: Category, Store, Products, Wallet
                var category = UsingDbContext(context => {
                    var c = new Category { Name = "Elect", Slug = "elect", Status = true };
                    context.Categories.Add(c);
                    context.SaveChanges();
                    return c;
                });

                var store = UsingDbContext(context => {
                    var s = new Store { Name = "Main Store", OwnerId = user.Id, Status = true, Slug = "main" };
                    context.Stores.Add(s);
                    context.SaveChanges();
                    return s;
                });

                var supplierId1 = user.Id; // Using same user as supplier for simplicity
                var product = UsingDbContext(context => {
                    var p = new Product { 
                        Name = "Prod1", CategoryId = category.Id, SupplierId = supplierId1, 
                        SupplierPrice = 100, ResellerMaxPrice = 200, StockQuantity = 10, Status = true 
                    };
                    context.Products.Add(p);
                    context.SaveChanges();
                    return p;
                });

                var storeProduct = UsingDbContext(context => {
                    var sp = new StoreProduct { 
                        StoreId = store.Id, ProductId = product.Id, ResellerPrice = 150, Status = true, StockQuantity = 10 
                    };
                    context.StoreProducts.Add(sp);
                    context.SaveChanges();
                    return sp;
                });

                // Add to Cart
                UsingDbContext(context => {
                    context.CartItems.Add(new CartItem { 
                        CustomerProfileId = Guid.NewGuid(), StoreProductId = storeProduct.Id, Price = 150, Quantity = 2, Status = "Active" 
                    });
                    context.SaveChanges();
                });

                // Wallet Balance
                await _walletManager.DepositAsync(user.Id, 1000, "DEP", "Deposit");
                await uowManager.Current.SaveChangesAsync();

                // 2. Act: Create Order
                var customerProfileId = UsingDbContext(context => context.CartItems.First().CustomerProfileId);
                await _orderAppService.Create(new CreateOrderDto {
                    CustomerProfileId = customerProfileId,
                    PaymentMethod = "Wallet",
                    ShippingCost = 10,
                    ShippingAddress = "123 Street"
                });

                await uowManager.Current.SaveChangesAsync();

                // 3. Assert: Order exists
                var order = UsingDbContext(context => context.Orders.First(o => o.CustomerProfileId == customerProfileId));
                order.PaymentStatus.ShouldBe("Paid (Escrow)");

                // 4. Assert: Supplier Order created!
                var supplierOrder = UsingDbContext(context => context.SupplierOrders.FirstOrDefault(so => so.OrderId == order.Id));
                supplierOrder.ShouldNotBeNull();
                supplierOrder.SupplierId.ShouldBe(supplierId1);
                supplierOrder.TotalPurchaseAmount.ShouldBe(200); // 100 * 2

                await uow.CompleteAsync();
            }
        }

        [Fact]
        public async Task Should_Distribute_Profit_When_Order_Delivered()
        {
            var uowManager = Resolve<Abp.Domain.Uow.IUnitOfWorkManager>();
            using (var uow = uowManager.Begin())
            {
                LoginAsDefaultTenantAdmin();
                var user = await GetCurrentUserAsync();

                // Setup similar to above
                var category = UsingDbContext(context => {
                    var c = new Category { Name = "Elect2", Slug = "elect2", Status = true };
                    context.Categories.Add(c);
                    context.SaveChanges();
                    return c;
                });

                var store = UsingDbContext(context => {
                    var s = new Store { Name = "Main Store 2", OwnerId = user.Id, Status = true, Slug = "main2" };
                    context.Stores.Add(s);
                    context.SaveChanges();
                    return s;
                });

                var supplierId = user.Id; // Using same user for simplicity
                var product = UsingDbContext(context => {
                    var p = new Product { 
                        Name = "Prod2", CategoryId = category.Id, SupplierId = supplierId, 
                        SupplierPrice = 100, ResellerMaxPrice = 200, StockQuantity = 10, Status = true 
                    };
                    context.Products.Add(p);
                    context.SaveChanges();
                    return p;
                });

                var storeProduct = UsingDbContext(context => {
                    var sp = new StoreProduct { 
                        StoreId = store.Id, ProductId = product.Id, ResellerPrice = 150, Status = true, StockQuantity = 10 
                    };
                    context.StoreProducts.Add(sp);
                    context.SaveChanges();
                    return sp;
                });

                UsingDbContext(context => {
                    context.CartItems.Add(new CartItem { 
                        CustomerProfileId = Guid.NewGuid(), StoreProductId = storeProduct.Id, Price = 150, Quantity = 1, Status = "Active" 
                    });
                    context.SaveChanges();
                });

                await _walletManager.DepositAsync(user.Id, 1000, "DEP", "Deposit");
                await uowManager.Current.SaveChangesAsync();

                var customerProfileId = UsingDbContext(context => context.CartItems.First().CustomerProfileId);
                var orderDto = await _orderAppService.Create(new CreateOrderDto {
                    CustomerProfileId = customerProfileId,
                    PaymentMethod = "Wallet",
                    ShippingCost = 0,
                    ShippingAddress = "123 Street"
                });

                await uowManager.Current.SaveChangesAsync();

                // Now Mark as Processing
                await _orderAppService.MarkAsProcessing(new MarkOrderProcessingDto { Id = orderDto.Id, SupplierReference = "REF-123" });
                await uowManager.Current.SaveChangesAsync();

                // Check balances before delivery
                // Buyer paid 150. Balance started at 1000 + 1000 (deposit) - 150 = 1850? 
                // Wait, GetMyWallet auto-creates with 0. Deposit adds 1000. So 1000 - 150 = 850.
                (await _walletManager.GetBalanceAsync(user.Id)).ShouldBe(850);

                // Act: Mark as Delivered
                await _orderAppService.MarkAsDelivered(new MarkOrderDeliveredDto { Id = orderDto.Id, DeliveryTrackingNumber = "TRACK-123" });
                await uowManager.Current.SaveChangesAsync();

                // Assert: 
                // Supplier (user.Id) should get 100.
                // Reseller (user.Id) should get 50 (150 - 100).
                // Total balance: 850 + 100 + 50 = 1000.
                (await _walletManager.GetBalanceAsync(user.Id)).ShouldBe(1000);

                await uow.CompleteAsync();
            }
        }
        [Fact]
        public async Task Should_Create_Order_For_Primeship_With_External_Payment()
        {
            var uowManager = Resolve<Abp.Domain.Uow.IUnitOfWorkManager>();
            using (var uow = uowManager.Begin())
            {
                LoginAsDefaultTenantAdmin();
                var user = await GetCurrentUserAsync();

                // Setup Category and Product
                var category = UsingDbContext(context => {
                    var c = new Category { Name = "Fashion", Slug = "fashion", Status = true };
                    context.Categories.Add(c);
                    context.SaveChanges();
                    return c;
                });

                var store = UsingDbContext(context => {
                    var s = new Store { Name = "Prime Ship Warehouse", OwnerId = user.Id, Status = true, Slug = "ps-warehouse" };
                    context.Stores.Add(s);
                    context.SaveChanges();
                    return s;
                });

                var product = UsingDbContext(context => {
                    var p = new Product { 
                        Name = "T-Shirt", CategoryId = category.Id, SupplierId = user.Id, 
                        SupplierPrice = 10, ResellerMaxPrice = 50, StockQuantity = 100, Status = true 
                    };
                    context.Products.Add(p);
                    context.SaveChanges();
                    return p;
                });

                var storeProduct = UsingDbContext(context => {
                    var sp = new StoreProduct { 
                        StoreId = store.Id, ProductId = product.Id, ResellerPrice = 40, Status = true, StockQuantity = 100 
                    };
                    context.StoreProducts.Add(sp);
                    context.SaveChanges();
                    return sp;
                });

                // Add to Cart
                var customerProfileId = Guid.NewGuid();
                UsingDbContext(context => {
                    context.CartItems.Add(new CartItem { 
                        CustomerProfileId = customerProfileId, StoreProductId = storeProduct.Id, Price = 40, Quantity = 1, Status = "Active" 
                    });
                    context.SaveChanges();
                });

                // Act: Create Order for PrimeShip
                await _orderAppService.Create(new CreateOrderDto {
                    CustomerProfileId = customerProfileId,
                    PaymentMethod = "MasterCard",
                    ShippingCost = 5,
                    ShippingAddress = "456 Fashion Blvd",
                    City = "London",
                    Country = "UK",
                    SourcePlatform = "PrimeShip"
                });

                await uowManager.Current.SaveChangesAsync();

                // Assert: Order exists and source is PrimeShip
                var order = UsingDbContext(context => context.Orders.First(o => o.CustomerProfileId == customerProfileId));
                order.SourcePlatform.ShouldBe("PrimeShip");
                order.PaymentMethod.ShouldBe("MasterCard");
                order.PaymentStatus.ShouldBe("Paid (External)");
                order.TotalAmount.ShouldBe(45); // 40 + 5

                await uow.CompleteAsync();
            }
        }
    }
}
