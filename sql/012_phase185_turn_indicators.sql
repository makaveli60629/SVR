IF OBJECT_ID('dbo.GameTurnIndicators', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.GameTurnIndicators (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    HandNumber INT NULL,
    SeatIndex INT NULL,
    ActorName NVARCHAR(120) NULL,
    Stage NVARCHAR(80) NULL,
    ActionName NVARCHAR(80) NULL,
    RemainingSeconds INT NULL,
    PotAmount INT NULL,
    PayloadJson NVARCHAR(MAX) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_GameTurnIndicators_CreatedAt' AND object_id = OBJECT_ID('dbo.GameTurnIndicators'))
BEGIN
  CREATE INDEX IX_GameTurnIndicators_CreatedAt ON dbo.GameTurnIndicators(CreatedAt DESC);
END;
GO
