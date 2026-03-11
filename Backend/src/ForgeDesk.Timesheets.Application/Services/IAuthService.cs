namespace ForgeDesk.Timesheets.Application.Services;

public interface IAuthService
{
    Task<(bool Success, string Token, object? User)> LoginAsync(string email, string password);
    Task<(bool Success, string Token, object? User)> RegisterAsync(string email, string password, string firstName, string lastName);
    string HashPassword(string password);
    bool VerifyPassword(string password, string hash);
}
