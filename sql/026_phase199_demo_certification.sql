-- PHASE-199-DEMO-CERTIFICATION-LOCK
IF OBJECT_ID('dbo.DemoCertificationReports', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.DemoCertificationReports (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    PayloadJson NVARCHAR(MAX) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;
GO
CREATE INDEX IX_DemoCertificationReports_CreatedAt ON dbo.DemoCertificationReports (CreatedAt DESC);
GO
