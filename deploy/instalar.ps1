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

# Que los NOTICE de psql (avisos inofensivos) no aborten la instalacion
$env:PGOPTIONS = "--client-min-messages=warning"

# Helper: corre psql sin que un NOTICE/stderr corte el script; devuelve el exit code real
function Invoke-Psql {
    param([Parameter(Mandatory)][string[]]$PsqlArgs)
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    & "$pgBinDefault\psql.exe" @PsqlArgs 2>&1 | Out-Null
    $code = $LASTEXITCODE
    $ErrorActionPreference = $prev
    return $code
}

# Si la base 'zeng' ya existe, ofrecer recrearla desde cero (instalacion limpia)
$existe = & "$pgBinDefault\psql.exe" -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='zeng'" 2>$null
if ("$existe".Trim() -eq "1") {
    Write-Host "  La base 'zeng' YA EXISTE."
    $resp = Read-Host "  Borrarla y recrearla desde cero? Se PIERDEN los datos actuales (S/N)"
    if ($resp -match '^[SsYy]') {
        Invoke-Psql @("-U","postgres","-c","DROP DATABASE zeng;") | Out-Null
        Invoke-Psql @("-U","postgres","-c","CREATE DATABASE zeng;") | Out-Null
        Write-Host "  Base recreada desde cero."
    } else {
        Write-Host "  Se mantiene la base existente (se re-aplican migraciones y catalogo)."
    }
} else {
    Invoke-Psql @("-U","postgres","-c","CREATE DATABASE zeng;") | Out-Null
    Write-Host "  Base 'zeng' creada."
}

# Esquema + TODAS las migraciones, en orden
$migraciones = @(
    "db\zeng_esquema_v1.sql",
    "db\migracion_v2.sql",
    "db\migracion_login.sql",
    "db\migracion_parametros_defaults.sql",
    "db\migracion_metodologias_acreditadas.sql",
    "db\migracion_informes_impreso.sql",
    "db\migracion_unique_informe.sql",
    "db\migracion_rol_auxiliar.sql"
)
foreach ($m in $migraciones) {
    $ruta = Join-Path $repo $m
    if (Test-Path $ruta) {
        Write-Host "  Corriendo $m..."
        $code = Invoke-Psql @("-v","ON_ERROR_STOP=1","-U","postgres","-d","zeng","-f",$ruta)
        if ($code -ne 0) {
            Write-Host "  ADVERTENCIA: $m salio con codigo $code (puede ser normal si ya existia)"
        }
    } else {
        Write-Host "  OMITIDO (no existe): $m"
    }
}

# ── 6. Generar api/.env ──────────────────────────────────────────────
Write-Host ""
Write-Host "[5/7] Generando api/.env..."

# Secreto aleatorio para JWT (compatible con Windows PowerShell 5.1 y PowerShell 7)
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rngBytes = New-Object 'System.Byte[]' 48
$rng.GetBytes($rngBytes)
$jwtSecret = [System.Convert]::ToBase64String($rngBytes)
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

# ── 7. Instalar dependencias del backend + cargar catalogo ───────────
Write-Host ""
Write-Host "[6/7] Instalando dependencias del backend y cargando catalogo..."
Push-Location (Join-Path $repo "api")
npm install --silent
if ($LASTEXITCODE -ne 0) { Write-Host "  ERROR en npm install del backend"; Pop-Location; exit 1 }

# Cargar catalogo real: ensayos, parametros, metodologias y sus relaciones
# (se corre desde api\ para que lea el archivo .env; los CSV los toma de ..\db)
Write-Host "  Cargando catalogo (ensayos / parametros / metodologias)..."
node seed_catalogos.js
if ($LASTEXITCODE -ne 0) { Write-Host "  ADVERTENCIA: seed_catalogos.js salio con codigo $LASTEXITCODE" }

# Enriquecer parametros: descripciones reales, valores por defecto y de referencia
$seedParam = Join-Path $repo "db\seed_parametros.sql"
if (Test-Path $seedParam) {
    Write-Host "  Cargando descripciones de parametros..."
    Invoke-Psql @("-v","ON_ERROR_STOP=1","-U","postgres","-d","zeng","-f",$seedParam) | Out-Null
}

# Cargar clientes reales
$seedCli = Join-Path $repo "db\seed_clientes.sql"
if (Test-Path $seedCli) {
    Write-Host "  Cargando clientes..."
    Invoke-Psql @("-v","ON_ERROR_STOP=1","-U","postgres","-d","zeng","-f",$seedCli) | Out-Null
}

# Crear usuario admin inicial (desde api\ para que lea el .env)
Write-Host "  Creando usuario admin..."
if (Test-Path "crear_admin.js") {
    node crear_admin.js
}
Pop-Location

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

# ── 11. Acceso directo "Reiniciar servidor ZENG" en el Escritorio ────
Write-Host ""
Write-Host "Creando acceso directo 'Reiniciar servidor ZENG'..."
$reiniciarPs = Join-Path $repo "deploy\reiniciar_servidor.ps1"
$icoZeng     = Join-Path $repo "deploy\zeng.ico"
$escritorioR = [Environment]::GetFolderPath("Desktop")
$lnkReinicio = Join-Path $escritorioR "Reiniciar servidor ZENG.lnk"
$wshR = New-Object -ComObject WScript.Shell
$lnkR = $wshR.CreateShortcut($lnkReinicio)
$lnkR.TargetPath       = $psExe
$lnkR.Arguments        = "-ExecutionPolicy Bypass -File `"$reiniciarPs`""
$lnkR.Description       = "Reiniciar el servidor ZENG sin reiniciar la PC"
$lnkR.WorkingDirectory = Join-Path $repo "deploy"
if (Test-Path $icoZeng) { $lnkR.IconLocation = "$icoZeng,0" }
$lnkR.Save()
Write-Host "  OK: acceso directo 'Reiniciar servidor ZENG' en el Escritorio."

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
Write-Host "  En el Escritorio quedo el icono 'Reiniciar servidor ZENG' por si"
Write-Host "  alguna vez necesitas reiniciarlo sin apagar la PC."
Write-Host ""
