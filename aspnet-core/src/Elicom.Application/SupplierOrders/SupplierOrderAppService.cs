using Abp.Application.Services;
using Abp.Domain.Repositories;
using Abp.UI;
using Elicom.Entities;
using Elicom.SupplierOrders.Dto;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Elicom.SupplierOrders
{
    public class SupplierOrderAppService : ApplicationService, ISupplierOrderAppService
    {
        private readonly IRepository<SupplierOrder, Guid> _supplierOrderRepo;
        private readonly IRepository<SupplierOrderItem, Guid> _supplierOrderItemRepo;

        public SupplierOrderAppService(
            IRepository<SupplierOrder, Guid> supplierOrderRepo,
            IRepository<SupplierOrderItem, Guid> supplierOrderItemRepo)
        {
            _supplierOrderRepo = supplierOrderRepo;
            _supplierOrderItemRepo = supplierOrderItemRepo;
        }

        // ✅ CREATE SUPPLIER ORDER (NO ORDER LINK)
        public async Task<SupplierOrderDto> Create(CreateSupplierOrderDto input)
        {
            if (input.Items == null || !input.Items.Any())
                throw new UserFriendlyException("Supplier order must contain items");

            var supplierOrder = new SupplierOrder
            {
                ResellerId = input.ResellerId,
                WarehouseAddress = input.WarehouseAddress,
                Status = "Purchased",
                ReferenceCode = GenerateReferenceCode(),
                TotalPurchaseAmount = input.Items.Sum(
                    i => i.Quantity * i.PurchasePrice
                )
            };

            await _supplierOrderRepo.InsertAsync(supplierOrder);
            await CurrentUnitOfWork.SaveChangesAsync(); // Get SupplierOrderId

            foreach (var item in input.Items)
            {
                var supplierOrderItem = new SupplierOrderItem
                {
                    SupplierOrderId = supplierOrder.Id,
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    PurchasePrice = item.PurchasePrice
                };

                await _supplierOrderItemRepo.InsertAsync(supplierOrderItem);
            }

            await CurrentUnitOfWork.SaveChangesAsync();

            return ObjectMapper.Map<SupplierOrderDto>(supplierOrder);
        }

        // ✅ GET SUPPLIER ORDER
        public async Task<SupplierOrderDto> Get(Guid id)
        {
            var supplierOrder = await _supplierOrderRepo.GetAll()
                .Include(x => x.Items)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (supplierOrder == null)
                throw new UserFriendlyException("Supplier order not found");

            return ObjectMapper.Map<SupplierOrderDto>(supplierOrder);
        }

        // 🔐 INTERNAL: Reference Code Generator
        private string GenerateReferenceCode()
        {
            return $"SUP-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";
        }
    }
}
