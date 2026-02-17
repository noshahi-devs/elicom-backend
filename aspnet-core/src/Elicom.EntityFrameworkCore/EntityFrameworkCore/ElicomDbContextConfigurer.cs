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
                options.EnableRetryOnFailure();
            }
        })
        .ConfigureWarnings(w => w.Throw(SqlServerEventId.SavepointsDisabledBecauseOfMARS));
    }

    public static void Configure(DbContextOptionsBuilder<ElicomDbContext> builder, DbConnection connection)
    {
        builder.UseSqlServer(connection, options => 
        {
            options.CommandTimeout(180);
            if (EnableRetries)
            {
                options.EnableRetryOnFailure();
            }
        })
        .ConfigureWarnings(w => w.Throw(SqlServerEventId.SavepointsDisabledBecauseOfMARS));
    }
}

