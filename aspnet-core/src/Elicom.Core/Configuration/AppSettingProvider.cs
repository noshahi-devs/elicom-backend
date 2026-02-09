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
            
            // SMTP Settings (Azure ACS as Default)
            new SettingDefinition("Abp.Net.Mail.DefaultFromAddress", "DoNotReply@easyfinora.com"),
            new SettingDefinition("Abp.Net.Mail.DefaultFromDisplayName", "Easy Finora"),
            new SettingDefinition("Abp.Net.Mail.Smtp.Host", "smtp.azurecomm.net"),
            new SettingDefinition("Abp.Net.Mail.Smtp.Port", "587"),
            new SettingDefinition("Abp.Net.Mail.Smtp.UserName", "DoNotReply"),
            new SettingDefinition("Abp.Net.Mail.Smtp.Password", ""), // User should provide this in DB
            new SettingDefinition("Abp.Net.Mail.Smtp.Domain", ""),
            new SettingDefinition("Abp.Net.Mail.Smtp.EnableSsl", "true"),
            new SettingDefinition("Abp.Net.Mail.Smtp.UseDefaultCredentials", "false"),

            // App Settings
            new SettingDefinition("App.ServerRootAddress", "https://app-elicom-backend.azurewebsites.net/"),
            new SettingDefinition("App.SmartStore.ClientRootAddress", "https://stapp-elicom-main.azurestaticapps.net/"),
            new SettingDefinition("App.PrimeShip.ClientRootAddress", "https://stapp-elicom-primeship.azurestaticapps.net/"),
            new SettingDefinition("App.EasyFinora.ClientRootAddress", "https://stapp-elicom-easyfinora.azurestaticapps.net/")
        };
    }
}
