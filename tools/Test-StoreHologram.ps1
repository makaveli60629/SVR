$ErrorActionPreference = "Stop"

$ModulePath = ".\game\modules\hubs\store_hologram.js"

if (!(Test-Path $ModulePath)) {
  throw "Missing store hologram module: $ModulePath"
}

$content = Get-Content $ModulePath -Raw

$required = @(
  "export function addStoreHologram",
  "export function tickStoreHologram",
  "svr_store_preview_selected",
  "https://svrpoker.com/site/store.html",
  "checkoutEnabled: false",
  "SVR VR STORE"
)

foreach ($needle in $required) {
  if ($content -notlike "*$needle*") {
    throw "Store hologram test failed. Missing: $needle"
  }
}

if ($content -like "*50K CHIPS*" -or $content -like "*500K CHIPS*" -or $content -like "*`$9.99*" -or $content -like "*`$49.99*" -or $content -like "*svr_wallet_update*") {
  throw "Store hologram safety test failed. Unsafe purchase/chip text found."
}

Write-Host "STORE HOLOGRAM TEST PASSED" -ForegroundColor Green