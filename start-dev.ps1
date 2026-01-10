# PowerShell script to start all development servers
# Run this script to start all three portals

Write-Host "🚀 Starting CleanCity Development Servers..." -ForegroundColor Green
Write-Host ""

# Start Citizen Portal
Write-Host "📱 Starting Citizen Portal on port 3000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd citizen-portal; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 2

# Start Sweeper Portal
Write-Host "🧹 Starting Sweeper Portal on port 3001..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd sweeper-portal; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 2

# Start Admin Portal
Write-Host "👨‍💼 Starting Admin Portal on port 3002..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd admin-portal; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "✅ All servers starting!" -ForegroundColor Green
Write-Host ""
Write-Host "Access the portals at:" -ForegroundColor Yellow
Write-Host "  - Citizen Portal: http://localhost:3000" -ForegroundColor White
Write-Host "  - Sweeper Portal: http://localhost:3001" -ForegroundColor White
Write-Host "  - Admin Portal: http://localhost:3002" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit this script (servers will continue running)..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

