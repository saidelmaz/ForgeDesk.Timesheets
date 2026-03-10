namespace ForgeDesk.Timesheets.Domain.Entities;

public class LeaveBalance
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int ResourceId { get; set; }
    public int LeaveTypeId { get; set; }
    public int Year { get; set; }
    public decimal Entitlement { get; set; }
    public decimal Used { get; set; }
    public decimal CarriedOver { get; set; }
    public decimal Remaining => Entitlement + CarriedOver - Used;

    // Navigation properties
    public virtual Resource Resource { get; set; } = null!;
    public virtual LeaveType LeaveType { get; set; } = null!;
}
