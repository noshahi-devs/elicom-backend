using Microsoft.EntityFrameworkCore;
using System.Data.Common;

namespace Elicom.EntityFrameworkCore;

public static class ElicomDbContextConfigurer
{
    public static void Configure(DbContextOptionsBuilder<ElicomDbContext> builder, string connectionString)
    {
        builder.UseSqlServer(connectionString, options => options.CommandTimeout(120));
    }

    public static void Configure(DbContextOptionsBuilder<ElicomDbContext> builder, DbConnection connection)
    {
        builder.UseSqlServer(connection, options => options.CommandTimeout(120));
    }
}
