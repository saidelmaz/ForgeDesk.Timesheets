using ForgeDesk.Timesheets.Domain.Enums;

namespace ForgeDesk.Timesheets.Domain.Entities;

public class AppTenantUser
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid TenantId { get; set; }
    public UserRole Role { get; set; } = UserRole.Employee;
    public bool IsActive { get; set; } = true;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}
