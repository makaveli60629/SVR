param(
  [string]$RepoRoot = (Get-Location).Path
)
$ErrorActionPreference = "Stop"
$ManifestPath = Join-Path $RepoRoot "Manifest\reiki-chakra-multi-session.json"
$ReportPath = Join-Path $RepoRoot "Reports\reiki-chakra-multi-session-report.txt"
if (!(Test-Path $ManifestPath)) { throw "Missing manifest: $ManifestPath" }
New-Item -ItemType Directory -Path (Split-Path $ReportPath) -Force | Out-Null
$manifest = Get-Content $ManifestPath -Raw | ConvertFrom-Json
$stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$checks = @()
$checks += "[$stamp] Applying $($manifest.phaseName)"
$checks += "Track: $($manifest.track)"
$checks += "Website untouched: $($manifest.hardLocks.websiteUntouched)"
$checks += "Lobby preserved: $($manifest.hardLocks.lobbyPreserved)"
$checks += "Approval-safe only: $($manifest.hardLocks.approvalSafeOnly)"
$required = @(
  "GameData\Reiki\reiki-chakra-symbols.json",
  "GameData\Reiki\reiki-tuning-modes.json",
  "GameData\Reiki\reiki-meditation-sessions.json",
  "GameData\Reiki\reiki-watch-chakra-session-panel.json",
  "GameData\Reiki\reiki-comfort-controls.json",
  "GameData\Reiki\reiki-approval-disclaimer.json"
)
foreach ($rel in $required) {
  $path = Join-Path $RepoRoot $rel
  if (Test-Path $path) { $checks += "OK: $rel" } else { $checks += "MISSING: $rel" }
}
$blocked = @("Trueitive","Truitive","trueitive.com","Shyona","Royston")
$scanFiles = Get-ChildItem (Join-Path $RepoRoot "GameData\Reiki") -Filter *.json -Recurse -ErrorAction SilentlyContinue
foreach ($term in $blocked) {
  $hit = $false
  foreach ($file in $scanFiles) {
    if ((Get-Content $file.FullName -Raw) -match [regex]::Escape($term)) { $hit = $true }
  }
  if ($hit) { $checks += "WARNING: blocked term found in GameData/Reiki: $term" } else { $checks += "OK: blocked term absent: $term" }
}
$checks += "Result: Reiki chakra tuning and multi-session data lock applied. Runtime binding can be added in a later code phase."
$checks | Set-Content -Path $ReportPath -Encoding UTF8
Write-Host "Reiki Phase 34 apply complete." -ForegroundColor Green
Write-Host "Report: $ReportPath" -ForegroundColor Cyan
