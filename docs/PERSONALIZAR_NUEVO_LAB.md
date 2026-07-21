# Personalizar el sistema para un nuevo laboratorio

> Guía para instalar el sistema en un laboratorio diferente a ZENG.
> Seguir esta lista de arriba a abajo — no queda nada hardcodeado sin cubrir.

---

## 1. Logo e imagen de marca

| Archivo | Qué cambiar |
|---|---|
| `web/public/logo.png` | Reemplazar por el logo del nuevo lab (mismo nombre, PNG con fondo transparente) |
| `web/public/favicon.ico` o `favicon.png` | Reemplazar por el ícono del nuevo lab |

El logo se usa en tres lugares del código — todos lo leen de `/logo.png`, así que con reemplazar el archivo alcanza.

---

## 2. Nombre del laboratorio en la interfaz

| Archivo | Línea | Texto actual → qué poner |
|---|---|---|
| `web/index.html` | 7 | `<title>zeng-web</title>` → nombre del nuevo lab |
| `web/src/components/layout/AppShell.tsx` | 61 | `"ZENG"` (texto en el sidebar) → nombre corto del lab |
| `web/src/pages/Login.tsx` | 262 | `"ZENG"` (título en la pantalla de login) → nombre del lab |
| `web/src/pages/Panel.tsx` | 173 | `"Panel de control — ZENG Laboratorio Microbiológico"` → nombre del lab |

---

## 3. Informe de Ensayo — todos los datos del lab

Todo está concentrado en **`web/src/pages/InformeImpresion.tsx`**.

| Línea | Texto actual | Qué poner |
|---|---|---|
| 143 | `alt="ZENG"` | Nombre del nuevo lab |
| 145 | `"ORGANISMO URUGUAYO DE ACREDITACIÓN"` | Organismo de acreditación del nuevo lab (o quitar si no aplica) |
| 148 | `"LE 006"` | Número de acreditación del nuevo lab |
| 153 | `"LABORATORIO MICROBIOLÓGICO"` | Tipo de laboratorio del nuevo lab |
| 239 | `"por ZENG  Laboratorio Microbiológico"` | Nombre del nuevo lab en la firma |
| 278 | `"O.U.A. LE NRO 006"` | Organismo y número de acreditación del nuevo lab |
| 279 | `"www.organismoruguayodeacreditacion.org"` | URL del organismo de acreditación |
| 280 | `"Reg.MGAP N° 0018: Alcance: www.mgap.gub.uy/DGSG/DILAVE"` | Registro sanitario del nuevo lab (o quitar si no aplica) |
| 282 | `"Mariano Moreno 2746 – Montevideo – Uruguay – Telefax: (598) 2486 46 63"` | Dirección y teléfono del nuevo lab |
| 285 | `"zengsa@adinet.com.uy – zeng@zeng.com.uy – Web: http://www.zeng.com.uy"` | Emails y web del nuevo lab |

---

## 4. Nombre de la base de datos

La base se llama `zeng` en todos lados. Cambiarlo es opcional (funciona igual si se deja), pero conviene para que sea prolijo.

Si se decide cambiar el nombre de la base (por ejemplo a `labnuevo`), hay que actualizarlo en estos archivos:

| Archivo | Dónde |
|---|---|
| `api/.env` | `DB_NAME=zeng` |
| `deploy/.env.example` | `DB_NAME=zeng` |
| `deploy/instalar.ps1` | líneas 75, 86, 105 — `CREATE DATABASE zeng`, `psql -d zeng`, `DB_NAME=zeng` |
| `scripts/backup_frecuente.ps1` | línea 11 — `$DB_NAME = "zeng"` |
| `scripts/backup_diario.ps1` | línea 11 — `$DB_NAME = "zeng"` |
| `api/index.js` | línea 622 — `const tempDb = "zeng_preview_restore"` (base temporal para preview de backups) |

---

## 5. Rutas y nombres de carpetas de backup

Las carpetas de backup tienen "zeng" en el nombre. Cambiar en:

| Archivo | Texto actual | Qué poner |
|---|---|---|
| `deploy/instalar.ps1` | línea 111: `BACKUP_LOG=...\backups_zeng\backup.log` | Reemplazar `backups_zeng` por el nombre del nuevo lab |
| `deploy/.env.example` | `BACKUP_LOG=D:\backups_zeng\backup.log` | Ídem |
| `scripts/backup_frecuente.ps1` | líneas 23–28: `backups_zeng\frecuentes`, `zeng_$ts.dump` | Reemplazar prefijo `zeng` |
| `scripts/backup_diario.ps1` | líneas 23–28: `backups_zeng\diarios`, `zeng_$fecha.dump` | Ídem |

Después de instalar con `instalar.ps1`, el `api/.env` generado apunta a la carpeta configurada — no hace falta tocarlo a mano si se edita el script antes de correrlo.

---

## 6. Nombres de las tareas programadas de Windows

El instalador crea estas tareas en el Programador de tareas de Windows:

| Nombre actual | Qué hace | Cambiar a |
|---|---|---|
| `ZENG_Backend` | Arranca el servidor con Windows | `LABNUEVO_Backend` |
| `ZENG_Backup_Frecuente` | Backup cada 30 min (08:00–19:00) | `LABNUEVO_Backup_Frecuente` |
| `ZENG_Backup_Diario` | Backup a las 23:00 | `LABNUEVO_Backup_Diario` |

