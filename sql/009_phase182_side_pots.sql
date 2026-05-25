-- SVR Phase 183 side pot resolution storage
IF OBJECT_ID('dbo.GameSidePotResolutions', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.GameSidePotResolutions (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    HandNumber INT NULL,
    PayloadJson NVARCHAR(MAX) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_GameSidePotResolutions_CreatedAt')
  CREATE INDEX IX_GameSidePotResolutions_CreatedAt ON dbo.GameSidePotResolutions(CreatedAt DESC);
