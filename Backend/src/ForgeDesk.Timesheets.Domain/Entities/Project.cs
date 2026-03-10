namespace ForgeDesk.Timesheets.Domain.Entities;

public class Project
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string ProjectCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public decimal BaselineHours { get; set; }
    public ProjectStatus Status { get; set; } = ProjectStatus.InStart;
    public int? CustomerId { get; set; }
    public int? ProjectManagerId { get; set; }
    public int? ProjectSupervisorId { get; set; }
    public int? AccountManagerId { get; set; }
    public string? Department { get; set; }
    public string? Type { get; set; }
    public string? Group { get; set; }
    public string? PlanningColor { get; set; }
    public string? Location { get; set; }
    public string? Hyperlink { get; set; }
    public bool ExposeToRelationPortal { get; set; }
    public string? InvoiceText { get; set; }
    public string? InvoicingInstructions { get; set; }
    public string? InvoiceGroup { get; set; }
    public int? CreatorId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public virtual Customer? Customer { get; set; }
    public virtual Resource? ProjectManager { get; set; }
    public virtual ICollection<ProjectTask> Tasks { get; set; } = new List<ProjectTask>();
    public virtual ICollection<TimesheetEntry> TimesheetEntries { get; set; } = new List<TimesheetEntry>();
    public virtual ICollection<ProjectAttachment> Attachments { get; set; } = new List<ProjectAttachment>();
    public virtual ICollection<ProjectNote> Notes { get; set; } = new List<ProjectNote>();
}
