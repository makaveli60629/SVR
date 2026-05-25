IF OBJECT_ID('dbo.GameTestQueue', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.GameTestQueue (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Build NVARCHAR(120) NOT NULL,
    Phase INT NOT NULL,
    Priority NVARCHAR(40) NULL,
    PayloadJson NVARCHAR(MAX) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;
CREATE INDEX IX_GameTestQueue_CreatedAt ON dbo.GameTestQueue (CreatedAt DESC);
