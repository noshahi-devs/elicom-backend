using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Elicom.Authorization;
using Elicom.Entities;
using Elicom.Stores.Dto;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Abp.Net.Mail;
using Elicom.Authorization.Users;
using MimeKit;
using MailKit.Net.Smtp;
using MailKit.Security;

namespace Elicom.Stores
{    

    public class StoreAppService : ElicomAppServiceBase, IStoreAppService
    {
        private readonly IRepository<Store, Guid> _storeRepo;
        private readonly IRepository<User, long> _userRepo;
        private readonly IEmailSender _emailSender;
        private readonly UserManager _userManager;

        public StoreAppService(
            IRepository<Store, Guid> storeRepo, 
            IRepository<User, long> userRepo,
            IEmailSender emailSender,
            UserManager userManager)
        {
            _storeRepo = storeRepo;
            _userRepo = userRepo;
            _emailSender = emailSender;
            _userManager = userManager;
        }

        [AbpAuthorize(PermissionNames.Pages_Stores)]
        public virtual async Task<ListResultDto<StoreDto>> GetAll()
        {
            using (UnitOfWorkManager.Current.DisableFilter(Abp.Domain.Uow.AbpDataFilters.MayHaveTenant, Abp.Domain.Uow.AbpDataFilters.MustHaveTenant))
            {
                var stores = await _storeRepo.GetAll().Include(s => s.Kyc).ToListAsync();
                return new ListResultDto<StoreDto>(ObjectMapper.Map<List<StoreDto>>(stores));
            }
        }

        [AbpAuthorize(PermissionNames.Pages_Stores)]
        public async Task<StoreDto> Get(Guid id)
        {
            var store = await _storeRepo.GetAsync(id);
            return ObjectMapper.Map<StoreDto>(store);
        }

        [AbpAuthorize]
        public async Task<StoreDto> Create(CreateStoreDto input)
        {
            var store = ObjectMapper.Map<Store>(input);
            store.CreatedAt = DateTime.Now;
            store.UpdatedAt = DateTime.Now;
            
            // Force current user as owner for security
            if (AbpSession.UserId.HasValue)
            {
                store.OwnerId = AbpSession.UserId.Value;
            }

            await _storeRepo.InsertAsync(store);
            return ObjectMapper.Map<StoreDto>(store);
        }

        [AbpAuthorize(PermissionNames.Pages_Stores_Edit)]
        public async Task<StoreDto> Update(UpdateStoreDto input)
        {
            var store = await _storeRepo.GetAsync(input.Id);
            ObjectMapper.Map(input, store);
            return ObjectMapper.Map<StoreDto>(store);
        }

        [AbpAuthorize(PermissionNames.Pages_Stores_Delete)]
        public async Task Delete(Guid id)
        {
            await _storeRepo.DeleteAsync(id);
        }

        [AbpAuthorize(PermissionNames.Pages_Stores)]
        public async Task Approve(EntityDto<Guid> input)
        {
            var store = await _storeRepo.GetAsync(input.Id);
            
            store.Status = true;
            await _storeRepo.UpdateAsync(store);

            // Send Email Notification
            await SendVerificationSuccessEmail(store);
        }

