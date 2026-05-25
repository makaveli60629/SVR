IF OBJECT_ID('dbo.GameBridgeRecorderErrors', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.GameBridgeRecorderErrors (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    BuildLabel NVARCHAR(120) NOT NULL,
    EventName NVARCHAR(160) NULL,
    MethodName NVARCHAR(160) NULL,
    ErrorMessage NVARCHAR(MAX) NULL,
    PayloadJson NVARCHAR(MAX) NULL,
    CreatedAtUtc DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;
GO
