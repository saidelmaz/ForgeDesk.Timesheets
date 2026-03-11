using ForgeDesk.Timesheets.Domain.Enums;

namespace ForgeDesk.Timesheets.Application.Services;

public interface ICurrentUserContext
{
    Guid UserId { get; }
    string Email { get; }
    string DisplayName { get; }
    bool IsAuthenticated { get; }
    Guid? CurrentTenantId { get; }
    bool IsSuperAdmin { get; }
    IReadOnlyList<Guid> TenantIds { get; }
    UserRole? GetTenantRole(Guid tenantId);
    bool BelongsToTenant(Guid tenantId);
}
