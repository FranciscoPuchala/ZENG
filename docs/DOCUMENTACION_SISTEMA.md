# ZENG — Documentación del Sistema
### Cómo funciona cada parte de la aplicación (actualizado jul 2026)

Documento de referencia: qué tiene el sistema y cómo funciona cada esquina.

---

## 1. Qué es

Sistema de gestión para el laboratorio de microbiología de alimentos **ZENG**. Reemplaza el
software viejo (una app de Access + un programa de resultados sobre SQL Server). Doble objetivo:
herramienta interna para ZENG y, a futuro, producto para vender a otros laboratorios chicos.
Funciona **100% offline** en la red local del lab.

---

## 2. Arquitectura — las 3 capas

| Capa | Qué es | Tecnología |
|---|---|---|
| **Frontend** | Lo que ve y toca el usuario (las pantallas) | React 19 + Vite + TypeScript + Tailwind |
| **Backend / API** | El intermediario: recibe pedidos y habla con la base | Node.js + Express (con JWT) |
| **Base de datos** | Donde viven TODOS los datos | PostgreSQL |

Flujo técnico: **Navegador (React) → API (Express) → PostgreSQL**.

**Despliegue:** cliente-servidor. Una PC "servidor" (siempre prendida) corre Postgres + backend;
las demás PC solo abren el navegador apuntando a su IP. Nada instalado por PC. (Ver sección 9.)

---

## 3. El flujo de trabajo — las 3 etapas

Una muestra recorre 3 etapas, igual que en el lab. Un análisis pasa por 3 estados:
**pendiente → cargado → publicado**.

1. **Ingreso de Muestra** — se registra la muestra (cliente, descripción, fechas, ensayos). Genera
   el N° de muestra global y crea un "análisis" *pendiente* por cada ensayo elegido.
2. **Carga de Resultados** — se cargan los valores de cada parámetro; el análisis pasa a *cargado*.
3. **Cuaderno de Análisis / Informe** — se agrupan análisis *cargados* de un cliente en un informe,
   se publica, y se imprime el Informe de Ensayo.

---

## 4. Las pantallas (cada esquina)

**Login** — usuario + contraseña, con fondo animado (estrellas con paralaje, nebulosas, estrellas
fugaces). Verifica contra el backend (contraseña con bcrypt); guarda la sesión (JWT) que persiste
entre recargas.

**Intro** — pantalla de bienvenida animada (logo Z girando, "BIENVENIDO") después del login.

**Panel (inicio)** — dashboard con estadísticas reales (muestras de hoy, pendientes, cargados,
publicados), gráficos, reloj y últimos informes.

**Ingreso de Muestra (etapa 1)** — formulario (cliente, descripción, fecha/hora de entrada, fecha
de muestreo, quién recibe, observaciones). Selección de ensayos con **buscador** (por código o
nombre) + lista scrollable con checkboxes + **chips** removibles de los seleccionados (hay 151
ensayos). El selector de cliente muestra **solo el código** (sin nombre, por privacidad — pedido
del lab). Al guardar: crea la muestra (N° interno global +1) y un análisis *pendiente* por cada
ensayo. Abajo, tabla de muestras recientes.

**Carga de Resultados (etapa 2)** — lista lateral de análisis *pendientes* (filtrable). Al elegir
uno, trae la **plantilla del ensayo**: sus parámetros y metodologías. Cada parámetro se **pre-carga
con su valor predeterminado** (el típico, ej. `<1.0*10(1)`, `Ausencia`); el analista solo lo cambia
si el resultado es distinto. Los parámetros de **presencia** usan **botones** (Ausencia/Detectado,
Negativo/Presuntivo Positivo…) en vez de texto. Se cargan fecha/hora de siembra, analista y revisor.
Al guardar, el análisis pasa a *cargado*.

**Cuaderno de Análisis (etapa 3)** — tabla de análisis *cargados*; se seleccionan con checkboxes
para agrupar en un informe, **solo del mismo cliente** (los de otros clientes se bloquean).
Formulario: N° de informe, fecha de recepción (autocompletada), fecha de emisión. "Publicar
informe" crea el informe y marca los análisis como *publicados*.

**Informe de Ensayo (impresión)** — el documento final que se entrega al cliente. Se renderiza en
HTML y se **imprime desde el navegador**. Estructura: encabezado (logo + acreditación), datos del
cliente y del informe, y por cada análisis su tabla de parámetros con 3 columnas (parámetro,
resultado, valores de referencia). *(Pendiente de cerrar con el lab: formatos especiales de los
códigos 01 y 121, y el header/pie exacto multipágina.)*

**Reporte de Ficha** — la hoja de trabajo que se imprime por ensayo para anotar a mano en el lab
(réplica de la del sistema viejo).

**Clientes** — lista de clientes (431 reales cargados) + historial de análisis de cada uno +
reimpresión de informes.

**Ensayos y Parámetros** — pantalla para ver el catálogo de ensayos con sus parámetros y metodologías.

