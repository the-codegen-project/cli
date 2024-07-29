namespace The.Codegen.Project;

class Program
{
    static void Main(string[] args)
    {

        var payload = new UserSignedUp
        {
            DisplayName = "Lagoni",
            Email = "lagoni@lagoni.com"
        };

        Console.WriteLine($"User was {payload.Serialize()}");
    }
}