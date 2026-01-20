using Abp.Authorization.Users;
using Abp.Net.Mail;
using Abp.Runtime.Caching;
using Abp.UI;
using Elicom.Authorization.Accounts.Dto;
using Elicom.Authorization.Users;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;
using System.Threading.Tasks;

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

    public async Task<RegisterOutput> Register(RegisterInput input)
    {
        var user = await _userRegistrationManager.RegisterAsync(
            input.Name,
            input.Surname,
            input.EmailAddress,
            input.UserName,
            input.Password,
            true // Assumed email address is always confirmed. Change this if you want to implement email confirmation.
        );

        return new RegisterOutput
        {
            CanLogin = user.IsActive && user.IsEmailConfirmed
        };
    }

    [HttpPost]
    public async Task RegisterSeller(string email)
    {
        // For simulation/testing, if no tenant is provided, we use the Default tenant (Id: 1)
        int tenantId = AbpSession.TenantId ?? 1;

        using (CurrentUnitOfWork.SetTenantId(tenantId))
        {
            // 1. Register user as inactive and unconfirmed
            var user = await _userRegistrationManager.RegisterAsync(
                "Seller",
                "User",
                email,
                email, // Username as email
                "Noshahi.000",
                false // Not confirmed yet
            );

            user.IsActive = false; // Keep inactive until verified
            await _userManager.UpdateAsync(user);

            // 2. Generate Verification Token
            var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            
            // 3. Construct Verification Link (Assuming local or configurable frontend URL)
            var verificationLink = $"https://localhost:44311/api/services/app/Account/VerifyEmail?userId={user.Id}&token={Uri.EscapeDataString(token)}";

            // 4. Send Rich HTML Email
            var emailBody = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #f9f9f9;'>
                    <div style='text-align: center; padding-bottom: 20px;'>
                        <h2 style='color: #007bff; font-weight: bold;'>Prime Ship UK</h2>
                        <h3 style='color: #333;'>Verify Your Account</h3>
                        <p style='color: #666;'>Welcome, <b>{email}</b>! Thank you for joining as a Seller.</p>
                    </div>
                    <div style='background-color: #ffffff; padding: 40px; border-radius: 12px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border: 2px solid #007bff;'>
                        <p style='font-size: 18px; color: #444; line-height: 1.6; margin-bottom: 30px;'>
                            Your account has been created with the password <b>Noshahi.000</b>.<br>
                            To complete your registration, please verify your email.
                        </p>
                        <a href='{verificationLink}' 
                           style='background-color: #007bff; color: #ffffff; padding: 18px 40px; text-decoration: none; font-weight: bold; border-radius: 8px; font-size: 20px; display: inline-block; transition: background 0.3s ease;'>
                           CLICK HERE TO VERIFY
                        </a>
                        <p style='margin-top: 35px; font-size: 14px; color: #777;'>
                            If the button above doesn't work, copy and paste this link:<br>
                            <span style='color: #007bff; word-break: break-all;'>{verificationLink}</span>
                        </p>
                    </div>
                    <div style='text-align: center; margin-top: 30px; color: #aaa; font-size: 13px;'>
                        &copy; 2026 Prime Ship UK. A Premium Dropshipping Platform.
                    </div>
                </div>";

            var mail = new System.Net.Mail.MailMessage(
                "no-reply@primeshipuk.com",
                email
            )
            {
                Subject = "Action Required: Verify Your Seller Account",
                Body = emailBody,
                IsBodyHtml = true
            };

            await _emailSender.SendAsync(mail);
        }
    }

    [HttpGet]
    public async Task<ContentResult> VerifyEmail(long userId, string token)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null) throw new UserFriendlyException("User not found");

        var result = await _userManager.ConfirmEmailAsync(user, token);
        if (result.Succeeded)
        {
            user.IsActive = true;
            await _userManager.UpdateAsync(user);

            // Return HTML that redirects to login page
            return new ContentResult
            {
                ContentType = "text/html",
                Content = @"
                    <html>
                        <body style='text-align: center; font-family: sans-serif; padding-top: 100px;'>
                            <h1 style='color: green;'>Account Verified Successfully!</h1>
                            <p>You are being redirected to the login page...</p>
                            <script>
                                setTimeout(function() {
                                    window.location.href = '/account/login';
                                }, 3000);
                            </script>
                        </body>
                    </html>"
            };
        }

        throw new UserFriendlyException("Invalid or expired verification token");
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
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var resetLink = $"https://localhost:44311/api/services/app/Account/ShowResetPasswordPage?userId={user.Id}&token={Uri.EscapeDataString(token)}";

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

            var mail = new System.Net.Mail.MailMessage(
                "no-reply@primeshipuk.com",
                email
            )
            {
                Subject = "Reset Your Prime Ship Password",
                Body = emailBody,
                IsBodyHtml = true
            };

            await _emailSender.SendAsync(mail);
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
