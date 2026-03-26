# PowerShell script to start both backend and frontend servers simultaneously

Write-Host "Starting Invoice Hub - Backend and Frontend..." -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Get the root directory
$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Define backend and frontend directories
$backendDir = Join-Path $rootDir "backend"
$frontendDir = Join-Path $rootDir "frontend"

# Function to start backend
function Start-Backend {
    Write-Host "Starting Backend (FastAPI)..." -ForegroundColor Yellow
    Set-Location $backendDir
    & python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
}

# Function to start frontend
function Start-Frontend {
    Write-Host "Starting Frontend (Vite + React)..." -ForegroundColor Yellow
    Set-Location $frontendDir
    & npm run dev
}

# Start both in background jobs
Write-Host "Launching backend on port 8000..." -ForegroundColor Green
$backendJob = Start-Job -ScriptBlock ${function:Start-Backend} -Name "Backend"

Write-Host "Waiting 3 seconds before launching frontend..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

Write-Host "Launching frontend on port 8080..." -ForegroundColor Green
$frontendJob = Start-Job -ScriptBlock ${function:Start-Frontend} -Name "Frontend"

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Both servers are starting..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:  http://localhost:8000" -ForegroundColor Green
Write-Host "Frontend: http://localhost:8080" -ForegroundColor Green
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Green
Write-Host ""
Write-Host "Waiting for servers to be ready..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop all servers" -ForegroundColor Yellow
Write-Host ""

# Wait for jobs to complete
Wait-Job -Job $backendJob, $frontendJob

# Cleanup on exit
Write-Host ""
Write-Host "Stopping servers..." -ForegroundColor Cyan
Stop-Job -Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
Remove-Job -Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
Write-Host "Servers stopped." -ForegroundColor Green
