using ForgeDesk.Timesheets.Domain.Enums;

namespace ForgeDesk.Timesheets.Domain.Entities;

public class TimesheetPeriod
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid UserId { get; set; }
    public DateOnly WeekStartDate { get; set; }
    public DateOnly WeekEndDate { get; set; }
    public decimal TotalHours { get; set; }
    public TimesheetPeriodStatus Status { get; set; } = TimesheetPeriodStatus.Open;
    public DateTime? SubmittedAt { get; set; }
    public Guid? ApprovedByUserId { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? RejectionReason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
