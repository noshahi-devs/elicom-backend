using Abp.Application.Services;
using Abp.Domain.Repositories;
using Abp.UI;
using AutoMapper;
using Elicom.Entities;
using Elicom.SupplierOrders.Dto;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Elicom.SupplierOrders
{
    public class SupplierOrderAppService : ApplicationService, ISupplierOrderAppService
    {
        private readonly IRepository<SupplierOrder, Guid> _supplierOrderRepository;
        private readonly IRepository<Order, Guid> _orderRepository;

        public SupplierOrderAppService(
            IRepository<SupplierOrder, Guid> supplierOrderRepository,
            IRepository<Order, Guid> orderRepository)
        {
            _supplierOrderRepository = supplierOrderRepository;
            _orderRepository = orderRepository;
        }

        // ✅ Create Supplier Order & deduct reseller payment
        public async Task<SupplierOrderDto> Create(CreateSupplierOrderDto input)
        {
            var order = await _orderRepository.GetAsync(input.OrderId);
            if (order == null)
                throw new UserFriendlyException("Order not found");

            // Map DTO to Entity
            var supplierOrder = ObjectMapper.Map<SupplierOrder>(input);
            supplierOrder.Status = "Purchased";

            // TODO: Deduct reseller balance here (implement wallet logic)

            await _supplierOrderRepository.InsertAsync(supplierOrder);
            await CurrentUnitOfWork.SaveChangesAsync();

            // Update order status and link SupplierOrder
            order.Status = "Shipped"; // shipped to Smartstore eventually
            order.SupplierOrderId = supplierOrder.Id;
            await _orderRepository.UpdateAsync(order);

            return ObjectMapper.Map<SupplierOrderDto>(supplierOrder);
        }

        // ✅ Get Supplier Order
        public async Task<SupplierOrderDto> Get(Guid id)
        {
            var supplierOrder = await _supplierOrderRepository.GetAll()
                .Include(so => so.Order)
                .FirstOrDefaultAsync(so => so.Id == id);

            return ObjectMapper.Map<SupplierOrderDto>(supplierOrder);
        }

        // ✅ Update Supplier Order (Delivered / Refunded)
        public async Task<SupplierOrderDto> Update(UpdateSupplierOrderDto input)
        {
            var supplierOrder = await _supplierOrderRepository.GetAsync(input.Id);

            if (!string.IsNullOrEmpty(input.Status))
                supplierOrder.Status = input.Status;

            if (!string.IsNullOrEmpty(input.PurchaseId))
                supplierOrder.PurchaseId = input.PurchaseId;

            await _supplierOrderRepository.UpdateAsync(supplierOrder);
            await CurrentUnitOfWork.SaveChangesAsync();

            // TODO: Refund reseller if status == Delivered or Refunded

            return ObjectMapper.Map<SupplierOrderDto>(supplierOrder);
        }
    }
}
