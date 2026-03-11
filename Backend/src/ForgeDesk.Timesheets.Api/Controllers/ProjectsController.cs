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
[Route("api/[controller]")]
[Authorize]
public class ProjectsController : ControllerBase
{
    private readonly TimesheetDbContext _context;
    private readonly ICurrentUserContext _currentUser;

    public ProjectsController(TimesheetDbContext context, ICurrentUserContext currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    [HttpGet]
    [RequirePermission(TimesheetPermissions.Projects.View)]
    public async Task<ActionResult<IEnumerable<ProjectResponse>>> GetProjects([FromQuery] string? status, [FromQuery] bool activeOnly = true)
    {
        var tenantId = _currentUser.CurrentTenantId;
        if (!tenantId.HasValue) return BadRequest(new { error = "X-TenantId header required" });

        var query = _context.Projects.Include(p => p.Tasks).Where(p => p.TenantId == tenantId.Value);
        if (activeOnly) query = query.Where(p => p.IsActive);

        var projects = await query.OrderBy(p => p.Name).ToListAsync();
        var result = new List<ProjectResponse>();

        foreach (var p in projects)
        {
            var actualHours = (decimal)await _context.TimesheetEntries.Where(e => e.ProjectId == p.Id).SumAsync(e => (double)e.Hours);
            result.Add(new ProjectResponse
            {
                Id = p.Id, Name = p.Name, Description = p.Description,
                CustomerId = p.CustomerId, CustomerName = p.CustomerName,
                ManagerUserId = p.ManagerUserId, ManagerName = p.ManagerName,
                Status = p.Status, StartDate = p.StartDate, EndDate = p.EndDate,
                BaselineHours = p.BaselineHours, PlannedHours = p.PlannedHours,
                ActualHours = actualHours, PlanningColor = p.PlanningColor, IsActive = p.IsActive,
                Tasks = p.Tasks.Where(t => t.IsActive).OrderBy(t => t.SortOrder).Select(t => new ProjectTaskResponse
                {
                    Id = t.Id, ProjectId = t.ProjectId, ParentTaskId = t.ParentTaskId,
                    Name = t.Name, Description = t.Description,
                    PlannedHours = t.PlannedHours, BaselineHours = t.BaselineHours,
                    SortOrder = t.SortOrder, IsActive = t.IsActive
                }).ToList()
            });
        }

        return Ok(result);
    }

    [HttpGet("{id}")]
    [RequirePermission(TimesheetPermissions.Projects.View)]
    public async Task<ActionResult<ProjectResponse>> GetProject(Guid id)
    {
        var p = await _context.Projects.Include(p => p.Tasks).FirstOrDefaultAsync(p => p.Id == id);
        if (p == null) return NotFound();

        var actualHours = (decimal)await _context.TimesheetEntries.Where(e => e.ProjectId == p.Id).SumAsync(e => (double)e.Hours);
        var taskActualHours = new Dictionary<Guid, decimal>();
        foreach (var t in p.Tasks)
        {
            taskActualHours[t.Id] = (decimal)await _context.TimesheetEntries.Where(e => e.TaskId == t.Id).SumAsync(e => (double)e.Hours);
        }

        return Ok(new ProjectResponse
        {
            Id = p.Id, Name = p.Name, Description = p.Description,
            CustomerId = p.CustomerId, CustomerName = p.CustomerName,
            ManagerUserId = p.ManagerUserId, ManagerName = p.ManagerName,
            Status = p.Status, StartDate = p.StartDate, EndDate = p.EndDate,
            BaselineHours = p.BaselineHours, PlannedHours = p.PlannedHours,
            ActualHours = actualHours, PlanningColor = p.PlanningColor, IsActive = p.IsActive,
            Tasks = p.Tasks.OrderBy(t => t.SortOrder).Select(t => new ProjectTaskResponse
            {
                Id = t.Id, ProjectId = t.ProjectId, ParentTaskId = t.ParentTaskId,
                Name = t.Name, Description = t.Description,
                PlannedHours = t.PlannedHours, BaselineHours = t.BaselineHours,
                ActualHours = taskActualHours.GetValueOrDefault(t.Id),
                SortOrder = t.SortOrder, IsActive = t.IsActive
            }).ToList()
        });
    }

    [HttpPost]
    [RequirePermission(TimesheetPermissions.Projects.Manage)]
    public async Task<ActionResult<ProjectResponse>> CreateProject([FromBody] CreateProjectRequest request)
    {
        var tenantId = _currentUser.CurrentTenantId;
        if (!tenantId.HasValue) return BadRequest(new { error = "X-TenantId header required" });

        var project = new Project
        {
            TenantId = tenantId.Value, Name = request.Name, Description = request.Description,
            CustomerId = request.CustomerId, CustomerName = request.CustomerName,
            ManagerUserId = request.ManagerUserId, ManagerName = request.ManagerName,
            StartDate = request.StartDate, EndDate = request.EndDate,
            BaselineHours = request.BaselineHours, PlannedHours = request.PlannedHours,
            PlanningColor = request.PlanningColor
        };

        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetProject), new { id = project.Id }, new ProjectResponse
        {
            Id = project.Id, Name = project.Name, Description = project.Description,
            CustomerId = project.CustomerId, CustomerName = project.CustomerName,
            Status = project.Status, IsActive = true
        });
    }

    [HttpPut("{id}")]
    [RequirePermission(TimesheetPermissions.Projects.Manage)]
    public async Task<IActionResult> UpdateProject(Guid id, [FromBody] UpdateProjectRequest request)
    {
        var project = await _context.Projects.FindAsync(id);
        if (project == null) return NotFound();

        if (request.Name != null) project.Name = request.Name;
        if (request.Description != null) project.Description = request.Description;
        if (request.CustomerId.HasValue) project.CustomerId = request.CustomerId;
        if (request.CustomerName != null) project.CustomerName = request.CustomerName;
        if (request.ManagerUserId.HasValue) project.ManagerUserId = request.ManagerUserId;
        if (request.ManagerName != null) project.ManagerName = request.ManagerName;
        if (request.Status.HasValue) project.Status = request.Status.Value;
        if (request.StartDate.HasValue) project.StartDate = request.StartDate;
        if (request.EndDate.HasValue) project.EndDate = request.EndDate;
        if (request.BaselineHours.HasValue) project.BaselineHours = request.BaselineHours.Value;
        if (request.PlannedHours.HasValue) project.PlannedHours = request.PlannedHours.Value;
        if (request.PlanningColor != null) project.PlanningColor = request.PlanningColor;
        project.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [RequirePermission(TimesheetPermissions.Projects.Manage)]
    public async Task<IActionResult> DeleteProject(Guid id)
    {
        var project = await _context.Projects.FindAsync(id);
        if (project == null) return NotFound();
        project.IsActive = false;
        project.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
