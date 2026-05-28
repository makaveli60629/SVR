param(
    [int]$Port = 5177
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

Write-Host "[SVR] Starting from $Root" -ForegroundColor Cyan

if (Test-Path ".\package.json") {
    $pkg = Get-Content ".\package.json" -Raw | ConvertFrom-Json
    $scripts = @()

    if ($pkg.PSObject.Properties.Name -contains "scripts") {
        $scripts = $pkg.scripts.PSObject.Properties.Name
    }

    if ($scripts -contains "dev") {
        Write-Host "[SVR] Running npm run dev" -ForegroundColor Green
        npm run dev
        exit
    }

    if ($scripts -contains "start") {
        Write-Host "[SVR] Running npm start" -ForegroundColor Green
        npm start
        exit
    }
}

$index = $null

foreach ($candidate in @(".\dist\index.html", ".\build\index.html", ".\public\index.html", ".\index.html")) {
    if (Test-Path $candidate) {
        $index = Resolve-Path $candidate
        break
    }
}

if (-not $index) {
    Write-Host "[SVR] No index.html found." -ForegroundColor Red
    exit 1
}

$serveDir = Split-Path $index -Parent
Set-Location $serveDir

$url = "http://localhost:$Port/index.html?svrClear=1&svr=$(Get-Date -Format yyyyMMddHHmmss)"
Write-Host "[SVR] Opening $url" -ForegroundColor Green
Start-Process $url

if (Get-Command py -ErrorAction SilentlyContinue) {
    py -m http.server $Port
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    python -m http.server $Port
} elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
    python3 -m http.server $Port
} else {
    Write-Host "[SVR] Python was not found. Opening file directly instead." -ForegroundColor Yellow
    Start-Process $index
}
