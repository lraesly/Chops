# Practice Log - Windows Setup Script
# Run this in PowerShell as Administrator

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Practice Log - Windows Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check for Node.js
Write-Host "Checking for Node.js..." -ForegroundColor Yellow
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = node --version
    Write-Host "  Node.js found: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "  Node.js not found. Installing via winget..." -ForegroundColor Yellow
    winget install OpenJS.NodeJS.LTS
    Write-Host "  Please restart PowerShell after installation and run this script again." -ForegroundColor Red
    exit 1
}

# Check for Rust
Write-Host "Checking for Rust..." -ForegroundColor Yellow
if (Get-Command rustc -ErrorAction SilentlyContinue) {
    $rustVersion = rustc --version
    Write-Host "  Rust found: $rustVersion" -ForegroundColor Green
} else {
    Write-Host "  Rust not found. Installing via winget..." -ForegroundColor Yellow
    winget install Rustlang.Rustup
    Write-Host "  Please restart PowerShell after installation and run this script again." -ForegroundColor Red
    exit 1
}

# Check for WebView2 (should be pre-installed on Windows 11)
Write-Host "Checking for WebView2..." -ForegroundColor Yellow
$webview2 = Get-ItemProperty -Path "HKLM:\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" -ErrorAction SilentlyContinue
if ($webview2) {
    Write-Host "  WebView2 found" -ForegroundColor Green
} else {
    Write-Host "  WebView2 not found. It should be pre-installed on Windows 11." -ForegroundColor Yellow
    Write-Host "  If build fails, download from: https://developer.microsoft.com/en-us/microsoft-edge/webview2/" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Building Practice Log for Windows..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
npm run tauri:build

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "Build complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your installers are at:" -ForegroundColor Cyan
Write-Host "  src-tauri\target\release\bundle\nsis\Practice Log_0.1.0_x64-setup.exe" -ForegroundColor White
Write-Host "  src-tauri\target\release\bundle\msi\Practice Log_0.1.0_x64.msi" -ForegroundColor White
Write-Host ""

# Open the output folder
explorer "src-tauri\target\release\bundle\nsis"
