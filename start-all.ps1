# PowerShell script to start all development servers
Write-Host "🚀 Starting CleanCity Development Servers..." -ForegroundColor Green
Write-Host ""

$portals = @(
    @{ Name = "Citizen Portal"; Port = 3000; Dir = "citizen-portal" },
    @{ Name = "Sweeper Portal"; Port = 3001; Dir = "sweeper-portal" },
    @{ Name = "Admin Portal"; Port = 3002; Dir = "admin-portal" }
)

foreach ($portal in $portals) {
    Write-Host "📱 Starting $($portal.Name) on port $($portal.Port)..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd $($portal.Dir); npm run dev" -WindowStyle Normal
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "✅ All servers starting!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Access the portals at:" -ForegroundColor Yellow
foreach ($portal in $portals) {
    Write-Host "   - $($portal.Name): http://localhost:$($portal.Port)" -ForegroundColor White
}
Write-Host ""
Write-Host "Press any key to exit this script (servers will continue running)..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

