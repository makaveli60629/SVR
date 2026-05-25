IF OBJECT_ID('dbo.GameBugReports', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.GameBugReports (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Build NVARCHAR(160) NOT NULL,
    Phase INT NOT NULL DEFAULT 195,
    Reason NVARCHAR(140) NULL,
    Area NVARCHAR(120) NULL,
    Severity NVARCHAR(80) NULL,
    Device NVARCHAR(240) NULL,
    Notes NVARCHAR(MAX) NULL,
    PayloadJson NVARCHAR(MAX) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_GameBugReports_CreatedAt' AND object_id=OBJECT_ID('dbo.GameBugReports'))
BEGIN
  CREATE INDEX IX_GameBugReports_CreatedAt ON dbo.GameBugReports (CreatedAt DESC);
END;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_GameBugReports_Severity' AND object_id=OBJECT_ID('dbo.GameBugReports'))
BEGIN
  CREATE INDEX IX_GameBugReports_Severity ON dbo.GameBugReports (Severity, CreatedAt DESC);
END;
