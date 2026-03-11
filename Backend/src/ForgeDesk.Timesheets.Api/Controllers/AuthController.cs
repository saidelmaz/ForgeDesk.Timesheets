using ForgeDesk.Timesheets.Application.DTOs;
using ForgeDesk.Timesheets.Application.Services;
using ForgeDesk.Timesheets.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ForgeDesk.Timesheets.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ICurrentUserContext _currentUser;
    private readonly TimesheetDbContext _context;

    public AuthController(IAuthService authService, ICurrentUserContext currentUser, TimesheetDbContext context)
    {
        _authService = authService;
        _currentUser = currentUser;
        _context = context;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var (success, token, user) = await _authService.LoginAsync(request.Email, request.Password);
        if (!success) return Unauthorized(new { error = "Invalid email or password" });
        return Ok(new LoginResponse { Token = token, User = (UserInfoDto)user! });
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var (success, token, user) = await _authService.RegisterAsync(request.Email, request.Password, request.FirstName, request.LastName);
        if (!success) return BadRequest(new { error = token });
        return Ok(new LoginResponse { Token = token, User = (UserInfoDto)user! });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetCurrentUser()
    {
        var user = await _context.Users.FindAsync(_currentUser.UserId);
        if (user == null) return NotFound();

        var tenantUsers = await _context.TenantUsers.Where(tu => tu.UserId == user.Id && tu.IsActive).ToListAsync();
        var tenants = new List<TenantInfoDto>();
        foreach (var tu in tenantUsers)
        {
            var tenant = await _context.Tenants.FindAsync(tu.TenantId);
            tenants.Add(new TenantInfoDto { TenantId = tu.TenantId, TenantName = tenant?.Name ?? "", Role = tu.Role.ToString() });
        }

        return Ok(new UserInfoDto
        {
            Id = user.Id, Email = user.Email, FirstName = user.FirstName, LastName = user.LastName,
            IsSuperAdmin = tenantUsers.Any(tu => tu.Role == Domain.Enums.UserRole.SuperAdmin),
            Tenants = tenants
        });
    }
}
