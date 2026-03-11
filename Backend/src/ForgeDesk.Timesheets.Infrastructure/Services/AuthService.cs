using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ForgeDesk.Timesheets.Application.DTOs;
using ForgeDesk.Timesheets.Application.Services;
using ForgeDesk.Timesheets.Domain.Entities;
using ForgeDesk.Timesheets.Domain.Enums;
using ForgeDesk.Timesheets.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace ForgeDesk.Timesheets.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly TimesheetDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(TimesheetDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<(bool Success, string Token, object? User)> LoginAsync(string email, string password)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
        if (user == null || !user.IsActive) return (false, string.Empty, null);
        if (!VerifyPassword(password, user.PasswordHash)) return (false, string.Empty, null);

        var tenantUsers = await _context.TenantUsers.Where(tu => tu.UserId == user.Id && tu.IsActive).ToListAsync();
        var token = GenerateJwtToken(user, tenantUsers);

        var tenants = new List<TenantInfoDto>();
        foreach (var tu in tenantUsers)
        {
            var tenant = await _context.Tenants.FindAsync(tu.TenantId);
            tenants.Add(new TenantInfoDto { TenantId = tu.TenantId, TenantName = tenant?.Name ?? "", Role = tu.Role.ToString() });
        }

        var userInfo = new UserInfoDto
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            IsSuperAdmin = tenantUsers.Any(tu => tu.Role == UserRole.SuperAdmin),
            Tenants = tenants
        };

        return (true, token, userInfo);
    }

    public async Task<(bool Success, string Token, object? User)> RegisterAsync(string email, string password, string firstName, string lastName)
    {
        if (await _context.Users.AnyAsync(u => u.Email.ToLower() == email.ToLower()))
            return (false, "Email already in use", null);

        var user = new AppUser
        {
            Email = email.ToLower(),
            PasswordHash = HashPassword(password),
            FirstName = firstName,
            LastName = lastName
        };
        _context.Users.Add(user);

        // Get or create default tenant
        var tenant = await _context.Tenants.FirstOrDefaultAsync();
        if (tenant == null)
        {
            tenant = new AppTenant { Name = "Default Tenant" };
            _context.Tenants.Add(tenant);
        }

        var isFirst = !await _context.TenantUsers.AnyAsync(tu => tu.TenantId == tenant.Id);
        var tenantUser = new AppTenantUser
        {
            UserId = user.Id,
            TenantId = tenant.Id,
            Role = isFirst ? UserRole.TenantAdmin : UserRole.Employee
        };
        _context.TenantUsers.Add(tenantUser);

        // Create default schedule (Mon-Fri 8h)
        for (int day = 1; day <= 5; day++)
        {
            _context.UserSchedules.Add(new UserSchedule
            {
                TenantId = tenant.Id,
                UserId = user.Id,
                DayOfWeek = day,
                ScheduledHours = 8.0m,
                IsWorkingDay = true
            });
        }
        for (int day = 0; day <= 6; day += 6) // Sun=0, Sat=6
        {
            _context.UserSchedules.Add(new UserSchedule
            {
                TenantId = tenant.Id,
                UserId = user.Id,
                DayOfWeek = day,
                ScheduledHours = 0,
                IsWorkingDay = false
            });
        }

        await _context.SaveChangesAsync();

        var token = GenerateJwtToken(user, new List<AppTenantUser> { tenantUser });
        var userInfo = new UserInfoDto
        {
            Id = user.Id, Email = user.Email, FirstName = user.FirstName, LastName = user.LastName,
            IsSuperAdmin = tenantUser.Role == UserRole.SuperAdmin,
            Tenants = new List<TenantInfoDto> { new() { TenantId = tenant.Id, TenantName = tenant.Name, Role = tenantUser.Role.ToString() } }
        };

        return (true, token, userInfo);
    }

    private string GenerateJwtToken(AppUser user, List<AppTenantUser> tenantUsers)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"] ?? "YourSuperSecretKeyThatIsAtLeast32CharactersLong!ChangeThisInProduction";
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new("FirstName", user.FirstName),
            new("LastName", user.LastName),
            new("IsSuperAdmin", tenantUsers.Any(tu => tu.Role == UserRole.SuperAdmin).ToString())
        };

        foreach (var tu in tenantUsers)
        {
            claims.Add(new Claim("TenantId", tu.TenantId.ToString()));
            claims.Add(new Claim("TenantRole", tu.Role.ToString()));
        }

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"] ?? "ForgeDesk",
            audience: jwtSettings["Audience"] ?? "ForgeDesk",
            claims: claims,
            expires: DateTime.UtcNow.AddHours(24),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string HashPassword(string password) => BCrypt.Net.BCrypt.HashPassword(password);
    public bool VerifyPassword(string password, string hash)
    {
        try { return BCrypt.Net.BCrypt.Verify(password, hash); }
        catch { return false; }
    }
}
