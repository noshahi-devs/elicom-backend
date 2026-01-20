using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.UI;
using Abp.Net.Mail;
using Elicom.Authorization;
using Elicom.Entities;
using Elicom.SupplierOrders.Dto;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Elicom.SupplierOrders
{
    [AbpAuthorize(PermissionNames.Pages_PrimeShip_Admin)]
    public class SupplierOrderAppService : ElicomAppServiceBase, ISupplierOrderAppService
    {
        private readonly IRepository<SupplierOrder, Guid> _supplierOrderRepository;
        private readonly IRepository<SupplierOrderItem, Guid> _supplierOrderItemRepository;
        private readonly IEmailSender _emailSender;

        public SupplierOrderAppService(
            IRepository<SupplierOrder, Guid> supplierOrderRepository,
            IRepository<SupplierOrderItem, Guid> supplierOrderItemRepository,
            IEmailSender emailSender)
        {
            _supplierOrderRepository = supplierOrderRepository;
            _supplierOrderItemRepository = supplierOrderItemRepository;
            _emailSender = emailSender;
        }

        // ✅ GET MY ORDERS (For Supplier)
        public async Task<ListResultDto<SupplierOrderDto>> GetMyOrders()
        {
            var user = await GetCurrentUserAsync();

            var orders = await _supplierOrderRepository.GetAll()
                .Include(x => x.Items)
                .Where(x => x.SupplierId == user.Id)
                .OrderByDescending(x => x.CreationTime)
                .ToListAsync();

            return new ListResultDto<SupplierOrderDto>(ObjectMapper.Map<List<SupplierOrderDto>>(orders));
        }

        // ✅ CREATE SUPPLIER ORDER (Usually called by system via OrderAppService, but kept for manual use)
        public async Task<SupplierOrderDto> Create(CreateSupplierOrderDto input)
        {
            if (input.Items == null || !input.Items.Any())
                throw new UserFriendlyException("Supplier order must contain items");

            var supplierOrder = new SupplierOrder
            {
                ResellerId = input.ResellerId,
                SupplierId = input.SupplierId,
                WarehouseAddress = input.WarehouseAddress,
                Status = "Purchased",
                ReferenceCode = GenerateReferenceCode(),
                TotalPurchaseAmount = input.Items.Sum(
                    i => i.Quantity * i.PurchasePrice
                )
            };

            await _supplierOrderRepository.InsertAsync(supplierOrder);
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

        // 🔐 INTERNAL: Reference Code Generator
        private string GenerateReferenceCode()
        {
            return $"SUP-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";
        }
    }
}
