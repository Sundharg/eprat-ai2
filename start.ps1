$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend = Join-Path $root "backend"

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "          EPRAT AI V1" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $backend

if (-not (Test-Path ".venv")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv .venv
}

Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
.\.venv\Scripts\python.exe -m pip install -r requirements.txt

Write-Host ""
Write-Host "Starting EPRAT AI..." -ForegroundColor Green
Write-Host "Open: http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "API:  http://127.0.0.1:8000/docs" -ForegroundColor Green
Write-Host ""

Start-Process "http://127.0.0.1:8000"

.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
