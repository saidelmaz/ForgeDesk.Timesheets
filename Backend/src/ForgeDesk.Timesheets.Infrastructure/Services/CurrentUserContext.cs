using System.Security.Claims;
using ForgeDesk.Timesheets.Application.Services;
using ForgeDesk.Timesheets.Domain.Enums;
using Microsoft.AspNetCore.Http;

namespace ForgeDesk.Timesheets.Infrastructure.Services;

public class CurrentUserContext : ICurrentUserContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly Lazy<Dictionary<Guid, UserRole>> _tenantRoles;

    public CurrentUserContext(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
        _tenantRoles = new Lazy<Dictionary<Guid, UserRole>>(ParseTenantRoles);
    }

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;
    private HttpRequest? Request => _httpContextAccessor.HttpContext?.Request;

    public Guid UserId
    {
        get
        {
            var claim = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(claim) || !Guid.TryParse(claim, out var userId))
                throw new UnauthorizedAccessException("User ID claim not found");
            return userId;
        }
    }

    public string Email => User?.FindFirst(ClaimTypes.Email)?.Value ?? string.Empty;

    public string DisplayName
    {
        get
        {
            var first = User?.FindFirst("FirstName")?.Value ?? "";
            var last = User?.FindFirst("LastName")?.Value ?? "";
            return $"{first} {last}".Trim();
        }
    }

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;

    public Guid? CurrentTenantId
    {
        get
        {
            if (Request?.Headers.TryGetValue("X-TenantId", out var h) == true && Guid.TryParse(h, out var tid))
                return tid;
            var ids = TenantIds;
            return ids.Count == 1 ? ids[0] : null;
        }
    }

    public bool IsSuperAdmin
    {
        get
        {
            var claim = User?.FindFirst("IsSuperAdmin")?.Value;
            return bool.TryParse(claim, out var v) && v;
        }
    }

    public IReadOnlyList<Guid> TenantIds
    {
        get
        {
            return User?.FindAll("TenantId")
                .Select(c => Guid.TryParse(c.Value, out var id) ? id : Guid.Empty)
                .Where(id => id != Guid.Empty)
                .ToList() ?? new List<Guid>();
        }
    }

    public UserRole? GetTenantRole(Guid tenantId)
    {
        return _tenantRoles.Value.TryGetValue(tenantId, out var role) ? role : null;
    }

    public bool BelongsToTenant(Guid tenantId)
    {
        return IsSuperAdmin || TenantIds.Contains(tenantId);
    }

    private Dictionary<Guid, UserRole> ParseTenantRoles()
    {
        var result = new Dictionary<Guid, UserRole>();
        if (User == null) return result;
        var tenantIdClaims = User.FindAll("TenantId").ToList();
        var tenantRoleClaims = User.FindAll("TenantRole").ToList();
        for (int i = 0; i < tenantIdClaims.Count && i < tenantRoleClaims.Count; i++)
        {
            if (Guid.TryParse(tenantIdClaims[i].Value, out var tenantId) &&
                Enum.TryParse<UserRole>(tenantRoleClaims[i].Value, out var role))
                result[tenantId] = role;
        }
        return result;
    }
}
