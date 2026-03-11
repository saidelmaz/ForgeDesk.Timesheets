using ForgeDesk.Timesheets.Api.Authorization;
using ForgeDesk.Timesheets.Application.DTOs;
using ForgeDesk.Timesheets.Application.Services;
using ForgeDesk.Timesheets.Domain.Constants;
using ForgeDesk.Timesheets.Domain.Entities;
using ForgeDesk.Timesheets.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ForgeDesk.Timesheets.Api.Controllers;

[ApiController]
[Route("api/Projects/{projectId}/Tasks")]
[Authorize]
public class ProjectTasksController : ControllerBase
{
    private readonly TimesheetDbContext _context;
    private readonly ICurrentUserContext _currentUser;

    public ProjectTasksController(TimesheetDbContext context, ICurrentUserContext currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    [HttpGet]
    [RequirePermission(TimesheetPermissions.Projects.View)]
    public async Task<ActionResult<IEnumerable<ProjectTaskResponse>>> GetTasks(Guid projectId)
    {
        var tasks = await _context.ProjectTasks.Where(t => t.ProjectId == projectId && t.IsActive)
            .OrderBy(t => t.SortOrder).ToListAsync();

        var result = new List<ProjectTaskResponse>();
        foreach (var t in tasks)
        {
            var actual = (decimal)await _context.TimesheetEntries.Where(e => e.TaskId == t.Id).SumAsync(e => (double)e.Hours);
            result.Add(new ProjectTaskResponse
            {
                Id = t.Id, ProjectId = t.ProjectId, ParentTaskId = t.ParentTaskId,
                Name = t.Name, Description = t.Description,
                PlannedHours = t.PlannedHours, BaselineHours = t.BaselineHours,
                ActualHours = actual, SortOrder = t.SortOrder, IsActive = t.IsActive
            });
        }
        return Ok(result);
    }

    [HttpPost]
    [RequirePermission(TimesheetPermissions.Projects.Manage)]
    public async Task<IActionResult> CreateTask(Guid projectId, [FromBody] CreateProjectTaskRequest request)
    {
        var tenantId = _currentUser.CurrentTenantId;
        if (!tenantId.HasValue) return BadRequest(new { error = "X-TenantId required" });

        var task = new ProjectTask
        {
            TenantId = tenantId.Value, ProjectId = projectId, Name = request.Name,
            Description = request.Description, ParentTaskId = request.ParentTaskId,
            PlannedHours = request.PlannedHours, BaselineHours = request.BaselineHours,
            SortOrder = request.SortOrder
        };
        _context.ProjectTasks.Add(task);
        await _context.SaveChangesAsync();
        return Ok(new ProjectTaskResponse { Id = task.Id, ProjectId = projectId, Name = task.Name, PlannedHours = task.PlannedHours, IsActive = true });
    }

    [HttpPut("{taskId}")]
    [RequirePermission(TimesheetPermissions.Projects.Manage)]
    public async Task<IActionResult> UpdateTask(Guid projectId, Guid taskId, [FromBody] UpdateProjectTaskRequest request)
    {
        var task = await _context.ProjectTasks.FirstOrDefaultAsync(t => t.Id == taskId && t.ProjectId == projectId);
        if (task == null) return NotFound();
        if (request.Name != null) task.Name = request.Name;
        if (request.Description != null) task.Description = request.Description;
        if (request.PlannedHours.HasValue) task.PlannedHours = request.PlannedHours.Value;
        if (request.BaselineHours.HasValue) task.BaselineHours = request.BaselineHours.Value;
        if (request.SortOrder.HasValue) task.SortOrder = request.SortOrder.Value;
        if (request.IsActive.HasValue) task.IsActive = request.IsActive.Value;
        task.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
