IF OBJECT_ID('dbo.GameReleaseCandidateChecks', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.GameReleaseCandidateChecks (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Build NVARCHAR(160) NOT NULL,
    Pass BIT NOT NULL DEFAULT 0,
    FailedCount INT NOT NULL DEFAULT 0,
    Reason NVARCHAR(120) NULL,
    PayloadJson NVARCHAR(MAX) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_GameReleaseCandidateChecks_CreatedAt')
BEGIN
  CREATE INDEX IX_GameReleaseCandidateChecks_CreatedAt ON dbo.GameReleaseCandidateChecks (CreatedAt DESC);
END;
GO
