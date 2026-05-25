IF OBJECT_ID('dbo.GameSessionExports', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.GameSessionExports (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    BuildLabel NVARCHAR(120) NULL,
    EventCount INT NULL,
    Payload NVARCHAR(MAX) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_GameSessionExports_CreatedAt' AND object_id = OBJECT_ID('dbo.GameSessionExports'))
BEGIN
  CREATE INDEX IX_GameSessionExports_CreatedAt ON dbo.GameSessionExports(CreatedAt DESC);
END;
GO
