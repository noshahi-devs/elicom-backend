using Abp.AspNetCore.Dependency;
using Abp.Dependency;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using Elicom.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using Microsoft.Extensions.Configuration;

namespace Elicom.Web.Host.Startup
{
    public class Program
    {
        public static void Main(string[] args)
        {
            System.Console.WriteLine(">>> Application starting...");
            var envName = System.Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
            System.Console.WriteLine($">>> Environment: {envName}");
            System.Console.WriteLine($">>> Current Directory: {System.IO.Directory.GetCurrentDirectory()}");

            try 
            {
                var host = CreateHostBuilder(args).Build();
                var config = host.Services.GetRequiredService<Microsoft.Extensions.Configuration.IConfiguration>();
                var connString = config.GetConnectionString("Default");
                System.Console.WriteLine($">>> Connection String Found: {!string.IsNullOrEmpty(connString)}");
                if (!string.IsNullOrEmpty(connString)) {
                    System.Console.WriteLine($">>> Connection String Length: {connString.Length}");
                    System.Console.WriteLine($">>> Connection String Start: {connString.Substring(0, Math.Min(20, connString.Length))}...");
                }
                
                using (var scope = host.Services.CreateScope())
                {
                    try
                    {
                        // var context = scope.ServiceProvider.GetRequiredService<ElicomDbContext>();
                        // context.Database.Migrate();
                    }
                    catch (System.Exception ex)
                    {
                        var logger = scope.ServiceProvider.GetRequiredService<Microsoft.Extensions.Logging.ILogger<Program>>();
                        logger.LogCritical(ex, "An error occurred while migrating the database.");
                    }
                }

                host.Run();
            }
            catch (System.Exception ex)
            {
                System.Console.WriteLine($">>> FATAL ERROR IN MAIN: {ex}");
                throw;
            }
        }

        internal static IHostBuilder CreateHostBuilder(string[] args) =>
            Microsoft.Extensions.Hosting.Host.CreateDefaultBuilder(args)
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseStartup<Startup>();
                })
                .UseCastleWindsor(IocManager.Instance.IocContainer);
    }
}
