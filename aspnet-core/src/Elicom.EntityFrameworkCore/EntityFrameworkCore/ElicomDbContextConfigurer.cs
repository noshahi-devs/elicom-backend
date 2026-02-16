using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using System.Data.Common;

namespace Elicom.EntityFrameworkCore;

public static class ElicomDbContextConfigurer
{
    public static void Configure(DbContextOptionsBuilder<ElicomDbContext> builder, string connectionString)
    {
        Console.WriteLine("[DB-CONFIG] Configuring DbContext (No Retries)");
        builder.UseSqlServer(connectionString, options => options.CommandTimeout(180))
               .ConfigureWarnings(w => w.Throw(SqlServerEventId.SavepointsDisabledBecauseOfMARS));
    }

    public static void Configure(DbContextOptionsBuilder<ElicomDbContext> builder, DbConnection connection)
    {
        Console.WriteLine("[DB-CONFIG] Configuring DbContext with Connection (No Retries)");
        builder.UseSqlServer(connection, options => options.CommandTimeout(180))
               .ConfigureWarnings(w => w.Throw(SqlServerEventId.SavepointsDisabledBecauseOfMARS));
    }
}

