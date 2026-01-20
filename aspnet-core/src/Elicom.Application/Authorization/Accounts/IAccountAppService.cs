using Abp.Application.Services;
using Elicom.Authorization.Accounts.Dto;
using System.Threading.Tasks;

namespace Elicom.Authorization.Accounts;

public interface IAccountAppService : IApplicationService
{
    Task<IsTenantAvailableOutput> IsTenantAvailable(IsTenantAvailableInput input);

    Task<RegisterOutput> Register(RegisterInput input);

    Task RegisterSeller(string email);

    Task<Microsoft.AspNetCore.Mvc.ContentResult> VerifyEmail(long userId, string token, string platform = "Prime Ship");

    Task ForgotPassword(string email);

    Task ResetPassword(ResetPasswordInput input);

    Task RegisterSmartStoreSeller(string email);
    Task RegisterSmartStoreCustomer(string email);

    Task RegisterPrimeShipSeller(string email);
    Task RegisterPrimeShipCustomer(string email);

    Task RegisterGlobalPayUser(string email);
}
