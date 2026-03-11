namespace ForgeDesk.Timesheets.Domain.Constants;

public static class TimesheetPermissions
{
    public const string All = "*";

    public static class Timesheets
    {
        public const string View = "timesheets.view";
        public const string ViewAll = "timesheets.view_all";
        public const string Create = "timesheets.create";
        public const string Update = "timesheets.update";
        public const string Approve = "timesheets.approve";
        public const string Delete = "timesheets.delete";
    }

    public static class Projects
    {
        public const string View = "projects.view";
        public const string Manage = "projects.manage";
    }

    public static class Reports
    {
        public const string View = "reports.view";
        public const string Export = "reports.export";
    }
}
