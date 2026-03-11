namespace ForgeDesk.Timesheets.Domain.Entities;

public class UserSchedule
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public Guid UserId { get; set; }
    public int DayOfWeek { get; set; }
    public decimal ScheduledHours { get; set; } = 8.0m;
    public bool IsWorkingDay { get; set; } = true;
}
