using ForgeDesk.Timesheets.Domain.Enums;

namespace ForgeDesk.Timesheets.Domain.Entities;

public class TimesheetEntry
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid UserId { get; set; }
    public string? UserDisplayName { get; set; }
    public Guid ProjectId { get; set; }
    public Guid? TaskId { get; set; }
    public Guid? TicketId { get; set; }
    public string? TicketSubject { get; set; }
    public Guid? ApplicationId { get; set; }
    public Guid? CategoryId { get; set; }
    public DateOnly Date { get; set; }
    public decimal Hours { get; set; }
    public TimeOnly? StartTime { get; set; }
    public TimeOnly? EndTime { get; set; }
    public int BreakMinutes { get; set; }
    public string? Notes { get; set; }
    public TimesheetEntryStatus Status { get; set; } = TimesheetEntryStatus.Draft;
    public bool IsDone { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public virtual Project Project { get; set; } = null!;
    public virtual ProjectTask? Task { get; set; }
}