Cambiar en `deploy/instalar.ps1` (líneas 154, 173, 183) y en `deploy/README.md`.

También hay una regla de firewall con el nombre `"ZENG Backend"` (línea 189 de `instalar.ps1`) → cambiar a `"LABNUEVO Backend"`.

---

## 7. Credenciales y secretos — SIEMPRE nuevos por cada lab

Estos se generan automáticamente al correr `deploy/instalar.ps1`. No hay que preocuparse si se usa el instalador. Pero si se copia el `api/.env` de ZENG a mano, hay que regenerarlos:

| Variable | En `api/.env` | Qué hacer |
|---|---|---|
| `JWT_SECRET` | `JWT_SECRET=zeng_lab_secreto_...` | Generar uno nuevo: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `DB_PASSWORD` | Contraseña de PostgreSQL | Poner la contraseña del postgres del nuevo servidor |
| `DB_USER` | `postgres` | Cambiar si el nuevo servidor usa otro usuario |
| `DB_HOST` / `DB_PORT` | `localhost` / `5432` | Cambiar si corresponde |

El `JWT_SECRET` del `api/.env` actual de ZENG **no debe copiarse** a otro lab — cada instalación debe tener el suyo.

---

## 8. Usuario administrador inicial

Después de instalar, el script corre `api/crear_admin.js` que pide nombre, usuario y contraseña del primer admin. Esto es interactivo — no hay nada hardcodeado de ZENG ahí.

El archivo `api/crear_admin.js` (línea 21) tiene el texto `"=== Crear usuario admin — ZENG ==="` — cambiar a nombre del nuevo lab si se quiere que sea prolijo (es solo cosmético, no afecta nada).

---

## 9. sessionStorage key en el navegador

| Archivo | Línea | Texto actual |
|---|---|---|
| `web/src/lib/auth.ts` | 1 | `const KEY = "zeng_token"` |

Cambiar a `"labnuevo_token"` o similar. Esto es el nombre de la clave donde se guarda el JWT en el navegador. Solo importa si en la misma PC se van a abrir dos sistemas distintos (para que no se pisen los tokens). En la práctica, como cada lab tiene su propio servidor, probablemente no importa.

---

## 10. Nombre del paquete npm (cosmético)

| Archivo | Línea | Texto actual |
|---|---|---|
| `web/package.json` | 2 | `"name": "zeng-web"` |

Cambiar a `"labnuevo-web"`. No afecta el funcionamiento — es solo el nombre interno del proyecto.

---

## 11. Datos del catálogo — lo más importante

Estos no son código, son datos de la base de datos. Hay que vaciarlos y cargar los del nuevo lab.

### Clientes
- Los 431 clientes en `db/seed_clientes.sql` son los clientes reales de ZENG — **no cargar en otro lab**.
- Incluye al propio ZENG como cliente (código `3196`).
- El nuevo lab puede importar sus propios clientes o cargarlos desde cero.

### Catálogo de ensayos, parámetros y metodologías
- `db/seed_parametros.sql` — los 149 parámetros con sus valores predeterminados, referencias y tipos de campo son los que usa ZENG (Enterobacterias, Salmonella, Listeria, etc.).
- `db/seed_ensayo_parametros.csv`, `db/seed_ensayos.csv`, `db/seed_metodologias.csv`, `db/seed_ensayo_metodologias.csv` — ídem.
- Otro laboratorio puede tener ensayos distintos, metodologías distintas, parámetros distintos, valores de referencia distintos.
- **Qué hacer:** cargar los seeds de ZENG solo si el nuevo lab hace los mismos análisis (microbiología de alimentos, mismo contexto uruguayo). Si no, hay que relevar los ensayos y parámetros del nuevo lab y generar sus propios seeds.

---

## 12. Mensajes de consola del servidor (cosmético)

| Archivo | Línea | Texto actual |
|---|---|---|
| `api/index.js` | 723 | `"Servidor ZENG corriendo en http://localhost:${PORT}"` |

Cambiar a nombre del nuevo lab. Solo aparece en la terminal del servidor — no afecta nada.

---

## Checklist rápido — qué hacer en orden

1. **Reemplazar `web/public/logo.png`** con el logo del nuevo lab.
2. **Editar `deploy/instalar.ps1`** antes de correrlo: cambiar nombres de tareas (`ZENG_*`), nombre de la base (si se quiere), rutas de backup.
3. **Correr `deploy/instalar.ps1`** — genera credenciales nuevas automáticamente.
4. **Editar `web/src/pages/InformeImpresion.tsx`** — todos los datos del encabezado y pie del informe (sección 3 arriba).
5. **Editar los textos de marca** en `AppShell.tsx`, `Login.tsx`, `Panel.tsx`, `index.html` (sección 2 arriba).
6. **Cargar el catálogo del nuevo lab** — ensayos, parámetros, metodologías.
7. **Cargar los clientes del nuevo lab** — no usar `seed_clientes.sql` de ZENG.
8. **Rebuild del frontend:** `cd web && npm run build`.

Los puntos 2 y 4 son los únicos que requieren editar código. El resto es reemplazar archivos o cargar datos.
