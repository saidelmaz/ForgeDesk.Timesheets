using ForgeDesk.Timesheets.Application.DTOs;
using ForgeDesk.Timesheets.Application.Services;
using ForgeDesk.Timesheets.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ForgeDesk.Timesheets.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class IntegrationController : ControllerBase
{
    private readonly TimesheetDbContext _context;
    private readonly ICurrentUserContext _currentUser;

    public IntegrationController(TimesheetDbContext context, ICurrentUserContext currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    [HttpGet("companies")]
    public async Task<ActionResult<IEnumerable<FDCompany>>> GetCompanies()
    {
        // Standalone mode: return distinct customer names from projects as companies
        var tenantId = _currentUser.CurrentTenantId;
        var projects = await _context.Projects
            .Where(p => tenantId.HasValue ? p.TenantId == tenantId.Value : true)
            .Where(p => p.CustomerName != null)
            .Select(p => new { p.CustomerId, p.CustomerName })
            .Distinct().ToListAsync();

        return Ok(projects.Select(p => new FDCompany
        {
            Id = p.CustomerId ?? Guid.NewGuid(),
            Name = p.CustomerName ?? "",
            IsActive = true
        }));
    }

    [HttpGet("users")]
    public async Task<ActionResult<IEnumerable<FDUser>>> GetUsers()
    {
        var users = await _context.Users.Where(u => u.IsActive).ToListAsync();
        return Ok(users.Select(u => new FDUser
        {
            Id = u.Id, Email = u.Email, FirstName = u.FirstName, LastName = u.LastName
        }));
    }

    [HttpGet("tickets")]
    public ActionResult<IEnumerable<FDTicket>> GetTickets()
    {
        // Placeholder - in production this would call ForgeDesk API
        return Ok(Array.Empty<FDTicket>());
    }

    [HttpGet("applications")]
    public ActionResult<IEnumerable<FDApplication>> GetApplications()
    {
        return Ok(Array.Empty<FDApplication>());
    }

    [HttpGet("categories")]
    public ActionResult<IEnumerable<FDCategory>> GetCategories()
    {
        return Ok(Array.Empty<FDCategory>());
    }
}
