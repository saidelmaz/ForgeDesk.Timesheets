using ForgeDesk.Timesheets.Domain.Enums;

namespace ForgeDesk.Timesheets.Application.DTOs;

public class ProjectResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public Guid? ManagerUserId { get; set; }
    public string? ManagerName { get; set; }
    public ProjectStatus Status { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public decimal BaselineHours { get; set; }
    public decimal PlannedHours { get; set; }
    public decimal ActualHours { get; set; }
    public string? PlanningColor { get; set; }
    public bool IsActive { get; set; }
    public List<ProjectTaskResponse> Tasks { get; set; } = new();
}

public class ProjectTaskResponse
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public Guid? ParentTaskId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal PlannedHours { get; set; }
    public decimal BaselineHours { get; set; }
    public decimal ActualHours { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
}

public class CreateProjectRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public Guid? ManagerUserId { get; set; }
    public string? ManagerName { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public decimal BaselineHours { get; set; }
    public decimal PlannedHours { get; set; }
    public string? PlanningColor { get; set; }
}

public class UpdateProjectRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public Guid? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public Guid? ManagerUserId { get; set; }
    public string? ManagerName { get; set; }
    public ProjectStatus? Status { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public decimal? BaselineHours { get; set; }
    public decimal? PlannedHours { get; set; }
    public string? PlanningColor { get; set; }
}

public class CreateProjectTaskRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? ParentTaskId { get; set; }
    public decimal PlannedHours { get; set; }
    public decimal BaselineHours { get; set; }
    public int SortOrder { get; set; }
}

public class UpdateProjectTaskRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public decimal? PlannedHours { get; set; }
    public decimal? BaselineHours { get; set; }
    public int? SortOrder { get; set; }
    public bool? IsActive { get; set; }
}
