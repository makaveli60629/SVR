-- Phase 177 hand history / stack lock support
IF OBJECT_ID('GameHandResults', 'U') IS NOT NULL
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_GameHandResults_CreatedAt' AND object_id=OBJECT_ID('GameHandResults'))
    CREATE INDEX IX_GameHandResults_CreatedAt ON GameHandResults(CreatedAt DESC);
END;

IF OBJECT_ID('GameTelemetry', 'U') IS NOT NULL
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_GameTelemetry_CreatedAt' AND object_id=OBJECT_ID('GameTelemetry'))
    CREATE INDEX IX_GameTelemetry_CreatedAt ON GameTelemetry(CreatedAt DESC);
END;
