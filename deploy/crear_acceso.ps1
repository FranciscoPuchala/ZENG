# deploy/crear_acceso.ps1
#
# Crea un acceso directo "ZENG" en el Escritorio que abre el programa en
# MODO APP: ventana propia sin barra de direcciones ni pestañas, como si
# fuera un programa instalado en la PC.
#
# Correrlo UNA VEZ en cada PC (incluida la PC servidor).
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File "deploy\crear_acceso.ps1"

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "  ZENG - Crear acceso directo en el Escritorio" -ForegroundColor Cyan
Write-Host "  ─────────────────────────────────────────────" -ForegroundColor Cyan
Write-Host ""

# ── 1. URL del servidor ───────────────────────────────────────────────────────
#
# El "modo app" necesita saber a qué dirección apuntar cuando se abra.
# - Si estás en la PC servidor:    http://localhost:3001
# - Si estás en otra PC de la red: http://192.168.1.XX:3001 (la IP del servidor)

Write-Host "  Ingresa la direccion del servidor ZENG." -ForegroundColor White
Write-Host "  * PC servidor  →  http://localhost:3001" -ForegroundColor Gray
Write-Host "  * Otra PC      →  http://192.168.1.XX:3001  (la IP del servidor)" -ForegroundColor Gray
Write-Host ""
$url = Read-Host "  Direccion [http://localhost:3001]"
if ([string]::IsNullOrWhiteSpace($url)) { $url = "http://localhost:3001" }

# ── 2. Detectar Chrome o Edge instalado ──────────────────────────────────────
#
# El "modo app" lo soportan Chrome y Edge con el flag --app=URL.
# Ese flag hace que el navegador abra una ventana sin barras ni pestanas,
# igual a como se ve una aplicacion nativa de escritorio.

$candidatos = @(
    @{ Nombre = "Chrome"; Exe = "C:\Program Files\Google\Chrome\Application\chrome.exe" },
    @{ Nombre = "Chrome"; Exe = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" },
    @{ Nombre = "Edge";   Exe = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" },
    @{ Nombre = "Edge";   Exe = "C:\Program Files\Microsoft\Edge\Application\msedge.exe" }
)

$navegador = $null
foreach ($c in $candidatos) {
    if (Test-Path $c.Exe) { $navegador = $c; break }
}

if ($null -eq $navegador) {
    Write-Host ""
    Write-Host "  ERROR: No se encontro Chrome ni Edge en esta PC." -ForegroundColor Red
    Write-Host "  Instala uno de los dos e intentalo de nuevo." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "  Navegador encontrado: $($navegador.Nombre)" -ForegroundColor Green

# ── 3. Rutas ──────────────────────────────────────────────────────────────────

$icoPath    = Join-Path $PSScriptRoot "zeng.ico"
$escritorio = [Environment]::GetFolderPath("Desktop")
$lnkPath    = Join-Path $escritorio "ZENG.lnk"

if (-not (Test-Path $icoPath)) {
    Write-Host ""
    Write-Host "  AVISO: No se encontro el icono en $icoPath" -ForegroundColor Yellow
    Write-Host "  El acceso directo se creara sin icono personalizado." -ForegroundColor Yellow
    $icoPath = ""
}

# ── 4. Crear el acceso directo (.lnk) ────────────────────────────────────────
#
# Un archivo .lnk es un "acceso directo" de Windows. Se crea con el objeto
# COM WScript.Shell, que es parte de Windows y no requiere nada instalado.
# El TargetPath es el ejecutable del navegador; Arguments es el flag --app=URL.

$wsh = New-Object -ComObject WScript.Shell
$lnk = $wsh.CreateShortcut($lnkPath)
$lnk.TargetPath       = $navegador.Exe
$lnk.Arguments        = "--app=$url"
$lnk.Description      = "ZENG - Sistema de gestion de laboratorio"
$lnk.WorkingDirectory = Split-Path $navegador.Exe
if ($icoPath -ne "") { $lnk.IconLocation = "$icoPath,0" }
$lnk.Save()

# ── 5. Listo ──────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "  Acceso directo creado:" -ForegroundColor Green
Write-Host "    $lnkPath" -ForegroundColor White
Write-Host ""
Write-Host "  Doble clic en el icono ZENG del Escritorio -> el programa se abre" -ForegroundColor White
Write-Host "  en su propia ventana, sin barra de direcciones ni pestanas." -ForegroundColor White
Write-Host ""
