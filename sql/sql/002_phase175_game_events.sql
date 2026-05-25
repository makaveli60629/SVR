-- SVR Phase 175 game/session event extensions
IF OBJECT_ID('dbo.GameHandResults', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.GameHandResults (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    SessionId NVARCHAR(100) NULL,
    WinnerName NVARCHAR(100) NULL,
    HandName NVARCHAR(100) NULL,
    PotAmount INT NULL,
    BoardCards NVARCHAR(200) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;

IF OBJECT_ID('dbo.GameTelemetryEvents', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.GameTelemetryEvents (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    EventType NVARCHAR(100) NOT NULL,
    Payload NVARCHAR(MAX) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;
