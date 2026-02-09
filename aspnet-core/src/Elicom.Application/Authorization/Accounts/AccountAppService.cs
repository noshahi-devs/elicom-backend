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

    public AccountAppService(
        UserRegistrationManager userRegistrationManager,
        IEmailSender emailSender,
        UserManager userManager)
    {
        _userRegistrationManager = userRegistrationManager;
        _emailSender = emailSender;
        _userManager = userManager;
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
                if (platform == "Prime Ship") clientRootAddressSetting = "App.PrimeShip.ClientRootAddress";
                if (platform == "Easy Finora" || platform == "Global Pay") clientRootAddressSetting = "App.EasyFinora.ClientRootAddress";

                var clientRootAddress = (await SettingManager.GetSettingValueAsync(clientRootAddressSetting))?.TrimEnd('/');
                if (string.IsNullOrEmpty(clientRootAddress)) clientRootAddress = "http://localhost:4200";

                string redirectPath = $"{clientRootAddress}/account/login";
                if (platform == "Smart Store") redirectPath = $"{clientRootAddress}/smartstore/login";
                if (platform == "Prime Ship") redirectPath = $"{clientRootAddress}/primeship/login";
                if (platform == "Easy Finora" || platform == "Global Pay") redirectPath = $"{clientRootAddress}/auth";

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

        if (AbpSession.TenantId == 3)
        {
            await SendVerificationEmail(user, "Easy Finora", "#1de016");
        }

        return new RegisterOutput
        {
            CanLogin = user.IsActive && user.IsEmailConfirmed
        };
    }

    private async Task SendVerificationEmail(User user, string platformName, string brandColor)
    {
        var serverRootAddress = (await SettingManager.GetSettingValueAsync("App.ServerRootAddress"))?.TrimEnd('/');
        if (string.IsNullOrEmpty(serverRootAddress)) serverRootAddress = "http://localhost:44311";

        var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
        var verificationLink = $"{serverRootAddress}/api/services/app/Account/VerifyEmail?userId={user.Id}&token={Uri.EscapeDataString(token)}&platform={Uri.EscapeDataString(platformName)}";

        var emailBody = $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #ffffff;'>
                <div style='text-align: center; border-bottom: 2px solid {brandColor}; padding-bottom: 15px;'>
                    <h1 style='color: #333; margin: 0;'>{platformName.ToUpper()}</h1>
                </div>
                <div style='padding: 30px; line-height: 1.6; color: #333;'>
                    <h2>Welcome to {platformName}!</h2>
                    <p>Hi <b>{user.Name}</b>,</p>
                    <p>You've successfully registered on {platformName}.</p>
                    <div style='text-align: center; margin: 35px 0;'>
                        <a href='{verificationLink}' style='background-color: {brandColor}; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 18px;'>
                            VERIFY MY ACCOUNT
                        </a>
                    </div>
                </div>
            </div>";

        await SendEmailWithCustomSmtp(
            await SettingManager.GetSettingValueAsync("Abp.Net.Mail.Smtp.Host") ?? "smtp.azurecomm.net",
            int.Parse(await SettingManager.GetSettingValueAsync("Abp.Net.Mail.Smtp.Port") ?? "587"),
            await SettingManager.GetSettingValueAsync("Abp.Net.Mail.Smtp.UserName"),
            await SettingManager.GetSettingValueAsync("Abp.Net.Mail.Smtp.Password"),
            platformName,
            await SettingManager.GetSettingValueAsync("Abp.Net.Mail.DefaultFromAddress") ?? $"no-reply@{platformName.Replace(" ", "").ToLower()}.com",
            user.EmailAddress,
            $"Action Required: Verify Your {platformName} Account",
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
        await RegisterPlatformUser(input.EmailAddress, 1, StaticRoleNames.Tenants.Reseller, "Seller", "Smart Store", "SS", "#ff9900", input.Password, input.Country, input.PhoneNumber, input.FullName);
    }

    [HttpPost]
    public async Task RegisterSmartStoreCustomer(RegisterSmartStoreInput input)
    {
        await RegisterPlatformUser(input.EmailAddress, 1, StaticRoleNames.Tenants.Buyer, "Customer", "Smart Store", "SS", "#ff9900", input.Password, input.Country, input.PhoneNumber, input.FullName);
    }

    [HttpPost]
    public async Task RegisterPrimeShipSeller(RegisterPrimeShipInput input)
    {
        await RegisterPlatformUser(input.EmailAddress, 2, StaticRoleNames.Tenants.Supplier, "Seller", "Prime Ship", "PS", "#007bff", input.Password, input.Country, input.PhoneNumber, input.FullName);
    }

    [HttpPost]
    public async Task RegisterPrimeShipCustomer(RegisterPrimeShipInput input)
    {
        await RegisterPlatformUser(input.EmailAddress, 2, StaticRoleNames.Tenants.Reseller, "Customer", "Prime Ship", "PS", "#007bff", input.Password, input.Country, input.PhoneNumber, input.FullName);
    }

    [HttpPost]
    public async Task RegisterGlobalPayUser(RegisterGlobalPayInput input)
    {
        await RegisterPlatformUser(input.EmailAddress, 3, StaticRoleNames.Tenants.Reseller, "User", "Global Pay", "GP", "#28a745", input.Password, input.Country, input.PhoneNumber, input.FullName);
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
            "Global Pay",
            fromEmail,
            toEmail,
            "Sample Email (Global Pay UK Register)",
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

            // Ensure user is inactive until verified
            user.IsActive = false;
            await _userManager.UpdateAsync(user);

            // Set/Update roles within the tenant context
            var currentRoles = await _userManager.GetRolesAsync(user);
            if (!currentRoles.Contains(roleName))
            {
                await _userManager.AddToRoleAsync(user, roleName);
            }

            var serverRootAddress = (await SettingManager.GetSettingValueAsync("App.ServerRootAddress"))?.TrimEnd('/');
            if (string.IsNullOrEmpty(serverRootAddress)) serverRootAddress = "http://localhost:44311";

            var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            
            var verificationLink = $"{serverRootAddress}/api/services/app/Account/VerifyEmail?userId={user.Id}&token={Uri.EscapeDataString(token)}&platform={Uri.EscapeDataString(platformName)}";

            var emailBody = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #ffffff;'>
                    <div style='text-align: center; border-bottom: 2px solid {brandColor}; padding-bottom: 15px;'>
                        <h1 style='color: #333; margin: 0;'>{platformName.ToUpper()}</h1>
                    </div>
                    <div style='padding: 30px; line-height: 1.6; color: #333;'>
                        <h2>Welcome to {platformName}!</h2>
                        <p>Hi <b>{name}</b>,</p>
                        <p>You've successfully registered as a <b>{userType}</b> on {platformName}.</p>
                        <p style='background-color: #f8f9fa; padding: 10px; border-radius: 4px; border-left: 4px solid {brandColor};'>
                        <b>Username:</b> <code>{email}</code><br>
                        <b>Password:</b> <code>{(password == "Noshahi.000" ? password : "Your chosen password")}</code>
                    </p>
                        <div style='text-align: center; margin: 35px 0;'>
                            <a href='{verificationLink}' style='background-color: {brandColor}; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 18px;'>
                                VERIFY MY ACCOUNT
                            </a>
                        </div>
                    </div>
                </div>";

            // 5. Send Platform-Specific Email (ACS ONLY)
            // We use global SMTP settings for ACS since it's a single account,
            // but we use platform-specific sender logic to satisfy domain verification.
            string host = await SettingManager.GetSettingValueAsync("Abp.Net.Mail.Smtp.Host") ?? "smtp.azurecomm.net";
            int port = int.Parse(await SettingManager.GetSettingValueAsync("Abp.Net.Mail.Smtp.Port") ?? "587");
            string userSmtp = await SettingManager.GetSettingValueAsync("Abp.Net.Mail.Smtp.UserName");
            string passSmtp = await SettingManager.GetSettingValueAsync("Abp.Net.Mail.Smtp.Password");
            
            // Default from address based on platform if not explicitly set globally
            string fromEmail = await SettingManager.GetSettingValueAsync("Abp.Net.Mail.DefaultFromAddress");
            if (string.IsNullOrEmpty(fromEmail))
            {
                fromEmail = $"no-reply@{platformName.Replace(" ", "").ToLower()}.com";
                if (platformName == "Easy Finora" || platformName == "Global Pay") fromEmail = "DoNotReply@easyfinora.com";
                if (platformName == "Smart Store") fromEmail = "DoNotReply@smartstoreus.com";
            }

            await SendEmailWithCustomSmtp(
                host,
                port,
                userSmtp,
                passSmtp,
                platformName,
                fromEmail,
                email,
                $"Action Required: Verify Your {platformName} Account",
                emailBody
            );
        }
    }

    private async Task SendEmailWithCustomSmtp(string host, int port, string user, string pass, string fromName, string fromEmail, string to, string subject, string body)
    {
        // Azure Communication Services Integration (Exclusively)
        // Standard SMTP fallbacks have been removed as per user requirement.
        
        // Ensure strictly verified domains for ACS
        if (fromEmail.Contains("easyfinora.com") || fromEmail.Contains("globalpay"))
        {
            fromEmail = "DoNotReply@easyfinora.com";
        }
        else if (fromEmail.Contains("primeship") || fromEmail.Contains("smartstore"))
        {
            fromEmail = "DoNotReply@smartstoreus.com";
        }

        Logger.Info($"[ACS] Starting email send to {to} from {fromEmail} using Azure Communication Services SDK");
        
        try
        {
            // Use Access Key from pass and build connection string if not already one
            string connectionString;
            if (pass != null && pass.StartsWith("endpoint="))
            {
                connectionString = pass;
            }
            else
            {
                // Default prod endpoint if only access key is provided
                connectionString = $"endpoint=https://comm-elicom-prod.unitedstates.communication.azure.com/;accesskey={pass}";
            }
            
            Logger.Info($"[ACS] Initializing EmailClient...");
            var emailClient = new EmailClient(connectionString);
            
            var emailMessage = new EmailMessage(
                senderAddress: fromEmail,
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
        catch (Exception ex)
        {
            Logger.Error($"[ACS] ❌ Exception while sending email to {to}", ex);
        }
    }


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

            if (tenantId == 3) // Global Pay / Easy Finora
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
