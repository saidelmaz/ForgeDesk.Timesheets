namespace ForgeDesk.Timesheets.Domain.Entities;

public class LeaveType
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = "#4CAF50";
    public bool RequiresApproval { get; set; } = true;
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }

    public virtual ICollection<LeaveRequest> LeaveRequests { get; set; } = new List<LeaveRequest>();
}
