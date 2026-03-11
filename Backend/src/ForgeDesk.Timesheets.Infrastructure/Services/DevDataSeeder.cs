using ForgeDesk.Timesheets.Domain.Entities;
using ForgeDesk.Timesheets.Domain.Enums;
using ForgeDesk.Timesheets.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ForgeDesk.Timesheets.Infrastructure.Services;

public static class DevDataSeeder
{
    public static async Task SeedAsync(TimesheetDbContext context)
    {
        if (await context.Users.AnyAsync()) return;

        // Create tenant
        var tenant = new AppTenant { Name = "Arco Information" };
        context.Tenants.Add(tenant);

        // Create admin user (password: Admin123!)
        var admin = new AppUser
        {
            Email = "admin@arco.be",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
            FirstName = "Said",
            LastName = "El Mazghari"
        };
        context.Users.Add(admin);
        context.TenantUsers.Add(new AppTenantUser { UserId = admin.Id, TenantId = tenant.Id, Role = UserRole.TenantAdmin });

        // Create employee user
        var emp = new AppUser
        {
            Email = "dev@arco.be",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Dev123!"),
            FirstName = "John",
            LastName = "Developer"
        };
        context.Users.Add(emp);
        context.TenantUsers.Add(new AppTenantUser { UserId = emp.Id, TenantId = tenant.Id, Role = UserRole.Employee });

        // Schedules for both users
        foreach (var userId in new[] { admin.Id, emp.Id })
        {
            for (int day = 0; day < 7; day++)
            {
                context.UserSchedules.Add(new UserSchedule
                {
                    TenantId = tenant.Id, UserId = userId, DayOfWeek = day,
                    ScheduledHours = (day >= 1 && day <= 5) ? 8.0m : 0,
                    IsWorkingDay = day >= 1 && day <= 5
                });
            }
        }

        // Projects
        var proj1 = new Project { TenantId = tenant.Id, Name = "Product - Ontwikkeling Arco Software Suite", CustomerName = "Arco Information", BaselineHours = 500, PlannedHours = 400, PlanningColor = "#4CAF50" };
        var proj2 = new Project { TenantId = tenant.Id, Name = "ELIC-O ePDF Rework", CustomerName = "Arco Information", BaselineHours = 100, PlannedHours = 80, PlanningColor = "#2196F3" };
        var proj3 = new Project { TenantId = tenant.Id, Name = "Cevi - Setup CAAS", CustomerName = "Cevi", BaselineHours = 40, PlannedHours = 40, PlanningColor = "#FF9800" };
        context.Projects.AddRange(proj1, proj2, proj3);

        // Tasks
        var task1 = new ProjectTask { TenantId = tenant.Id, ProjectId = proj1.Id, Name = "Suite - General", PlannedHours = 200, SortOrder = 1 };
        var task2 = new ProjectTask { TenantId = tenant.Id, ProjectId = proj1.Id, Name = "Product management", PlannedHours = 100, SortOrder = 2 };
        var task3 = new ProjectTask { TenantId = tenant.Id, ProjectId = proj2.Id, Name = "ePdf Rework", PlannedHours = 80, SortOrder = 1 };
        var task4 = new ProjectTask { TenantId = tenant.Id, ProjectId = proj3.Id, Name = "Config", PlannedHours = 40, SortOrder = 1 };
        context.ProjectTasks.AddRange(task1, task2, task3, task4);

        // Sample timesheet entries for current week
        var today = DateOnly.FromDateTime(DateTime.Today);
        var monday = today.AddDays(-(int)today.DayOfWeek + 1);
        if (today.DayOfWeek == DayOfWeek.Sunday) monday = monday.AddDays(-7);

        for (int d = 0; d < 5 && monday.AddDays(d) <= today; d++)
        {
            context.TimesheetEntries.Add(new TimesheetEntry
            {
                TenantId = tenant.Id, UserId = admin.Id, ProjectId = proj1.Id, TaskId = task1.Id,
                Date = monday.AddDays(d), Hours = 6, Status = TimesheetEntryStatus.Draft,
                UserDisplayName = "Said El Mazghari"
            });
            context.TimesheetEntries.Add(new TimesheetEntry
            {
                TenantId = tenant.Id, UserId = admin.Id, ProjectId = proj2.Id, TaskId = task3.Id,
                Date = monday.AddDays(d), Hours = 2, Status = TimesheetEntryStatus.Draft,
                UserDisplayName = "Said El Mazghari"
            });
        }

        await context.SaveChangesAsync();

        // Seed leave types
        if (!context.LeaveTypes.Any())
        {
            var annualLeave = new LeaveType
            {
                TenantId = tenant.Id,
                Name = "Annual Leave",
                Description = "Standard annual vacation days",
                Color = "#4f46e5",
                DefaultDaysPerYear = 20,
                RequiresApproval = true,
                IsPaid = true,
                SortOrder = 1
            };
            var sickLeave = new LeaveType
            {
                TenantId = tenant.Id,
                Name = "Sick Leave",
                Description = "Medical or health related absence",
                Color = "#f59e0b",
                DefaultDaysPerYear = 10,
                RequiresApproval = false,
                IsPaid = true,
                SortOrder = 2
            };
            var unpaidLeave = new LeaveType
            {
                TenantId = tenant.Id,
                Name = "Unpaid Leave",
                Description = "Leave without pay",
                Color = "#64748b",
                DefaultDaysPerYear = 0,
                RequiresApproval = true,
                IsPaid = false,
                SortOrder = 3
            };
            var compensatory = new LeaveType
            {
                TenantId = tenant.Id,
                Name = "Compensatory Leave",
                Description = "Time off in lieu of overtime worked",
                Color = "#0d9488",
                DefaultDaysPerYear = 0,
                RequiresApproval = true,
                IsPaid = true,
                SortOrder = 4
            };

            context.LeaveTypes.AddRange(annualLeave, sickLeave, unpaidLeave, compensatory);
            await context.SaveChangesAsync();

            // Seed leave balances for current year
            var currentYear = DateTime.UtcNow.Year;
            var adminUser = context.Users.First(u => u.Email == "admin@arco.be");
            var employeeUser = context.Users.First(u => u.Email == "dev@arco.be");

            var balances = new List<LeaveBalance>
            {
                new() { TenantId = tenant.Id, UserId = adminUser.Id, LeaveTypeId = annualLeave.Id, Year = currentYear, TotalDays = 20, UsedDays = 3, PendingDays = 0 },
                new() { TenantId = tenant.Id, UserId = adminUser.Id, LeaveTypeId = sickLeave.Id, Year = currentYear, TotalDays = 10, UsedDays = 1, PendingDays = 0 },
                new() { TenantId = tenant.Id, UserId = employeeUser.Id, LeaveTypeId = annualLeave.Id, Year = currentYear, TotalDays = 20, UsedDays = 5, PendingDays = 2 },
                new() { TenantId = tenant.Id, UserId = employeeUser.Id, LeaveTypeId = sickLeave.Id, Year = currentYear, TotalDays = 10, UsedDays = 2, PendingDays = 0 },
            };
            context.LeaveBalances.AddRange(balances);

            // Seed a sample leave request
            var leaveRequest = new LeaveRequest
            {
                TenantId = tenant.Id,
                UserId = employeeUser.Id,
                UserDisplayName = "John Developer",
                LeaveTypeId = annualLeave.Id,
                StartDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(14)),
                EndDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(15)),
                TotalDays = 2,
                Reason = "Family vacation",
                Status = LeaveStatus.Pending
            };
            context.LeaveRequests.Add(leaveRequest);
            await context.SaveChangesAsync();
        }
    }
}
