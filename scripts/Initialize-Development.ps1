param([switch]$StartApi)

$ErrorActionPreference = 'Stop'
$nexaRoot = Split-Path -Parent $PSScriptRoot
Push-Location $nexaRoot
try {
    $nexaEnvironmentFile = Join-Path $nexaRoot '.env'
    if (-not (Test-Path -LiteralPath $nexaEnvironmentFile)) {
        $nexaPasswordBytes = New-Object byte[] 32
        $nexaRandom = [System.Security.Cryptography.RandomNumberGenerator]::Create()
        $nexaRandom.GetBytes($nexaPasswordBytes)
        $nexaRandom.Dispose()
        $nexaGeneratedPassword = ([BitConverter]::ToString($nexaPasswordBytes)).Replace('-', '').ToLowerInvariant()
        $nexaEnvironment = @(
            'POSTGRES_DB=nexa_dev'
            'POSTGRES_USER=nexa'
            "POSTGRES_PASSWORD=$nexaGeneratedPassword"
            'POSTGRES_PORT=54329'
        )
        [IO.File]::WriteAllLines($nexaEnvironmentFile, $nexaEnvironment)
    }

    $nexaValues = @{}
    foreach ($nexaLine in Get-Content -LiteralPath $nexaEnvironmentFile) {
        if ($nexaLine -match '^\s*(POSTGRES_DB|POSTGRES_USER|POSTGRES_PASSWORD|POSTGRES_PORT)=(.*)$') {
            $nexaValues[$Matches[1]] = $Matches[2].Trim()
        }
    }
    foreach ($nexaKey in 'POSTGRES_DB','POSTGRES_USER','POSTGRES_PASSWORD','POSTGRES_PORT') {
        if ([string]::IsNullOrWhiteSpace($nexaValues[$nexaKey])) { throw "Missing $nexaKey in .env." }
    }
    if ($nexaValues['POSTGRES_PASSWORD'] -eq 'replace-with-a-local-password') {
        throw 'Replace the example database password in .env before continuing.'
    }

    docker info --format '{{.ServerVersion}}' | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Start Docker Desktop with Linux containers and retry.' }
    docker compose up -d --wait
    if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL startup failed.' }

    $nexaConnection = New-Object System.Data.Common.DbConnectionStringBuilder
    $nexaConnection['Host'] = 'localhost'
    $nexaConnection['Port'] = $nexaValues['POSTGRES_PORT']
    $nexaConnection['Database'] = $nexaValues['POSTGRES_DB']
    $nexaConnection['Username'] = $nexaValues['POSTGRES_USER']
    $nexaConnection['Password'] = $nexaValues['POSTGRES_PASSWORD']
    dotnet user-secrets set 'ConnectionStrings:NexaDb' $nexaConnection.ConnectionString --project src/Nexa.Api | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Saving the development connection string failed.' }

    dotnet tool restore
    if ($LASTEXITCODE -ne 0) { throw 'EF tool restore failed.' }
    dotnet restore Nexa.Platform.slnx
    if ($LASTEXITCODE -ne 0) { throw 'Package restore failed.' }
    dotnet run --project src/Nexa.Api -- --migrate --seed
    if ($LASTEXITCODE -ne 0) { throw 'Migration or role seed failed.' }
    Write-Host 'Nexa development database is ready. Connection saved in user-secrets.'

    if ($StartApi) {
        dotnet run --project src/Nexa.Api --launch-profile https
        if ($LASTEXITCODE -ne 0) { throw 'API startup failed.' }
    }
}
finally {
    Pop-Location
}