        private async Task SendVerificationSuccessEmail(Store store)
        {
            User owner;
            using (CurrentUnitOfWork.DisableFilter(Abp.Domain.Uow.AbpDataFilters.MayHaveTenant, Abp.Domain.Uow.AbpDataFilters.MustHaveTenant))
            {
                owner = store.Owner ?? await _userRepo.GetAsync(store.OwnerId);
            }
            
            var recipientEmail = !string.IsNullOrEmpty(store.SupportEmail) ? store.SupportEmail : owner.EmailAddress;
            var brandColor = "#f85606"; // Prime Ship Orange
            var platformName = "Primeship UK";

            var emailBody = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #ffffff;'>
                    <div style='text-align: center; border-bottom: 2px solid {brandColor}; padding-bottom: 15px;'>
                        <h1 style='color: #333; margin: 0;'>{platformName.ToUpper()}</h1>
                    </div>
                    <div style='padding: 30px; line-height: 1.6; color: #333;'>
                        <h2 style='color: {brandColor};'>Congratulations!</h2>
                        <p>Hi <b>{owner.Name}</b>,</p>
                        <p>We are excited to inform you that your store application for <b>""{store.Name}""</b> has been <b>approved</b>.</p>
                        <p>You can now log in to the seller dashboard and start setting up your products.</p>
                        <div style='text-align: center; margin: 35px 0;'>
                            <a href='https://elicom.nosshahidevs.com/auth' style='background-color: {brandColor}; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 18px;'>
                                GO TO SELLER PANEL
                            </a>
                        </div>
                        <p>If you have any questions, feel free to contact our support team.</p>
                        <p>Happy Selling!</p>
                    </div>
                </div>";

            try
            {
                await SendEmailWithCustomSmtp(
                    "primeshipuk.com",
                    465,
                    "worldcart@primeshipuk.com",
                    "Noshahi.000",
                    platformName,
                    recipientEmail,
                    $"{platformName} - Your Store '{store.Name}' is Approved!",
                    emailBody
                );
            }
            catch (Exception ex)
            {
                Logger.Error($"Failed to send Store Approval email to {recipientEmail}: {ex.Message}");
            }
        }

        private async Task SendEmailWithCustomSmtp(string host, int port, string user, string pass, string fromName, string to, string subject, string body)
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(fromName, user));
            message.To.Add(new MailboxAddress("", to));
            message.Subject = subject;

            var bodyBuilder = new BodyBuilder { HtmlBody = body };
            message.Body = bodyBuilder.ToMessageBody();

            using (var client = new MailKit.Net.Smtp.SmtpClient())
            {
                client.ServerCertificateValidationCallback = (s, c, h, e) => true;
                await client.ConnectAsync(host, port, SecureSocketOptions.SslOnConnect);
                await client.AuthenticateAsync(user, pass);
                await client.SendAsync(message);
                await client.DisconnectAsync(true);
            }
        }

        [AbpAuthorize(PermissionNames.Pages_Stores)]
        public async Task Reject(EntityDto<Guid> input)
        {
            var store = await _storeRepo.GetAsync(input.Id);
            store.Status = false;
            await _storeRepo.UpdateAsync(store);
        }

        [AbpAuthorize(PermissionNames.Pages_Stores)]
        public async Task VerifyKyc(EntityDto<Guid> input)
        {
            var store = await _storeRepo.GetAllIncluding(s => s.Kyc).FirstOrDefaultAsync(s => s.Id == input.Id);
            if (store != null && store.Kyc != null)
            {
                store.Kyc.Status = true;
                await _storeRepo.UpdateAsync(store);
            }
        }

        [AbpAuthorize]
        public virtual async Task<StoreDto> GetMyStore()
        {
            var userId = AbpSession.UserId;
            Logger.Info($"[GetMyStore] Request by User ID: {userId}, Tenant ID: {AbpSession.TenantId}");

            if (!userId.HasValue) 
            {
                Logger.Warn("[GetMyStore] AbpSession.UserId is null!");
                return null;
            }

            using (UnitOfWorkManager.Current.DisableFilter(Abp.Domain.Uow.AbpDataFilters.MayHaveTenant, Abp.Domain.Uow.AbpDataFilters.MustHaveTenant))
            {
                var store = await _storeRepo.GetAll()
                    .Include(s => s.Kyc)
                    .FirstOrDefaultAsync(s => s.OwnerId == userId.Value);

                if (store == null) 
                {
                    Logger.Warn($"[GetMyStore] No store found for User {userId}.");
                    return null;
                }

                Logger.Info($"[GetMyStore] Found store '{store.Name}' (ID: {store.Id})");
                return ObjectMapper.Map<StoreDto>(store);
            }
        }
    }
}
