using Abp.Application.Services;
using Elicom.Authorization.Accounts.Dto;
using System.Threading.Tasks;

namespace Elicom.Authorization.Accounts;

public interface IAccountAppService : IApplicationService
{
    Task<IsTenantAvailableOutput> IsTenantAvailable(IsTenantAvailableInput input);

    Task<RegisterOutput> Register(RegisterInput input);
}
