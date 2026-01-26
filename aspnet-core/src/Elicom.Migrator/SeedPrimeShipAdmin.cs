using Elicom.Migrator;

Console.WriteLine("╔════════════════════════════════════════╗");
Console.WriteLine("║  PRIME SHIP ADMIN SEEDER              ║");
Console.WriteLine("╔════════════════════════════════════════╗");
Console.WriteLine();

try
{
    PrimeShipAdminSeeder.SeedAdmin();
}
catch (Exception ex)
{
    Console.WriteLine();
    Console.WriteLine("❌ ERROR:");
    Console.WriteLine(ex.Message);
    Console.WriteLine();
    Console.WriteLine("Stack trace:");
    Console.WriteLine(ex.StackTrace);
}

Console.WriteLine();
Console.WriteLine("Press ENTER to exit...");
Console.ReadLine();
