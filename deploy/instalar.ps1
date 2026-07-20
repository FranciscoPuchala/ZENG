# ZENG - Script de instalacion del servidor
# Ejecutar como Administrador:
#   powershell -ExecutionPolicy Bypass -File "deploy\instalar.ps1"

#Requires -RunAsAdministrator

$ErrorActionPreference = "Stop"
$repo = Split-Path $PSScriptRoot -Parent

Write-Host ""
Write-Host "============================================="
Write-Host "  ZENG - Instalacion del servidor"
Write-Host "============================================="
Write-Host ""

# ── 1. Verificar Node.js ─────────────────────────────────────────────
Write-Host "[1/7] Verificando Node.js..."
try {
    $nodeVer = (node --version 2>&1).ToString().TrimStart("v")
    $nodeMajor = [int]($nodeVer -split "\.")[0]
    if ($nodeMajor -lt 18) {
        Write-Host "  ATENCION: Node.js $nodeVer detectado. Se recomienda v18 o superior."
        Write-Host "  Descargar: https://nodejs.org"
        Read-Host "  Presiona Enter para continuar igual, o cierra y actualiza primero"
    } else {
        Write-Host "  OK: Node.js v$nodeVer"
    }
} catch {
    Write-Host "  ERROR: Node.js no encontrado. Instalar desde https://nodejs.org"
    exit 1
}

# ── 2. Verificar PostgreSQL y ubicar pg_dump ──────────────────────────
Write-Host "[2/7] Verificando PostgreSQL..."
$pgBinDefault = $null
foreach ($ver in @("18","17","16","15")) {
    $ruta = "C:\Program Files\PostgreSQL\$ver\bin"
    if (Test-Path "$ruta\pg_dump.exe") {
        $pgBinDefault = $ruta
        break
    }
}
if (-not $pgBinDefault) {
    Write-Host "  ERROR: No se encontro pg_dump.exe. Instalar PostgreSQL desde https://www.postgresql.org"
    exit 1
}
Write-Host "  OK: PostgreSQL bin en $pgBinDefault"

# ── 3. Pedir datos de configuracion ──────────────────────────────────
Write-Host ""
Write-Host "[3/7] Configuracion..."

$pgPass = Read-Host "  Contrasena del usuario 'postgres' de PostgreSQL"
$puerto = Read-Host "  Puerto para la app web (Enter = 3001)"
if (-not $puerto) { $puerto = "3001" }
$backupDest = Read-Host "  Carpeta de backups (Enter = D:\)"
if (-not $backupDest) { $backupDest = "D:\" }

# ── 4. Probar conexion a Postgres ────────────────────────────────────
Write-Host "  Probando conexion a PostgreSQL..."
$env:PGPASSWORD = $pgPass
$env:Path = "$pgBinDefault;" + $env:Path
$test = & "$pgBinDefault\psql.exe" -U postgres -c "SELECT 1" -t 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: No se pudo conectar a PostgreSQL con la contrasena ingresada."
    exit 1
}
Write-Host "  OK: conexion exitosa."

# ── 5. Crear base de datos y correr migraciones ───────────────────────
Write-Host ""
Write-Host "[4/7] Creando base de datos 'zeng'..."

# Crear DB (ignora el error si ya existe)
& "$pgBinDefault\psql.exe" -U postgres -c "CREATE DATABASE zeng;" 2>&1 | Out-Null

$migraciones = @(
    "db\zeng_esquema_v1.sql",
    "db\migracion_v2.sql",
    "db\migracion_login.sql"
)
foreach ($m in $migraciones) {
    $ruta = Join-Path $repo $m
    if (Test-Path $ruta) {
        Write-Host "  Corriendo $m..."
        & "$pgBinDefault\psql.exe" -U postgres -d zeng -f $ruta 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  ADVERTENCIA: $m salio con codigo $LASTEXITCODE (puede ser normal si ya existia)"
        }
    } else {
        Write-Host "  OMITIDO (no existe): $m"
    }
}

# ── 6. Generar api/.env ──────────────────────────────────────────────
Write-Host ""
Write-Host "[5/7] Generando api/.env..."

