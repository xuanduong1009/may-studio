# Shares the local store on the internet through a temporary Cloudflare tunnel.
# Usage: npm run share   (stop with Ctrl+C; the link changes every time)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

# 1. cloudflared: on PATH, or in %USERPROFILE%\tools\cloudflared
$cmd = Get-Command cloudflared -ErrorAction SilentlyContinue
if ($cmd) { $exe = $cmd.Source } else { $exe = Join-Path $env:USERPROFILE "tools\cloudflared\cloudflared.exe" }
if (-not (Test-Path $exe)) {
  Write-Host "Khong tim thay cloudflared. Tai tai: https://github.com/cloudflare/cloudflared/releases (cloudflared-windows-amd64.exe)" -ForegroundColor Red
  Write-Host "roi dat vao $exe" -ForegroundColor Red
  exit 1
}

# 2. production server on port 3000 (build first if needed)
$running = $false
try { Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 3 | Out-Null; $running = $true } catch { }
if (-not $running) {
  if (-not (Test-Path ".next\BUILD_ID")) {
    Write-Host "Dang build ban production..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) { exit 1 }
  }
  Write-Host "Dang khoi dong server (cua so rieng)..." -ForegroundColor Yellow
  Start-Process -FilePath "npm.cmd" -ArgumentList "start" -WorkingDirectory $root -WindowStyle Minimized
  for ($i = 0; $i -lt 30 -and -not $running; $i++) {
    Start-Sleep -Seconds 1
    try { Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 3 | Out-Null; $running = $true } catch { }
  }
  if (-not $running) { Write-Host "Server khong khoi dong duoc." -ForegroundColor Red; exit 1 }
}

# 3. tunnel
Write-Host ""
Write-Host "Link cong khai se hien ben duoi, dang https://....trycloudflare.com" -ForegroundColor Green
Write-Host "Gui link do cho ban be. Nhan Ctrl+C de ngung chia se." -ForegroundColor Green
Write-Host ""
& $exe tunnel --no-autoupdate --url http://localhost:3000
