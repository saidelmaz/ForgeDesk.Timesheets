using ForgeDesk.Timesheets.Application.DTOs;
using ForgeDesk.Timesheets.Application.Services;
using ForgeDesk.Timesheets.Domain.Entities;
using ForgeDesk.Timesheets.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ForgeDesk.Timesheets.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LeaveTypesController : ControllerBase
{
    private readonly TimesheetDbContext _context;
    private readonly ICurrentUserContext _currentUser;

    public LeaveTypesController(TimesheetDbContext context, ICurrentUserContext currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<List<LeaveTypeDto>>> GetAll()
    {
        var tenantId = _currentUser.CurrentTenantId;
        if (!tenantId.HasValue) return BadRequest(new { error = "X-TenantId header required" });

        var types = await _context.LeaveTypes
            .Where(t => t.TenantId == tenantId.Value && t.IsActive)
            .OrderBy(t => t.SortOrder)
            .Select(t => new LeaveTypeDto(
                t.Id, t.Name, t.Description, t.Color,
                t.DefaultDaysPerYear, t.RequiresApproval, t.IsPaid,
                t.IsActive, t.SortOrder))
            .ToListAsync();
        return Ok(types);
    }

    [HttpPost]
    public async Task<ActionResult<LeaveTypeDto>> Create(CreateLeaveTypeDto dto)
    {
        var tenantId = _currentUser.CurrentTenantId;
        if (!tenantId.HasValue) return BadRequest(new { error = "X-TenantId header required" });

        var entity = new LeaveType
        {
            TenantId = tenantId.Value,
            Name = dto.Name,
            Description = dto.Description,
            Color = dto.Color,
            DefaultDaysPerYear = dto.DefaultDaysPerYear,
            RequiresApproval = dto.RequiresApproval,
            IsPaid = dto.IsPaid,
            SortOrder = dto.SortOrder
        };
        _context.LeaveTypes.Add(entity);
        await _context.SaveChangesAsync();
        return Ok(new LeaveTypeDto(entity.Id, entity.Name, entity.Description, entity.Color,
            entity.DefaultDaysPerYear, entity.RequiresApproval, entity.IsPaid, entity.IsActive, entity.SortOrder));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<LeaveTypeDto>> Update(Guid id, CreateLeaveTypeDto dto)
    {
        var tenantId = _currentUser.CurrentTenantId;
        if (!tenantId.HasValue) return BadRequest(new { error = "X-TenantId header required" });

        var entity = await _context.LeaveTypes.FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId.Value);
        if (entity == null) return NotFound();

        entity.Name = dto.Name;
        entity.Description = dto.Description;
        entity.Color = dto.Color;
        entity.DefaultDaysPerYear = dto.DefaultDaysPerYear;
        entity.RequiresApproval = dto.RequiresApproval;
        entity.IsPaid = dto.IsPaid;
        entity.SortOrder = dto.SortOrder;
        await _context.SaveChangesAsync();

        return Ok(new LeaveTypeDto(entity.Id, entity.Name, entity.Description, entity.Color,
            entity.DefaultDaysPerYear, entity.RequiresApproval, entity.IsPaid, entity.IsActive, entity.SortOrder));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var tenantId = _currentUser.CurrentTenantId;
        if (!tenantId.HasValue) return BadRequest(new { error = "X-TenantId header required" });

        var entity = await _context.LeaveTypes.FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId.Value);
        if (entity == null) return NotFound();
        entity.IsActive = false;
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
