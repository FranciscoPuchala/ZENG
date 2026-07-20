# ZENG - Backup frecuente de PostgreSQL (cada 30 minutos)
# Uso manual: powershell -ExecutionPolicy Bypass -File "scripts\backup_frecuente.ps1"

function Read-EnvVar($file, $key) {
    $line = Get-Content $file -ErrorAction SilentlyContinue | Where-Object { $_ -match "^$key=" }
    if ($line) { return ($line -split "=", 2)[1].Trim() }
    return $null
}

$envFile      = Join-Path $PSScriptRoot "..\api\.env"
$DB_NAME      = "zeng"
$DB_USER      = "postgres"
$PG_BIN       = Read-EnvVar $envFile "PG_BIN"
$DESTINO      = Read-EnvVar $envFile "BACKUP_DESTINO"
$DIAS_RETENER = 7

if (-not $PG_BIN)  { $PG_BIN  = "C:\Program Files\PostgreSQL\18\bin" }
if (-not $DESTINO) { $DESTINO = "D:\" }

$env:PGPASSWORD = Read-EnvVar $envFile "DB_PASSWORD"
$env:Path = "$PG_BIN;" + $env:Path

$carpeta = "$DESTINO\backups_zeng\frecuentes"
$log     = "$DESTINO\backups_zeng\backup.log"
New-Item -ItemType Directory -Force $carpeta | Out-Null

$ts      = Get-Date -Format "yyyy-MM-dd_HH-mm"
$archivo = "$carpeta\zeng_$ts.dump"

try {
    & "$PG_BIN\pg_dump.exe" -U $DB_USER -F c -f $archivo $DB_NAME
    if ($LASTEXITCODE -eq 0) {
        $linea = "$(Get-Date -Format 'yyyy-MM-dd HH:mm')  OK       $archivo"
    } else {
        $linea = "$(Get-Date -Format 'yyyy-MM-dd HH:mm')  ERROR    pg_dump salio con codigo $LASTEXITCODE"
        Remove-Item $archivo -ErrorAction SilentlyContinue
    }
} catch {
    $linea = "$(Get-Date -Format 'yyyy-MM-dd HH:mm')  ERROR    $_"
}

Add-Content -Path $log -Value $linea -Encoding UTF8
Write-Host $linea

$limite = (Get-Date).AddDays(-$DIAS_RETENER)
Get-ChildItem "$carpeta\*.dump" | Where-Object { $_.LastWriteTime -lt $limite } | Remove-Item -Force
