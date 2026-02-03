using Abp.Auditing;
using Elicom.Sessions.Dto;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Elicom.Sessions;

public class SessionAppService : ElicomAppServiceBase, ISessionAppService
{
    [DisableAuditing]
    public async Task<GetCurrentLoginInformationsOutput> GetCurrentLoginInformations()
    {
        var output = new GetCurrentLoginInformationsOutput
        {
            Application = new ApplicationInfoDto
            {
                Version = AppVersionHelper.Version,
                ReleaseDate = AppVersionHelper.ReleaseDate,
                Features = new Dictionary<string, bool>()
            }
        };

        if (AbpSession.TenantId.HasValue)
        {
            output.Tenant = ObjectMapper.Map<TenantLoginInfoDto>(await GetCurrentTenantAsync());
        }

        if (AbpSession.UserId.HasValue)
        {
            var user = await GetCurrentUserAsync();
            output.User = ObjectMapper.Map<UserLoginInfoDto>(user);

            var roles = await UserManager.GetRolesAsync(user);
            output.User.RoleNames = roles.ToArray();
        }

        return output;
    }
}
