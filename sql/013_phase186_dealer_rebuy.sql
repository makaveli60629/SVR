IF OBJECT_ID('dbo.GameDealerButtonEvents', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.GameDealerButtonEvents (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    PayloadJson NVARCHAR(MAX) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID('dbo.GameRebuyEvents', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.GameRebuyEvents (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    PayloadJson NVARCHAR(MAX) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_GameDealerButtonEvents_CreatedAt')
  CREATE INDEX IX_GameDealerButtonEvents_CreatedAt ON dbo.GameDealerButtonEvents(CreatedAt DESC);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_GameRebuyEvents_CreatedAt')
  CREATE INDEX IX_GameRebuyEvents_CreatedAt ON dbo.GameRebuyEvents(CreatedAt DESC);
