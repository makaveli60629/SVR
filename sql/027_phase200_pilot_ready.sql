IF OBJECT_ID('dbo.GamePilotReadyReports', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.GamePilotReadyReports (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    BuildLabel NVARCHAR(120) NOT NULL,
    Readiness NVARCHAR(80) NULL,
    ScorePercent INT NULL,
    Payload NVARCHAR(MAX) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;
CREATE INDEX IX_GamePilotReadyReports_CreatedAt ON dbo.GamePilotReadyReports(CreatedAt DESC);
