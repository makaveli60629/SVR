IF OBJECT_ID('dbo.RuntimeCrashShieldReports', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.RuntimeCrashShieldReports (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    BuildLabel NVARCHAR(120) NULL,
    Source NVARCHAR(120) NULL,
    Message NVARCHAR(1000) NULL,
    PayloadJson NVARCHAR(MAX) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;
GO
CREATE INDEX IX_RuntimeCrashShieldReports_CreatedAt ON dbo.RuntimeCrashShieldReports(CreatedAt DESC);
GO
