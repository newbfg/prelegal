$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

$ImageName = "prelegal"
$ContainerName = "prelegal"
$Port = if ($env:PORT) { $env:PORT } else { "8000" }

docker build -t $ImageName .
docker rm -f $ContainerName 2>$null | Out-Null

$envArgs = @()
if (Test-Path ".env") {
    $envArgs = @("--env-file", ".env")
}

docker run -d --name $ContainerName -p "${Port}:8000" @envArgs $ImageName

Write-Host "Prelegal is running at http://localhost:$Port"
