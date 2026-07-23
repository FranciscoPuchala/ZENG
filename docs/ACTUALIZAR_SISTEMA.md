# ZENG — Actualizar el sistema (sin perder datos, sin reinstalar)

## La idea clave

El **código** y los **datos** son cosas separadas:

- **Datos** (usuarios, muestras, informes, clientes) → viven en **PostgreSQL**. Actualizar el
  código **NO los toca**.
- **Código** (`api/` + `web/`) → es lo que actualizás.
- **Configuración** (`api/.env`) → queda en el servidor, no se pisa.

Por eso actualizar **nunca** borra la base y **nunca** se reinstala todo. El instalador
(`instalar.ps1`) es SÓLO para la primera vez.

---

## Receta para actualizar (en el servidor)

### En tu compu principal (VS Code)
1. Commit + push de los cambios.

### En la PC servidor
2. **Traer el código nuevo:**
   - Con git: `git pull`
   - Sin git (pendrive): copiar los archivos nuevos encima. **No toques** la carpeta de datos de
     Postgres ni el `api/.env`.
3. **Si cambió el frontend** (`web/`), reconstruirlo:
   ```
   cd web
   npm run build
   ```
4. **Si el cambio toca la base** (agregar columna, renombrar algo, etc.), correr **esa** migración
   una vez:
   ```
   psql -U postgres -d zeng -f db\NOMBRE_DE_LA_MIGRACION.sql
   ```
   > Esto **no borra datos** — sólo aplica el cambio puntual.
5. **Reiniciar el backend:**
   ```
   Stop-ScheduledTask -TaskName "ZENG_Backend"
   Start-ScheduledTask -TaskName "ZENG_Backend"
   ```
   (O reiniciar la PC: arranca solo.)
6. **Las otras PC:** nada. Refrescan el navegador (F5) y ven la versión nueva.

---

## Dos tipos de actualización

- **Sólo código** (lo más común: un arreglo, un texto, un botón) → pasos 2, 3 y 5. La base ni se toca.
- **Código + base** (como renombrar un rol o agregar un campo) → además el paso 4 (la migración).
  Tampoco pierde datos: "actualizar la base" ≠ "borrar la base".

---

## Ejemplo real: cambiar el rol "Técnico" por "Auxiliar"

1. Cambio de código en `web/src/pages/Configuracion.tsx` (la etiqueta y la opción del menú).
2. Migración de base `db/migracion_rol_auxiliar.sql` (renombra el rol de los usuarios que ya lo tenían).
3. Deploy en el servidor:
   ```
   git pull
   cd web
   npm run build
   cd ..
   psql -U postgres -d zeng -f db\migracion_rol_auxiliar.sql
   Stop-ScheduledTask -TaskName "ZENG_Backend"
   Start-ScheduledTask -TaskName "ZENG_Backend"
   ```
4. Refrescás el navegador → ahora dice "Auxiliar". Ningún usuario ni dato se perdió.
