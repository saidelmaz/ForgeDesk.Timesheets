namespace ForgeDesk.Timesheets.Domain.Entities;

public class LeaveRequest
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int ResourceId { get; set; }
    public int LeaveTypeId { get; set; }
    public DateTime DateFrom { get; set; }
    public DateTime DateTo { get; set; }
    public decimal Duration { get; set; }
    public int? ApproverId { get; set; }
    public LeaveStatus Status { get; set; } = LeaveStatus.Pending;
    public string? Reason { get; set; }
    public string? RejectionReason { get; set; }
    public DateTime RequestDate { get; set; } = DateTime.UtcNow;
    public DateTime? ApprovalDate { get; set; }

    // Navigation properties
    public virtual Resource Resource { get; set; } = null!;
    public virtual LeaveType LeaveType { get; set; } = null!;
    public virtual Resource? Approver { get; set; }
}
