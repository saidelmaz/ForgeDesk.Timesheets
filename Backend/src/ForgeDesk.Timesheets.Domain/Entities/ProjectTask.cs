namespace ForgeDesk.Timesheets.Domain.Entities;

public class ProjectTask
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public int? ParentTaskId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public TaskItemStatus Status { get; set; } = TaskItemStatus.Open;
    public decimal BaselineHours { get; set; }
    public decimal PlannedHours { get; set; }
    public decimal ActualHours { get; set; }
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public virtual Project Project { get; set; } = null!;
    public virtual ProjectTask? ParentTask { get; set; }
    public virtual ICollection<ProjectTask> ChildTasks { get; set; } = new List<ProjectTask>();
    public virtual ICollection<TimesheetEntry> TimesheetEntries { get; set; } = new List<TimesheetEntry>();
}
