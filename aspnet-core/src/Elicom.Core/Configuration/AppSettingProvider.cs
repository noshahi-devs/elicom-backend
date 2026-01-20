using Abp.Configuration;
using System.Collections.Generic;

namespace Elicom.Configuration;

public class AppSettingProvider : SettingProvider
{
    public override IEnumerable<SettingDefinition> GetSettingDefinitions(SettingDefinitionProviderContext context)
    {
        return new[]
        {
            new SettingDefinition(AppSettingNames.UiTheme, "red", scopes: SettingScopes.Application | SettingScopes.Tenant | SettingScopes.User, clientVisibilityProvider: new VisibleSettingClientVisibilityProvider()),
            
            // SMTP Settings (Direct Defaults)
            new SettingDefinition("Abp.Net.Mail.DefaultFromAddress", "no-reply@primeshipuk.com"),
            new SettingDefinition("Abp.Net.Mail.DefaultFromDisplayName", "Prime Ship UK"),
            new SettingDefinition("Abp.Net.Mail.Smtp.Host", "primeshipuk.com"),
            new SettingDefinition("Abp.Net.Mail.Smtp.Port", "465"),
            new SettingDefinition("Abp.Net.Mail.Smtp.UserName", "no-reply@primeshipuk.com"),
            new SettingDefinition("Abp.Net.Mail.Smtp.Password", "xB}Q]@saOI^K"),
            new SettingDefinition("Abp.Net.Mail.Smtp.Domain", ""),
            new SettingDefinition("Abp.Net.Mail.Smtp.EnableSsl", "true"),
            new SettingDefinition("Abp.Net.Mail.Smtp.UseDefaultCredentials", "false")
        };
    }
}
