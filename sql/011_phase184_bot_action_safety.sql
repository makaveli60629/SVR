-- SVR Phase 185: Bot action safety and runtime recovery telemetry
IF OBJECT_ID('dbo.GameBotActionSafety', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.GameBotActionSafety (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    HandNumber INT NULL,
    Stage NVARCHAR(50) NULL,
    SeatIndex INT NULL,
    ActorName NVARCHAR(100) NULL,
    ActionName NVARCHAR(40) NULL,
    RequestedAmount INT NULL,
    PaidAmount INT NULL,
    PotAmount INT NULL,
    Payload NVARCHAR(MAX) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;
GO

IF OBJECT_ID('dbo.GameRuntimeRecovery', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.GameRuntimeRecovery (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    HandNumber INT NULL,
    Stage NVARCHAR(50) NULL,
    Message NVARCHAR(400) NULL,
    Payload NVARCHAR(MAX) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END;
GO
