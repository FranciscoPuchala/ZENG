# Guía de Base de Datos — ZENG
### Para entender el sistema y resolver problemas vos mismo

> Tenela a mano. Explica cómo funciona la base del sistema y qué hacer si algo falla,
> incluso si en el momento no tenés a quién consultar.

---

## 1. Cómo está armado (el modelo mental)

El sistema tiene **3 capas**, una arriba de la otra:

1. **Frontend** (React) — las pantallas que ves en el navegador. Corre en `http://localhost:5173`.
2. **Backend / API** (Node + Express) — el intermediario: recibe lo que pide el frontend y le habla a la base. Corre en `http://localhost:3001`.
3. **Base de datos** (PostgreSQL) — donde viven **TODOS** los datos (clientes, muestras, resultados, informes…). Corre como un servicio de Windows en el puerto `5432`.

**La idea más importante:** los datos **NO** están en la app; están en PostgreSQL. Si se rompe la app pero tenés la base (o un backup), no perdiste nada. Por eso lo que hay que cuidar por encima de todo es **la base y sus backups**.

**Regla del flujo:** el frontend necesita el backend prendido, y el backend necesita la base prendida. Si una capa de abajo está caída, la de arriba no anda.

---

## 2. Cómo arrancar todo (en orden)

1. **PostgreSQL** arranca solo (es un servicio de Windows). Para chequearlo:
   Inicio → "Servicios" → buscá `postgresql-x64-18` → debe estar **"En ejecución"**. Si no, botón derecho → **Iniciar**.
2. **Backend:** una terminal → `cd api` → `npm run dev` → debe decir *"Servidor ZENG corriendo en http://localhost:3001"*.
3. **Frontend:** otra terminal → `cd web` → `npm run dev` → abrís `http://localhost:5173`.

---

## 3. Cómo ver tus datos

**Opción visual (recomendada para vos):** instalá **DBeaver** (gratis) o usá **pgAdmin** (viene con Postgres). Te conectás una vez (host `localhost`, puerto `5432`, base `zeng`, usuario `postgres`) y ves/editás las tablas haciendo clic, sin memorizar comandos.

**Opción comandos (psql):** `psql -U postgres -d zeng` (te pide la contraseña). Después:
- `\dt` → lista las tablas
- `SELECT * FROM clientes;` → ver una tabla (cambiá el nombre)
- `\q` → salir

---

## 4. Backup y restauración (LO MÁS IMPORTANTE)

Un **backup** es una foto de toda la base en un solo archivo. Si algo se rompe, restaurás la última foto y volviste a estar bien.

**Hacer un backup:**
```
pg_dump -U postgres -d zeng -F c -f C:\backups\zeng_2026-07-19.dump
```
(`-F c` = formato comprimido; poné la fecha en el nombre.)

**Restaurar:**
```
pg_restore -U postgres -d zeng --clean C:\backups\zeng_2026-07-19.dump
```

**Regla de oro:** antes de tocar o borrar datos importantes, **hacé un backup**. Y tené backups **automáticos** (ver la estrategia del disco externo de 2 TB).

---

## 5. Problemas comunes y cómo resolverlos

| Síntoma | Causa probable | Qué hacer |
|---|---|---|
| La app no muestra datos | El backend no está corriendo | En `api/`: `npm run dev` |
| El backend da error de conexión | PostgreSQL parado, o `.env` mal | Iniciar el servicio de Postgres; revisar `api/.env` |
| "psql/pg_dump no se reconoce" | Falta el PATH | Agregar `C:\Program Files\PostgreSQL\18\bin` al PATH |
| Se borró o rompió algo en los datos | Error humano / bug | **Restaurar del último backup** |
| El disco se llenó | Muchos backups viejos | Borrar / mover backups antiguos |
| Olvidaste la contraseña de postgres | — | Está en `api/.env` (línea `DB_PASSWORD`) |

---

## 6. Reglas de oro

- Los datos viven en **PostgreSQL**. Cuidá la base y los backups antes que nada.
- **Nunca** edites datos en producción sin un backup fresco antes.
- Guardá la contraseña de `postgres` en un lugar seguro.
- Si algo no anda, diagnosticá **de abajo hacia arriba**: ¿está la base? ¿está el backend? ¿está el frontend?
- Ante la duda, un backup no molesta.

---

*Tu instalación: PostgreSQL 18, puerto 5432, base `zeng`, usuario `postgres`. Config del backend en `api/.env`.*
