using Abp.AspNetCore;
using Abp.AspNetCore.Mvc.Antiforgery;
using Abp.AspNetCore.SignalR.Hubs;
using Abp.Castle.Logging.Log4Net;
using Abp.Extensions;
using Elicom.Configuration;
using Elicom.Identity;
using Castle.Facilities.Logging;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.OpenApi.Models;
using System;
using System.IO;
using System.Linq;
using System.Reflection;
using Microsoft.AspNetCore.Http; // Added for WriteAsync

namespace Elicom.Web.Host.Startup
{
    public class Startup
    {
        private const string _defaultCorsPolicyName = "localhost";

        private const string _apiVersion = "v1";

        private readonly IConfigurationRoot _appConfiguration;
        private readonly IWebHostEnvironment _hostingEnvironment;

        public Startup(IWebHostEnvironment env)
        {
            _hostingEnvironment = env;
            _appConfiguration = env.GetAppConfiguration();
        }

        public void ConfigureServices(IServiceCollection services)
        {
            //MVC
            services.AddControllersWithViews(options =>
            {
                options.Filters.Add(new AbpAutoValidateAntiforgeryTokenAttribute());
            });

            IdentityRegistrar.Register(services);
            AuthConfigurer.Configure(services, _appConfiguration);

            services.AddSignalR();

            services.AddCors(
                options => options.AddPolicy(
                    _defaultCorsPolicyName,
                    builder =>
                    {
                        var corsOrigins = _appConfiguration["App:CorsOrigins"];
                        var origins = (corsOrigins ?? "")
                            .Split(",", StringSplitOptions.RemoveEmptyEntries)
                            .Select(o => o.RemovePostFix("/"))
                            .ToArray();

                        if (origins.Contains("*") || string.IsNullOrEmpty(corsOrigins))
                        {
                            builder.SetIsOriginAllowed(_ => true);
                        }
                        else
                        {
                            builder.WithOrigins(origins);
                        }

                        builder.AllowAnyHeader()
                            .AllowAnyMethod()
                            .AllowCredentials();
                    }
                )
            );

            // Swagger - Enable this line and the related lines in Configure method to enable swagger UI
            ConfigureSwagger(services);

            // Configure Abp and Dependency Injection
            services.AddAbpWithoutCreatingServiceProvider<ElicomWebHostModule>(
                // Configure Log4Net logging
                options => options.IocManager.IocContainer.AddFacility<LoggingFacility>(
                    f => f.UseAbpLog4Net().WithConfig(_hostingEnvironment.IsDevelopment()
                        ? "log4net.config"
                        : "log4net.Production.config"
                    )
                )
            );
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env, ILoggerFactory loggerFactory)
        {
            // 0. ULTIMATE SAFETY NET: Ensure CORS headers & JSON Error on Crash
            // This catches DB connection errors or other startup crashes that happen before ABP/CORS middleware can handle them gracefully.
            app.Use(async (context, next) =>
            {
                try
                {
                    await next();
                }
                catch (Exception ex)
                {
                    if (context.Response.HasStarted) throw;

                    // 🚀 Log to Console for Azure Log Stream
                    Console.WriteLine($"[SAFETY-NET] CRITICAL CRASH: {ex.GetType().Name} - {ex.Message}");
                    Console.WriteLine(ex.ToString());

                    context.Response.StatusCode = 500;
                    context.Response.ContentType = "application/json";
                    
                    var origin = context.Request.Headers["Origin"].ToString();
                    if (!string.IsNullOrEmpty(origin))
                    {
                        context.Response.Headers["Access-Control-Allow-Origin"] = origin;
                        context.Response.Headers["Access-Control-Allow-Credentials"] = "true";
                        context.Response.Headers["Access-Control-Allow-Headers"] = "Content-Type, X-Requested-With, Authorization, abp-tenantid";
                        context.Response.Headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS";
                    }

                    var msg = (ex.Message ?? "Unknown Error").Replace("\"", "'").Replace("\r", " ").Replace("\n", " ");
                    var details = (ex.InnerException?.Message ?? ex.ToString()).Replace("\"", "'").Replace("\r", " ").Replace("\n", " ");
                    
                    var errorJson = $"{{\"success\":false,\"error\":{{\"message\":\"Critical Server Error (SafetyNet)\",\"details\":\"{msg} | {details}\"}}}}";
                    await context.Response.WriteAsync(errorJson);
                }
            });

            // 1. Sanitize invalid culture cookies FIRST to prevent crashes in any downstream middleware
            app.Use(async (context, next) =>
            {
                if (context.Request.Headers.TryGetValue("Cookie", out var cookies))
                {
                    bool changed = false;
                    var newCookies = cookies.Select(cookie =>
                    {
                        if (string.IsNullOrEmpty(cookie)) return cookie;
                        
                        // If cookie contains markers of known corruption or invalid chars, just drop the culture part
                        if ((cookie.Contains(".AspNetCore.Culture=") || cookie.Contains("Abp.Localization.CultureName=")) &&
                            (cookie.Contains("<") || cookie.Contains(">") || cookie.Contains("d__") || cookie.Contains("\0")))
                        {
                            changed = true;
                            // Regex-less removal for safety
                            var parts = cookie.Split(';').Where(p => 
                                !p.Contains(".AspNetCore.Culture=") && 
                                !p.Contains("Abp.Localization.CultureName="));
                            return string.Join(";", parts);
                        }
                        return cookie;
                    }).ToArray();

                    if (changed)
                    {
                        context.Request.Headers["Cookie"] = newCookies;
                        // Clear the cookies in the response to stop them from being sent back
                        context.Response.Cookies.Delete(".AspNetCore.Culture");
                        context.Response.Cookies.Delete("Abp.Localization.CultureName");
                    }
                }
                await next();
            });

            // 2. CORS must be early to handle OPTIONS requests (preflight) immediately
            app.UseCors(_defaultCorsPolicyName);

            // 3. Initialize ABP
            app.UseAbp(options => { options.UseAbpRequestLocalization = false; }); 

            app.UseStaticFiles();

            app.UseRouting();

            app.UseAuthentication();
            app.UseAuthorization();

            app.UseAbpRequestLocalization();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapHub<AbpCommonHub>("/signalr");
                endpoints.MapControllerRoute("default", "{controller=Home}/{action=Index}/{id?}");
                endpoints.MapControllerRoute("defaultWithArea", "{area}/{controller=Home}/{action=Index}/{id?}");
            });

