IF OBJECT_ID('dbo.BridgeHealthReports', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.BridgeHealthReports (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    PayloadJson NVARCHAR(MAX) NOT NULL
  );
END;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_BridgeHealthReports_CreatedAt' AND object_id=OBJECT_ID('dbo.BridgeHealthReports'))
  CREATE INDEX IX_BridgeHealthReports_CreatedAt ON dbo.BridgeHealthReports(CreatedAt DESC);
