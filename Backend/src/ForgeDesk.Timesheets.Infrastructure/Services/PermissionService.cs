using ForgeDesk.Timesheets.Application.Services;
using ForgeDesk.Timesheets.Domain.Constants;
using ForgeDesk.Timesheets.Domain.Enums;

namespace ForgeDesk.Timesheets.Infrastructure.Services;

public class PermissionService : IPermissionService
{
    private static readonly Dictionary<UserRole, List<string>> RolePermissions = new()
    {
        [UserRole.SuperAdmin] = new() { TimesheetPermissions.All },
        [UserRole.TenantAdmin] = new()
        {
            TimesheetPermissions.Timesheets.View, TimesheetPermissions.Timesheets.ViewAll,
            TimesheetPermissions.Timesheets.Create, TimesheetPermissions.Timesheets.Update,
            TimesheetPermissions.Timesheets.Approve, TimesheetPermissions.Timesheets.Delete,
            TimesheetPermissions.Projects.View, TimesheetPermissions.Projects.Manage,
            TimesheetPermissions.Reports.View, TimesheetPermissions.Reports.Export
        },
        [UserRole.Manager] = new()
        {
            TimesheetPermissions.Timesheets.View, TimesheetPermissions.Timesheets.ViewAll,
            TimesheetPermissions.Timesheets.Create, TimesheetPermissions.Timesheets.Update,
            TimesheetPermissions.Timesheets.Approve,
            TimesheetPermissions.Projects.View, TimesheetPermissions.Projects.Manage,
            TimesheetPermissions.Reports.View, TimesheetPermissions.Reports.Export
        },
        [UserRole.Helpdesk] = new()
        {
            TimesheetPermissions.Timesheets.View, TimesheetPermissions.Timesheets.Create,
            TimesheetPermissions.Timesheets.Update,
            TimesheetPermissions.Projects.View, TimesheetPermissions.Reports.View
        },
        [UserRole.Employee] = new()
        {
            TimesheetPermissions.Timesheets.View, TimesheetPermissions.Timesheets.Create,
            TimesheetPermissions.Timesheets.Update,
            TimesheetPermissions.Projects.View, TimesheetPermissions.Reports.View
        }
    };

    public Task<bool> HasPermissionAsync(Guid userId, Guid tenantId, UserRole role, string permission)
    {
        if (role == UserRole.SuperAdmin) return Task.FromResult(true);
        var perms = GetPermissionsForRole(role);
        return Task.FromResult(perms.Contains(permission));
    }

    public List<string> GetPermissionsForRole(UserRole role)
    {
        return RolePermissions.TryGetValue(role, out var perms) ? perms : new List<string>();
    }
}
