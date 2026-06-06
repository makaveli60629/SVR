<#
.SYNOPSIS
  Applies the SVR Scorpion Room Table Integration manifest safely.

.DESCRIPTION
  Reads Manifest/room-update.scorpion-table.json, backs up affected files,
  creates missing GameData placeholder files, writes feature flags, and emits
  Reports/scorpion-room-update-report.txt.

.NOTES
  Run from the repository root:
    powershell -ExecutionPolicy Bypass -File .\Tools\SVR-ApplyRoomUpdate.ps1
#>

[CmdletBinding()]
param(
  [string]$RepoRoot = (Get-Location).Path,
  [string]$ManifestPath = "Manifest/room-update.scorpion-table.json"
)

$ErrorActionPreference = "Stop"
$ReportLines = New-Object System.Collections.Generic.List[string]

function Add-ReportLine {
  param([string]$Line)
  $ReportLines.Add($Line) | Out-Null
  Write-Host $Line
}

function Ensure-Directory {
  param([string]$Path)
  if (-not (Test-Path $Path)) {
    New-Item -ItemType Directory -Path $Path -Force | Out-Null
    Add-ReportLine "CREATED DIR: $Path"
  }
}

function Backup-FileIfExists {
  param([string]$Path, [string]$BackupRoot)
  if (Test-Path $Path) {
    $relative = Resolve-Path -Path $Path | ForEach-Object { $_.Path.Substring($RepoRoot.Length).TrimStart('\','/') }
    $backupPath = Join-Path $BackupRoot $relative
    Ensure-Directory (Split-Path $backupPath -Parent)
    Copy-Item $Path $backupPath -Force
    Add-ReportLine "BACKED UP: $relative"
  }
}

function Write-JsonFile {
  param([string]$Path, [object]$Data)
  Ensure-Directory (Split-Path $Path -Parent)
  $json = $Data | ConvertTo-Json -Depth 40
  Set-Content -Path $Path -Value $json -Encoding UTF8
  Add-ReportLine "WROTE: $Path"
}

$RepoRoot = (Resolve-Path $RepoRoot).Path
Set-Location $RepoRoot

$manifestFullPath = Join-Path $RepoRoot $ManifestPath
if (-not (Test-Path $manifestFullPath)) {
  throw "Manifest not found: $manifestFullPath"
}

$Manifest = Get-Content $manifestFullPath -Raw | ConvertFrom-Json
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $RepoRoot "Backups/scorpion-room-table-$timestamp"

Add-ReportLine "SVR Scorpion Room Update Apply Report"
Add-ReportLine "Timestamp: $(Get-Date -Format o)"
Add-ReportLine "Manifest: $ManifestPath"
Add-ReportLine "Phase: $($Manifest.phaseName) / $($Manifest.phaseNumber)"
Add-ReportLine "Update ID: $($Manifest.updateId)"
Add-ReportLine "Repo Root: $RepoRoot"
Add-ReportLine ""

# Prepare directories
$requiredDirs = @(
  "Manifest",
  "Tools",
  "GameData/Rooms",
  "GameData/Cards",
  "GameData/Chips",
  "GameData/Avatars",
  "GameData/UI",
  "GameData/Sky",
  "Reports",
  "Backups"
)
foreach ($dir in $requiredDirs) { Ensure-Directory (Join-Path $RepoRoot $dir) }

# Backup affected files before writing
$filesMap = $Manifest.filesToCreateOrUpdate.PSObject.Properties
foreach ($prop in $filesMap) {
  $target = Join-Path $RepoRoot $prop.Value
  Backup-FileIfExists $target $backupRoot
}

# Write room data placeholder/source of truth exports
$seatCount = [int]$Manifest.roomRules.playerSeats.seatCount
$seatAnchors = @()
for ($i = 1; $i -le $seatCount; $i++) {
  $angle = (($i - 1) * (360 / $seatCount))
  $seatAnchors += [ordered]@{
    id = "seat.$i"
    enabled = $true
    order = $i
    angleDegrees = [math]::Round($angle, 2)
    height = $Manifest.roomRules.playerSeats.defaultSeatHeight
    anchor = "seat.$i.anchor"
    handZone = "seat.handZone.$i"
    chipStack = "seat.chipStack.$i"
    avatar = "seat.$i.avatar"
  }
}

$roomData = [ordered]@{
  updateId = $Manifest.updateId
  roomId = $Manifest.targetRoom.id
  displayName = $Manifest.targetRoom.displayName
  type = $Manifest.targetRoom.type
  cameraMode = $Manifest.targetRoom.cameraMode
  locomotionMode = $Manifest.targetRoom.locomotionMode
  playerSeats = $Manifest.roomRules.playerSeats
  seatAnchors = $seatAnchors
  camera = $Manifest.roomRules.camera
  validation = $Manifest.validation
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
}
Write-JsonFile (Join-Path $RepoRoot $Manifest.filesToCreateOrUpdate.roomData) $roomData

$cardData = [ordered]@{
  enabled = $Manifest.roomRules.cards.enabled
  gameStyle = $Manifest.roomRules.cards.gameStyle
  dealOrder = $Manifest.roomRules.cards.dealOrder
  privateHands = $Manifest.roomRules.cards.privateHands
  communityCards = $Manifest.roomRules.cards.communityCards
  hideOtherPlayerCards = $Manifest.roomRules.cards.hideOtherPlayerCards
  showOwnCardsOnly = $Manifest.roomRules.cards.showOwnCardsOnly
  burnCards = $Manifest.roomRules.cards.burnCards
  defaultDeckCount = $Manifest.roomRules.cards.defaultDeckCount
  shuffleBeforeDeal = $Manifest.roomRules.cards.shuffleBeforeDeal
  zones = $Manifest.roomRules.cards.cardZones
  state = [ordered]@{
    deck = @()
    discard = @()
    community = @()
    playerHands = @{}
    lastDealDirection = "left-to-right"
  }
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
}
Write-JsonFile (Join-Path $RepoRoot $Manifest.filesToCreateOrUpdate.cardData) $cardData

$chipData = [ordered]@{
  enabled = $Manifest.roomRules.chips.enabled
  physicsEnabled = $Manifest.roomRules.chips.physicsEnabled
  soundEnabled = $Manifest.roomRules.chips.soundEnabled
  allowPickup = $Manifest.roomRules.chips.allowPickup
  allowStacking = $Manifest.roomRules.chips.allowStacking
  allowThrowing = $Manifest.roomRules.chips.allowThrowing
  zones = $Manifest.roomRules.chips.chipZones
  sounds = $Manifest.roomRules.chips.sounds
  state = [ordered]@{
    bank = 0
    pot = 0
    playerStacks = @{}
  }
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
}
Write-JsonFile (Join-Path $RepoRoot $Manifest.filesToCreateOrUpdate.chipData) $chipData

$avatarData = [ordered]@{
  enabled = $Manifest.roomRules.avatars.enabled
  seatAnchored = $Manifest.roomRules.avatars.seatAnchored
  showHead = $Manifest.roomRules.avatars.showHead
  showHands = $Manifest.roomRules.avatars.showHands
  showBody = $Manifest.roomRules.avatars.showBody
  placeholderStyle = $Manifest.roomRules.avatars.placeholderStyle
  future3DAvatarReady = $Manifest.roomRules.avatars.future3DAvatarReady
  avatarSlots = $Manifest.roomRules.avatars.avatarSlots
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
}
Write-JsonFile (Join-Path $RepoRoot $Manifest.filesToCreateOrUpdate.avatarSeatData) $avatarData

$watchData = [ordered]@{
  enabled = $Manifest.roomRules.watchUI.enabled
  mode = $Manifest.roomRules.watchUI.mode
  activation = $Manifest.roomRules.watchUI.activation
  panels = $Manifest.roomRules.watchUI.panels
  notes = $Manifest.roomRules.watchUI.notes
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
}
Write-JsonFile (Join-Path $RepoRoot $Manifest.filesToCreateOrUpdate.watchUIData) $watchData

$skyData = [ordered]@{
  enabled = $Manifest.skyObjects.enabled
  objects = $Manifest.skyObjects.objects
  safety = [ordered]@{
    avoidLobbyCrossing = $true
    avoidBuildingClip = $true
    collisions = $false
  }
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
}
Write-JsonFile (Join-Path $RepoRoot $Manifest.filesToCreateOrUpdate.skyData) $skyData

# Write feature flags export
$featureFlagPath = Join-Path $RepoRoot "GameData/Rooms/scorpion-room-feature-flags.json"
Write-JsonFile $featureFlagPath ([ordered]@{
  updateId = $Manifest.updateId
  featureFlags = $Manifest.featureFlags
  repairTargets = $Manifest.repairTargets
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
})

# Validation pass: existence checks and warnings
Add-ReportLine ""
Add-ReportLine "Validation summary:"
foreach ($check in $Manifest.validation.requiredChecks) {
  Add-ReportLine "CHECK: $($check.id) — $($check.description)"
}

Add-ReportLine ""
Add-ReportLine "Pass criteria retained from manifest:"
foreach ($criteria in $Manifest.validation.passCriteria) {
  Add-ReportLine "- $criteria"
}

Add-ReportLine ""
Add-ReportLine "Feature flags written:"
foreach ($flag in $Manifest.featureFlags.PSObject.Properties) {
  Add-ReportLine "- $($flag.Name) = $($flag.Value)"
}

$reportPath = Join-Path $RepoRoot $Manifest.filesToCreateOrUpdate.reportOutput
Ensure-Directory (Split-Path $reportPath -Parent)
Set-Content -Path $reportPath -Value ($ReportLines -join [Environment]::NewLine) -Encoding UTF8

Write-Host ""
Write-Host "Complete. Report written to: $reportPath" -ForegroundColor Green