$jwtSecret = [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
$envPath = Join-Path $repo "api\.env"

@"
DB_HOST=localhost
DB_PORT=5432
DB_NAME=zeng
DB_USER=postgres
DB_PASSWORD=$pgPass
JWT_SECRET=$jwtSecret
PORT=$puerto
BACKUP_DESTINO=$backupDest
BACKUP_LOG=${backupDest}\backups_zeng\backup.log
PG_BIN=$pgBinDefault
"@ | Out-File -FilePath $envPath -Encoding utf8 -NoNewline

Write-Host "  Archivo creado: $envPath"

# ── 7. Instalar dependencias del backend ─────────────────────────────
Write-Host ""
Write-Host "[6/7] Instalando dependencias del backend..."
Push-Location (Join-Path $repo "api")
npm install --silent
if ($LASTEXITCODE -ne 0) { Write-Host "  ERROR en npm install del backend"; exit 1 }
Pop-Location

# Crear usuario admin inicial
Write-Host "  Creando usuario admin..."
$adminScript = Join-Path $repo "api\crear_admin.js"
if (Test-Path $adminScript) {
    node $adminScript
}

# ── 8. Build del frontend ────────────────────────────────────────────
Write-Host ""
Write-Host "  Construyendo el frontend..."
Push-Location (Join-Path $repo "web")
npm install --silent
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "  ERROR en npm run build del frontend"; exit 1 }
Pop-Location
Write-Host "  Build OK: web\dist\ listo."

# ── 9. Registrar tareas programadas ─────────────────────────────────
Write-Host ""
Write-Host "[7/7] Registrando tareas programadas de Windows..."

$apiEntry  = "node $(Join-Path $repo 'api\index.js')"
$nodePath  = (Get-Command node).Source

# -- Backend: arrancar con Windows --
$actionBack = New-ScheduledTaskAction -Execute $nodePath -Argument (Join-Path $repo "api\index.js") -WorkingDirectory (Join-Path $repo "api")
$triggerBack = New-ScheduledTaskTrigger -AtStartup
$settingsBack = New-ScheduledTaskSettingsSet -RestartCount 5 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit (New-TimeSpan -Hours 0)
$principalBack = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
Register-ScheduledTask -TaskName "ZENG_Backend" -Action $actionBack -Trigger $triggerBack -Settings $settingsBack -Principal $principalBack -Force | Out-Null
Write-Host "  OK: tarea ZENG_Backend (arranca con Windows)"

# -- Backup frecuente: cada 30 min de 08:00 a 19:30 --
$backupScript  = Join-Path $repo "scripts\backup_frecuente.ps1"
$psExe         = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
$argsFrecuente = "-ExecutionPolicy Bypass -NonInteractive -File `"$backupScript`""

$triggersFrecuente = @()
for ($h = 8; $h -le 19; $h++) {
    foreach ($m in @(0, 30)) {
        if ($h -eq 19 -and $m -eq 30) { continue }
        $t = New-ScheduledTaskTrigger -Daily -At (Get-Date -Hour $h -Minute $m -Second 0)
        $triggersFrecuente += $t
    }
}
$actionFrec = New-ScheduledTaskAction -Execute $psExe -Argument $argsFrecuente
$settingsFrec = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 10)
$principalFrec = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
Register-ScheduledTask -TaskName "ZENG_Backup_Frecuente" -Action $actionFrec -Trigger $triggersFrecuente -Settings $settingsFrec -Principal $principalFrec -Force | Out-Null
Write-Host "  OK: tarea ZENG_Backup_Frecuente (08:00-19:00 cada 30 min)"

# -- Backup diario: 23:00 --
$backupDiario = Join-Path $repo "scripts\backup_diario.ps1"
$argsDiario   = "-ExecutionPolicy Bypass -NonInteractive -File `"$backupDiario`""
$triggerDiario = New-ScheduledTaskTrigger -Daily -At "23:00"
$actionDiario  = New-ScheduledTaskAction -Execute $psExe -Argument $argsDiario
$settingsDiario = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 10)
$principalDiario = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
Register-ScheduledTask -TaskName "ZENG_Backup_Diario" -Action $actionDiario -Trigger $triggerDiario -Settings $settingsDiario -Principal $principalDiario -Force | Out-Null
Write-Host "  OK: tarea ZENG_Backup_Diario (23:00)"

# ── 10. Firewall ─────────────────────────────────────────────────────
Write-Host ""
Write-Host "Configurando firewall para el puerto $puerto..."
New-NetFirewallRule -DisplayName "ZENG Backend" -Direction Inbound -Protocol TCP -LocalPort $puerto -Action Allow -Profile Any -ErrorAction SilentlyContinue | Out-Null
Write-Host "  OK: puerto $puerto abierto en el firewall."

# ── Resumen final ────────────────────────────────────────────────────
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch "Loopback" -and $_.IPAddress -notmatch "^169" } | Select-Object -First 1).IPAddress

Write-Host ""
Write-Host "============================================="
Write-Host "  Instalacion completada."
Write-Host "============================================="
Write-Host ""
Write-Host "  URL del servidor: http://${ip}:${puerto}"
Write-Host "  Las otras PCs abren esa URL en el navegador."
Write-Host ""
Write-Host "  Para iniciar el backend ahora mismo:"
Write-Host "    node api\index.js"
Write-Host ""
Write-Host "  El backend arranca automaticamente con Windows (tarea ZENG_Backend)."
Write-Host ""
