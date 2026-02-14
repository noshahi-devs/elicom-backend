using Abp.Authorization.Users;
using Abp.Net.Mail;
using Abp.Runtime.Caching;
using Abp.UI;
using Abp.Domain.Uow;
using Elicom.Authorization.Accounts.Dto;
using Elicom.Authorization.Users;
using Elicom.Authorization.Roles;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using MimeKit;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.EntityFrameworkCore;
using Abp.Configuration;
using Azure.Communication.Email;
using Azure;

namespace Elicom.Authorization.Accounts;

public class AccountAppService : ElicomAppServiceBase, IAccountAppService
{
    // from: http://regexlib.com/REDetails.aspx?regexp_id=1923
    public const string PasswordRegex = "(?=^.{8,}$)(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\\s)[0-9a-zA-Z!@#$%^&*()]*$";

    private readonly UserRegistrationManager _userRegistrationManager;
    private readonly IEmailSender _emailSender;
    private readonly UserManager _userManager;
    private readonly Microsoft.Extensions.Configuration.IConfiguration _configuration;

    public AccountAppService(
        UserRegistrationManager userRegistrationManager,
        IEmailSender emailSender,
        UserManager userManager,
        Microsoft.Extensions.Configuration.IConfiguration configuration)
    {
        _userRegistrationManager = userRegistrationManager;
        _emailSender = emailSender;
        _userManager = userManager;
        _configuration = configuration;
    }

    [HttpGet]
    public virtual async Task<ContentResult> VerifyEmail(long userId, string token, string platform = "Prime Ship")
    {
        Logger.Info($"VerifyEmail: Attempting to verify user {userId} for platform {platform}");

        User user;
        // Search directly using EF Core IgnoreQueryFilters to bypass all visibility rules
        user = await _userManager.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == userId);
        
        if (user == null) 
        {
            Logger.Error($"VerifyEmail: User {userId} not found even with IgnoreQueryFilters.");
            throw new UserFriendlyException("User not found");
        }

        Logger.Info($"VerifyEmail: User {userId} found. TenantId={user.TenantId}. Proceeding to confirm token.");

        // Set the tenant context to the user's actual tenant (e.g., Tenant 3) for confirmation
        using (UnitOfWorkManager.Current.SetTenantId(user.TenantId))
        {
            var result = await _userManager.ConfirmEmailAsync(user, token);
            if (result.Succeeded)
            {
                user.IsActive = true;
                await _userManager.UpdateAsync(user);

                // Get ClientRootAddress from platform-specific settings
                string clientRootAddressSetting = "App.SmartStore.ClientRootAddress";
                if (platform == "Prime Ship" || platform == "Prime Ship UK") clientRootAddressSetting = "App.PrimeShip.ClientRootAddress";
                if (platform == "Easy Finora") clientRootAddressSetting = "App.EasyFinora.ClientRootAddress";

                var clientRootAddress = (await SettingManager.GetSettingValueAsync(clientRootAddressSetting))?.TrimEnd('/');
                if (string.IsNullOrEmpty(clientRootAddress)) clientRootAddress = "http://localhost:4200";

                string redirectPath = $"{clientRootAddress}/account/login";
            if (platform == "Smart Store") redirectPath = $"{clientRootAddress}/smartstore/auth";
            if (platform == "Prime Ship" || platform == "Prime Ship UK") redirectPath = $"{clientRootAddress}/auth/login";
            if (platform == "Easy Finora") redirectPath = $"{clientRootAddress}/auth";

                return new ContentResult
                {
                    ContentType = "text/html",
                    Content = $@"
                        <html>
                            <body style='text-align: center; font-family: sans-serif; padding-top: 100px;'>
                                <h1 style='color: green;'>{platform} Account Verified!</h1>
                                <p>You are being redirected to the login page...</p>
                                <script>
                                    setTimeout(function() {{
                                        window.location.href = '{redirectPath}';
                                    }}, 3000);
                                </script>
                            </body>
                        </html>"
                };
            }
        }

