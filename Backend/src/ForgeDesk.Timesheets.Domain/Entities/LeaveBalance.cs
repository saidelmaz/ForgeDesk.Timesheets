namespace ForgeDesk.Timesheets.Domain.Entities;

public class LeaveBalance
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid UserId { get; set; }
    public Guid LeaveTypeId { get; set; }
    public int Year { get; set; }
    public decimal TotalDays { get; set; }
    public decimal UsedDays { get; set; }
    public decimal PendingDays { get; set; }
    public decimal CarriedOverDays { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public decimal RemainingDays => TotalDays + CarriedOverDays - UsedDays - PendingDays;

    public virtual LeaveType? LeaveType { get; set; }
}
