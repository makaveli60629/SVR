-- Phase 183 folded/mucked player eligibility log
IF OBJECT_ID('dbo.GameFoldEligibility', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.GameFoldEligibility (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    HandNumber INT NULL,
    FoldedPlayersJson NVARCHAR(MAX) NULL,
    PayloadJson NVARCHAR(MAX) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_GameFoldEligibility_CreatedAt' AND object_id = OBJECT_ID('dbo.GameFoldEligibility'))
BEGIN
  CREATE INDEX IX_GameFoldEligibility_CreatedAt ON dbo.GameFoldEligibility(CreatedAt DESC);
END;
