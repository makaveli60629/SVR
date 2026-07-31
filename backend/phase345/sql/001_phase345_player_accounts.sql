SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF OBJECT_ID('dbo.Players','U') IS NULL
BEGIN
  CREATE TABLE dbo.Players (
    PlayerId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Players PRIMARY KEY,
    DisplayName NVARCHAR(40) NOT NULL,
    Email NVARCHAR(255) NOT NULL,
    Role NVARCHAR(30) NOT NULL CONSTRAINT DF_Players_Role DEFAULT 'player',
    PlayMoney BIGINT NOT NULL CONSTRAINT DF_Players_PlayMoney DEFAULT 50000,
    DailyStreak INT NOT NULL CONSTRAINT DF_Players_DailyStreak DEFAULT 0,
    LastRewardClaimAt DATETIME2 NULL,
    AvatarUrl NVARCHAR(1000) NULL,
    EquippedOutfitJson NVARCHAR(MAX) NULL CONSTRAINT CK_Players_EquippedOutfitJson CHECK (EquippedOutfitJson IS NULL OR ISJSON(EquippedOutfitJson)=1),
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Players_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Players_UpdatedAt DEFAULT SYSUTCDATETIME(),
    LastLoginAt DATETIME2 NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_Players_IsActive DEFAULT 1,
    CONSTRAINT UQ_Players_Email UNIQUE (Email),
    CONSTRAINT CK_Players_PlayMoney CHECK (PlayMoney >= 0)
  );
END;

IF OBJECT_ID('dbo.PlayerCredentials','U') IS NULL
BEGIN
  CREATE TABLE dbo.PlayerCredentials (
    PlayerId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_PlayerCredentials PRIMARY KEY,
    PasswordHash NVARCHAR(255) NOT NULL,
    PasswordUpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_PlayerCredentials_Updated DEFAULT SYSUTCDATETIME(),
    FailedLoginCount INT NOT NULL CONSTRAINT DF_PlayerCredentials_Failed DEFAULT 0,
    LockedUntil DATETIME2 NULL,
    CONSTRAINT FK_PlayerCredentials_Player FOREIGN KEY (PlayerId) REFERENCES dbo.Players(PlayerId) ON DELETE CASCADE
  );
END;

IF OBJECT_ID('dbo.PlayerInventory','U') IS NULL
BEGIN
  CREATE TABLE dbo.PlayerInventory (
    ItemId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_PlayerInventory PRIMARY KEY DEFAULT NEWID(),
    PlayerId UNIQUEIDENTIFIER NOT NULL,
    ItemType NVARCHAR(50) NOT NULL,
    AssetUrl NVARCHAR(1000) NULL,
    Quantity INT NOT NULL CONSTRAINT DF_PlayerInventory_Quantity DEFAULT 1,
    Equipped BIT NOT NULL CONSTRAINT DF_PlayerInventory_Equipped DEFAULT 0,
    MetadataJson NVARCHAR(MAX) NULL CONSTRAINT CK_PlayerInventory_MetadataJson CHECK (MetadataJson IS NULL OR ISJSON(MetadataJson)=1),
    AcquiredAt DATETIME2 NOT NULL CONSTRAINT DF_PlayerInventory_AcquiredAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_PlayerInventory_Player FOREIGN KEY (PlayerId) REFERENCES dbo.Players(PlayerId) ON DELETE CASCADE,
    CONSTRAINT CK_PlayerInventory_Quantity CHECK (Quantity >= 0)
  );
  CREATE INDEX IX_PlayerInventory_PlayerId ON dbo.PlayerInventory(PlayerId);
END;

IF OBJECT_ID('dbo.GameSessions','U') IS NULL
BEGIN
  CREATE TABLE dbo.GameSessions (
    SessionId UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_GameSessions PRIMARY KEY,
    PlayerId UNIQUEIDENTIFIER NOT NULL,
    Platform NVARCHAR(20) NOT NULL,
    MetadataJson NVARCHAR(MAX) NULL CONSTRAINT CK_GameSessions_MetadataJson CHECK (MetadataJson IS NULL OR ISJSON(MetadataJson)=1),
    StartedAt DATETIME2 NOT NULL CONSTRAINT DF_GameSessions_StartedAt DEFAULT SYSUTCDATETIME(),
    LastHeartbeatAt DATETIME2 NOT NULL CONSTRAINT DF_GameSessions_Heartbeat DEFAULT SYSUTCDATETIME(),
    ActiveSeconds INT NOT NULL CONSTRAINT DF_GameSessions_ActiveSeconds DEFAULT 0,
    HeartbeatCount INT NOT NULL CONSTRAINT DF_GameSessions_HeartbeatCount DEFAULT 0,
    EndedAt DATETIME2 NULL,
    CONSTRAINT FK_GameSessions_Player FOREIGN KEY (PlayerId) REFERENCES dbo.Players(PlayerId) ON DELETE CASCADE,
    CONSTRAINT CK_GameSessions_ActiveSeconds CHECK (ActiveSeconds >= 0),
    CONSTRAINT CK_GameSessions_HeartbeatCount CHECK (HeartbeatCount >= 0)
  );
  CREATE INDEX IX_GameSessions_PlayerStarted ON dbo.GameSessions(PlayerId,StartedAt) INCLUDE (ActiveSeconds,HeartbeatCount,EndedAt);
END;

IF OBJECT_ID('dbo.DailyRewardClaims','U') IS NULL
BEGIN
  CREATE TABLE dbo.DailyRewardClaims (
    ClaimId BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_DailyRewardClaims PRIMARY KEY,
    PlayerId UNIQUEIDENTIFIER NOT NULL,
    RewardDate DATE NOT NULL,
    RewardChips INT NOT NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_DailyRewardClaims_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_DailyRewardClaims_Player FOREIGN KEY (PlayerId) REFERENCES dbo.Players(PlayerId) ON DELETE CASCADE,
    CONSTRAINT UQ_DailyRewardClaims_PlayerDate UNIQUE (PlayerId,RewardDate),
    CONSTRAINT CK_DailyRewardClaims_RewardChips CHECK (RewardChips > 0)
  );
END;

IF OBJECT_ID('dbo.PlayerActivityEvents','U') IS NULL
BEGIN
  CREATE TABLE dbo.PlayerActivityEvents (
    EventId BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_PlayerActivityEvents PRIMARY KEY,
    PlayerId UNIQUEIDENTIFIER NOT NULL,
    SessionId UNIQUEIDENTIFIER NULL,
    EventName NVARCHAR(80) NOT NULL,
    MetadataJson NVARCHAR(MAX) NULL CONSTRAINT CK_PlayerActivityEvents_MetadataJson CHECK (MetadataJson IS NULL OR ISJSON(MetadataJson)=1),
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_PlayerActivityEvents_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_PlayerActivityEvents_Player FOREIGN KEY (PlayerId) REFERENCES dbo.Players(PlayerId),
    CONSTRAINT FK_PlayerActivityEvents_Session FOREIGN KEY (SessionId) REFERENCES dbo.GameSessions(SessionId)
  );
  CREATE INDEX IX_PlayerActivityEvents_PlayerCreated ON dbo.PlayerActivityEvents(PlayerId,CreatedAt DESC);
END;

COMMIT TRANSACTION;
