# ZENG — Comandos de instalación (copiar y pegar)

Todos los comandos para dejar el programa **completo y andando** en una PC, en orden.
Seguí de arriba hacia abajo. Lo que va **entre comillas y en negrita** es lo que tenés
que escribir cuando el instalador te lo pregunte.

> **Antes de empezar** (se instalan a mano, con internet, una sola vez):
> - **PostgreSQL 18** → https://www.postgresql.org/download/windows/ (anotá la contraseña de `postgres`).
> - **Node.js LTS** → https://nodejs.org (en el instalador **NO tildes** "Tools for Native Modules").
> - **Git** (recomendado) → https://git-scm.com/download/win (siguiente-siguiente-finalizar). Sirve para
>   traer el proyecto y, sobre todo, para **actualizarlo** después con un solo comando. Cerrá y reabrí
>   PowerShell después de instalarlo.

---

## Paso 0 — Traer el proyecto al servidor

Dos formas de bajar la carpeta del proyecto. **Git es lo recomendado**, porque después actualizar
el sistema es un solo comando (`git pull`).

**Con Git (recomendado)** — abrí PowerShell y:

```powershell
cd C:\
git clone https://github.com/FranciscoPuchala/ZENG.git
```

Te queda la carpeta **`C:\ZENG`**. (Si pide iniciar sesión, se abre el navegador → entrá con tu GitHub.)

**Con ZIP (alternativa)** — en el repo: botón verde **Code** → **Download ZIP** → extraé. Te queda
una carpeta `ZENG-main`.

> Recién bajada, la carpeta tiene **sólo el código** (sin dependencias ni configuración). Se vuelve
> usable cuando corrés el instalador (Pasos 1 y 2). No corras los comandos de actualización sobre una
> carpeta recién clonada.

---

## Paso 1 — Abrir PowerShell como Administrador en la carpeta del proyecto

1. Abrí la carpeta del proyecto en el Explorador (`C:\ZENG` si usaste Git, o `ZENG-main` si usaste ZIP;
   adentro tiene `deploy`, `api`, `web`, `db`).
2. Copiá su ruta desde la barra de direcciones de arriba.
3. Inicio → escribí `powershell` → clic derecho en **Windows PowerShell** → **Ejecutar como administrador** → **Sí**.

   > ⚠️ Confirmá que arriba de la ventana diga **"Administrador: Windows PowerShell"**. Si abrís el
   > **"Símbolo del sistema" (CMD)** o una ventana **sin** la palabra *Administrador*, el instalador
   > falla con el error `ScriptRequiresElevation`.

4. Metete en la carpeta (pegá tu ruta entre comillas):

```powershell
cd "C:\ZENG"
```
(Si usaste ZIP, la ruta es la de tu carpeta `ZENG-main`, ej. `cd "C:\Users\TuUsuario\Downloads\ZENG-main"`.)

---

## Paso 2 — Correr el instalador de ZENG

```powershell
powershell -ExecutionPolicy Bypass -File "deploy\instalar.ps1"
```

Te va a preguntar, en este orden:

| Pregunta | Qué poner |
|---|---|
| Contraseña de `postgres` | La que pusiste al instalar Postgres (ej. `postgres123`) |
| Puerto | Apretá **Enter** (queda 3001) |
| Carpeta de backups | Prueba: `C:\ZENG_backups` · Lab: la letra del disco 2 TB (ej. `E:\`) |
| **Usuario admin** → Nombre de usuario | ej. `francisco` |
| **Usuario admin** → Contraseña | Para **entrar al programa** (ej. `zeng123`) |
| **Usuario admin** → Nombre completo | ej. `Francisco Puchala` |

> ⚠️ Son **DOS contraseñas distintas**: la de **Postgres** (base de datos) y la del **usuario admin**
> (login del programa). No las mezcles.

El instalador hace todo solo: crea la base, carga el catálogo, arma el frontend, deja el backend en
**auto-arranque**, abre el firewall y al final te muestra la **URL del servidor** (ej. `http://192.168.1.50:3001`).
**Anotá esa URL.**

---

## Paso 3 — Crear el acceso directo en el Escritorio

```powershell
powershell -ExecutionPolicy Bypass -File "deploy\crear_acceso.ps1"
```

Cuando pregunte la dirección:
- En la **PC servidor** → `http://localhost:3001`
- En **otra PC** → la URL del servidor (ej. `http://192.168.1.50:3001`)

Te deja el ícono **ZENG** en el Escritorio.

---

## Paso 4 — Probar

1. **Reiniciá la PC** (para confirmar que el servidor arranca solo al prender).
2. **Doble clic en el ícono ZENG** → tiene que aparecer el **login**.
3. Entrá con el usuario y contraseña del admin que creaste. ✅

---

## Comandos útiles (por si algo falla)

**Ver la IP de esta PC** (la necesitás para las otras PC):
```powershell
ipconfig
```
Buscá la línea **"Dirección IPv4"** (ej. `192.168.1.50`).

**Arrancar el backend a mano** (para probar / ver errores):
```powershell
cd "C:\ZENG\api"
node index.js
```

**Crear otro usuario** (admin u otro):
```powershell
cd "C:\ZENG\api"
node crear_admin.js
```

**Ver si la tarea de auto-arranque quedó registrada:**
```powershell
Get-ScheduledTask -TaskName "ZENG_Backend"
```

---

## Para las OTRAS PC del lab (clientes)

No se instala nada. Solo el acceso directo, apuntando a la IP del servidor:

```powershell
powershell -ExecutionPolicy Bypass -File "deploy\crear_acceso.ps1"
```
Dirección: `http://IP-DEL-SERVIDOR:3001`

Doble clic en el ícono ZENG → login. Todas las PC ven **los mismos datos** (mismo servidor).


Set-ScheduledTask -TaskName "ZENG_Backend" -Settings (New-ScheduledTaskSettingsSet -RestartCount 5 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit (New-TimeSpan -Hours 0) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries)

cd C:\
git clone https://github.com/FranciscoPuchala/ZENG.git ZENGSistema
cd C:\ZENGSistema
powershell -ExecutionPolicy Bypass -File "deploy\instalar.ps1"

(Get-Content "C:\ZENGSistema\web\dist\index.html") -replace 'lang="en"','lang="es" translate="no"' | Set-Content "C:\ZENGSistema\web\dist\index.html"