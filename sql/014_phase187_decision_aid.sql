IF OBJECT_ID('dbo.GameDecisionAid', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.GameDecisionAid (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    HandNumber INT NULL,
    Stage NVARCHAR(80) NULL,
    CallAmount INT NOT NULL DEFAULT 0,
    PotAmount INT NOT NULL DEFAULT 0,
    PotOddsPct INT NOT NULL DEFAULT 0,
    PressureLabel NVARCHAR(80) NULL,
    HintText NVARCHAR(255) NULL,
    PayloadJson NVARCHAR(MAX) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_GameDecisionAid_CreatedAt' AND object_id=OBJECT_ID('dbo.GameDecisionAid'))
  CREATE INDEX IX_GameDecisionAid_CreatedAt ON dbo.GameDecisionAid(CreatedAt DESC);
GO
