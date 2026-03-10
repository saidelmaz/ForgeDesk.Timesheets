namespace ForgeDesk.Timesheets.Domain.Entities;

public class TimesheetConfirmation
{
    public int Id { get; set; }
    public int TenantId { get; set; }
    public int ResourceId { get; set; }
    public DateTime WeekStartDate { get; set; }
    public DateTime WeekEndDate { get; set; }
    public decimal TotalHours { get; set; }
    public ConfirmationStatus Status { get; set; } = ConfirmationStatus.Pending;
    public DateTime? ConfirmedAt { get; set; }
    public int? ConfirmedById { get; set; }
    public string? Comments { get; set; }

    // Navigation properties
    public virtual Resource Resource { get; set; } = null!;
    public virtual Resource? ConfirmedBy { get; set; }
}
