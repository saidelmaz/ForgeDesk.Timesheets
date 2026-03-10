namespace ForgeDesk.Timesheets.Domain.Entities;

public class ProjectNote
{
    public int Id { get; set; }
    public int ProjectId { get; set; }
    public string Content { get; set; } = string.Empty;
    public int CreatedById { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public virtual Project Project { get; set; } = null!;
}
