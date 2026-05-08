param(
    [string]$RepoPath = "C:\Users\ronal\SVR-backend",
    [string]$ZipPath = "C:\Users\ronal\Downloads\game.zip",
    [string]$CommitMessage = "Update game build"
)

$ErrorActionPreference = "Stop"

function Run-Git {
    param([string[]]$Args)
    Write-Host "git $($Args -join ' ')" -ForegroundColor Cyan
    & git @Args
    if ($LASTEXITCODE -ne 0) {
        throw "Git command failed: git $($Args -join ' ')"
    }
}

if (!(Test-Path $RepoPath)) {
    throw "Repo path not found: $RepoPath"
}

if (!(Test-Path $ZipPath)) {
    throw "game.zip not found: $ZipPath"
}

Set-Location $RepoPath

# Make pulls safer by default.
Run-Git @("config", "pull.rebase", "true")
Run-Git @("config", "rebase.autoStash", "true")

# Make sure we are on main and synced before modifying update/game.zip.
Run-Git @("fetch", "origin")
Run-Git @("checkout", "main")
Run-Git @("pull", "--rebase", "origin", "main")

# Replace deployed game package.
$TargetZip = Join-Path $RepoPath "update\game.zip"
Copy-Item $ZipPath $TargetZip -Force
Write-Host "Copied $ZipPath to $TargetZip" -ForegroundColor Green

Run-Git @("add", "update/game.zip")

# Commit only if there is actually a staged change.
& git diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "No changes detected in update/game.zip. Nothing to commit." -ForegroundColor Yellow
} else {
    Run-Git @("commit", "-m", $CommitMessage)
}

# Sync one more time in case GitHub changed while we were committing.
Run-Git @("pull", "--rebase", "origin", "main")
Run-Git @("push", "origin", "main")

Write-Host ""
Write-Host "Upload complete. update/game.zip is pushed to main." -ForegroundColor Green
