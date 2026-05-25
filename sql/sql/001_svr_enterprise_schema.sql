-- SVR Poker Phase 174 Enterprise Schema
-- Run in Azure SQL Query Editor. Do not place secrets in frontend files.

IF OBJECT_ID('SiteMessages','U') IS NULL
CREATE TABLE SiteMessages (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  Name NVARCHAR(120) NULL,
  Email NVARCHAR(180) NULL,
  Topic NVARCHAR(80) NULL,
  Message NVARCHAR(MAX) NOT NULL,
  Status NVARCHAR(40) NOT NULL DEFAULT 'new',
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

IF OBJECT_ID('AdminStatus','U') IS NULL
CREATE TABLE AdminStatus (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  IsOnline BIT NOT NULL DEFAULT 0,
  DisplayName NVARCHAR(120) NULL,
  UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

IF OBJECT_ID('StoreProducts','U') IS NULL
CREATE TABLE StoreProducts (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  Sku NVARCHAR(80) NOT NULL UNIQUE,
  Title NVARCHAR(160) NOT NULL,
  Description NVARCHAR(MAX) NULL,
  Category NVARCHAR(80) NULL,
  PriceCents INT NOT NULL DEFAULT 0,
  Currency NVARCHAR(8) NOT NULL DEFAULT 'usd',
  ImageUrl NVARCHAR(500) NULL,
  IsVisible BIT NOT NULL DEFAULT 1,
  IsCheckoutEnabled BIT NOT NULL DEFAULT 0,
  SortOrder INT NOT NULL DEFAULT 100,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

IF OBJECT_ID('SponsorshipCampaigns','U') IS NULL
CREATE TABLE SponsorshipCampaigns (
  CampaignId UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  SponsorName NVARCHAR(160) NOT NULL,
  LogoUrl NVARCHAR(500) NULL,
  AdType NVARCHAR(80) NOT NULL,
  TargetAmount DECIMAL(12,2) NOT NULL DEFAULT 0,
  RaisedAmount DECIMAL(12,2) NOT NULL DEFAULT 0,
  Status NVARCHAR(40) NOT NULL DEFAULT 'pending',
  ComplianceNotes NVARCHAR(MAX) NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

IF OBJECT_ID('CharityAllocations','U') IS NULL
CREATE TABLE CharityAllocations (
  AllocationId UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
  CampaignId UNIQUEIDENTIFIER NULL,
  CauseCategory NVARCHAR(80) NOT NULL,
  PayoutPercentage INT NOT NULL DEFAULT 0,
  VerifiedTxId NVARCHAR(255) NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

IF OBJECT_ID('GameHandResults','U') IS NULL
CREATE TABLE GameHandResults (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  PayloadJson NVARCHAR(MAX) NOT NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

IF OBJECT_ID('AnalyticsEvents','U') IS NULL
CREATE TABLE AnalyticsEvents (
  Id BIGINT IDENTITY(1,1) PRIMARY KEY,
  EventName NVARCHAR(120) NOT NULL,
  PayloadJson NVARCHAR(MAX) NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

IF NOT EXISTS (SELECT 1 FROM StoreProducts WHERE Sku='svr-watch-skin-alpha')
INSERT INTO StoreProducts(Sku,Title,Description,Category,PriceCents,IsCheckoutEnabled,SortOrder)
VALUES
('svr-watch-skin-alpha','SVR Watch Skin Alpha','Preview cosmetic item. Checkout disabled until approval.','cosmetic',0,0,10),
('svr-glove-neon','SVR Neon Glove Preview','Preview avatar glove cosmetic. Checkout disabled until approval.','cosmetic',0,0,20),
('sponsor-billboard-preview','Sponsor Billboard Preview','Preview placement for approved sponsors only.','sponsor',0,0,30);
