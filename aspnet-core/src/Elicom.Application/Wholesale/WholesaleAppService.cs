using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.UI;
using Elicom.Entities;
using Elicom.SupplierOrders.Dto;
using Elicom.Wallets;
using Elicom.Authorization;
using Elicom.Wholesale.Dto;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Elicom.Wholesale
{
    [AbpAuthorize(PermissionNames.Pages_PrimeShip)]
    public class WholesaleAppService : ElicomAppServiceBase, IWholesaleAppService
    {
        private readonly IRepository<Product, Guid> _productRepository;
        private readonly IRepository<SupplierOrder, Guid> _supplierOrderRepository;
        private readonly IWalletManager _walletManager;

        public WholesaleAppService(
            IRepository<Product, Guid> productRepository,
            IRepository<SupplierOrder, Guid> supplierOrderRepository,
            IWalletManager walletManager)
        {
            _productRepository = productRepository;
            _supplierOrderRepository = supplierOrderRepository;
            _walletManager = walletManager;
        }

        public async Task<SupplierOrderDto> PlaceWholesaleOrder(CreateWholesaleOrderInput input)
        {
            var user = await GetCurrentUserAsync();

            if (input.Items == null || !input.Items.Any())
            {
                throw new UserFriendlyException("Please select at least one product.");
            }

            // 1. Calculate Total Amount based on Wholesale Prices
            decimal totalAmount = 0;
            var orderItems = new List<SupplierOrderItem>();

            foreach (var item in input.Items)
            {
                var product = await _productRepository.GetAsync(item.ProductId);
                totalAmount += product.SupplierPrice * item.Quantity;

                orderItems.Add(new SupplierOrderItem
                {
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    PurchasePrice = product.SupplierPrice
                });
            }

            // 2. Pay Upfront (Deduct from GlobalPayUK Card / Wallet)
            bool paymentSuccess = await _walletManager.TryDebitAsync(
                user.Id, 
                totalAmount, 
                "WHOLESALE-PURCHASE", 
                $"Purchase from Prime Ship UK for customer: {input.CustomerName}"
            );

            if (!paymentSuccess)
            {
                throw new UserFriendlyException("Insufficient balance in your GlobalPayUK Card to place this wholesale order.");
            }

            // 3. Create the Supplier Order (Directed to Admin - we'll assume AdminId is 1 for now or use Host)
            // In a more robust system, we would have a setting for 'SystemAdminId'
            var supplierOrder = new SupplierOrder
            {
                ReferenceCode = $"WHOLE-{DateTime.UtcNow:yyyyMMddHHmmss}",
                ResellerId = user.Id,
                SupplierId = 1, // Default Admin
                TotalPurchaseAmount = totalAmount,
                Status = "Purchased",
                ShippingAddress = input.ShippingAddress,
                CustomerName = input.CustomerName,
                SourcePlatform = "PrimeShip",
                Items = orderItems
            };

            await _supplierOrderRepository.InsertAsync(supplierOrder);
            await CurrentUnitOfWork.SaveChangesAsync();

            return ObjectMapper.Map<SupplierOrderDto>(supplierOrder);
        }
    }
}
