namespace ForgeDesk.Timesheets.Domain.Entities;

public class WorkSchedule
{
    public int Id { get; set; }
    public int ResourceId { get; set; }
    public decimal MondayHours { get; set; } = 8.0m;
    public decimal TuesdayHours { get; set; } = 8.0m;
    public decimal WednesdayHours { get; set; } = 8.0m;
    public decimal ThursdayHours { get; set; } = 8.0m;
    public decimal FridayHours { get; set; } = 8.0m;
    public decimal SaturdayHours { get; set; } = 0.0m;
    public decimal SundayHours { get; set; } = 0.0m;
    public TimeOnly DefaultStartTime { get; set; } = new TimeOnly(9, 0);
    public TimeOnly DefaultEndTime { get; set; } = new TimeOnly(17, 0);
    public decimal BreakDurationMinutes { get; set; } = 60;

    public decimal TotalWeeklyHours => MondayHours + TuesdayHours + WednesdayHours +
        ThursdayHours + FridayHours + SaturdayHours + SundayHours;

    // Navigation properties
    public virtual Resource Resource { get; set; } = null!;
}
