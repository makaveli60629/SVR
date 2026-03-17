param([string]$VaultRoot = ".\SVR-Vault")
$ErrorActionPreference = "Stop"
$toolRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
& (Join-Path $toolRoot "Verify-SVRPack.ps1") -VaultRoot $VaultRoot
& (Join-Path $toolRoot "Build-SVRPack.ps1") -VaultRoot $VaultRoot -OutputRoot ".\build\game" -ZipPath ".\update\game.zip"
$report = @{version = "2.0.61"; rebuiltAtUtc = (Get-Date).ToUniversalTime().ToString("s") + "Z"; zipPath = ".\update\game.zip"; vaultRoot = $VaultRoot }
New-Item -ItemType Directory -Path ".\build" -Force | Out-Null
$report | ConvertTo-Json | Set-Content ".\build\diagnostics-report.json"
Write-Host "Recovery complete. Diagnostics written to .\build\diagnostics-report.json" -ForegroundColor Green
