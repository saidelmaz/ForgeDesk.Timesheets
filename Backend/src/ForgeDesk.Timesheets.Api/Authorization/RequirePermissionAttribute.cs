using ForgeDesk.Timesheets.Application.Services;
using ForgeDesk.Timesheets.Domain.Enums;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace ForgeDesk.Timesheets.Api.Authorization;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
public class RequirePermissionAttribute : Attribute, IAsyncAuthorizationFilter
{
    public string Permission { get; }
    public RequirePermissionAttribute(string permission) => Permission = permission;

    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.User;
        if (!(user.Identity?.IsAuthenticated ?? false))
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        var currentUser = context.HttpContext.RequestServices.GetRequiredService<ICurrentUserContext>();
        if (currentUser.IsSuperAdmin) return;

        var tenantId = currentUser.CurrentTenantId;
        if (!tenantId.HasValue)
        {
            context.Result = new BadRequestObjectResult(new { error = "X-TenantId header is required" });
            return;
        }

        var role = currentUser.GetTenantRole(tenantId.Value);
        if (!role.HasValue)
        {
            context.Result = new ForbidResult();
            return;
        }

        var permissionService = context.HttpContext.RequestServices.GetRequiredService<IPermissionService>();
        var hasPermission = await permissionService.HasPermissionAsync(currentUser.UserId, tenantId.Value, role.Value, Permission);
        if (!hasPermission) context.Result = new ForbidResult();
    }
}
