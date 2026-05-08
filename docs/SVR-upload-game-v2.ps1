param(
    [string]$RepoPath = "C:\Users\ronal\SVR-backend",
    [string]$ZipPath = "C:\Users\ronal\Downloads\game.zip",
    [string]$CommitMessage = "Update SVR game build",
    [switch]$AuditOnly
)

$ErrorActionPreference = "Stop"

function Write-Step($msg) {
    Write-Host ""
    Write-Host "== $msg ==" -ForegroundColor Cyan
}

function Fail($msg) {
    Write-Host ""
    Write-Host "FAILED: $msg" -ForegroundColor Red
    exit 1
}

function Run-Git {
    param([string[]]$Args)
    Write-Host "git $($Args -join ' ')" -ForegroundColor DarkCyan
    & git @Args
    if ($LASTEXITCODE -ne 0) {
        Fail "Git command failed: git $($Args -join ' ')"
    }
}

Write-Step "SVR upload preflight"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Fail "Git is not installed or not in PATH. Install Git for Windows, then reopen PowerShell."
}

if (!(Test-Path $RepoPath)) {
    Fail "Repo path not found: $RepoPath"
}

if (!(Test-Path $ZipPath)) {
    Fail "game.zip not found: $ZipPath"
}

$zipSize = (Get-Item $ZipPath).Length
$limit = 25MB
Write-Host "Zip size: $([math]::Round($zipSize / 1MB, 2)) MB"
if ($zipSize -ge $limit) {
    Fail "game.zip is too large. Must be under 25 MB."
}

Set-Location $RepoPath

if (!(Test-Path ".git")) {
    Fail "This folder is not a Git repo: $RepoPath"
}

Write-Step "Repo state"
Run-Git @("status", "--short")
Run-Git @("remote", "-v")
Run-Git @("branch", "--show-current")

# Recover from interrupted rebase if user wants audit only, do not mutate.
if (Test-Path ".git\rebase-merge" -or Test-Path ".git\rebase-apply") {
    Fail "A rebase is already in progress. Run: git rebase --abort"
}

if ($AuditOnly) {
    Write-Host "Audit-only mode complete. No files changed." -ForegroundColor Green
    exit 0
}

Write-Step "Sync main before replacing game.zip"
Run-Git @("config", "pull.rebase", "true")
Run-Git @("config", "rebase.autoStash", "true")
Run-Git @("fetch", "origin")
Run-Git @("checkout", "main")
Run-Git @("pull", "--rebase", "origin", "main")

Write-Step "Replace update/game.zip"
$targetDir = Join-Path $RepoPath "update"
if (!(Test-Path $targetDir)) {
    New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
}
$TargetZip = Join-Path $targetDir "game.zip"
Copy-Item $ZipPath $TargetZip -Force
Write-Host "Copied $ZipPath to $TargetZip" -ForegroundColor Green

Write-Step "Commit"
Run-Git @("add", "update/game.zip")

& git diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "No staged change detected. Nothing to commit." -ForegroundColor Yellow
} else {
    Run-Git @("commit", "-m", $CommitMessage)
}

Write-Step "Final sync and push"
Run-Git @("pull", "--rebase", "origin", "main")
Run-Git @("push", "origin", "main")

Write-Host ""
Write-Host "SVR upload complete. update/game.zip pushed to main." -ForegroundColor Green
