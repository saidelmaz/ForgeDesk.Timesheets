using ForgeDesk.Timesheets.Domain.Enums;

namespace ForgeDesk.Timesheets.Application.Services;

public interface IPermissionService
{
    Task<bool> HasPermissionAsync(Guid userId, Guid tenantId, UserRole role, string permission);
    List<string> GetPermissionsForRole(UserRole role);
}
