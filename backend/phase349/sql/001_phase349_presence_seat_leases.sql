SET XACT_ABORT ON;
GO

IF OBJECT_ID('dbo.PlayerPresence','U') IS NULL
BEGIN
  CREATE TABLE dbo.PlayerPresence (
    RoomId nvarchar(80) NOT NULL,
    PlayerId uniqueidentifier NOT NULL,
    SessionId uniqueidentifier NOT NULL,
    ClientId nvarchar(100) NOT NULL,
    Platform nvarchar(20) NOT NULL,
    AvatarJson nvarchar(max) NULL,
    PoseJson nvarchar(max) NULL,
    SeatId tinyint NULL,
    ConnectedAt datetime2(3) NOT NULL CONSTRAINT DF_PlayerPresence_ConnectedAt DEFAULT SYSUTCDATETIME(),
    LastHeartbeatAt datetime2(3) NOT NULL CONSTRAINT DF_PlayerPresence_LastHeartbeatAt DEFAULT SYSUTCDATETIME(),
    ExpiresAt datetime2(3) NOT NULL,
    IsActive bit NOT NULL CONSTRAINT DF_PlayerPresence_IsActive DEFAULT 1,
    CONSTRAINT PK_PlayerPresence PRIMARY KEY (RoomId, PlayerId),
    CONSTRAINT FK_PlayerPresence_Player FOREIGN KEY (PlayerId) REFERENCES dbo.Players(PlayerId),
    CONSTRAINT CK_PlayerPresence_Seat CHECK (SeatId IS NULL OR SeatId BETWEEN 0 AND 5),
    CONSTRAINT CK_PlayerPresence_Platform CHECK (Platform IN ('android','quest','desktop','web')),
    CONSTRAINT CK_PlayerPresence_AvatarJson CHECK (AvatarJson IS NULL OR ISJSON(AvatarJson)=1),
    CONSTRAINT CK_PlayerPresence_PoseJson CHECK (PoseJson IS NULL OR ISJSON(PoseJson)=1)
  );
  CREATE UNIQUE INDEX UX_PlayerPresence_SessionId ON dbo.PlayerPresence(SessionId);
  CREATE INDEX IX_PlayerPresence_RoomActive ON dbo.PlayerPresence(RoomId,IsActive,ExpiresAt) INCLUDE(PlayerId,SeatId,LastHeartbeatAt);
END;
GO

IF OBJECT_ID('dbo.PlayerSeatLeases','U') IS NULL
BEGIN
  CREATE TABLE dbo.PlayerSeatLeases (
    RoomId nvarchar(80) NOT NULL,
    SeatId tinyint NOT NULL,
    PlayerId uniqueidentifier NOT NULL,
    SessionId uniqueidentifier NOT NULL,
    ClaimedAt datetime2(3) NOT NULL CONSTRAINT DF_PlayerSeatLeases_ClaimedAt DEFAULT SYSUTCDATETIME(),
    ExpiresAt datetime2(3) NOT NULL,
    CONSTRAINT PK_PlayerSeatLeases PRIMARY KEY(RoomId,SeatId),
    CONSTRAINT FK_PlayerSeatLeases_Player FOREIGN KEY(PlayerId) REFERENCES dbo.Players(PlayerId),
    CONSTRAINT CK_PlayerSeatLeases_Seat CHECK(SeatId BETWEEN 0 AND 5)
  );
  CREATE UNIQUE INDEX UX_PlayerSeatLeases_PlayerRoom ON dbo.PlayerSeatLeases(RoomId,PlayerId);
  CREATE INDEX IX_PlayerSeatLeases_ExpiresAt ON dbo.PlayerSeatLeases(ExpiresAt);
END;
GO

IF OBJECT_ID('dbo.PlayerPresenceEvents','U') IS NULL
BEGIN
  CREATE TABLE dbo.PlayerPresenceEvents (
    EventId bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
    RoomId nvarchar(80) NOT NULL,
    PlayerId uniqueidentifier NOT NULL,
    SessionId uniqueidentifier NULL,
    EventType nvarchar(40) NOT NULL,
    SeatId tinyint NULL,
    MetadataJson nvarchar(max) NULL,
    CreatedAt datetime2(3) NOT NULL CONSTRAINT DF_PlayerPresenceEvents_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_PlayerPresenceEvents_Player FOREIGN KEY(PlayerId) REFERENCES dbo.Players(PlayerId),
    CONSTRAINT CK_PlayerPresenceEvents_Metadata CHECK(MetadataJson IS NULL OR ISJSON(MetadataJson)=1)
  );
  CREATE INDEX IX_PlayerPresenceEvents_PlayerTime ON dbo.PlayerPresenceEvents(PlayerId,CreatedAt DESC);
  CREATE INDEX IX_PlayerPresenceEvents_RoomTime ON dbo.PlayerPresenceEvents(RoomId,CreatedAt DESC);
END;
GO
