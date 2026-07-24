# ZENG — Reiniciar el servidor sin reiniciar la PC.
#
# Reinicia la tarea "ZENG_Backend" (el backend que arranca con Windows).
# Se usa con doble clic en el acceso directo "Reiniciar servidor ZENG" del Escritorio.
# Se auto-eleva a Administrador, que hace falta para reiniciar el servicio.

# Si no soy Administrador, me relanzo como Administrador (aparece el cartel de Windows).
$soyAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $soyAdmin) {
    Start-Process powershell.exe -Verb RunAs -ArgumentList "-ExecutionPolicy","Bypass","-File","`"$PSCommandPath`""
    exit
}

Write-Host ""
Write-Host "  Reiniciando el servidor ZENG..." -ForegroundColor Cyan
Stop-ScheduledTask  -TaskName "ZENG_Backend" -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Start-ScheduledTask -TaskName "ZENG_Backend" -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host ""
Write-Host "  Listo. El servidor se reinicio." -ForegroundColor Green
Write-Host "  En las otras PC, refresca el navegador con F5." -ForegroundColor Gray
Write-Host ""
Start-Sleep -Seconds 3
