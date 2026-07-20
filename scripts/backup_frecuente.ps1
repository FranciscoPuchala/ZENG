# ZENG - Backup frecuente de PostgreSQL (cada 30 minutos)
# Uso manual: powershell -ExecutionPolicy Bypass -File "scripts\backup_frecuente.ps1"

# --- CONFIGURACION ---
$DESTINO      = "C:\Users\franp\OneDrive\Escritorio\respaldo"
$DB_NAME      = "zeng"
$DB_USER      = "postgres"
$PG_BIN       = "C:\Program Files\PostgreSQL\18\bin"
$DIAS_RETENER = 7
# ---------------------

# Leer contrasena del api/.env
$envFile = "C:\Users\franp\OneDrive\Documentos\GitHub\ZENG\api\.env"
$lineaPass = Get-Content $envFile | Where-Object { $_ -match "^DB_PASSWORD=" }
$env:PGPASSWORD = ($lineaPass -split "=", 2)[1].Trim()
$env:Path = "$PG_BIN;" + $env:Path

# Crear carpetas si no existen
$carpeta = "$DESTINO\backups_zeng\frecuentes"
$log     = "$DESTINO\backups_zeng\backup.log"
New-Item -ItemType Directory -Force $carpeta | Out-Null

# Nombre del archivo con fecha y hora
$ts      = Get-Date -Format "yyyy-MM-dd_HH-mm"
$archivo = "$carpeta\zeng_$ts.dump"

# Correr pg_dump
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

# Borrar frecuentes de mas de $DIAS_RETENER dias
$limite = (Get-Date).AddDays(-$DIAS_RETENER)
Get-ChildItem "$carpeta\*.dump" | Where-Object { $_.LastWriteTime -lt $limite } | Remove-Item -Force
