# ZENG — Actualizaciones (copiar y pegar)

## La idea

El **código** y los **datos** están separados. Actualizar el código **nunca borra la base** y
**no se reinstala nada** (el `instalar.ps1` es sólo para la primera vez). Los usuarios, muestras
e informes quedan intactos.

> **Cómo funciona (importante):** un cambio se guarda primero en el repo de tu **compu principal**,
> pero **no va solo a GitHub**. El servidor del lab sólo puede bajar lo que **ya está en GitHub**.
> Por eso el circuito es SIEMPRE:
>
> **1)** commit + push desde tu **compu principal** → **2)** `git reset --hard` + build en el **servidor**.

---

## Receta general

### Paso 1 — En tu compu principal (donde se hacen los cambios)

```powershell
git add .
git commit -m "descripción del cambio"
git push
```

### Paso 2 — En la PC servidor del lab (carpeta `C:\ZENGsistema`)

```powershell
git fetch
git reset --hard origin/main
cd web
npm.cmd run build
cd ..
Stop-ScheduledTask -TaskName "ZENG_Backend"
Start-ScheduledTask -TaskName "ZENG_Backend"
```

Las otras PC: sólo **F5** en el navegador y ven la versión nueva.

**Notas importantes:**
- Usá **`npm.cmd run build`** (no `npm run build`): así no lo bloquea la política de scripts de Windows.
- **`git reset --hard origin/main`** deja el servidor **idéntico a GitHub** (descarta parches locales; en el
  servidor no debería haber ediciones a mano). Evita el conflicto de `instalar.ps1` que frenaba el `git pull`.
- El Stop/Start del backend necesita PowerShell **como Administrador**.
- Si el cambio es **sólo frontend** (un color, un texto): con `git reset` + `npm.cmd run build` + **F5** alcanza,
  no hace falta reiniciar el backend. Reiniciás sólo si el cambio toca el **backend** (`api/`).
- Si el cambio **toca la base** (agregar campo, migración): corré además su `.sql` — ver cada actualización abajo.
- `npm.cmd run build` **no necesita internet**.

### ¿Cómo sé que quedó actualizado?

En el servidor:
```powershell
git status
```
Tiene que decir **"up to date with 'origin/main'"** y **"nothing to commit"**.

---

## Primera vez con Git (sólo si instalaste por ZIP)

Si la carpeta la bajaste por **ZIP**, conectala una vez a Git (no pierde `node_modules` ni tu `.env`):

```powershell
cd "RUTA\A\TU\CARPETA"
git init
git remote add origin https://github.com/FranciscoPuchala/ZENG.git
git fetch origin
git reset --hard origin/main
git branch -M main
git branch --set-upstream-to=origin/main main
```

---

## Registro de actualizaciones

Cada entrada tiene los comandos del **servidor**. Las nuevas se agregan arriba. (Antes, siempre hacé
commit + push desde tu compu principal.)

### 2026-07 — Impresión del informe a página completa

- Código: `web/src/index.css` (`@page { margin: 0 }` → la hoja ocupa toda la página y se van el "ZENG" y "localhost" que agregaba Chrome). Sólo frontend.

```powershell
git fetch
git reset --hard origin/main
cd web
npm.cmd run build
cd ..
```
Verificar: imprimir un informe → ocupa la hoja completa, sin encabezado/pie del navegador.

### 2026-07 — Modo oscuro: Carga de Resultados

- Código: `web/src/pages/CargaResultados.tsx` (colores claros fijos → versiones con opacidad, se adaptan a claro/oscuro). Sólo frontend.

```powershell
git fetch
git reset --hard origin/main
cd web
npm.cmd run build
cd ..
```
Verificar: **F5**, modo oscuro, seleccionar una muestra → la fila se ve teal suave (no blanca).

### 2026-07 — Traducción de Chrome (pantalla en blanco)

- Código: `web/index.html` (`lang="es" translate="no"` para que Chrome no traduzca y no rompa React). Sólo frontend.

```powershell
git fetch
git reset --hard origin/main
cd web
npm.cmd run build
cd ..
```
Verificar: `Select-String -Path "C:\ZENGsistema\web\dist\index.html" -Pattern "translate"` muestra `translate="no"`.

### 2026-07 — "Respaldo" sólo para administradores

- Código: `web/src/components/layout/AppShell.tsx`. Sólo frontend.

```powershell
git fetch
git reset --hard origin/main
cd web
npm.cmd run build
cd ..
```
Verificar: con admin se ve "Respaldo"; con analista/auxiliar, no.

### 2026-07 — Rol "Técnico" → "Auxiliar" + informes acumulativos

- Código: `web/src/pages/Configuracion.tsx` + `api/index.js` (informes acumulativos). Base: `db/migracion_rol_auxiliar.sql`.
- Toca **frontend + backend + base**:

```powershell
git fetch
git reset --hard origin/main
cd web
npm.cmd run build
cd ..
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d zeng -f db\migracion_rol_auxiliar.sql
Stop-ScheduledTask -TaskName "ZENG_Backend"
Start-ScheduledTask -TaskName "ZENG_Backend"
```
Verificar: **F5** → el rol aparece como **"Auxiliar"** y se pueden crear usuarios con ese rol.

---

_(Próximas actualizaciones van acá arriba, cada una con su bloque para copiar y pegar.)_
