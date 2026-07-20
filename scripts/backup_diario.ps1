# ZENG - Backup diario de PostgreSQL (una vez por dia, ej. 23:00)
# Uso manual: powershell -ExecutionPolicy Bypass -File "scripts\backup_diario.ps1"

# --- CONFIGURACION ---
$DESTINO       = "C:\Users\franp\OneDrive\Escritorio\respaldo"
$DB_NAME       = "zeng"
$DB_USER       = "postgres"
$PG_BIN        = "C:\Program Files\PostgreSQL\18\bin"
$DIAS_RETENER  = 365
# ---------------------

# Leer contrasena del api/.env
$envFile = "C:\Users\franp\OneDrive\Documentos\GitHub\ZENG\api\.env"
$lineaPass = Get-Content $envFile | Where-Object { $_ -match "^DB_PASSWORD=" }
$env:PGPASSWORD = ($lineaPass -split "=", 2)[1].Trim()
$env:Path = "$PG_BIN;" + $env:Path

# Crear carpetas si no existen
$carpeta = "$DESTINO\backups_zeng\diarios"
$log     = "$DESTINO\backups_zeng\backup.log"
New-Item -ItemType Directory -Force $carpeta | Out-Null

# Un solo archivo por dia: zeng_2026-07-19.dump
$fecha   = Get-Date -Format "yyyy-MM-dd"
$archivo = "$carpeta\zeng_$fecha.dump"

# Correr pg_dump
try {
    & "$PG_BIN\pg_dump.exe" -U $DB_USER -F c -f $archivo $DB_NAME
    if ($LASTEXITCODE -eq 0) {
        $linea = "$(Get-Date -Format 'yyyy-MM-dd HH:mm')  OK-DIA   $archivo"
    } else {
        $linea = "$(Get-Date -Format 'yyyy-MM-dd HH:mm')  ERROR    pg_dump salio con codigo $LASTEXITCODE"
        Remove-Item $archivo -ErrorAction SilentlyContinue
    }
} catch {
    $linea = "$(Get-Date -Format 'yyyy-MM-dd HH:mm')  ERROR    $_"
}

Add-Content -Path $log -Value $linea -Encoding UTF8
Write-Host $linea

# Borrar diarios de mas de $DIAS_RETENER dias
$limite = (Get-Date).AddDays(-$DIAS_RETENER)
Get-ChildItem "$carpeta\*.dump" | Where-Object { $_.LastWriteTime -lt $limite } | Remove-Item -Force
