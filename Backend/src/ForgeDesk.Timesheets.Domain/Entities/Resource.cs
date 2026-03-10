namespace ForgeDesk.Timesheets.Domain.Entities;

public class Resource
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string? ForgedeskUserId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Department { get; set; }
    public decimal DefaultHoursPerDay { get; set; } = 8.0m;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual ICollection<TimesheetEntry> TimesheetEntries { get; set; } = new List<TimesheetEntry>();
    public virtual ICollection<PlanningEntry> PlanningEntries { get; set; } = new List<PlanningEntry>();
    public virtual ICollection<LeaveRequest> LeaveRequests { get; set; } = new List<LeaveRequest>();
    public virtual WorkSchedule? WorkSchedule { get; set; }
}
