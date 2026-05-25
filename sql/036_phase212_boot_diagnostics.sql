IF OBJECT_ID('dbo.GameBootDiagnostics', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.GameBootDiagnostics (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    PayloadJson NVARCHAR(MAX) NOT NULL
  );
END;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_GameBootDiagnostics_CreatedAt' AND object_id=OBJECT_ID('dbo.GameBootDiagnostics'))
BEGIN
  CREATE INDEX IX_GameBootDiagnostics_CreatedAt ON dbo.GameBootDiagnostics (CreatedAt DESC);
END;
