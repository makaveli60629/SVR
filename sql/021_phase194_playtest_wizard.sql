IF OBJECT_ID('dbo.GamePlaytestWizardRuns', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.GamePlaytestWizardRuns (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Build NVARCHAR(160) NOT NULL,
    Pass BIT NULL,
    Reason NVARCHAR(140) NULL,
    ChecklistJson NVARCHAR(MAX) NULL,
    PayloadJson NVARCHAR(MAX) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_GamePlaytestWizardRuns_CreatedAt' AND object_id=OBJECT_ID('dbo.GamePlaytestWizardRuns'))
BEGIN
  CREATE INDEX IX_GamePlaytestWizardRuns_CreatedAt ON dbo.GamePlaytestWizardRuns (CreatedAt DESC);
END;
