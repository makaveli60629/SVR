IF OBJECT_ID('GameActionLog', 'U') IS NULL
BEGIN
  CREATE TABLE GameActionLog (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    EventType NVARCHAR(80) NOT NULL DEFAULT 'action_log',
    PayloadJson NVARCHAR(MAX) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_GameActionLog_CreatedAt' AND object_id = OBJECT_ID('GameActionLog'))
BEGIN
  CREATE INDEX IX_GameActionLog_CreatedAt ON GameActionLog(CreatedAt DESC);
END;
