using Abp.BackgroundJobs;
using Abp.Dependency;
using Abp.Domain.Repositories;
using Abp.Net.Mail;
using Elicom.BackgroundJobs;
using Elicom.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using Abp.Domain.Uow;
using Elicom.Authorization.Users;
using System.Collections.Generic;

namespace Elicom.Orders.BackgroundJobs
{
    public class OrderEmailJob : AsyncBackgroundJob<OrderEmailJobArgs>, ITransientDependency
    {
        private readonly IRepository<Order, Guid> _orderRepository;
        private readonly IRepository<StoreProduct, Guid> _storeProductRepository;
        private readonly IEmailSender _emailSender;
        private readonly UserManager _userManager;

        public OrderEmailJob(
            IRepository<Order, Guid> orderRepository,
            IRepository<StoreProduct, Guid> storeProductRepository,
            IEmailSender emailSender,
            UserManager userManager)
        {
            _orderRepository = orderRepository;
            _storeProductRepository = storeProductRepository;
            _emailSender = emailSender;
            _userManager = userManager;
        }

        [UnitOfWork]
        public override async Task ExecuteAsync(OrderEmailJobArgs args)
        {
            using (UnitOfWorkManager.Current.DisableFilter(AbpDataFilters.MayHaveTenant, AbpDataFilters.MustHaveTenant))
            {
                var order = await _orderRepository.GetAll()
                    .Include(o => o.OrderItems)
                    .FirstOrDefaultAsync(o => o.Id == args.OrderId);

                if (order == null)
                {
                    Logger.Warn($"OrderEmailJob: Order with ID {args.OrderId} not found.");
                    return;
                }

                try
                {
                    var user = await _userManager.FindByIdAsync(order.UserId.ToString());
                    var customerEmail = user?.EmailAddress ?? order.RecipientEmail;
                    var adminEmail = "noshahidevelopersinc@gmail.com";

                    // 1. Email to CUSTOMER
                    var customerBody = $@"
                        <h2>Order Confirmed!</h2>
                        <p>Dear Customer, your order <b>{order.OrderNumber}</b> has been placed successfully.</p>
                        <p>Total Amount: {order.TotalAmount:C}</p>
                        <p>We are processing your items and will notify you once shipped.</p>";

                    await SendEmailAsync(customerEmail, $"Order Confirmed: {order.OrderNumber}", customerBody);

                    // 2. Email to ADMIN
                    var adminBody = $@"
                        <h2>New Order Alert</h2>
                        <p>Order <b>{order.OrderNumber}</b> has been placed on SmartStore.</p>
                        <p>Amount: {order.TotalAmount:C}</p>
                        <p>Check the admin dashboard for details.</p>";

                    await SendEmailAsync(adminEmail, $"[ALERT] New Order: {order.OrderNumber}", adminBody);

                    // 3. Email to each SELLER
                    var storeProductIds = order.OrderItems.Select(oi => oi.StoreProductId).ToList();
                    var storeProducts = await _storeProductRepository.GetAll()
                        .Include(sp => sp.Store)
                        .Where(sp => storeProductIds.Contains(sp.Id))
                        .ToListAsync();

                    var storeGroups = storeProducts.GroupBy(sp => sp.StoreId);
                    foreach (var group in storeGroups)
                    {
                        var store = group.First().Store;
                        var owner = await _userManager.FindByIdAsync(store.OwnerId.ToString());
                        if (owner != null)
                        {
                            var sellerBody = $@"
                                <h2>You have a New Order!</h2>
                                <p>Store: <b>{store.Name}</b></p>
                                <p>Order: <b>{order.OrderNumber}</b></p>
                                <p>Please log in to your Seller Portal to fulfill this order.</p>";

                            await SendEmailAsync(owner.EmailAddress, $"New Sale: {order.OrderNumber}", sellerBody);
                        }
                    }
                }
                catch (Exception ex)
                {
                    Logger.Error("Failed to send order placement emails", ex);
                    throw; // Re-throw to let ABP retry the job
                }
            }
        }

        private async Task SendEmailAsync(string to, string subject, string body)
        {
            try
            {
                var mail = new System.Net.Mail.MailMessage("no-reply@primeshipuk.com", to)
                {
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = true
                };
                await _emailSender.SendAsync(mail);
            }
            catch (Exception ex)
            {
                Logger.Error($"Email error to {to}: {ex.Message}");
            }
        }
    }
}
