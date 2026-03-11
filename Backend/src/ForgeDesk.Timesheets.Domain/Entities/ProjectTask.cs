namespace ForgeDesk.Timesheets.Domain.Entities;

public class ProjectTask
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid ProjectId { get; set; }
    public Guid? ParentTaskId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal PlannedHours { get; set; }
    public decimal BaselineHours { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public virtual Project Project { get; set; } = null!;
    public virtual ProjectTask? ParentTask { get; set; }
    public virtual ICollection<ProjectTask> ChildTasks { get; set; } = new List<ProjectTask>();
    public virtual ICollection<TimesheetEntry> TimesheetEntries { get; set; } = new List<TimesheetEntry>();
}
