using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.UI;
using Abp.Net.Mail;
using Elicom.Entities;
using Elicom.SupplierOrders.Dto;
using Elicom.Wallets;
using Elicom.Authorization;
using Elicom.Wholesale.Dto;
using Elicom.Cards;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Elicom.Wholesale
{
    [AbpAuthorize(PermissionNames.Pages_PrimeShip)]
    [Abp.Domain.Uow.UnitOfWork(System.Transactions.TransactionScopeOption.Suppress)]
    public class WholesaleAppService : ElicomAppServiceBase, IWholesaleAppService
    {
        private readonly IRepository<Product, Guid> _productRepository;
        private readonly IRepository<SupplierOrder, Guid> _supplierOrderRepository;
        private readonly IWalletManager _walletManager;
        private readonly IEmailSender _emailSender;
        private readonly ICardAppService _cardAppService;

        public WholesaleAppService(
            IRepository<Product, Guid> productRepository,
            IRepository<SupplierOrder, Guid> supplierOrderRepository,
            IWalletManager walletManager,
            IEmailSender emailSender,
            ICardAppService cardAppService)
        {
            _productRepository = productRepository;
            _supplierOrderRepository = supplierOrderRepository;
            _walletManager = walletManager;
            _emailSender = emailSender;
            _cardAppService = cardAppService;
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

            // 2. Pay Upfront (Deduct from EasyFinora Card if method is finora)
            if (input.PaymentMethod == "finora")
            {
                if (string.IsNullOrEmpty(input.CardNumber))
                {
                    throw new UserFriendlyException("Card number is required for EasyFinora payment.");
                }

                await _cardAppService.ProcessPayment(new ProcessCardPaymentInput
                {
                    CardNumber = input.CardNumber,
                    ExpiryDate = input.ExpiryDate,
                    Cvv = input.Cvv,
                    Amount = totalAmount,
                    Description = $"Wholesale purchase from PrimeShip for {input.CustomerName}",
                    ReferenceId = "Pending" // Will be updated if needed or used as is
                });
            }
            else
            {
                // Fallback for other methods or the original wallet logic (currently disabled)
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
            await _supplierOrderRepository.InsertAsync(supplierOrder);
            // await CurrentUnitOfWork.SaveChangesAsync(); // Removed for atomicity

            // Automate Email
            try
            {
                var mail = new System.Net.Mail.MailMessage(
                    "no-reply@primeshipuk.com",
                    "noshahidevelopersinc@gmail.com"
                )
                {
                    Subject = $"New Wholesale Order: {supplierOrder.ReferenceCode}",
                    Body = $"A new wholesale order has been placed.\n\nTotal Amount: {totalAmount}\nCustomer: {input.CustomerName}\nRef: {supplierOrder.ReferenceCode}",
                    IsBodyHtml = false
                };

                await _emailSender.SendAsync(mail);
            }
            catch (Exception ex)
            {
                Logger.Error("Failed to send email notification", ex);
            }

            return ObjectMapper.Map<SupplierOrderDto>(supplierOrder);
        }
    }
}
