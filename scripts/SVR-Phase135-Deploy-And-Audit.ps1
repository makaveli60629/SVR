# SVR Phase 135 Deploy and Audit Workflow
# Run from the root of the SVR repository.
# Official workflow: GitHub + PowerShell + GitHub Actions / Auto Deploy.

$ErrorActionPreference = "Stop"

Write-Host "=== SVR Phase 135 Deploy and Audit ===" -ForegroundColor Cyan

if (-not (Test-Path ".git")) {
  Write-Host "ERROR: This script must be run from the root of the SVR git repository." -ForegroundColor Red
  Write-Host "Example: cd C:\Users\ronal\SVR" -ForegroundColor Yellow
  exit 1
}

Write-Host "`n[1/8] Pulling latest main..." -ForegroundColor Yellow
git pull origin main

Write-Host "`n[2/8] Checking for forbidden NewServer references..." -ForegroundColor Yellow
$scanPaths = @("index.html", "launch.css")
if (Test-Path "docs") {
  $scanPaths += (Get-ChildItem "docs" -Filter "*.md" -File | ForEach-Object { $_.FullName })
}
$forbidden = Select-String -Path $scanPaths -Pattern "NewServer", "curious-kelpie-b6bb99" -ErrorAction SilentlyContinue
if ($forbidden) {
  Write-Host "WARNING: Forbidden NewServer reference found:" -ForegroundColor Red
  $forbidden | ForEach-Object {
    Write-Host ("{0}:{1} {2}" -f $_.Path, $_.LineNumber, $_.Line) -ForegroundColor Red
  }
} else {
  Write-Host "OK: No NewServer references found in public launch/manifest files." -ForegroundColor Green
}

Write-Host "`n[3/8] Checking required files..." -ForegroundColor Yellow
$required = @(
  "index.html",
  "launch.css",
  "game\index.html",
  "game\main.js",
  "docs\SVR_VERSION_0_1_MASTER_BLUEPRINT.md",
  "docs\PHASE-135-MASTER-MANIFEST-DEPLOY-WORKFLOW-LOCK.md",
  "scripts\SVR-Phase135-Deploy-And-Audit.ps1",
  "update\version.json"
)
foreach ($file in $required) {
  if (Test-Path $file) {
    Write-Host "OK: $file" -ForegroundColor Green
  } else {
    Write-Host "MISSING: $file" -ForegroundColor Red
  }
}

Write-Host "`n[4/8] Current build marker..." -ForegroundColor Yellow
if (Test-Path "update\version.json") {
  Get-Content "update\version.json" | ForEach-Object { Write-Host $_ }
} else {
  Write-Host "MISSING: update\version.json" -ForegroundColor Red
}

Write-Host "`n[5/8] Git status..." -ForegroundColor Yellow
git status --short

Write-Host "`n[6/8] Optional commit helper" -ForegroundColor Yellow
Write-Host "If you have intentional local changes, run:" -ForegroundColor Cyan
Write-Host "git add index.html launch.css docs/SVR_VERSION_0_1_MASTER_BLUEPRINT.md docs/PHASE-135-MASTER-MANIFEST-DEPLOY-WORKFLOW-LOCK.md scripts/SVR-Phase135-Deploy-And-Audit.ps1 update/version.json" -ForegroundColor White
Write-Host 'git commit -m "Phase 135 master manifest deploy workflow lock"' -ForegroundColor White
Write-Host "git push origin main" -ForegroundColor White

Write-Host "`n[7/8] GitHub Actions reminder" -ForegroundColor Yellow
Write-Host "Open GitHub -> Actions -> Auto Deploy -> Run workflow -> main" -ForegroundColor Cyan

Write-Host "`n[8/8] Test URLs" -ForegroundColor Yellow
Write-Host "Public: https://svrpoker.com/?v=phase135-workflow-lock" -ForegroundColor White
Write-Host "Game:   https://svrpoker.com/game/?v=phase135-workflow-lock" -ForegroundColor White
Write-Host "Press Ctrl + F5 after opening each URL." -ForegroundColor White

Write-Host "`n=== Phase 135 audit complete ===" -ForegroundColor Cyan
