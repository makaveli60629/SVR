$ErrorActionPreference = "Stop"
$targets = @( ".\update\game.zip", ".\manifests\modules.json", ".\tools\Build-SVRPack.ps1", ".\tools\Verify-SVRPack.ps1", ".\tools\Recover-SVRPack.ps1" )
$missing = @()
foreach ($target in $targets) { if (Test-Path $target) { Write-Host "[OK] $target" -ForegroundColor Green } else { Write-Host "[MISSING] $target" -ForegroundColor Red; $missing += $target } }
if ($missing.Count -gt 0) { throw "Repo bundle is incomplete." }
Write-Host "Repo bundle diagnostics passed." -ForegroundColor Green
