using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using System;
using System.Data.Common;

namespace Elicom.EntityFrameworkCore;

public static class ElicomDbContextConfigurer
{
    // Flag to safely disable retries during problematic startup phases (like ABP localization init)
    public static bool EnableRetries { get; set; } = false;

    public static void Configure(DbContextOptionsBuilder<ElicomDbContext> builder, string connectionString)
    {
        builder.UseSqlServer(connectionString, options => 
        {
            options.CommandTimeout(180);
            if (EnableRetries)
            {
                // Configure retry strategy for Azure SQL transient failures
                options.EnableRetryOnFailure(
                    maxRetryCount: 3,
                    maxRetryDelay: TimeSpan.FromSeconds(30),
                    errorNumbersToAdd: new[] { 
                        -2,     // Timeout
                        -1,     // Connection broken
                        2,      // Network error
                        53,     // Could not open connection
                        64,     // Error on server
                        233,    // Connection initialization error
                        10053,  // Transport-level error
                        10054,  // Connection forcibly closed
                        10060,  // Network timeout
                        40197,  // Service error processing request
                        40501,  // Service busy
                        40613   // Database unavailable
                    });
            }
        })
        .ConfigureWarnings(w => w.Ignore(SqlServerEventId.SavepointsDisabledBecauseOfMARS));
    }

    public static void Configure(DbContextOptionsBuilder<ElicomDbContext> builder, DbConnection connection)
    {
        builder.UseSqlServer(connection, options => 
        {
            options.CommandTimeout(180);
            if (EnableRetries)
            {
                // Configure retry strategy for Azure SQL transient failures
                options.EnableRetryOnFailure(
                    maxRetryCount: 3,
                    maxRetryDelay: TimeSpan.FromSeconds(30),
                    errorNumbersToAdd: new[] { 
                        -2, -1, 2, 53, 64, 233, 10053, 10054, 10060, 40197, 40501, 40613
                    });
            }
        })
        .ConfigureWarnings(w => w.Ignore(SqlServerEventId.SavepointsDisabledBecauseOfMARS));
    }
}

