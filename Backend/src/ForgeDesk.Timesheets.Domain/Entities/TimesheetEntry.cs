namespace ForgeDesk.Timesheets.Domain.Entities;

public class TimesheetEntry
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int ResourceId { get; set; }
    public DateTime Date { get; set; }
    public int? CustomerId { get; set; }
    public int? ProjectId { get; set; }
    public int? TaskId { get; set; }
    public int? TicketId { get; set; }
    public decimal ActualHours { get; set; }
    public TimeOnly? StartTime { get; set; }
    public TimeOnly? StopTime { get; set; }
    public bool IncludeBreakInActuals { get; set; }
    public string? Notes { get; set; }
    public TimesheetStatus Status { get; set; } = TimesheetStatus.Open;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public virtual Customer? Customer { get; set; }
    public virtual Project? Project { get; set; }
    public virtual ProjectTask? Task { get; set; }
    public virtual Resource Resource { get; set; } = null!;
}
