param([string]$VaultRoot = ".\SVR-Vault")
$ErrorActionPreference = "Stop"
function Get-ModuleRoot { param([string]$Preferred) if (Test-Path (Join-Path $Preferred "modules")) { return (Resolve-Path $Preferred).Path } if (Test-Path ".\modules") { return (Resolve-Path ".\").Path } throw "Module vault not found. Put the unpacked vault at .\SVR-Vault or place modules beside this script." }
$resolvedVault = Get-ModuleRoot -Preferred $VaultRoot
$moduleRoot = Join-Path $resolvedVault "modules"
$manifestPath = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) "..\manifests\modules.json"
$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
$fail = $false
foreach ($module in $manifest.modules) { $payload = Join-Path (Join-Path $moduleRoot $module.name) "payload"; if (Test-Path $payload) { Write-Host "[OK] $($module.name)" -ForegroundColor Green } elseif ($module.required) { Write-Host "[MISSING REQUIRED] $($module.name)" -ForegroundColor Red; $fail = $true } else { Write-Host "[MISSING OPTIONAL] $($module.name)" -ForegroundColor Yellow } }
if ($fail) { throw "One or more required modules are missing." }
Write-Host "Module verify passed." -ForegroundColor Green
