IF OBJECT_ID('dbo.GameOneCommandDeployHealth','U') IS NULL
BEGIN
  CREATE TABLE dbo.GameOneCommandDeployHealth (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    BuildLabel NVARCHAR(120) NOT NULL,
    Payload NVARCHAR(MAX) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;