**Respaldo (backups)** — estado de los backups (último, cuenta regresiva al próximo, historial).
Permite **restaurar**: elegís de qué backup, ves una **vista previa** del contenido (clientes +
informes) y confirmás escribiendo `CONFIRMAR`.

---

## 5. El modelo de datos — 11 tablas

**Catálogo (datos fijos):** `clientes`, `usuarios`, `ensayos`, `parametros`, `metodologias`.

**Relaciones muchos-a-muchos:** `ensayo_parametros` (qué parámetros tiene cada ensayo) y
`ensayo_metodologias` (qué metodologías) — porque un parámetro/metodología se repite en muchos ensayos.

**Operación (lo de cada día):** `muestras`, `analisis`, `resultados`, `informes`.

**Campos clave:**
- `parametros`: `tipo_campo` (texto / ausencia / negativo / no_detectado), `valor_predeterminado`, `valor_referencia`.
- `analisis`: `estado` (pendiente / cargado / publicado).
- `muestras`: `numero_interno` (contador global, +1 por muestra).
- Esquema en `db/zeng_esquema_v1.sql` + migraciones (`migracion_v2`, `migracion_login`, `migracion_parametros_defaults`).

---

## 6. Cuentas y seguridad (login)

- Login con usuario + contraseña; contraseñas **hasheadas con bcrypt** (nunca en texto plano).
- Sesión con **JWT** (token de 12 h); el backend verifica el token en cada pedido protegido.
- **Roles:** `admin` (crea usuarios, acceso total), `analista`, `tecnico`.
- Los usuarios los crea el admin por terminal: `node crear_admin.js` (en `api/`). *(Pantalla de
  administración de usuarios: pendiente.)*
- Como es **offline**, la superficie de ataque es mínima (nadie de internet puede entrar).

---

## 7. Backups y restauración

- Scripts en `scripts/` (PowerShell): `backup_frecuente.ps1` (cada 30 min) y `backup_diario.ps1`,
  con `pg_dump`.
- Programados con el **Programador de tareas de Windows** (frecuente 08–20 h cada 30 min; diario 23 h).
- **Rotación:** frecuentes 7 días, diarios 1 año. **Log** de OK/ERROR. **Restauración probada.**
- Se puede restaurar desde la pantalla **Respaldo** (con vista previa).
- *(Pendiente: apuntar al disco externo de 2 TB real cuando lo conecten — cambiar `BACKUP_DESTINO`.)*

---

## 8. El backend / API — endpoints

- **Auth:** `POST /login`, `GET /me`, `POST /usuarios`, `GET /usuarios`.
- **Panel:** `GET /stats/panel`.
- **Clientes:** `GET/POST /clientes`, `GET /clientes/:id/analisis`.
- **Catálogo:** `GET /ensayos`, `GET /ensayos/:codigo/plantilla`, `GET /ensayos/:id/parametros`.
- **Muestras:** `GET/POST /muestras`, `DELETE /muestras/:id`.
- **Resultados:** `GET /analisis/pendientes`, `POST /analisis/:id/resultados`.
- **Informes:** `GET /analisis/cargados`, `POST /informes`, `GET /informes`, `GET /informes/:id/reporte`.
- **Backups:** `GET /backup/status`, `GET /backup/lista`, `POST /backup/preview`, `POST /backup/restaurar`.

---

## 9. Despliegue / instalación

- **Modelo cliente-servidor:** una PC servidor (siempre prendida) con Postgres + backend; las demás
  por navegador. Se actualiza una sola vez en el servidor.
- **Paquete `deploy/`:** `instalar.ps1` hace todo en la PC servidor — verifica Postgres/Node, crea la
  base + migraciones + seeds, genera el `.env` con `JWT_SECRET`, instala el backend, hace el build del
  frontend (que el backend sirve), deja el **backend en auto-arranque**, configura el **firewall** y
  muestra la **IP** del servidor. Más `deploy/README.md` con la guía paso a paso.
- En producción el backend sirve el frontend construido (un solo puerto) y la API usa rutas relativas.

---

## 10. Lo que falta

1. **Instalar en la PC servidor del lab** (con `deploy/instalar.ps1`) + conectar el **disco de 2 TB**.
2. **Cerrar el informe con el lab:** descripciones reales de ~145 parámetros, formatos especiales de
   los códigos **01 y 121**, y el header/pie multipágina exacto.
3. Pantalla de **gestión de usuarios** desde la app (baja prioridad).

---

## 11. Cómo correrlo (desarrollo)

```
# Base de datos
psql -U postgres -d zeng -f db/zeng_esquema_v1.sql   (+ migraciones + seeds)
# Backend
cd api && npm install && npm run dev      # http://localhost:3001
# Frontend
cd web && npm install && npm run dev      # http://localhost:5173
```

Guía de base de datos y resolución de problemas: `docs/GUIA_BASE_DE_DATOS.md`.
