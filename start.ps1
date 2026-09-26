Write-Host "===================================="
Write-Host "STARTING CHAT PLATFORM"
Write-Host "===================================="

docker compose down

docker compose up -d --build

Write-Host ""
Write-Host "Creating test users..."
Start-Sleep -Seconds 5

$users = @(
    @{
        fullName = "Test User 1"
        email = "testuser1@example.com"
        password = "password123"
    },
    @{
        fullName = "Test User 2"
        email = "testuser2@example.com"
        password = "password123"
    },
    @{
        fullName = "Test User 3"
        email = "testuser3@example.com"
        password = "password123"
    }
)

foreach ($user in $users) {

    $body = $user | ConvertTo-Json

    Invoke-RestMethod `
        -Uri "http://localhost/api/auth/register" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body
}

Start-Sleep -Seconds 2
Write-Host ""
Write-Host "===================================="
Write-Host "SYSTEM STARTED"
Write-Host "===================================="

Write-Host "Frontend: http://localhost"
Write-Host "API: http://localhost/api"

pause