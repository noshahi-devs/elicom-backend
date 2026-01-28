using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.UI;
using Abp.Net.Mail;
using Elicom.Authorization;
using Elicom.Entities;
using Elicom.Orders.Dto;
using Elicom.SupplierOrders.Dto;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Elicom.SupplierOrders
{
    [AbpAuthorize]
    public class SupplierOrderAppService : ElicomAppServiceBase, ISupplierOrderAppService
    {
        private readonly IRepository<SupplierOrder, Guid> _supplierOrderRepository;
        private readonly IRepository<SupplierOrderItem, Guid> _supplierOrderItemRepository;
        private readonly IEmailSender _emailSender;

        private const long PlatformAdminId = 1; // The system account that holds Escrow funds

        public SupplierOrderAppService(
            IRepository<SupplierOrder, Guid> supplierOrderRepository,
            IRepository<SupplierOrderItem, Guid> supplierOrderItemRepository,
            IEmailSender emailSender)
        {
            _supplierOrderRepository = supplierOrderRepository;
            _supplierOrderItemRepository = supplierOrderItemRepository;
            _emailSender = emailSender;
        }

        // ✅ GET MY ORDERS (For Supplier and Reseller)
        public async Task<ListResultDto<SupplierOrderDto>> GetMyOrders()
        {
            var user = await GetCurrentUserAsync();

            var orders = await _supplierOrderRepository.GetAll()
                .Include(x => x.Items).ThenInclude(i => i.Product)
                .Include(x => x.Reseller)
                .Where(x => x.SupplierId == user.Id || x.ResellerId == user.Id)
                .OrderByDescending(x => x.CreationTime)
                .ToListAsync();

            return new ListResultDto<SupplierOrderDto>(ObjectMapper.Map<List<SupplierOrderDto>>(orders));
        }

        // ✅ CREATE SUPPLIER ORDER (Manual sourcing flow in Prime Ship)
        public async Task<SupplierOrderDto> Create(CreateSupplierOrderDto input)
        {
            var user = await GetCurrentUserAsync();
            
            // Find Admin user for the current tenant to be the default supplier
            var tenantAdmin = await UserManager.Users
                .Where(u => u.TenantId == AbpSession.TenantId && u.UserName == "admin")
                .FirstOrDefaultAsync();

            var adminId = tenantAdmin?.Id ?? 1; // Fallback if not found

            if (input.Items == null || !input.Items.Any())
                throw new UserFriendlyException("Supplier order must contain items");

            var supplierOrder = new SupplierOrder
            {
                ResellerId = user.Id, 
                SupplierId = adminId, 
                WarehouseAddress = input.WarehouseAddress,
                CustomerName = input.CustomerName,
                ShippingAddress = input.ShippingAddress,
                Status = "Pending", 
                ReferenceCode = GenerateReferenceCode(),
                SourcePlatform = "Primeship",
                TotalPurchaseAmount = input.Items.Sum(i => i.Quantity * i.PurchasePrice)
            };

            // If a specific supplier was provided, use it
            if (input.SupplierId > 0)
            {
                supplierOrder.SupplierId = input.SupplierId;
            }

            await _supplierOrderRepository.InsertAsync(supplierOrder);
            await CurrentUnitOfWork.SaveChangesAsync();

            foreach (var item in input.Items)
            {
                var supplierOrderItem = new SupplierOrderItem
                {
                    SupplierOrderId = supplierOrder.Id,
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    PurchasePrice = item.PurchasePrice
                };

                await _supplierOrderItemRepository.InsertAsync(supplierOrderItem);
            }

            await CurrentUnitOfWork.SaveChangesAsync();

            return ObjectMapper.Map<SupplierOrderDto>(supplierOrder);
        }

        // ✅ GET SUPPLIER ORDER
        public async Task<SupplierOrderDto> Get(Guid id)
        {
            var user = await GetCurrentUserAsync();
            var supplierOrder = await _supplierOrderRepository.GetAll()
                .Include(x => x.Items)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (supplierOrder == null)
                throw new UserFriendlyException("Supplier order not found");

            // Verify access (either supplier or reseller who owns it)
            if (supplierOrder.SupplierId != user.Id && supplierOrder.ResellerId != user.Id)
            {
                 throw new UserFriendlyException("Access denied.");
            }

            return ObjectMapper.Map<SupplierOrderDto>(supplierOrder);
        }

        public async Task MarkAsShipped(Guid id)
        {
            var user = await GetCurrentUserAsync();
            var order = await _supplierOrderRepository.FirstOrDefaultAsync(x => x.Id == id && x.SupplierId == user.Id);
            
            if (order == null) throw new UserFriendlyException("Order not found or access denied.");
            
            order.Status = "Shipped";
            await _supplierOrderRepository.UpdateAsync(order);

            // Notify Admin/Seller
            try
            {
                var mail = new System.Net.Mail.MailMessage(
                    "no-reply@primeshipuk.com",
                    "noshahidevelopersinc@gmail.com"
                )
                {
                    Subject = $"[PrimeShip] Order Shipped: {order.ReferenceCode}",
                    Body = $"Wholesale order {order.ReferenceCode} has been marked as SHIPPED.\n\nCustomer: {order.CustomerName}\nTracking: {order.ReferenceCode}",
                    IsBodyHtml = false
                };
                await _emailSender.SendAsync(mail);
            }
            catch (Exception ex)
            {
                Logger.Error("Email failed: " + ex.Message);
            }
        }

        public async Task MarkAsDelivered(Guid id)
        {
            var user = await GetCurrentUserAsync();
            var order = await _supplierOrderRepository.FirstOrDefaultAsync(x => x.Id == id && x.SupplierId == user.Id);
            
            if (order == null) throw new UserFriendlyException("Order not found or access denied.");
            
            order.Status = "Delivered";
            await _supplierOrderRepository.UpdateAsync(order);

            // Notify Admin/Seller
            try
            {
                var mail = new System.Net.Mail.MailMessage(
                    "no-reply@primeshipuk.com",
                    "noshahidevelopersinc@gmail.com"
                )
                {
                    Subject = $"[PrimeShip] Order Delivered: {order.ReferenceCode}",
                    Body = $"Wholesale order {order.ReferenceCode} has been marked as DELIVERED.\n\nCustomer: {order.CustomerName}",
                    IsBodyHtml = false
                };
                await _emailSender.SendAsync(mail);
            }
            catch (Exception ex)
            {
                Logger.Error("Email failed: " + ex.Message);
            }

            // AUTO-UPDATE Smart Store Order if linked
            if (order.OrderId.HasValue)
            {
                // In a real system, we'd fire an event or use a domain service
                // For now, we'll assume the Smart Store order can be marked as 'Delivered' 
                // once its linked wholesale order is delivered.
            }
        }
        public async Task<SupplierOrderDto> MarkAsVerified(Guid id)
        {
            var order = await _supplierOrderRepository.GetAll()
                .Include(so => so.Items)
                .FirstOrDefaultAsync(so => so.Id == id);
                
            if (order == null) throw new UserFriendlyException("Wholesale order not found");

            order.Status = "Verified";
            await _supplierOrderRepository.UpdateAsync(order);
            await CurrentUnitOfWork.SaveChangesAsync();

            return ObjectMapper.Map<SupplierOrderDto>(order);
        }

        // ✅ GET ALL ORDERS (For Admin)
        [AbpAuthorize(PermissionNames.Pages_PrimeShip_Admin)]
        public async Task<ListResultDto<SupplierOrderDto>> GetAll()
        {
            var orders = await _supplierOrderRepository.GetAll()
                .Include(x => x.Items).ThenInclude(i => i.Product)
                .Include(x => x.Reseller)
                .OrderByDescending(x => x.CreationTime)
                .ToListAsync();

            return new ListResultDto<SupplierOrderDto>(ObjectMapper.Map<List<SupplierOrderDto>>(orders));
        }

        // ✅ UPDATE ORDER STATUS (For Admin)
        [AbpAuthorize(PermissionNames.Pages_PrimeShip_Admin)]
        [HttpPost]
        [HttpPatch]
        [HttpPut]
        public async Task<SupplierOrderDto> UpdateStatus(Elicom.Orders.Dto.UpdateOrderStatusDto input)
        {
            var order = await _supplierOrderRepository.GetAll()
                .Include(x => x.Items)
                .FirstOrDefaultAsync(x => x.Id == input.Id);
                
            if (order == null) throw new UserFriendlyException("Wholesale order not found");
            
            order.Status = input.Status;
            
            await _supplierOrderRepository.UpdateAsync(order);
            await CurrentUnitOfWork.SaveChangesAsync();
            
            return ObjectMapper.Map<SupplierOrderDto>(order);
        }

        // 🔐 INTERNAL: Reference Code Generator
        private string GenerateReferenceCode()
        {
            return $"SUP-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";
        }
    }
}
