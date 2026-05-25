IF OBJECT_ID('dbo.GameBridgeProxyReports', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.GameBridgeProxyReports (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    Build NVARCHAR(100) NULL,
    ProxyActive BIT NULL,
    Payload NVARCHAR(MAX) NULL
  );
END;
