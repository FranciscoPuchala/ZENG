# ZENG — Instalación del servidor

Guía para dejar el sistema funcionando en la PC que hace de servidor.  
Las otras 3 PC solo necesitan un navegador — no se instala nada en ellas.

---

## Prerequisitos

Instalar en la PC servidor antes de correr el script:

| Software | Versión mínima | Descarga |
|----------|---------------|---------|
| **Node.js** | v18 o superior | https://nodejs.org |
| **PostgreSQL** | v15 o superior | https://www.postgresql.org/download/windows/ |
| **Git** (opcional) | cualquiera | https://git-scm.com |

> **PostgreSQL:** durante la instalación, el installer pide una contraseña para el usuario `postgres`. Anotarla — el script de instalación la va a pedir.

---

## Instalación (una sola vez)

1. Abrir **PowerShell como Administrador** (click derecho → "Ejecutar como administrador")
2. Navegar a la carpeta del proyecto:
   ```
   cd C:\ruta\al\proyecto\ZENG
   ```
3. Correr el script:
   ```
   powershell -ExecutionPolicy Bypass -File "deploy\instalar.ps1"
   ```
4. El script va a pedir:
   - Contraseña de `postgres`
   - Puerto para la app (por defecto `3001`)
   - Carpeta para los backups (por defecto `D:\`)

El script hace todo automáticamente:
- Crea la base `zeng` y corre las migraciones
- Genera `api/.env` con la contraseña y un JWT secret aleatorio
- Instala las dependencias (`npm install`)
- Construye el frontend (`npm run build`)
- Registra 3 tareas en el Programador de tareas de Windows:
  - `ZENG_Backend` — arranca el backend con Windows
  - `ZENG_Backup_Frecuente` — backup cada 30 min (08:00 a 19:00)
  - `ZENG_Backup_Diario` — backup a las 23:00
- Abre el puerto en el firewall de Windows

Al terminar muestra la URL del servidor, por ejemplo:
```
URL del servidor: http://192.168.1.50:3001
```

---

## Verificar que funciona

1. Abrir una terminal y correr:
   ```
   node api\index.js
   ```
2. Abrir el navegador en **esta misma PC** y entrar a `http://localhost:3001`
3. Debería aparecer la pantalla de login de ZENG

Si funciona, cerrar la terminal — el backend va a arrancar solo la próxima vez que enciendas la PC.

---

## Acceso desde las otras PCs

En cualquier otra PC de la red, abrir el navegador y entrar a:
```
http://192.168.1.50:3001
```
(reemplazar la IP con la que mostró el script)

Para saber la IP del servidor en cualquier momento:
```
ipconfig
```
Buscar "Dirección IPv4" de la conexión de red (Ethernet o Wi-Fi).

---

## Actualizar el sistema

Cuando haya una versión nueva del código:

```powershell
# 1. Bajar los cambios
git pull

# 2. Rebuild del frontend
cd web
npm install
npm run build
cd ..

# 3. Reiniciar el backend
# En el Programador de tareas, buscar "ZENG_Backend" y hacer clic en "Ejecutar"
# O desde PowerShell como Admin:
Stop-ScheduledTask -TaskName "ZENG_Backend"
Start-ScheduledTask -TaskName "ZENG_Backend"
```

Si hay migraciones nuevas en `db/`, correrlas antes del paso 3:
```
psql -U postgres -d zeng -f db\nueva_migracion.sql
```

---

## Qué hacer si algo falla

### El backend no arranca
- Revisar el log del Programador de tareas (buscar `ZENG_Backend` y ver el historial)
- Probar correr manualmente: `node api\index.js` — el error va a aparecer en la terminal

### No se puede conectar desde otra PC
- Verificar que el firewall permite el puerto: `netsh advfirewall firewall show rule name="ZENG Backend"`
- Verificar que las PCs están en la misma red
- Probar `ping IP-del-servidor` desde la otra PC

### Los backups no se están haciendo
- Revisar `D:\backups_zeng\backup.log` (o la carpeta configurada)
- Ver `docs/GUIA_BASE_DE_DATOS.md` para instrucciones de restauración

### Restaurar un backup
Ver la pantalla "Respaldo" dentro de la app, o consultar `docs/GUIA_BASE_DE_DATOS.md`.

---

## Variables de entorno (`api/.env`)

El archivo `api/.env` se genera automáticamente. No subirlo a git (ya está en `.gitignore`).  
Ver `deploy/.env.example` para la lista de todas las variables.

Para cambiar algún valor (ej. carpeta de backups):
1. Editar `api/.env`
2. Reiniciar el backend (Stop + Start de la tarea `ZENG_Backend`)
