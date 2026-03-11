using ForgeDesk.Timesheets.Api.Authorization;
using ForgeDesk.Timesheets.Application.DTOs;
using ForgeDesk.Timesheets.Application.Services;
using ForgeDesk.Timesheets.Domain.Constants;
using ForgeDesk.Timesheets.Domain.Entities;
using ForgeDesk.Timesheets.Domain.Enums;
using ForgeDesk.Timesheets.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ForgeDesk.Timesheets.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TimesheetEntriesController : ControllerBase
{
    private readonly TimesheetDbContext _context;
    private readonly ICurrentUserContext _currentUser;

    public TimesheetEntriesController(TimesheetDbContext context, ICurrentUserContext currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    [HttpGet]
    [RequirePermission(TimesheetPermissions.Timesheets.View)]
    public async Task<ActionResult<IEnumerable<TimesheetEntryResponse>>> GetEntries(
        [FromQuery] Guid? userId, [FromQuery] DateOnly? dateFrom, [FromQuery] DateOnly? dateTo,
        [FromQuery] Guid? projectId, [FromQuery] TimesheetEntryStatus? status)
    {
        var tenantId = _currentUser.CurrentTenantId;
        if (!tenantId.HasValue) return BadRequest(new { error = "X-TenantId header required" });

        var query = _context.TimesheetEntries
            .Include(e => e.Project)
            .Include(e => e.Task)
            .Where(e => e.TenantId == tenantId.Value)
            .AsQueryable();

        if (userId.HasValue) query = query.Where(e => e.UserId == userId.Value);
        else if (!_currentUser.IsSuperAdmin) query = query.Where(e => e.UserId == _currentUser.UserId);
        if (dateFrom.HasValue) query = query.Where(e => e.Date >= dateFrom.Value);
        if (dateTo.HasValue) query = query.Where(e => e.Date <= dateTo.Value);
        if (projectId.HasValue) query = query.Where(e => e.ProjectId == projectId.Value);
        if (status.HasValue) query = query.Where(e => e.Status == status.Value);

        var entries = await query.OrderByDescending(e => e.Date).ThenBy(e => e.Project.Name)
            .Select(e => new TimesheetEntryResponse
            {
                Id = e.Id, UserId = e.UserId, UserDisplayName = e.UserDisplayName,
                ProjectId = e.ProjectId, ProjectName = e.Project.Name,
                TaskId = e.TaskId, TaskName = e.Task != null ? e.Task.Name : null,
                TicketId = e.TicketId, TicketSubject = e.TicketSubject,
                Date = e.Date, Hours = e.Hours,
                StartTime = e.StartTime, EndTime = e.EndTime, BreakMinutes = e.BreakMinutes,
                Notes = e.Notes, Status = e.Status, IsDone = e.IsDone
            }).Take(500).ToListAsync();

        return Ok(entries);
    }

    [HttpGet("{id}")]
    [RequirePermission(TimesheetPermissions.Timesheets.View)]
    public async Task<ActionResult<TimesheetEntryResponse>> GetEntry(Guid id)
    {
        var entry = await _context.TimesheetEntries.Include(e => e.Project).Include(e => e.Task).FirstOrDefaultAsync(e => e.Id == id);
        if (entry == null) return NotFound();
        return Ok(new TimesheetEntryResponse
        {
            Id = entry.Id, UserId = entry.UserId, UserDisplayName = entry.UserDisplayName,
            ProjectId = entry.ProjectId, ProjectName = entry.Project.Name,
            TaskId = entry.TaskId, TaskName = entry.Task?.Name,
            TicketId = entry.TicketId, TicketSubject = entry.TicketSubject,
            Date = entry.Date, Hours = entry.Hours,
            StartTime = entry.StartTime, EndTime = entry.EndTime, BreakMinutes = entry.BreakMinutes,
            Notes = entry.Notes, Status = entry.Status, IsDone = entry.IsDone
        });
    }

    [HttpPost]
    [RequirePermission(TimesheetPermissions.Timesheets.Create)]
    public async Task<ActionResult<TimesheetEntryResponse>> CreateEntry([FromBody] CreateTimesheetEntryRequest request)
    {
        var tenantId = _currentUser.CurrentTenantId;
        if (!tenantId.HasValue) return BadRequest(new { error = "X-TenantId header required" });

        var entry = new TimesheetEntry
        {
            TenantId = tenantId.Value, UserId = _currentUser.UserId,
            UserDisplayName = _currentUser.DisplayName,
            ProjectId = request.ProjectId, TaskId = request.TaskId,
            TicketId = request.TicketId, TicketSubject = request.TicketSubject,
            ApplicationId = request.ApplicationId, CategoryId = request.CategoryId,
            Date = request.Date, Hours = request.Hours,
            StartTime = request.StartTime, EndTime = request.EndTime,
            BreakMinutes = request.BreakMinutes, Notes = request.Notes
        };

        _context.TimesheetEntries.Add(entry);
        await _context.SaveChangesAsync();

        var project = await _context.Projects.FindAsync(entry.ProjectId);
        return CreatedAtAction(nameof(GetEntry), new { id = entry.Id }, new TimesheetEntryResponse
        {
            Id = entry.Id, UserId = entry.UserId, UserDisplayName = entry.UserDisplayName,
            ProjectId = entry.ProjectId, ProjectName = project?.Name ?? "",
            TaskId = entry.TaskId, Date = entry.Date, Hours = entry.Hours,
            Status = entry.Status, IsDone = entry.IsDone
        });
    }

    [HttpPut("{id}")]
    [RequirePermission(TimesheetPermissions.Timesheets.Update)]
    public async Task<IActionResult> UpdateEntry(Guid id, [FromBody] UpdateTimesheetEntryRequest request)
    {
        var entry = await _context.TimesheetEntries.FindAsync(id);
        if (entry == null) return NotFound();

        if (request.ProjectId.HasValue) entry.ProjectId = request.ProjectId.Value;
        if (request.TaskId.HasValue) entry.TaskId = request.TaskId;
        if (request.TicketId.HasValue) entry.TicketId = request.TicketId;
        if (request.TicketSubject != null) entry.TicketSubject = request.TicketSubject;
        if (request.Date.HasValue) entry.Date = request.Date.Value;
        if (request.Hours.HasValue) entry.Hours = request.Hours.Value;
        if (request.StartTime.HasValue) entry.StartTime = request.StartTime;
        if (request.EndTime.HasValue) entry.EndTime = request.EndTime;
        if (request.BreakMinutes.HasValue) entry.BreakMinutes = request.BreakMinutes.Value;
        if (request.Notes != null) entry.Notes = request.Notes;
        if (request.IsDone.HasValue) entry.IsDone = request.IsDone.Value;
        entry.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [RequirePermission(TimesheetPermissions.Timesheets.Delete)]
    public async Task<IActionResult> DeleteEntry(Guid id)
    {
        var entry = await _context.TimesheetEntries.FindAsync(id);
        if (entry == null) return NotFound();
        _context.TimesheetEntries.Remove(entry);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
