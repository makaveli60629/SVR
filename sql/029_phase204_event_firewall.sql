IF OBJECT_ID('dbo.EventFirewallReports', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.EventFirewallReports (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    BuildLabel NVARCHAR(120) NOT NULL,
    ReportType NVARCHAR(80) NOT NULL,
    Payload NVARCHAR(MAX) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;
GO
CREATE INDEX IX_EventFirewallReports_CreatedAt ON dbo.EventFirewallReports(CreatedAt DESC);
GO