            // Enable middleware to serve generated Swagger as a JSON endpoint
            app.UseSwagger(c => { c.RouteTemplate = "swagger/{documentName}/swagger.json"; });

            // Enable middleware to serve swagger-ui assets (HTML, JS, CSS etc.)
            app.UseSwaggerUI(options =>
            {
                // specifying the Swagger JSON endpoint.
                options.SwaggerEndpoint($"/swagger/{_apiVersion}/swagger.json", $"Elicom API {_apiVersion}");
                options.IndexStream = () => Assembly.GetExecutingAssembly()
                    .GetManifestResourceStream("Elicom.Web.Host.wwwroot.swagger.ui.index.html");
                options.DisplayRequestDuration(); // Controls the display of the request duration (in milliseconds) for "Try it out" requests.
            }); // URL: /swagger

            // 🚀 IMPORTANT: EF Core Retry strategy has been removed from ElicomDbContextConfigurer to prevent transaction conflicts.
        }

        private void ConfigureSwagger(IServiceCollection services)
        {
            services.AddSwaggerGen(options =>
            {
                options.SwaggerDoc(_apiVersion, new OpenApiInfo
                {
                    Version = _apiVersion,
                    Title = "Elicom API",
                    Description = "Elicom",
                    // uncomment if needed TermsOfService = new Uri("https://example.com/terms"),
                    Contact = new OpenApiContact
                    {
                        Name = "Elicom",
                        Email = string.Empty,
                        Url = new Uri("https://twitter.com/aspboilerplate"),
                    },
                    License = new OpenApiLicense
                    {
                        Name = "MIT License",
                        Url = new Uri("https://github.com/aspnetboilerplate/aspnetboilerplate/blob/dev/LICENSE.md"),
                    }
                });
                options.DocInclusionPredicate((docName, description) => true);

                // Define the BearerAuth scheme that's in use
                options.AddSecurityDefinition("bearerAuth", new OpenApiSecurityScheme()
                {
                    Description =
                        "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
                    Name = "Authorization",
                    In = ParameterLocation.Header,
                    Type = SecuritySchemeType.ApiKey
                });

                //add summaries to swagger
                bool canShowSummaries = _appConfiguration.GetValue<bool>("Swagger:ShowSummaries");
                if (canShowSummaries)
                {
                    var hostXmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
                    var hostXmlPath = Path.Combine(AppContext.BaseDirectory, hostXmlFile);
                    options.IncludeXmlComments(hostXmlPath);

                    var applicationXml = $"Elicom.Application.xml";
                    var applicationXmlPath = Path.Combine(AppContext.BaseDirectory, applicationXml);
                    options.IncludeXmlComments(applicationXmlPath);

                    var webCoreXmlFile = $"Elicom.Web.Core.xml";
                    var webCoreXmlPath = Path.Combine(AppContext.BaseDirectory, webCoreXmlFile);
                    options.IncludeXmlComments(webCoreXmlPath);
                }
            });
        }
    }
}
