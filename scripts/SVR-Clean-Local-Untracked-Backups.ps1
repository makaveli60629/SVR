# SVR Local Untracked Backup Cleanup
# Run from the root of the SVR repository.
# This script does NOT delete files. It moves safe local untracked backup artifacts
# into a timestamped local archive folder so git status becomes clean.
#
# Dry run:
#   powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\SVR-Clean-Local-Untracked-Backups.ps1
# Apply:
#   powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\SVR-Clean-Local-Untracked-Backups.ps1 -Apply

param(
  [switch]$Apply
)

$ErrorActionPreference = "Stop"

Write-Host "=== SVR Local Untracked Backup Cleanup ===" -ForegroundColor Cyan

if (-not (Test-Path ".git")) {
  Write-Host "ERROR: Run this from the root of the SVR git repository." -ForegroundColor Red
  Write-Host "Example: cd C:\Users\ronal\SVR" -ForegroundColor Yellow
  exit 1
}

$archiveRoot = "_local_untracked_archive"
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$archiveDir = Join-Path $archiveRoot $stamp

$gitStatus = git status --porcelain
$untracked = @()
foreach ($line in $gitStatus) {
  if ($line.StartsWith("?? ")) {
    $path = $line.Substring(3).Trim()
    if ($path) { $untracked += $path }
  }
}

if ($untracked.Count -eq 0) {
  Write-Host "OK: No untracked files found." -ForegroundColor Green
  exit 0
}

$safePatterns = @(
  "*.bak",
  "*.bak-*",
  "*.backup",
  "*.tmp",
  "*~",
  "update/*.zip.bak*",
  "api/*.bak*",
  "*.log",
  "tatus"
)

$reviewOnlyPatterns = @(
  "api/package-lock.json",
  "package-lock.json"
)

$safeToMove = New-Object System.Collections.Generic.List[string]
$reviewOnly = New-Object System.Collections.Generic.List[string]

foreach ($path in $untracked) {
  $normalized = $path -replace "\\", "/"
  $isReviewOnly = $false
  foreach ($pattern in $reviewOnlyPatterns) {
    if ($normalized -like $pattern) { $isReviewOnly = $true; break }
  }
  if ($isReviewOnly) {
    $reviewOnly.Add($path)
    continue
  }

  $isSafe = $false
  foreach ($pattern in $safePatterns) {
    if ($normalized -like $pattern) { $isSafe = $true; break }
  }
  if ($isSafe) { $safeToMove.Add($path) }
  else { $reviewOnly.Add($path) }
}

Write-Host "`nSafe local backup artifacts:" -ForegroundColor Yellow
if ($safeToMove.Count -eq 0) {
  Write-Host "  none" -ForegroundColor DarkGray
} else {
  foreach ($path in $safeToMove) { Write-Host "  MOVE: $path" -ForegroundColor Green }
}

Write-Host "`nReview manually before touching:" -ForegroundColor Yellow
if ($reviewOnly.Count -eq 0) {
  Write-Host "  none" -ForegroundColor DarkGray
} else {
  foreach ($path in $reviewOnly) { Write-Host "  REVIEW: $path" -ForegroundColor Magenta }
}

if (-not $Apply) {
  Write-Host "`nDRY RUN ONLY. Nothing was moved." -ForegroundColor Cyan
  Write-Host "To apply safe cleanup, run:" -ForegroundColor Cyan
  Write-Host "powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\SVR-Clean-Local-Untracked-Backups.ps1 -Apply" -ForegroundColor White
  exit 0
}

if ($safeToMove.Count -eq 0) {
  Write-Host "No safe files to move." -ForegroundColor Green
  exit 0
}

New-Item -ItemType Directory -Force -Path $archiveDir | Out-Null

foreach ($path in $safeToMove) {
  if (-not (Test-Path $path)) { continue }
  $target = Join-Path $archiveDir $path
  $targetParent = Split-Path $target -Parent
  if ($targetParent) { New-Item -ItemType Directory -Force -Path $targetParent | Out-Null }
  Move-Item -Force -Path $path -Destination $target
}

Write-Host "`nMoved safe backup artifacts to: $archiveDir" -ForegroundColor Green
Write-Host "`nNew git status:" -ForegroundColor Yellow
git status --short

Write-Host "`nIf review-only files remain, inspect them before deleting or committing." -ForegroundColor Cyan
Write-Host "For example: api/package-lock.json may be legitimate if the API package changed." -ForegroundColor Cyan
