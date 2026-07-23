# ZENG — Actualizaciones (copiar y pegar)

## La idea

El **código** y los **datos** están separados. Actualizar el código **nunca borra la base** y
**no se reinstala nada** (el `instalar.ps1` es sólo para la primera vez). Los usuarios, muestras
e informes quedan intactos.

---

## Preparar PowerShell (una sola vez por PC)

Windows bloquea los scripts por defecto, y `npm` es uno (si no, `npm run build` falla con
`UnauthorizedAccess`). Habilitalo una vez, por usuario:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

Cuando pregunte, respondé `S`. Desde ahí, `npm` anda en cualquier PowerShell.

---

## Receta general (cada vez que actualizás, en la PC servidor)

```powershell
cd C:\ZENG
git pull
cd web
npm run build
cd ..
Stop-ScheduledTask -TaskName "ZENG_Backend"
Start-ScheduledTask -TaskName "ZENG_Backend"
```

Las otras PC: sólo **F5** en el navegador y ven la versión nueva.

Notas:
- El Stop/Start necesita PowerShell **como Administrador**.
- Si el cambio **toca la base** (agregar campo, renombrar algo), además corré su migración — ver cada
  actualización abajo. Si es **sólo código** (lo más común), no hace falta.
- `npm run build` **no necesita internet** (usa lo ya instalado), así que en el lab offline también anda.

---

## Primera vez con Git (sólo si instalaste por ZIP)

Si la carpeta la bajaste por **ZIP**, conectala una vez a Git (no pierde `node_modules` ni tu `.env`):

```powershell
cd "C:\Users\TuUsuario\Downloads\ZENG-main"
git init
git remote add origin https://github.com/FranciscoPuchala/ZENG.git
git fetch origin
git reset --hard origin/main
git branch -M main
git branch --set-upstream-to=origin/main main
```

Desde ahí, actualizar es la **receta general** de arriba (`git pull` ...).

---

## Registro de actualizaciones

Cada entrada tiene los comandos exactos para aplicarla en el servidor. Las nuevas se agregan arriba.

### 2026-07 — Rol "Técnico" → "Auxiliar"

- Código: `web/src/pages/Configuracion.tsx` (la etiqueta y la opción del menú).
- Base: `db/migracion_rol_auxiliar.sql` (renombra el rol de los usuarios que ya lo tenían; no borra nada).

Deploy en el servidor:

```powershell
cd C:\ZENG
git pull
cd web
npm run build
cd ..
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d zeng -f db\migracion_rol_auxiliar.sql
Stop-ScheduledTask -TaskName "ZENG_Backend"
Start-ScheduledTask -TaskName "ZENG_Backend"
```

Verificar: **F5** en el navegador → el rol aparece como **"Auxiliar"**.

---

_(Próximas actualizaciones van acá arriba, cada una con su bloque para copiar y pegar.)_



powershell -ExecutionPolicy Bypass -File "deploy\instalar.ps1"

Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d zeng -c "ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check; ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_check CHECK (rol IN ('admin','analista','auxiliar'));"