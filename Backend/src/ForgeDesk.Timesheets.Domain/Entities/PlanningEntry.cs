namespace ForgeDesk.Timesheets.Domain.Entities;

public class PlanningEntry
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int ResourceId { get; set; }
    public int ProjectId { get; set; }
    public int? TaskId { get; set; }
    public DateTime Date { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public decimal PlannedHours { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public virtual Resource Resource { get; set; } = null!;
    public virtual Project Project { get; set; } = null!;
    public virtual ProjectTask? Task { get; set; }
}
