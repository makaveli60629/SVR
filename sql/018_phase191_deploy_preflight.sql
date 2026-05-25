IF OBJECT_ID('dbo.GameDeployPreflight', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.GameDeployPreflight (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Build NVARCHAR(120) NOT NULL,
    Pass BIT NOT NULL DEFAULT 0,
    PayloadJson NVARCHAR(MAX) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;
GO
CREATE INDEX IX_GameDeployPreflight_CreatedAt ON dbo.GameDeployPreflight (CreatedAt DESC);
GO
