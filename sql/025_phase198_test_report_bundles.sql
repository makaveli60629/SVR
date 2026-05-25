IF OBJECT_ID('dbo.GameTestReportBundles', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.GameTestReportBundles (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Build NVARCHAR(120) NOT NULL,
    ReportJson NVARCHAR(MAX) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_GameTestReportBundles_CreatedAt' AND object_id=OBJECT_ID('dbo.GameTestReportBundles'))
BEGIN
  CREATE INDEX IX_GameTestReportBundles_CreatedAt ON dbo.GameTestReportBundles (CreatedAt DESC);
END;
