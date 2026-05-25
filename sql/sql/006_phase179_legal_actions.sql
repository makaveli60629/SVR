IF OBJECT_ID('GameLegalActions', 'U') IS NULL
BEGIN
  CREATE TABLE GameLegalActions (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    HandNumber INT NULL,
    Stage NVARCHAR(80) NULL,
    CallAmount INT NOT NULL DEFAULT 0,
    OptionsJson NVARCHAR(MAX) NOT NULL,
    PayloadJson NVARCHAR(MAX) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_GameLegalActions_CreatedAt' AND object_id = OBJECT_ID('GameLegalActions'))
BEGIN
  CREATE INDEX IX_GameLegalActions_CreatedAt ON GameLegalActions(CreatedAt DESC);
END;
