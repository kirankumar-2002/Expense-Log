# Detect Local IP
$ip = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias 'Wi-Fi' -ErrorAction SilentlyContinue).IPAddress
if (!$ip) {
    $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" } | Select-Object -First 1).IPAddress
}

$hostname = "expenselog.local"
$hostsPath = "$env:SystemRoot\System32\drivers\etc\hosts"
$entry = "127.0.0.1 $hostname"

Write-Host "--- Local Development Configuration ---" -ForegroundColor Cyan
Write-Host "Machine IP: $ip" -ForegroundColor Yellow
Write-Host "Hostname:   $hostname" -ForegroundColor Yellow
Write-Host ""

Write-Host "To access your local dev server from your Android device, use:"
Write-Host "http://$($ip):3000" -ForegroundColor Green
Write-Host ""

Write-Host "To use $hostname in your browser, add this to your hosts file ($hostsPath):"
Write-Host $entry -ForegroundColor Green
Write-Host ""

Write-Host "Would you like to try adding this entry automatically? (Requires Admin)"
Write-Host "Run this command in an Admin PowerShell:"
Write-Host "Add-Content -Path $hostsPath -Value `"`n$entry`"" -ForegroundColor White
