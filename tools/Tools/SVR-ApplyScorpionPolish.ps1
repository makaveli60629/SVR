param(
  [string]$RepoRoot = (Get-Location).Path,
  [string]$ManifestPath = "Manifest\room-polish.scorpion-premium.json"
)

$ErrorActionPreference = "Stop"

function Write-Step($Message) {
  Write-Host "[SVR] $Message" -ForegroundColor Cyan
}

function Ensure-Dir($Path) {
  if (-not (Test-Path $Path)) {
    New-Item -ItemType Directory -Path $Path -Force | Out-Null
  }
}

function Backup-IfExists($Path, $BackupRoot) {
  if (Test-Path $Path) {
    $relative = Resolve-Path $Path
    $dest = Join-Path $BackupRoot ((Split-Path $Path -Leaf) + ".bak")
    Copy-Item $Path $dest -Force
    return $dest
  }
  return $null
}

Set-Location $RepoRoot
$FullManifestPath = Join-Path $RepoRoot $ManifestPath
if (-not (Test-Path $FullManifestPath)) {
  throw "Manifest not found: $FullManifestPath"
}

Write-Step "Reading manifest: $ManifestPath"
$Manifest = Get-Content $FullManifestPath -Raw | ConvertFrom-Json
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$BackupRoot = Join-Path $RepoRoot "Backups\scorpion-premium-polish-$timestamp"
Ensure-Dir $BackupRoot

$targets = @(
  "GameData\Rooms\scorpion-premium-polish.json",
  "GameData\UI\scorpion-poker-ui.json",
  "GameData\Poker\scorpion-actions.json",
  "GameData\Camera\scorpion-camera3-tour.json",
  "GameData\Audio\scorpion-sound-cues.json",
  "Reports\scorpion-premium-polish-report.txt"
)

$backedUp = @()
foreach ($target in $targets) {
  $full = Join-Path $RepoRoot $target
  $backup = Backup-IfExists $full $BackupRoot
  if ($backup) { $backedUp += $backup }
}

Ensure-Dir (Join-Path $RepoRoot "GameData\Rooms")
Ensure-Dir (Join-Path $RepoRoot "GameData\UI")
Ensure-Dir (Join-Path $RepoRoot "GameData\Poker")
Ensure-Dir (Join-Path $RepoRoot "GameData\Camera")
Ensure-Dir (Join-Path $RepoRoot "GameData\Audio")
Ensure-Dir (Join-Path $RepoRoot "Reports")

Write-Step "Writing Scorpion premium polish data files"

$roomData = [ordered]@{
  roomId = "scorpion-room"
  phase = "PHASE-32-SCORPION-PREMIUM-POKER-POLISH-LOCK"
  premiumAtmosphere = $Manifest.features.roomAtmosphere
  tablePolish = $Manifest.features.tablePolish
  locks = $Manifest.locks
}
$roomData | ConvertTo-Json -Depth 20 | Set-Content "GameData\Rooms\scorpion-premium-polish.json" -Encoding UTF8

$uiData = [ordered]@{
  roomId = "scorpion-room"
  potLabel = $true
  activeTurnRing = $true
  actionTimerSeconds = 20
  winnerBanner = $true
  winningHandText = $true
  handHistoryStrip = $true
  watchAlert = "YOUR TURN"
  readability = "large-vr-friendly"
}
$uiData | ConvertTo-Json -Depth 20 | Set-Content "GameData\UI\scorpion-poker-ui.json" -Encoding UTF8

$actionData = [ordered]@{
  roomId = "scorpion-room"
  actions = @("Fold", "Check", "Call", "Raise", "All-In", "Next Hand")
  keyboard = [ordered]@{ Fold="F"; Check="K"; Call="C"; Raise="R"; AllIn="A"; NextHand="H" }
  timeout = [ordered]@{ seconds=20; noBet="auto-check"; facingBet="auto-fold" }
}
$actionData | ConvertTo-Json -Depth 20 | Set-Content "GameData\Poker\scorpion-actions.json" -Encoding UTF8

$cameraData = [ordered]@{
  roomId = "scorpion-room"
  camera3 = [ordered]@{
    enabled = $true
    loop = $true
    speed = "slow"
    shots = @("table-close-up", "chip-stacks", "community-cards", "active-player", "city-overlook", "scorpion-sign", "winner-sweep")
  }
}
$cameraData | ConvertTo-Json -Depth 20 | Set-Content "GameData\Camera\scorpion-camera3-tour.json" -Encoding UTF8

$audioData = [ordered]@{
  roomId = "scorpion-room"
  autoplay = $false
  unlock = "user-interaction-or-xr-session"
  cues = @("chip-click", "chip-stack", "card-slide", "card-flip", "timer-warning", "winner-sweep", "soft-room-ambience")
}
$audioData | ConvertTo-Json -Depth 20 | Set-Content "GameData\Audio\scorpion-sound-cues.json" -Encoding UTF8

$reportLines = @()
$reportLines += "SVR Scorpion Room Premium Poker Polish Report"
$reportLines += "Timestamp: $(Get-Date -Format o)"
$reportLines += "Phase: $($Manifest.phaseNumber) - $($Manifest.phaseName)"
$reportLines += "Update ID: $($Manifest.updateId)"
$reportLines += ""
$reportLines += "Created/Updated:"
foreach ($target in $targets | Where-Object { $_ -notlike 'Reports*' }) {
  $reportLines += "- $target"
}
$reportLines += ""
$reportLines += "Backups:"
if ($backedUp.Count -gt 0) {
  foreach ($b in $backedUp) { $reportLines += "- $b" }
} else {
  $reportLines += "- No prior target files found."
}
$reportLines += ""
$reportLines += "Validation:"
$reportLines += "- Site untouched: $($Manifest.locks.siteUntouched)"
$reportLines += "- Preserve original lobby: $($Manifest.locks.preserveOriginalLobby)"
$reportLines += "- Private Scorpion room only: $($Manifest.locks.scorpionPrivateRoomOnly)"
$reportLines += "- Dealer body disabled: $($Manifest.locks.dealerBodyDisabled)"
$reportLines += "- Left-to-right dealing: $($Manifest.locks.leftToRightDealing)"
$reportLines += "- Action timer seconds: 20"
$reportLines += ""
$reportLines += "Next code pass: wire these data files into the Scorpion private room runtime module only."

$reportPath = "Reports\scorpion-premium-polish-report.txt"
$reportLines | Set-Content $reportPath -Encoding UTF8

Write-Host "Complete. Report written to: $reportPath" -ForegroundColor Green
