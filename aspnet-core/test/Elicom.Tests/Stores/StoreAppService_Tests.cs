using Elicom.Stores;
using Elicom.Stores.Dto;
using Microsoft.EntityFrameworkCore;
using Shouldly;
using System;
using System.Threading.Tasks;
using Xunit;
using Elicom.Entities;
using Abp.Application.Services.Dto;
using Elicom.Authorization.Users;

namespace Elicom.Tests.Stores
{
    public class StoreAppService_Tests : ElicomTestBase
    {
        private readonly IStoreAppService _storeAppService;

        public StoreAppService_Tests()
        {
            _storeAppService = Resolve<IStoreAppService>();
        }

        [Fact]
        public async Task Approve_Store_Test()
        {
            // Arrange
            Guid storeId = Guid.NewGuid();
            await UsingDbContextAsync(async context =>
            {
                var admin = await context.Users.FirstAsync(u => u.UserName == "admin");
                
                context.Stores.Add(new Store
                {
                    Id = storeId,
                    Name = "Test Store",
                    OwnerId = admin.Id,
                    Status = false,
                    SupportEmail = "store@test.com",
                    Slug = "test-store",
                    Description = "Test Description",
                    ShortDescription = "Short",
                    LongDescription = "Long"
                });
            });

            // Act
            using (var uow = LocalIocManager.Resolve<Abp.Domain.Uow.IUnitOfWorkManager>().Begin())
            {
                await _storeAppService.Approve(new EntityDto<Guid>(storeId));
                await uow.CompleteAsync();
            }

            // Assert
            await UsingDbContextAsync(async context =>
            {
                var store = await context.Stores.FirstOrDefaultAsync(s => s.Id == storeId);
                store.ShouldNotBeNull();
                store.Status.ShouldBeTrue();
            });
        }

        [Fact]
        public async Task Reject_Store_Test()
        {
            // Arrange
            Guid storeId = Guid.NewGuid();
            await UsingDbContextAsync(async context =>
            {
                var admin = await context.Users.FirstAsync(u => u.UserName == "admin");

                context.Stores.Add(new Store
                {
                    Id = storeId,
                    Name = "Rejected Store",
                    OwnerId = admin.Id,
                    Status = true, // Start as true
                    SupportEmail = "reject@test.com",
                    Slug = "reject-store",
                    Description = "Test Description",
                    ShortDescription = "Short",
                    LongDescription = "Long"
                });
            });

            // Act
            using (var uow = LocalIocManager.Resolve<Abp.Domain.Uow.IUnitOfWorkManager>().Begin())
            {
                await _storeAppService.Reject(new EntityDto<Guid>(storeId));
                await uow.CompleteAsync();
            }

            // Assert
            await UsingDbContextAsync(async context =>
            {
                var store = await context.Stores.FirstOrDefaultAsync(s => s.Id == storeId);
                store.ShouldNotBeNull();
                store.Status.ShouldBeFalse();
            });
        }
    }
}
