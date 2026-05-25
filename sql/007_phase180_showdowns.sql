IF OBJECT_ID('GameShowdowns', 'U') IS NULL
BEGIN
  CREATE TABLE GameShowdowns (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    HandNumber INT NULL,
    Winner NVARCHAR(120) NULL,
    HandName NVARCHAR(120) NULL,
    WinningCards NVARCHAR(80) NULL,
    Board NVARCHAR(80) NULL,
    Pot INT NOT NULL DEFAULT 0,
    PayloadJson NVARCHAR(MAX) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_GameShowdowns_CreatedAt' AND object_id = OBJECT_ID('GameShowdowns'))
BEGIN
  CREATE INDEX IX_GameShowdowns_CreatedAt ON GameShowdowns(CreatedAt DESC);
END;
