IF OBJECT_ID('dbo.GameContributions', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.GameContributions (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Build NVARCHAR(80) NULL,
    HandNumber INT NULL,
    PlayerName NVARCHAR(100) NULL,
    SeatIndex INT NULL,
    Paid INT NOT NULL DEFAULT 0,
    Requested INT NOT NULL DEFAULT 0,
    Stage NVARCHAR(50) NULL,
    Pot INT NOT NULL DEFAULT 0,
    PayloadJson NVARCHAR(MAX) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_GameContributions_CreatedAt' AND object_id = OBJECT_ID('dbo.GameContributions'))
  CREATE INDEX IX_GameContributions_CreatedAt ON dbo.GameContributions (CreatedAt DESC);