        throw new UserFriendlyException("Invalid or expired verification token");
    }

    public async Task<IsTenantAvailableOutput> IsTenantAvailable(IsTenantAvailableInput input)
    {
        var tenant = await TenantManager.FindByTenancyNameAsync(input.TenancyName);
        if (tenant == null)
        {
            return new IsTenantAvailableOutput(TenantAvailabilityState.NotFound);
        }

        if (!tenant.IsActive)
        {
            return new IsTenantAvailableOutput(TenantAvailabilityState.InActive);
        }

        return new IsTenantAvailableOutput(TenantAvailabilityState.Available, tenant.Id);
    }

    [HttpPost]
    public async Task<RegisterOutput> Register(RegisterInput input)
    {
        try
        {
            var user = await _userRegistrationManager.RegisterAsync(
                input.Name,
                input.Surname,
                input.EmailAddress,
                input.UserName,
                input.Password,
                false, // Email address is NOT confirmed by default.
                input.PhoneNumber,
                input.Country
            );

            var tenantId = AbpSession.TenantId ?? 1;
            string platformName = "Elicom";
            string brandColor = "#007bff";

            if (tenantId == 1 || tenantId == 2) { platformName = "Prime Ship UK"; brandColor = "#f85606"; }
            else if (tenantId == 3) { platformName = "Easy Finora"; brandColor = "#1de016"; }
            else if (tenantId == 4) { platformName = "Easy Finora"; brandColor = "#28a745"; }

            await SendVerificationEmail(user, platformName, brandColor);

            return new RegisterOutput
            {
                CanLogin = user.IsActive && user.IsEmailConfirmed
            };
        }
        catch (Exception ex)
        {
             throw new UserFriendlyException($"Registration Error: {ex.Message} | Inner: {ex.InnerException?.Message}");
        }
    }

    private async Task SendVerificationEmail(User user, string platformName, string brandColor)
    {
        var serverRootAddress = (await SettingManager.GetSettingValueAsync("App.ServerRootAddress"))?.TrimEnd('/');
        if (string.IsNullOrEmpty(serverRootAddress)) serverRootAddress = "http://localhost:44311";

        var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
        var verificationLink = $"{serverRootAddress}/api/services/app/Account/VerifyEmail?userId={user.Id}&token={Uri.EscapeDataString(token)}&platform={Uri.EscapeDataString(platformName)}";

        // var emailBody = $@"
        //     <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #ffffff;'>
        //         <div style='text-align: center; border-bottom: 2px solid {brandColor}; padding-bottom: 15px;'>
        //             <h1 style='color: #333; margin: 0;'>{platformName.ToUpper()}</h1>
        //         </div>
        //         <div style='padding: 30px; line-height: 1.6; color: #333;'>
        //             <h2>Welcome to {platformName}!</h2>
        //             <p>Hi <b>{user.Name}</b>,</p>
        //             <p>You've successfully registered on {platformName}.</p>
        //             <div style='text-align: center; margin: 35px 0;'>
        //                 <a href='{verificationLink}' style='background-color: {brandColor}; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 18px;'>
        //                     VERIFY MY ACCOUNT
        //                 </a>
        //             </div>
        //         </div>
        //     </div>";

        // Platform-specific email templates for complete brand separation
        string emailBody;

        if (platformName == "Prime Ship")
        {
            // PRIME SHIP UK - Compact Professional Theme (Orange to match website)
            emailBody = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
</head>
<body style='margin:0; padding:0; background-color:#fff5f0; font-family: ""Segoe UI"", Tahoma, Geneva, Verdana, sans-serif;'>

    <table width='100%' cellpadding='0' cellspacing='0' style='background-color:#fff5f0; padding:30px 20px;'>
        <tr>
            <td align='center'>

                <table width='600' cellpadding='0' cellspacing='0' style='background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 20px rgba(248,86,6,0.15);'>
                    
                    <!-- Compact Header with Orange Theme -->
                    <tr>
                        <td style='background: linear-gradient(135deg, #F85606 0%, #FF2E00 100%); padding:25px 30px; text-align:center;'>
                            <div style='display:inline-block; background:rgba(255,255,255,0.15); width:60px; height:60px; border-radius:50%; line-height:60px; margin-bottom:10px; border:2px solid rgba(255,255,255,0.3);'>
                                <span style='font-size:30px;'>🚢</span>
                            </div>
                            <h1 style='margin:0; color:#ffffff; font-size:26px; font-weight:700; letter-spacing:2px;'>
                                PRIME SHIP UK
                            </h1>
                            <p style='margin:5px 0 0; color:rgba(255,255,255,0.9); font-size:12px;'>Your Trusted Wholesale Partner</p>
                        </td>
                    </tr>

                    <!-- Compact Body -->
                    <tr>
                        <td style='padding:30px 35px; color:#2c3e50; font-size:15px; line-height:1.6;'>

                            <h2 style='margin:0 0 15px; font-weight:600; color:#F85606; font-size:20px;'>Verify Your Account</h2>

                            <p style='margin:0 0 12px;'>Dear <strong>{(string.IsNullOrEmpty(user.Name) ? user.UserName : user.Name)}</strong>,</p>

                            <p style='margin:0 0 18px;'>
                                Welcome to Prime Ship UK! Please verify your email to access our wholesale marketplace.
                            </p>

                            <!-- CTA Button -->
                            <table width='100%' cellpadding='0' cellspacing='0' style='margin:25px 0;'>
                                <tr>
                                    <td align='center'>
                                        <a href='{verificationLink}' 
                                           style='background: linear-gradient(135deg, #F85606 0%, #FF2E00 100%);
                                                  color:#ffffff; 
                                                  padding:14px 40px; 
                                                  text-decoration:none; 
                                                  border-radius:6px; 
                                                  font-weight:700; 
                                                  font-size:15px;
                                                  display:inline-block;
                                                  box-shadow: 0 4px 12px rgba(248,86,6,0.3);
                                                  text-transform:uppercase;
                                                  letter-spacing:0.5px;'>
                                            ✓ Verify Email
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style='font-size:12px; color:#7f8c8d; background:#fff9e6; padding:12px; border-radius:5px; margin:0 0 18px; border-left:3px solid #ffc107;'>
                                🔒 This link expires in 24 hours. Didn't sign up? Ignore this email.
                            </p>

                            <p style='margin:0; font-size:14px; color:#2c3e50;'>
                                Kind Regards,<br/>
                                <strong style='color:#F85606;'>Prime Ship UK Team</strong>
                            </p>

                        </td>
                    </tr>

                    <!-- Compact Footer with Orange Theme -->
                    <tr>
                        <td style='background:#F85606; padding:18px 30px; text-align:center;'>
                            <p style='margin:0; font-size:12px; color:rgba(255,255,255,0.95);'>
                                📍 London, UK | 📧 support@primeshipuk.com
                            </p>
                            <p style='margin:8px 0 0; font-size:11px; color:rgba(255,255,255,0.8);'>
                                © {DateTime.UtcNow.Year} Prime Ship UK. All rights reserved.
                            </p>
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>
</html>";
        }
        else if (platformName == "Easy Finora")
        {
            // EASY FINORA - Keep existing green financial theme (DON'T TOUCH)
            emailBody = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
</head>
<body style='margin:0; padding:0; background-color:#f4f6f8; font-family: Arial, Helvetica, sans-serif;'>

    <table width='100%' cellpadding='0' cellspacing='0' style='background-color:#f4f6f8; padding:40px 0;'>
        <tr>
            <td align='center'>

                <table width='600' cellpadding='0' cellspacing='0' style='background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.05);'>
                    
                    <!-- Header -->
                    <tr>
                        <td style='background:{brandColor}; padding:20px 30px; text-align:center;'>
                            <h1 style='margin:0; color:#ffffff; font-size:24px; letter-spacing:1px;'>
                                {platformName}
                            </h1>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style='padding:40px 30px; color:#333333; font-size:15px; line-height:1.6;'>

                            <h2 style='margin-top:0; font-weight:600;'>Confirm Your Email Address</h2>

                            <p>Dear {user.Name},</p>

                            <p>
                                Thank you for registering with <strong>{platformName}</strong>. 
                                To complete your account setup, please confirm your email address by clicking the button below.
                            </p>

                            <table width='100%' cellpadding='0' cellspacing='0' style='margin:30px 0;'>
                                <tr>
                                    <td align='center'>
                                        <a href='{verificationLink}' 
                                           style='background:{brandColor}; 
                                                  color:#ffffff; 
                                                  padding:14px 28px; 
                                                  text-decoration:none; 
                                                  border-radius:5px; 
                                                  font-weight:bold; 
                                                  font-size:15px;
                                                  display:inline-block;'>
                                            Verify Email Address
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style='font-size:13px; color:#666;'>
                                If the button above does not work, please copy and paste the following link into your browser:
                            </p>

                            <p style='word-break:break-all; font-size:12px; color:#888;'>
                                {verificationLink}
                            </p>

                            <hr style='border:none; border-top:1px solid #eee; margin:30px 0;' />

                            <p style='font-size:13px; color:#777;'>
                                If you did not create this account, please ignore this email.
                                This verification link may expire for security reasons.
                            </p>

                            <p style='margin-top:30px;'>
                                Best Regards,<br/>
                                <strong>{platformName} Team</strong>
                            </p>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style='background:#f9fafb; padding:20px 30px; text-align:center; font-size:12px; color:#999;'>
                            © {DateTime.UtcNow.Year} {platformName}. All rights reserved.
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>
</html>";
        }
        else // Smart Store or other platforms
        {
            // SMART STORE - E-commerce Orange Theme
            emailBody = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
</head>
<body style='margin:0; padding:0; background-color:#fff5f0; font-family: Arial, Helvetica, sans-serif;'>

    <table width='100%' cellpadding='0' cellspacing='0' style='background-color:#fff5f0; padding:40px 20px;'>
        <tr>
            <td align='center'>

                <table width='600' cellpadding='0' cellspacing='0' style='background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 3px 15px rgba(255,69,0,0.15);'>
                    
                    <!-- Header -->
                    <tr>
                        <td style='background:linear-gradient(135deg, #ff9900 0%, #ff6600 100%); padding:30px; text-align:center;'>
                            <h1 style='margin:0; color:#ffffff; font-size:28px; font-weight:700; letter-spacing:1.5px;'>
                                🛒 {platformName}
                            </h1>
                            <p style='margin:8px 0 0; color:#ffe6cc; font-size:13px;'>Your Online Shopping Destination</p>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style='padding:40px 35px; color:#333333; font-size:15px; line-height:1.7;'>

                            <h2 style='margin:0 0 18px; font-weight:600; color:#ff6600;'>Verify Your Email</h2>

                            <p>Hello <strong>{user.Name}</strong>,</p>

                            <p>
                                Welcome to <strong>{platformName}</strong>! We're excited to have you join our shopping community.
                            </p>

                            <p>
                                Please verify your email address to unlock your account and start shopping:
                            </p>

                            <table width='100%' cellpadding='0' cellspacing='0' style='margin:30px 0;'>
                                <tr>
                                    <td align='center'>
                                        <a href='{verificationLink}' 
                                           style='background:linear-gradient(135deg, #ff9900 0%, #ff6600 100%);
                                                  color:#ffffff; 
                                                  padding:15px 40px; 
                                                  text-decoration:none; 
                                                  border-radius:25px; 
                                                  font-weight:bold; 
                                                  font-size:15px;
                                                  display:inline-block;
                                                  box-shadow:0 4px 12px rgba(255,102,0,0.3);'>
                                            Verify My Email
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style='font-size:13px; color:#666; margin:25px 0;'>
                                Can't click the button? Copy this link into your browser:
                            </p>

                            <p style='word-break:break-all; font-size:12px; color:#999; background:#fff9f5; padding:12px; border-radius:5px;'>
                                {verificationLink}
                            </p>

                            <hr style='border:none; border-top:1px solid #ffe6cc; margin:30px 0;' />

                            <p style='font-size:13px; color:#777;'>
                                Didn't sign up? You can safely ignore this email.
                            </p>

                            <p style='margin-top:25px;'>
                                Happy Shopping!<br/>
                                <strong style='color:#ff6600;'>{platformName} Team</strong>
                            </p>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style='background:#fff5f0; padding:20px 30px; text-align:center; font-size:12px; color:#999;'>
                            © {DateTime.UtcNow.Year} {platformName}. All rights reserved.
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>

</body>
</html>";
        }



        // Platform-specific email subjects
        string emailSubject;
        if (platformName == "Prime Ship")
        {
            emailSubject = "🚢 Verify Your Prime Ship UK Account - Wholesale Access Awaits";
        }
        else if (platformName == "Easy Finora")
        {
            emailSubject = "Action Required: Verify Your Easy Finora Account";
        }
        else
        {
            emailSubject = $"Verify Your {platformName} Account";
        }

        await SendEmailWithCustomSmtp(
            await SettingManager.GetSettingValueAsync("Abp.Net.Mail.Smtp.Host") ?? "smtp.azurecomm.net",
            int.Parse(await SettingManager.GetSettingValueAsync("Abp.Net.Mail.Smtp.Port") ?? "587"),
            await SettingManager.GetSettingValueAsync("Abp.Net.Mail.Smtp.UserName"),
            await SettingManager.GetSettingValueAsync("Abp.Net.Mail.Smtp.Password"),
            platformName,
            null, // senderAddress will be determined inside SendEmailWithCustomSmtp based on platformName
            user.EmailAddress,
            emailSubject,
            emailBody
        );
    }

    [HttpPost]
    public async Task RegisterSeller(string email)
    {
        await RegisterPrimeShipSeller(new RegisterPrimeShipInput 
        { 
            EmailAddress = email, 
            Password = "DefaultPassword123!", // Legacy support
            Country = "United Kingdom",
            PhoneNumber = "0000000000"
        });
    }

    [HttpPost]
    public async Task RegisterSmartStoreSeller(RegisterSmartStoreInput input)
    {
        await RegisterPlatformUser(input.EmailAddress, 1, StaticRoleNames.Tenants.Supplier, "Seller", "Smart Store", "SS", "#ff9900", input.Password, input.Country, input.PhoneNumber, input.FullName);
    }

    [HttpPost]
    public async Task RegisterSmartStoreCustomer(RegisterSmartStoreInput input)
    {
        await RegisterPlatformUser(input.EmailAddress, 1, StaticRoleNames.Tenants.Buyer, "Customer", "Smart Store", "SS", "#ff9900", input.Password, input.Country, input.PhoneNumber, input.FullName);
    }

    [HttpPost]
    public async Task RegisterPrimeShipSeller(RegisterPrimeShipInput input)
    {
        await RegisterPlatformUser(input.EmailAddress, 2, StaticRoleNames.Tenants.Supplier, "Seller", "Prime Ship UK", "PS", "#f85606", input.Password, input.Country, input.PhoneNumber, input.FullName);
    }

    [HttpPost]
    public async Task RegisterPrimeShipCustomer(RegisterPrimeShipInput input)
    {
        await RegisterPlatformUser(input.EmailAddress, 2, StaticRoleNames.Tenants.Reseller, "Customer", "Prime Ship UK", "PS", "#f85606", input.Password, input.Country, input.PhoneNumber, input.FullName);
    }

    [HttpPost]
    public async Task RegisterGlobalPayUser(RegisterGlobalPayInput input)
    {
        await RegisterPlatformUser(input.EmailAddress, 3, StaticRoleNames.Tenants.Reseller, "User", "Easy Finora", "GP", "#28a745", input.Password, input.Country, input.PhoneNumber, input.FullName);
    }


    [HttpPost]
    public async Task SendSampleEmail()
    {
        const string toEmail = "noshahidevelopersinc@gmail.com";

        Logger.Info($"SendSampleEmail: Start sending sample email to {toEmail}. TenantId={AbpSession.TenantId}");

        var fromEmail = await SettingManager.GetSettingValueAsync("Abp.Net.Mail.DefaultFromAddress") ?? "no-reply@smartstoreus.com";

        await SendEmailWithCustomSmtp(
            await SettingManager.GetSettingValueAsync("Abp.Net.Mail.Smtp.Host") ?? "smtp.azurecomm.net",
            587,
            await SettingManager.GetSettingValueAsync("Abp.Net.Mail.Smtp.UserName"),
            await SettingManager.GetSettingValueAsync("Abp.Net.Mail.Smtp.Password"),
            "Easy Finora",
            fromEmail,
            toEmail,
            "Sample Email (Easy Finora Register)",
            "<div style='font-family: Arial, sans-serif;'>Sample email from backend API.</div>"
        );

        Logger.Info($"SendSampleEmail: Completed send attempt to {toEmail}.");
    }

    private async Task RegisterPlatformUser(string email, int tenantId, string roleName, string userType, string platformName, string prefix, string brandColor, string password = "Noshahi.000", string country = null, string phoneNumber = null, string fullName = null)
    {
        // Split FullName into Name and Surname for ABP User entity
        string name = fullName ?? userType;
        string surname = "User";

        if (!string.IsNullOrEmpty(fullName))
        {
            var parts = fullName.Trim().Split(' ', 2);
            if (parts.Length > 1)
            {
                name = parts[0];
                surname = parts[1];
            }
            else
            {
                name = parts[0];
            }
        }
        using (CurrentUnitOfWork.SetTenantId(tenantId))
        using (CurrentUnitOfWork.DisableFilter(AbpDataFilters.MayHaveTenant, AbpDataFilters.MustHaveTenant))
        {
            string userName = $"{prefix}_{email}";

            // 1. Check if user already exists in this platform/tenant context
            var user = await _userManager.FindByNameAsync(userName);
            
            if (user == null)
            {
                // Create new user
                user = await _userRegistrationManager.RegisterAsync(
                    name,
                    surname,
                    email,
                    userName,
                    password,
                    false,
                    phoneNumber,
                    country
                );
            }
            else
            {
                Logger.Info($"Platform user {userName} already exists. Resending verification email.");
            }

            // Ensure user is active (Verification is handled by email link, but we set Active true for troubleshooting)
            user.IsActive = true;
            await _userManager.UpdateAsync(user);

            // 2. Ensure Role exists for this tenant before assigning
            var role = await RoleManager.RoleExistsAsync(roleName);
            if (!role)
            {
                Logger.Info($"Role {roleName} not found for tenant {tenantId}. Creating it now.");
                var newRole = new Elicom.Authorization.Roles.Role(tenantId, roleName, roleName) { IsStatic = true };
                await RoleManager.CreateAsync(newRole);
            }

            // Set/Update roles within the tenant context
            var currentRoles = await _userManager.GetRolesAsync(user);
            if (!currentRoles.Contains(roleName))
            {
                await _userManager.AddToRoleAsync(user, roleName);
                Logger.Info($"Assigned role {roleName} to user {userName}");
            }

            // 3. Send Verification Email (Wrapped in try-catch to prevent registration failure on email error)
            try
            {
                await SendVerificationEmail(user, platformName, brandColor);
            }
            catch (Exception emailEx)
            {
                Logger.Error($"Registration succeeded but verification email failed for {email}: {emailEx.Message}");
                // We DON'T throw here, so the user registration still completes.
            }
        }
    }

    private async Task SendEmailWithCustomSmtp(string host, int port, string user, string pass, string fromName, string fromEmail, string to, string subject, string body)
    {
        // ---------------------------------------------------------
        // AZURE COMMUNICATION SERVICES (ACS) INTEGRATION - FIXED
        // ---------------------------------------------------------
        
        // 1. Determine Sender Email based on platformName (fromName) or fallback
        string senderEmail = "DoNotReply@smartstoreus.com"; // Default fallback

        if (!string.IsNullOrEmpty(fromName))
        {
            if (fromName.Contains("Easy Finora"))
            {
                senderEmail = "DoNotReply@easyfinora.com";
            }
            else if (fromName.Contains("Prime Ship") || fromName.Contains("Primeship") || fromName.Contains("Smart Store"))
            {
                senderEmail = "DoNotReply@primeshipuk.com";
            }
        }
        else if (!string.IsNullOrEmpty(fromEmail) && (fromEmail.Contains("easyfinora.com") || fromEmail.Contains("globalpay")))
        {
            senderEmail = "DoNotReply@easyfinora.com";
        }
        else if (!string.IsNullOrEmpty(fromEmail) && fromEmail.Contains("primeship"))
        {
            senderEmail = "DoNotReply@primeshipuk.com";
        }

        Logger.Info($"[ACS] Starting email send to {to}. Platform: {fromName}. Sender: {senderEmail}");

        // 2. Get the ACS Connection String directly from Configuration (bypass DB legacy SMTP settings)
        //    We utilize the "Abp.Net.Mail.Smtp.Password" key from appsettings.json as the ACS Key
        string acsKey = _configuration["App:Settings:Abp.Net.Mail.Smtp.Password"]; 
        
        // If not found there, try the flat structure if that's how it is loaded (ABP behavior varies)
        if (string.IsNullOrEmpty(acsKey))
        {
             acsKey = _configuration["Settings:Abp.Net.Mail.Smtp.Password"];
        }

        // Fallback to the argument `pass` ONLY if it looks like a connection string, otherwise rely on the Config
        string connectionString;
        if (!string.IsNullOrEmpty(pass) && pass.StartsWith("endpoint="))
        {
             connectionString = pass;
             Logger.Info("[ACS] Using Connection String passed in arguments.");
        }
        else if (!string.IsNullOrEmpty(acsKey))
        {
             // Construct connection string standard format
             connectionString = $"endpoint=https://comm-elicom-prod.unitedstates.communication.azure.com/;accesskey={acsKey}";
             Logger.Info("[ACS] Using Connection String constructed from appsettings.json Key.");
        }
        else
        {
             // Last resort fallback (likely to fail if DB has garbage)
             connectionString = $"endpoint=https://comm-elicom-prod.unitedstates.communication.azure.com/;accesskey={pass}";
             Logger.Warn("[ACS] ⚠️ Configuration key not found. Falling back to argument password (potential risk if legacy).");
        }


        try
        {
            var emailClient = new EmailClient(connectionString);
            
            var emailMessage = new EmailMessage(
                senderAddress: senderEmail,
                recipientAddress: to,
                content: new EmailContent(subject)
                {
                    Html = body
                }
            );

            Logger.Info($"[ACS] Sending email via Azure Communication Services...");
            
            var emailSendOperation = await emailClient.SendAsync(WaitUntil.Completed, emailMessage);
            
            Logger.Info($"[ACS] ✅ Email sent successfully to {to} from {fromEmail}. OpId: {emailSendOperation.Id}");
        }
        catch (RequestFailedException ex)
        {
            Logger.Error($"[ACS] ❌ Azure Request Failed. ErrorCode: {ex.ErrorCode}. Message: {ex.Message}");
            
            if (ex.ErrorCode == "DomainNotLinked")
            {
                throw new UserFriendlyException($"Configuration Error: The domain '{fromEmail}' is not linked to the configured ACS Resource. Please verify the domain in Azure or check 'appsettings.json' keys.");
            }
            throw new UserFriendlyException($"Could not send verification email (ACS Error): {ex.Message}");
        }
        catch (Exception ex)
        {
            Logger.Error($"[ACS] ❌ General Exception while sending email to {to}", ex);
            throw new UserFriendlyException($"Could not send verification email: {ex.Message}");
        }
    }
    
    private int min(int a, int b) => a < b ? a : b;


    [HttpPost]
    public async Task ForgotPassword(string email)
    {
        int tenantId = AbpSession.TenantId ?? 1;
        using (CurrentUnitOfWork.SetTenantId(tenantId))
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null) 
            {
                Logger.Warn($"ForgotPassword: User not found for email {email} in tenant {tenantId}");
                return;
            }

            Logger.Info($"ForgotPassword: Generating reset token for {email}");
            var serverRootAddress = (await SettingManager.GetSettingValueAsync("App.ServerRootAddress"))?.TrimEnd('/');
            if (string.IsNullOrEmpty(serverRootAddress)) serverRootAddress = "http://localhost:44311";

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var resetLink = $"{serverRootAddress}/api/services/app/Account/ShowResetPasswordPage?userId={user.Id}&token={Uri.EscapeDataString(token)}";

            var emailBody = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f4f7f6;'>
                    <div style='text-align: center; padding-bottom: 20px;'>
                        <h2 style='color: #d9534f; font-weight: bold;'>Prime Ship UK</h2>
                        <h3 style='color: #333;'>Password Reset Request</h3>
                    </div>
                    <div style='background-color: #ffffff; padding: 40px; border-radius: 12px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border-top: 4px solid #d9534f;'>
                        <p style='font-size: 16px; color: #555; line-height: 1.6;'>
                            We received a request to reset your password. If you didn't make this request, you can safely ignore this email.
                        </p>
                        <div style='margin: 35px 0;'>
                            <a href='{resetLink}' 
                               style='background-color: #d9534f; color: #ffffff; padding: 18px 35px; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 18px; display: inline-block;'>
                               RESET MY PASSWORD
                            </a>
                        </div>
                        <p style='font-size: 14px; color: #888;'>
                            For security reasons, this link will expire in 24 hours.
                        </p>
                    </div>
                    <div style='text-align: center; margin-top: 30px; color: #aaa; font-size: 12px;'>
                        If you're having trouble clicking the button, copy and paste this URL into your web browser:<br>
                        <a href='{resetLink}' style='color: #d9534f; word-break: break-all;'>{resetLink}</a>
                    </div>
                </div>";

            // 5. Send Platform-Specific Email (ACS ONLY)
            string host = await SettingManager.GetSettingValueAsync("Abp.Net.Mail.Smtp.Host") ?? "smtp.azurecomm.net";
            string userSmtp = await SettingManager.GetSettingValueAsync("Abp.Net.Mail.Smtp.UserName");
            string passSmtp = await SettingManager.GetSettingValueAsync("Abp.Net.Mail.Smtp.Password");

            if (tenantId == 3 || tenantId == 4) // Easy Finora
            {
                await SendEmailWithCustomSmtp(
                    host,
                    587,
                    userSmtp,
                    passSmtp,
                    "Easy Finora",
                    "no-reply@easyfinora.com",
                    email,
                    "Reset Your Easy Finora Password",
                    emailBody
                );
            }
            else if (tenantId == 2) // Prime Ship
            {
                 await SendEmailWithCustomSmtp(
                    host,
                    587,
                    userSmtp,
                    passSmtp,
                    "Prime Ship UK",
                    "no-reply@primeshipuk.com",
                    email,
                    "Reset Your Prime Ship Password",
                    emailBody
                );
            }
            else // Default (Smart Store or other)
            {
                await SendEmailWithCustomSmtp(
                    host,
                    587,
                    userSmtp,
                    passSmtp,
                    "Smart Store",
                    "no-reply@smartstoreus.com",
                    email,
                    "Reset Your Password",
                    emailBody
                );
            }
            Logger.Info($"ForgotPassword: Email sent to {email}");
        }
    }

    [HttpGet]
    public ContentResult ShowResetPasswordPage(long userId, string token)
    {
        // This is a simple HTML page to collect the new password
        return new ContentResult
        {
            ContentType = "text/html",
            Content = $@"
                <html>
                    <body style='font-family: sans-serif; display: flex; justify-content: center; padding-top: 100px; background-color: #f4f7f6;'>
                        <div style='background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); width: 350px;'>
                            <h2 style='text-align: center; color: #333;'>Reset Password</h2>
                            <p style='font-size: 14px; color: #666; margin-bottom: 25px;'>Please enter your new password below.</p>
                            <input type='password' id='newPass' placeholder='New Password' style='width: 100%; padding: 12px; margin-bottom: 20px; border: 1px solid #ddd; border-radius: 6px;'>
                            <button onclick='submitReset()' style='width: 100%; padding: 12px; background: #d9534f; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;'>Update Password</button>
                            <div id='msg' style='margin-top: 15px; text-align: center; font-size: 14px;'></div>
                        </div>
                        <script>
                            async function submitReset() {{
                                const pass = document.getElementById('newPass').value;
                                if (!pass) {{ alert('Please enter a password'); return; }}
                                
                                const response = await fetch('/api/services/app/Account/ResetPassword', {{
                                    method: 'POST',
                                    headers: {{ 'Content-Type': 'application/json' }},
                                    body: JSON.stringify({{ userId: {userId}, token: '{token}', newPassword: pass }})
                                }});
                                
                                if (response.ok) {{
                                    document.getElementById('msg').innerHTML = '<span style=""color: green"">Password updated! Redirecting...</span>';
                                    setTimeout(() => window.location.href = '/account/login', 2000);
                                }} else {{
                                    document.getElementById('msg').innerHTML = '<span style=""color: red"">Error resetting password. Link might be expired.</span>';
                                }}
                            }}
                        </script>
                    </body>
                </html>"
        };
    }

    [HttpPost]
    public async Task ResetPassword(ResetPasswordInput input)
    {
        var user = await _userManager.FindByIdAsync(input.UserId.ToString());
        if (user == null) throw new UserFriendlyException("User not found");

        var result = await _userManager.ResetPasswordAsync(user, input.Token, input.NewPassword);
        if (!result.Succeeded)
        {
            throw new UserFriendlyException("Failed to reset password: " + string.Join(", ", result.Errors.Select(e => e.Description)));
        }
    }
}
