IF OBJECT_ID('dbo.GameSmokeTests', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.GameSmokeTests (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Build NVARCHAR(120) NOT NULL,
    Pass BIT NOT NULL DEFAULT 0,
    FailedCount INT NOT NULL DEFAULT 0,
    PayloadJson NVARCHAR(MAX) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;
GO
CREATE INDEX IX_GameSmokeTests_CreatedAt ON dbo.GameSmokeTests (CreatedAt DESC);
GO
