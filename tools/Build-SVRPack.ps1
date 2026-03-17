param([string]$VaultRoot = ".\SVR-Vault",[string]$OutputRoot = ".\build\game",[string]$ZipPath = ".\update\game.zip")
$ErrorActionPreference = "Stop"
function Get-ModuleRoot { param([string]$Preferred) if (Test-Path (Join-Path $Preferred "modules")) { return (Resolve-Path $Preferred).Path } if (Test-Path ".\modules") { return (Resolve-Path ".\").Path } throw "Module vault not found. Put the unpacked vault at .\SVR-Vault or place modules beside this script." }
$resolvedVault = Get-ModuleRoot -Preferred $VaultRoot
$moduleRoot = Join-Path $resolvedVault "modules"
$manifestPath = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) "..\manifests\modules.json"
$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
if (Test-Path $OutputRoot) { Remove-Item $OutputRoot -Recurse -Force }
New-Item -ItemType Directory -Path $OutputRoot -Force | Out-Null
foreach ($module in $manifest.modules) { $payload = Join-Path (Join-Path $moduleRoot $module.name) "payload"; if (-not (Test-Path $payload)) { if ($module.required) { throw "Missing required module payload: $($module.name)" } else { Write-Host "Skipping optional missing module $($module.name)" -ForegroundColor Yellow; continue } } Write-Host "Applying module $($module.name)" -ForegroundColor Cyan; Copy-Item (Join-Path $payload "*") $OutputRoot -Recurse -Force }
$zipDir = Split-Path -Parent $ZipPath
if (-not (Test-Path $zipDir)) { New-Item -ItemType Directory -Path $zipDir -Force | Out-Null }
if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }
Compress-Archive -Path (Join-Path $OutputRoot "*") -DestinationPath $ZipPath -Force
Write-Host "Built $ZipPath from module vault $resolvedVault" -ForegroundColor Green
