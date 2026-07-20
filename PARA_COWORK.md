# PARA_COWORK.md — Novedades de Claude Code → Cowork

> Este archivo lo escribe **Claude Code** al terminar cada sesión de construcción.
> Cowork lo lee para saber qué se hizo en el repo y poder actualizar `CLAUDE.md`
> y tomar decisiones de planificación con información al día.
>
> Flujo inverso a `CLAUDE.md`:
> - `CLAUDE.md` → Cowork escribe, Claude Code lee (contexto y decisiones)
> - `PARA_COWORK.md` → Claude Code escribe, Cowork lee (lo que se construyó)

---

## Sesión anterior — 11 jul 2026 (mañana)

### Pantalla intro splash — estado final

- Logo real ZENG (`web/public/logo.png`, PNG fondo transparente) girando con efecto 3D
- Animación de textos: efecto telescopio (apertura de iris `clip-path: circle()` + blur + letter-spacing)
- Textos grandes: "BIENVENIDO, FRANCISCO" (`text-5xl`) + "LABORATORIO MICROBIOLÓGICO" (`text-xl`)
- Fondo navy, 2 giros, misma curva de easing en zoom y rotación → frenan juntos
- Archivos: `web/src/components/Intro.tsx`, `web/src/index.css`

---

## Última sesión — 11 jul 2026 (noche) — BACKEND ARRANCADO

### Resumen ejecutivo

**Se completaron los 4 pasos del roadmap del finde.** El stack completo funciona de punta a punta:

```
Navegador (React) → Node.js (Express API) → PostgreSQL
```

Una muestra ingresada desde el navegador queda guardada en la base de datos real.

---

### Paso 1 — PostgreSQL instalado ✅

- PostgreSQL 18.4 instalado en Windows (puerto 5432)
- Usuario: `postgres`
- Base creada: `zeng`
- Esquema cargado: `psql -U postgres -d zeng -f db/zeng_esquema_v1.sql` → 8 tablas + 5 índices

**Nota importante:** `psql` no queda en el PATH automáticamente en Windows. Hay que agregar manualmente a cada sesión de PowerShell:
```powershell
$env:Path = $env:Path + ";C:\Program Files\PostgreSQL\18\bin"
```
O reiniciar VS Code para que tome el PATH persistido.

---

### Paso 2 — Datos de prueba cargados ✅

Archivo: `db/seed.sql` (nuevo, commiteado)

Datos insertados:
- **4 clientes**: 439, 297, 026 A, 100
- **4 usuarios**: sv, dq, fr, dg
- **1 ensayo confirmado**: `138 = Enterobacterias`
- **1 parámetro**: Enterobacterias (ufc/g, código 0052)

Para recargar en caso de necesidad: `psql -U postgres -d zeng -f db/seed.sql`

---

### Paso 3 — Backend Node.js ✅

Carpeta: `api/` (nueva)

**Stack:** Node.js + Express 5 + pg + dotenv

**Cómo correrlo:**
```bash
cd api
npm run dev
# → Servidor ZENG corriendo en http://localhost:3001
```

**Endpoints disponibles:**

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/clientes` | Lista todos los clientes |
| POST | `/clientes` | Crea un cliente nuevo |
| GET | `/usuarios` | Lista todos los usuarios/analistas |
| GET | `/ensayos` | Lista todos los ensayos |
| GET | `/muestras` | Lista muestras con cliente, ensayos y estado |
| POST | `/muestras` | Crea muestra + analisis por cada ensayo seleccionado |

**Detalle importante de `POST /muestras`:**
- Calcula el `numero_interno` global automáticamente (MAX + 1, arranca desde 228000)
- Recibe `ensayo_ids[]` y crea una fila en `analisis` por cada uno, en estado `pendiente`
- Cuerpo esperado: `{ cliente_id, descripcion, fecha_entrada, hora_entrada, fecha_muestreo, recibido_por, observaciones, ensayo_ids }`

**Archivo de configuración:** `api/.env` (NO está en git, cubierto por `.gitignore`)
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=zeng
DB_USER=postgres
DB_PASSWORD=<contraseña local>
```

---

### Paso 4 — Ingreso de Muestra conectado a la API ✅

Archivo: `web/src/pages/IngresoMuestra.tsx` (reescrito)

**Lo que cambió:**
- Ya no hay datos hardcodeados. Todo viene de la API en tiempo real.
- Al cargar la pantalla hace 4 llamadas en paralelo: `/clientes`, `/usuarios`, `/ensayos`, `/muestras`
- El formulario es controlado (cada campo tiene su `useState`)
- "Guardar muestra" llama a `POST /muestras` y refresca la tabla automáticamente
- La tabla muestra muestras reales con número interno, cliente, descripción, ensayos y estado
- El buscador filtra por número o nombre de cliente en tiempo real (sin llamada a la API)

**CORS:** el backend tiene middleware CORS que permite llamadas desde `localhost:5173`.

---

### Estado actual del proyecto

| Componente | Estado |
|---|---|
| PostgreSQL local | ✅ Andando |
| Esquema (8 tablas) | ✅ Cargado |
| Datos de prueba | ✅ Cargados |
| Backend API (Node) | ✅ Corriendo en :3001 |
| Frontend (React) | ✅ Corriendo en :5173 |
| Etapa 1 — Ingreso de Muestra | ✅ Conectada a la base real |
| Etapa 2 — Carga de Resultados | ✅ Conectada a la base real |
| Etapa 3 — Cuaderno de Análisis | ⏳ Todavía mock |
| Informe de Ensayo PDF | ⏳ Pendiente 2ª visita |

---

### Lo que falta / próximos pasos sugeridos

1. **Conectar Cuaderno de Análisis** (Etapa 3) — requiere endpoints de informes
2. **Pantallas Clientes y Ensayos** — gestión del catálogo (alta/baja de clientes y ensayos)
3. **2ª visita al laboratorio** — traer el mapeo ensayo→parámetros real, formato del informe, credenciales del SQL Server actual
4. **PATH permanente de psql** — configurar en Windows para no tener que setearlo cada sesión

---

## Sesión — 15 jul 2026 — ETAPA 2 CONECTADA

### Resumen ejecutivo

**Etapa 2 (Carga de Resultados) funciona de punta a punta.** El stack completo de las dos primeras etapas está activo:

```
Navegador → Node.js API → PostgreSQL
  Etapa 1: Ingreso de Muestra ✅
  Etapa 2: Carga de Resultados ✅
```

### Backend — 3 endpoints nuevos en `api/index.js`

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/analisis/pendientes` | Lista análisis en estado `pendiente` con datos de muestra, cliente y ensayo |
| GET | `/ensayos/:id/parametros` | Devuelve los parámetros de un ensayo (por su `id`) |
| POST | `/analisis/:id/resultados` | Guarda valores por parámetro, actualiza análisis a `cargado` |

**Detalle de `POST /analisis/:id/resultados`:**
- Actualiza `analisis.estado = 'cargado'` y guarda `fecha_siembra` / `hora_siembra`
- Por cada parámetro: `INSERT ... ON CONFLICT DO UPDATE` (upsert, se puede guardar dos veces sin duplicar)
- Cuerpo: `{ fecha_siembra, hora_siembra, analista_id, revisor_id, resultados: [{ parametro_id, valor, lectura_dilucion }] }`

### Frontend — `web/src/pages/CargaResultados.tsx` reescrito completo

**Lo que cambió:**
- Lista lateral izquierda trae análisis pendientes reales del endpoint `GET /analisis/pendientes`
- Al hacer click en uno: llama `GET /ensayos/:id/parametros` y muestra la tabla de parámetros reales
- Formulario: fecha de siembra (hoy por defecto), hora, analista y revisor (selects con usuarios reales de la API)
- Tabla de parámetros con campos `valor` (ej. `<1.0*10(1)`) y `lectura dilución` por cada parámetro
- Al guardar: llama `POST /analisis/:id/resultados`, y si es OK el análisis **desaparece de la lista** (ya no está pendiente)
- Sin análisis seleccionado: panel derecho muestra placeholder con ícono de tubo de ensayo
- Buscador filtra por N° de muestra o nombre de cliente

**Build TypeScript:** sin errores (`npm run build` OK en 1.03s).

---

---

## Estado actual del proyecto (15 jul 2026, tarde)

| Componente | Estado |
|---|---|
| PostgreSQL local | ✅ Andando |
| Esquema (8 tablas) | ✅ Cargado |
| Datos de prueba | ✅ Cargados |
| Backend API (Node) | ✅ Corriendo en :3001 |
| Frontend (React) | ✅ Corriendo en :5173 |
| Etapa 1 — Ingreso de Muestra | ✅ Funciona de punta a punta |
| Etapa 2 — Carga de Resultados | ✅ Funciona de punta a punta (validado hoy) |
| Etapa 3 — Cuaderno de Análisis | ⏳ Todavía mock |
| Informe de Ensayo PDF | ⏳ Pendiente 2ª visita |

**Francisco va al laboratorio hoy (15 jul) para cerrar los pendientes de la 2ª visita.**
Ver checklist en `docs/ZENG - Checklist 2a visita.pdf`.

Lo más importante a traer del lab:
- Mapeo real ensayo → parámetros (cuántos ensayos hay, qué parámetros tiene cada uno)
- Copia del formato exacto del Informe de Ensayo (para reproducirlo igual en PDF)
- Acceso a los datos del sistema actual (Access / SQL Server)
- Info de infraestructura: cuántas PCs, cuál es el servidor, cómo es la red

---

## Sesión — 16 jul 2026 — ESQUEMA v2 + PLANTILLA DE ENSAYO

### Resumen ejecutivo

Se completaron los Pasos 1 y 3 de la tarea actual del CLAUDE.md. El Paso 2 (cargar catálogos reales) está bloqueado esperando dos CSVs de Cowork.

### Paso 1 — Esquema v2 ✅

Nuevo archivo: `db/migracion_v2.sql`. Cambios aplicados sobre la base real:

- `parametros` ahora es catálogo standalone: sin `ensayo_id`, con `codigo TEXT UNIQUE`, `descripcion`, `unidad`, `tipo_valor` (`'numerico'` | `'presencia'`)
- Nueva tabla `metodologias` (id, codigo UNIQUE, descripcion)
- Nueva tabla `ensayo_parametros` (ensayo_id FK, parametro_id FK, orden, UNIQUE)
- Nueva tabla `ensayo_metodologias` (ensayo_id FK, metodologia_id FK, orden, UNIQUE)
- `seed.sql` actualizado para usar el nuevo esquema

Cómo aplicar desde cero:
```bash
psql -U postgres -d zeng -f db/migracion_v2.sql
psql -U postgres -d zeng -f db/seed.sql
```

### Paso 2 — Cargar catálogos reales ⏳ BLOQUEADO

Esperando de Cowork:
- `db/seed_ensayos.csv` — 151 ensayos (codigo, nombre)
- `db/seed_parametros.csv` — 158 parámetros (codigo, descripcion, unidad, tipo_valor)

Ya disponibles en `db/`:
- `seed_metodologias.csv` ✅
- `seed_ensayo_parametros.csv` ✅ (376 pares)
- `seed_ensayo_metodologias.csv` ✅ (283 pares)

### Paso 3 — Endpoint `/plantilla` ✅

Nuevo endpoint en `api/index.js`:

`GET /ensayos/:codigo/plantilla` → devuelve `{ ensayo, parametros[], metodologias[] }`

- Busca el ensayo por **código texto** (no por id numérico)
- Parámetros: id, codigo, descripcion, unidad, tipo_valor, orden
- Metodologías: codigo, descripcion
- Devuelve 404 si el código no existe

También se corrigió el endpoint existente `GET /ensayos/:id/parametros` que estaba roto (usaba `ensayo_id` en `parametros`, columna que ya no existe).

### Paso 4 — Frontend CargaResultados ✅

`web/src/pages/CargaResultados.tsx` actualizado:

- Al seleccionar un análisis, llama a `/ensayos/:codigo/plantilla` en lugar del endpoint viejo
- Inputs adaptativos por `tipo_valor`:
  - `numerico` → campo de texto libre (como antes)
  - `presencia` → botones `-` / `+` (toggle, con color)
- Botón `×` por fila para eliminar un parámetro que no se realizó en ese caso puntual
- Lista de metodologías al pie del formulario (solo lectura)

**Validado en la app:** funciona con el parámetro de prueba (0052 Enterobacterias). Cuando lleguen los CSVs y se cargue el catálogo real, todos los ensayos van a mostrar su plantilla completa.

### Estado actual

| Componente | Estado |
|---|---|
| Esquema v2 | ✅ Aplicado en la base |
| Catálogo real (ensayos + parámetros) | ⏳ Esperando CSVs de Cowork |
| Catálogo metodologías | ✅ CSV disponible, pendiente de cargar con el resto |
| Endpoint `/plantilla` | ✅ Funcionando |
| CargaResultados con plantilla | ✅ Funcionando |
| Etapa 3 — Cuaderno de Análisis | ⏳ Todavía mock |

*Actualizado por Claude Code el 16/07/2026.*

---

## Sesión — 16 jul 2026 (tarde) — ETAPA 3 CONECTADA

### Resumen ejecutivo

**Etapa 3 (Cuaderno de Análisis) funciona de punta a punta.** Las tres etapas del flujo del laboratorio están ahora conectadas a la base de datos real.

### Backend — 2 endpoints nuevos en `api/index.js`

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/analisis/cargados` | Lista análisis en estado `cargado` con `cliente_id`, datos de muestra, cliente y ensayo |
| POST | `/informes` | Crea un informe, marca los análisis seleccionados como `publicado` |

**Detalle de `POST /informes`:**
- Cuerpo: `{ cliente_id, numero_informe, fecha_recepcion, fecha_emision, analisis_ids[] }`
- Crea la fila en `informes` con `publicado = true` y `fecha_publicado = CURRENT_DATE`
- Por cada `analisis_id`: actualiza `informe_id`, `numero_informe` y `estado = 'publicado'`

### Frontend — `web/src/pages/CuadernoAnalisis.tsx` reescrito completo

**Lo que cambió:**
- Ya no hay datos hardcodeados. La tabla trae análisis reales del endpoint `GET /analisis/cargados`.
- Al seleccionar un análisis, **se bloquean los de otros clientes** (se grisan y no son seleccionables). Un informe agrupa sólo análisis del mismo cliente.
- Checkbox de "seleccionar todos" selecciona todos los del cliente activo.
- Formulario: N° de informe + fecha de recepción + fecha de emisión.
- "Publicar informe" llama a `POST /informes`; si es OK los análisis **desaparecen de la lista** y aparece un toast animado.
- Botón deshabilitado si falta N° de informe o fecha de emisión.
- Placeholder del PDF del informe permanece (pendiente 2ª visita).

**Build TypeScript:** sin errores (`npm run build` OK en 1.09s).

### Estado actual

| Componente | Estado |
|---|---|
| Etapa 1 — Ingreso de Muestra | ✅ Funciona de punta a punta |
| Etapa 2 — Carga de Resultados | ✅ Funciona de punta a punta |
| Etapa 3 — Cuaderno de Análisis | ✅ Funciona de punta a punta |
| Catálogo real (ensayos + parámetros) | ⏳ Esperando CSVs de Cowork |
| Informe de Ensayo PDF | ⏳ Pendiente 2ª visita |

### Lo que falta / próximos pasos sugeridos

1. **Cargar catálogo real** (Paso 2) — en cuanto lleguen `seed_ensayos.csv` y `seed_parametros.csv` de Cowork
2. **Pantalla Panel** — conectar las 4 stat tiles a datos reales (muestras hoy, pendientes, cargados, publicados)
3. **Pantallas Clientes y Ensayos** — gestión del catálogo (alta/baja)
4. **PDF Informe de Ensayo** — después de cerrar el formato en la 2ª visita

*Actualizado por Claude Code el 16/07/2026.*

---

## Sesión — 17 jul 2026 — CATÁLOGO REAL CARGADO + SELECTOR DE ENSAYOS

### Resumen ejecutivo

Se cargaron los 5 CSVs del catálogo real del laboratorio y se mejoró la UI de selección de ensayos en Etapa 1, que con 151 opciones no podía seguir siendo una lista de etiquetas.

### Catálogo real cargado ✅

Los CSVs de Cowork llegaron y se cargaron con el script `api/seed_catalogos.js`:

```
node api/seed_catalogos.js
```

Resultado:
- **151 ensayos** cargados
- **149 parámetros** (los 158 del CSV; 0052 ya existía y se actualizó su descripción a "Enterobacterias (ufc/g)")
- **68 metodologías**
- **376 relaciones** ensayo→parámetro
- **283 relaciones** ensayo→metodología

Verificación automática al final del script: ensayo `01` (Potabilidad) quedó con **4 parámetros** y **3 metodologías** ✅

El script usa `ON CONFLICT DO UPDATE` en todos los inserts, por lo que se puede volver a correr sin duplicar datos.

### Selector de ensayos en Etapa 1 rediseñado ✅

`web/src/pages/IngresoMuestra.tsx` — sección Ensayos reemplazada:

**Antes:** lista de etiquetas/pills (inmanejable con 151 opciones).

**Ahora:**
- **Chips removibles** en la parte superior: muestran los ensayos ya seleccionados con botón `×` para quitarlos.
- **Campo de búsqueda**: filtra por código (`138`) o nombre (`salmo`, `entero`, etc.) al instante.
- **Lista scrollable** (176px de alto): todos los ensayos navegables, con checkbox teal visual. Los seleccionados quedan resaltados aunque no estén en el viewport.
- Al limpiar el formulario, se vacían los ensayos seleccionados y el campo de búsqueda.

### Estado actual del proyecto

| Componente | Estado |
|---|---|
| Etapa 1 — Ingreso de Muestra | ✅ Funciona de punta a punta |
| Etapa 2 — Carga de Resultados | ✅ Funciona de punta a punta |
| Etapa 3 — Cuaderno de Análisis | ✅ Funciona de punta a punta |
| Catálogo real (151 ensayos, 149 parámetros, 68 metodologías) | ✅ Cargado en la base |
| Informe de Ensayo PDF | ⏳ Pendiente 2ª visita |

### Lo que falta / próximos pasos sugeridos

1. **Pantalla Panel** — conectar las 4 stat tiles a datos reales (muestras hoy, pendientes, cargados, publicados)
2. **Pantallas Clientes y Ensayos** — gestión del catálogo (alta/baja desde la app)
3. **PDF Informe de Ensayo** — después de cerrar el formato exacto con el laboratorio

*Actualizado por Claude Code el 17/07/2026.*

---

## Sesión — 18-19 jul 2026 — INFORME REAL + PANEL + CLIENTES + VARIAS MEJORAS

### Resumen ejecutivo

Sesión muy intensa. Se construyó el **Informe de Ensayo real** (renderizado HTML con todos los campos del informe actual del lab), se completó el **Panel** con datos reales y gráficos, se hizo la **pantalla de Clientes** con historial de análisis, y se mejoraron varias pantallas con validaciones, búsqueda y correcciones de UX.

---

### Informe de Ensayo real — `web/src/pages/InformeImpresion.tsx` (NUEVO ARCHIVO) ✅

Se reemplazó el placeholder del Cuaderno de Análisis por un informe real que se **imprime desde el navegador** (`window.print()`). El informe se renderiza en un **portal React** (`createPortal`) adjunto al `<body>`, con CSS `@media print` que oculta toda la UI y muestra solo el contenido del informe.

**Estructura del informe (reproduciendo el original del lab):**
- Cabecera: logo ZENG + bloque "ORGANISMO URUGUAYO DE ACREDITACIÓN / LE 006"
- Título: "Informe de Ensayo de {nombre del ensayo}"
- Tabla cliente / N° informe (dos columnas): cliente, dirección, teléfono, fax / N° informe, fechas (muestreo, recepción, análisis, emisión)
- Bloques por análisis: N° análisis + descripción de muestra, filas de resultados (descripción, valor)
- Observaciones y firma ("por ZENG Laboratorio Microbiológico")
- **Método analítico** → listado de metodologías del ensayo (va DEBAJO de la firma)
- Notas (3 puntos fijos)
- Pie del timbre profesional
- Pie de página: nota sobre `(-)` / OUA LE 006, URLs, dirección

**N° de ANÁLISIS** (formato confirmado): `{numero_cliente}/{nro_secuencial_por_cliente}/{AA-MM-DD de siembra}`
- El número secuencial es **por cliente**, no global: se calcula con `ROW_NUMBER() OVER (PARTITION BY cliente_id ORDER BY numero_interno)` en SQL.

**N° de INFORME** (auto-generado): `{numero_cliente}/{codigo_ensayo}/{AA-MM-DD de emisión}`
- Se genera automáticamente al seleccionar análisis en el Cuaderno; no requiere entrada manual.

**Endpoint de datos:** `GET /informes/:id/reporte` → devuelve `{ informe, ensayo, analisis[], metodologias[] }`

**Impresión:**
- `window.print()` es síncrono en Chrome → al volver del diálogo, el overlay se cierra solo.
- CSS `@media print`: oculta toda la UI (`body > *:not(#informe-print-root)`), muestra solo el portal; reset de `position`/`overflow`/`height` para el portal y su div interno.

---

### Auto-cierre del overlay de impresión ✅

**Problema resuelto:** el overlay (InformeImpresion) permanecía visible después de que el usuario cerraba el diálogo de impresión de Chrome.

**Solución final:** llamar `onCerrar(modoConfirmacion)` inmediatamente después de `window.print()` (síncrono):
```js
onClick={() => {
  window.print()
  onCerrar(modoConfirmacion)
}}
```
Se descartó el enfoque con `afterprint` (event listener) porque no es confiable en todas las versiones de Chrome.

---

### Flujo de confirmación de impresión ✅

**Problema:** si el usuario publicaba un informe pero cerraba el overlay sin imprimir, los análisis desaparecían del Cuaderno y no podía recuperarlos.

**Solución:** estado `idsRecienPublicados` en CuadernoAnalisis:
- Al publicar: los IDs se guardan en `idsRecienPublicados` (NO se eliminan de `cargados` todavía).
- El InformeImpresion recibe `modoConfirmacion={true}` (primera apertura) o `{false}` (reimpresión desde Clientes).
- `onCerrar(true)` → elimina los análisis del Cuaderno (confirma que se imprimió).
- `onCerrar(false)` → cierra sin eliminar (usuario canceló o volvió del overlay sin imprimir).

---

### Informes publicados en CuadernoAnalisis ✅

Se reemplazó el placeholder del informe por una tabla real de **Informes publicados** al pie de la pantalla Cuaderno de Análisis:
- Trae datos de `GET /informes` (LIMIT 100, ORDER BY id DESC).
- Columnas: N° informe, cliente, ensayo, fecha emisión, cantidad de análisis, botón Reimprimir.
- Botón "Reimprimir" abre InformeImpresion con `modoConfirmacion={false}`.
- Nuevo endpoint en API: `GET /informes` → lista completa de informes publicados con join a clientes y conteo de análisis.

---

### Panel rediseñado con datos reales ✅

`web/src/pages/Panel.tsx` reescrito completo.

**Datos: nuevo endpoint `GET /stats/panel`** — una sola llamada con `Promise.all` que devuelve:
- `pendientes`: análisis en estado `pendiente`
- `cargados`: análisis en estado `cargado` (renombrado de "en carga de resultados" → "Listos para informe")
- `informes_total`: total de informes publicados
- `muestras_hoy`: muestras con `DATE(fecha_entrada) = CURRENT_DATE` (reemplazó "clientes registrados")
- `top_ensayos`: top 5 ensayos por cantidad de análisis
- `actividad_14d`: muestras recibidas por día en los últimos 14 días
- `ultimos_informes`: últimos 5 informes (N° informe, cliente, fecha, cantidad análisis)

**Componentes visuales nuevos:**
- Reloj en tiempo real (setInterval, esquina superior derecha)
- 4 stat tiles con colores semánticos (amber, blue, teal, slate)
- `BarraEnsayo`: barras horizontales proporcionales para top ensayos
- `ActivityChart`: SVG de barras verticales para actividad de 14 días, con tooltip hover y barra de hoy en teal sólido
- Lista de últimos 5 informes con N° informe, cliente, fecha, badge "X análisis"
- `rellenarDias()`: helper que rellena días sin datos con 0 para mantener 14 barras siempre visibles

---

### Pantalla Clientes ✅

`web/src/pages/Clientes.tsx` (archivo nuevo).

**Layout dos paneles:**
- Izquierda (300px fija): lista de todos los clientes con búsqueda por nombre. Viene de `GET /clientes`.
- Derecha: historial completo de análisis del cliente seleccionado. Viene de `GET /clientes/:id/analisis`.

**Búsqueda de análisis:** filtra en tiempo real por N° análisis, N° muestra, ensayo, descripción, N° informe, cualquier fecha.

**Tabla de análisis:** N° Análisis (calculado con `nroAnalisis()`), N° Muestra, Descripción, Ensayo (badge), F. Recepción, F. Siembra, N° Informe, Estado (badge), botón Imprimir (si tiene informe).

**Nuevo endpoint:** `GET /clientes/:id/analisis` → historial completo con `ROW_NUMBER() OVER (PARTITION BY cliente_id ORDER BY numero_interno)` para calcular el número secuencial por cliente.

---

### Búsqueda de clientes en Ingreso de Muestra ✅

Se reemplazó el `<Select>` de clientes por un buscador igual al de ensayos:
- Sin cliente seleccionado: campo de texto + lista scrollable filtrada.
- Con cliente seleccionado: chip con `numero_cliente — nombre` y botón `×` para deseleccionar.
- El formulario ya no pre-selecciona el primer cliente al cargar (requiere selección explícita).

---

### Validación en Carga de Resultados ✅

Si el usuario intenta guardar con campos de parámetros vacíos, la app bloquea el guardado y resalta visualmente las filas problemáticas (fondo rojo claro, borde rojo en el input, mensaje de error). El error se limpia campo por campo al completarlo o al eliminar el parámetro.

---

### Auto-fill fecha de recepción ✅

Al seleccionar análisis en el Cuaderno, `fecha_recepcion` se rellena automáticamente con la `fecha_entrada` de la muestra (viene en la respuesta de `GET /analisis/cargados`).

---

### Datos de prueba borrados ✅

Se eliminaron todas las filas de prueba de `muestras`, `analisis`, `informes` y `resultados` para empezar con datos reales del lab.

---

### Estado actual del proyecto (19 jul 2026)

| Componente | Estado |
|---|---|
| Etapa 1 — Ingreso de Muestra | ✅ Funciona de punta a punta |
| Etapa 2 — Carga de Resultados | ✅ Funciona de punta a punta |
| Etapa 3 — Cuaderno de Análisis | ✅ Funciona de punta a punta |
| Informe de Ensayo (impresión) | ✅ Renderizado HTML, imprime desde el navegador |
| Panel con datos reales | ✅ Stats, gráficos, reloj, últimos informes |
| Pantalla Clientes | ✅ Lista + historial de análisis + reimpresión |
| Catálogo real (151 ensayos, 149 parámetros, 68 metodologías) | ✅ Cargado en la base |
| Catálogo de clientes reales | ⏳ Pendiente — usar datos del lab |
| Múltiples formatos de informe por código | ⏳ Pendiente — ver abajo |

---

### PENDIENTES — confirmaciones del laboratorio (crítico)

Estos puntos están **bloqueados esperando información del lab** (Francisco va a consultar):

#### 1. Parámetros con valores predeterminados

Muchos resultados tienen **valores típicos fijos** que aparecen por defecto pero pueden modificarse en casos especiales. Falta saber:
- ¿Qué parámetros tienen valor predeterminado?
- ¿Cuál es el valor por defecto de cada uno?
- Afecta directamente a `CargaResultados.tsx`: los inputs deben venir pre-cargados con ese valor.

#### 2. Cuáles parámetros son tipo `presencia` (`-` / `+`)

El campo `tipo_valor` del CSV dice qué parámetros son `presencia` (ej. Salmonella, Listeria), pero hay que **confirmar con el lab** si la lista del CSV es correcta y completa. En el informe impreso, los valores `presencia` no aparecen como `-`/`+` sino como texto (ej. "Ausencia en 25g" / "Presencia en 25g") — también falta confirmar el texto exacto de cada valor.

#### 3. PDF con header/footer de los informes

El lab va a mandar un PDF mostrando exactamente cómo es el encabezado y pie de página que aparece en **todas las hojas** de los informes. Esto es importante porque:
- El informe actual puede ocupar varias páginas (múltiples análisis, muchos parámetros).
- Cada página repite el header/footer.
- Hay que reproducirlo exactamente en el CSS de impresión (`@page`, `thead` repetible, etc.).

#### 4. Parámetros con `(-)` → apariencia en el informe

El prefijo `(-)` en un nombre de parámetro indica que ese ensayo **no está dentro del alcance de acreditación OUA LE 006**. En el informe impreso, ¿cómo aparecen exactamente estos parámetros? ¿Con el `(-)` en el nombre, o de otra forma?

#### 5. Formatos diferentes de informe por código de ensayo

Se confirmó que **al menos los códigos 01 y 121 tienen un formato de informe diferente** al resto. Y posiblemente hay otros códigos con formatos distintos también. Falta saber:
- ¿Cuáles códigos tienen formato diferente?
- ¿En qué difieren (distinto orden de campos, campos extra, distinto título, etc.)?
- Esto va a requerir un componente de informe diferente por tipo, o plantillas configurables.

#### 6. Catálogo de clientes reales

Los clientes actuales en la base son de prueba. Hay que cargar los clientes reales del lab (con su `numero_cliente`, nombre, dirección, teléfono, etc.). Viene del sistema actual (Access/SQL Server).

---

### Próximos pasos (en orden de prioridad)

1. **Recibir confirmaciones del lab** (puntos 1–5 de arriba) → sin esto no se puede finalizar el informe.
2. **Cargar clientes reales** desde el sistema actual (Access/SQL Server) — Paso 2 del roadmap.
3. **Ajustar el informe** según el PDF de header/footer que mande el lab.
4. **Valores predeterminados en CargaResultados** → pre-cargar inputs con el valor típico.
5. **Múltiples formatos de informe** → implementar variante para 01, 121, y los que falten.
6. **Pantalla Ensayos** — gestión del catálogo (alta/baja desde la app, si hace falta).

*Actualizado por Claude Code el 19/07/2026.*

---

## Sesión — 19 jul 2026 (tarde) — SISTEMA DE LOGIN COMPLETO

### Resumen ejecutivo

Se implementó el sistema de autenticación completo. Flujo: **Login → Intro → App**. Los usuarios se identifican antes de entrar, el nombre real aparece en el sidebar, y hay un botón de cerrar sesión.

---

### Base de datos — migración login ✅

Nuevo archivo: `db/migracion_login.sql`

Cambios aplicados sobre la base real:
```sql
ALTER TABLE usuarios
  ADD COLUMN usuario       TEXT UNIQUE,
  ADD COLUMN password_hash TEXT,
  ADD COLUMN rol           TEXT NOT NULL DEFAULT 'analista'
                           CHECK (rol IN ('admin', 'analista', 'tecnico'));
```

**Nota:** el constraint se amplió en la misma sesión para incluir `'tecnico'` como tercer rol válido (además de `'admin'` y `'analista'`).

Los usuarios de prueba (sv, dq, fr, dg) fueron **borrados** de la base. Solo quedan usuarios reales del laboratorio.

---

### Backend — 3 endpoints nuevos + middleware ✅

Paquetes instalados: `bcrypt` + `jsonwebtoken`

Nueva variable de entorno en `api/.env`: `JWT_SECRET` (clave aleatoria generada automáticamente).

**Middleware `auth(req, res, next)`:** verifica el token JWT en el header `Authorization: Bearer <token>`. Se usa en endpoints protegidos.

| Método | Ruta | Qué hace |
|---|---|---|
| POST | `/login` | Verifica usuario + bcrypt hash, devuelve JWT de 12h |
| GET | `/me` | Verifica token y devuelve datos del usuario actual |
| POST | `/usuarios` | Crea usuario nuevo (solo rol `admin`) |

**JWT payload:** `{ id, usuario, nombre, iniciales, rol, exp }` — el frontend lo decodifica sin verificar firma (solo para mostrar datos), la verificación real la hace el backend.

---

### Script para crear usuarios desde terminal ✅

Archivo: `api/crear_admin.js`

```bash
cd api
node crear_admin.js
```

Hace 4 preguntas interactivas (usuario, contraseña, nombre, iniciales) y crea el usuario como `admin`. Si el usuario ya existe, actualiza su contraseña. Válido para crear cualquier usuario, no solo admins.

**Forma de correrlo:** siempre desde dentro de la carpeta `api/` (no desde la raíz).

---

### Frontend — 4 archivos modificados/creados ✅

**`web/src/lib/auth.ts`** (nuevo):
- `guardarToken(token)` / `leerToken()` / `borrarToken()` — maneja el JWT en `localStorage`
- `leerSesion()` — decodifica el payload del JWT guardado y verifica que no esté expirado

**`web/src/pages/Login.tsx`** (nuevo):
- Pantalla de login con fondo navy, logo Z, campos usuario + contraseña
- Llama a `POST /login`, guarda el token, llama a `onLogin(usuario)`
- Muestra error si usuario/contraseña incorrectos o servidor caído
- Botón deshabilitado hasta que ambos campos estén completos

**`web/src/App.tsx`** (modificado):
- Nuevo estado `usuario: UsuarioSesion | null` — inicializado desde `leerSesion()` (persiste entre recargas)
- Flujo: sin sesión → `<Login>`, con sesión → Intro → App
- `handleLogin()`: guarda usuario, resetea intro para que se muestre al entrar
- `handleLogout()`: borra token, limpia estado, vuelve al login

**`web/src/components/layout/AppShell.tsx`** (modificado):
- Acepta props `usuario: UsuarioSesion` y `onLogout: () => void`
- Footer del sidebar: muestra iniciales reales (con fondo teal), nombre completo y rol
- Botón de cerrar sesión (ícono `LogOut`) al lado del nombre — rojo al hover
- Ya no hay datos hardcodeados ("Francisco · Recepción")

**`web/src/components/Intro.tsx`** (modificado):
- Eliminada la constante `NOMBRE_USUARIO = "Francisco"`
- Texto cambiado de `"Bienvenido, {NOMBRE_USUARIO}"` → `"Bienvenido"` (sin nombre)

---

### Roles en uso

| Rol | Descripción |
|---|---|
| `admin` | Puede crear usuarios, acceso total |
| `analista` | Acceso normal al flujo del lab |
| `tecnico` | Tercer rol agregado en esta sesión a pedido del lab |

La diferenciación de permisos por rol en el frontend (qué puede ver/hacer cada uno) queda para una fase futura.

---

### Pendiente — Gestión de usuarios desde la app

Hoy la única forma de crear/modificar usuarios es:
- **Crear:** `node crear_admin.js` desde la terminal (carpeta `api/`)
- **Ver/modificar:** psql → `SELECT id, iniciales, nombre, usuario, rol FROM usuarios;` + `UPDATE`

Se decidió no construir la pantalla de Configuración → Usuarios en esta sesión. Queda pendiente para cuando haga falta.

---

### Estado actual del proyecto (19 jul 2026, noche)

| Componente | Estado |
|---|---|
| Sistema de login (DB + backend + frontend) | ✅ Completo |
| Etapa 1 — Ingreso de Muestra | ✅ Funciona de punta a punta |
| Etapa 2 — Carga de Resultados | ✅ Funciona de punta a punta |
| Etapa 3 — Cuaderno de Análisis | ✅ Funciona de punta a punta |
| Informe de Ensayo (impresión) | ✅ Renderizado HTML, imprime desde el navegador |
| Panel con datos reales | ✅ Stats, gráficos, reloj, últimos informes |
| Pantalla Clientes | ✅ Lista + historial + reimpresión |
| Gestión de usuarios desde la app | ⏳ Pendiente (hoy solo desde terminal/psql) |
| Confirmaciones del lab (formatos de informe, parámetros, etc.) | ⏳ Esperando — ver sección anterior |

*Actualizado por Claude Code el 19/07/2026.*

---

## Sesion — 19 jul 2026 (noche) — BACKUPS AUTOMATICOS COMPLETOS

### Resumen ejecutivo

Sistema de backups automaticos de PostgreSQL completamente funcional y probado. Los backups corren solos sin que nadie tenga que hacer nada.

### Scripts creados — `scripts/`

**`scripts/backup_frecuente.ps1`**
- Corre `pg_dump` de la base `zeng` en formato comprimido (`-F c`)
- Guarda en `$DESTINO\backups_zeng\frecuentes\zeng_YYYY-MM-DD_HH-mm.dump`
- Borra archivos de mas de 7 dias automaticamente
- Lee la contrasena de postgres directamente del `api/.env` (no hay contrasena en el repo)
- Escribe una linea en `$DESTINO\backups_zeng\backup.log` con fecha + OK/ERROR

**`scripts/backup_diario.ps1`**
- Igual pero guarda en `$DESTINO\backups_zeng\diarios\zeng_YYYY-MM-DD.dump`
- Retiene 365 dias

**Configuracion:** la variable `$DESTINO` esta arriba de cada script. Hoy apunta a la carpeta `respaldo` del escritorio (prueba). En produccion cambiarla por la letra del disco externo de 2TB (ej. `E:\`).

### Tareas programadas de Windows creadas

| Tarea | Horario | Script |
|---|---|---|
| `ZENG_Backup_Frecuente` | Cada 30 min, 08:00-20:00 | `backup_frecuente.ps1` |
| `ZENG_Backup_Diario` | Todos los dias 23:00 | `backup_diario.ps1` |

Creadas con PowerShell como Administrador. Estado: Ready. Para verificar: Inicio -> "Programador de tareas".

### Como verificar que los backups estan corriendo

1. **El log:** `respaldo\backups_zeng\backup.log` — cada ejecucion agrega una linea con fecha + OK/ERROR
2. **Programador de tareas:** ver columna "Ultima ejecucion" de `ZENG_Backup_Frecuente`
3. **Los archivos:** en `respaldo\backups_zeng\frecuentes\` deben aparecer archivos nuevos cada 30 min

### Restauracion probada y verificada

Se restauro el backup en `zeng_test` y se verifico: 4 clientes, 5 usuarios, 151 ensayos. Todo OK.

Comando de restauracion de emergencia:
```
pg_restore -U postgres -d zeng "ruta\al\backup.dump"
```

### Pendiente — Cuando llegue el disco externo de 2TB

En cada script cambiar:
```powershell
$DESTINO = "C:\Users\franp\OneDrive\Escritorio\respaldo"
```
Por la letra real del disco (ej. `E:\`). Y volver a probar que los archivos aparecen ahi.

*Actualizado por Claude Code el 19/07/2026.*

---

## Sesion — 19 jul 2026 (madrugada) — RESTAURACION MEJORADA + PRIVACIDAD CLIENTE

### Resumen ejecutivo

Dos mejoras sobre lo construido esta noche: la pantalla de Respaldo ahora permite elegir de qué backup restaurar (con vista previa del contenido), y el selector de cliente en Ingreso de Muestra ya no muestra nombres a la vista.

---

### Bug corregido — restauracion usaba backup incorrecto

El endpoint `POST /backup/restaurar` solo buscaba en `frecuentes/` y podía restaurar un archivo mas viejo que el que había en `diarios/`. Ahora compara los dos y elige el mas reciente por fecha de modificacion. Ademas se acepta exit code 1 (warnings) como exito, que es lo que devuelve pg_restore con `--clean` en bases con objetos que no existen todavia.

---

### Seleccion de backup + vista previa — `api/index.js` + `web/src/pages/Respaldo.tsx` ✅

#### Nuevos endpoints

| Metodo | Ruta | Que hace |
|---|---|---|
| GET | `/backup/lista` | Lista los ultimos 15 dumps de `frecuentes/` + 15 de `diarios/`, ordenados por fecha |
| POST | `/backup/preview` | Restaura el dump elegido en `zeng_preview_restore` (base temporal), consulta clientes + informes, borra la base temporal y devuelve el resultado |

**Detalle de `/backup/preview`:**
- Corre `dropdb --if-exists zeng_preview_restore` + `createdb` + `pg_restore --no-owner --no-privileges`
- Consulta clientes + sus numeros de informe (con `json_agg`)
- Siempre hace `dropdb` al final (sea OK o error)
- Timeout de 60s para pg_restore de preview; 120s para el restaurar real

**`POST /backup/restaurar` actualizado:**
- Acepta `{ archivo, carpeta }` en el body → restaura ese archivo especifico
- Si no viene body, usa el mas reciente de cualquier carpeta (fallback)
- Acepta exit code 0 o 1 como exito

#### Nuevo flujo del modal en Respaldo

El boton "Restaurar" ahora abre un modal en 3 pasos:

1. **Lista de backups** scrollable (frecuentes en teal, diarios en azul) con fecha, tipo y tamaño
2. Click en uno → spinner + llamada a `/backup/preview` (puede tardar segundos)
3. Tabla de **clientes con sus numeros de informe** del backup seleccionado
4. Recien entonces aparece el campo para escribir `CONFIRMAR` y el boton se habilita

---

### Selector de cliente en Ingreso de Muestra — solo codigos ✅

`web/src/pages/IngresoMuestra.tsx`

El laboratorio pidio que los nombres de los clientes no sean visibles al momento de seleccion:

- **Lista desplegable:** ahora solo muestra `{numero_cliente}`, sin nombre
- **Chip de seleccionado:** antes mostraba "026 A — Nombre del cliente"; ahora solo "026 A"
- **Buscador:** filtra solo por `numero_cliente`, no por nombre
- La tabla de "Muestras recientes" y la pantalla Clientes no fueron tocadas

---

### Estado actual del proyecto (19 jul 2026, madrugada)

| Componente | Estado |
|---|---|
| Sistema de login (DB + backend + frontend) | ✅ Completo |
| Backups automaticos (frecuentes + diarios) | ✅ Funcionando con tareas programadas |
| Pantalla Respaldo | ✅ Estado, countdown, historial, seleccion de backup, vista previa, restauracion con CONFIRMAR |
| Etapa 1 — Ingreso de Muestra | ✅ Funciona (selector de cliente solo muestra codigos) |
| Etapa 2 — Carga de Resultados | ✅ Funciona de punta a punta |
| Etapa 3 — Cuaderno de Analisis | ✅ Funciona de punta a punta |
| Informe de Ensayo (impresion) | ✅ Renderizado HTML, imprime desde el navegador |
| Panel con datos reales | ✅ Stats, graficos, reloj, ultimos informes |
| Pantalla Clientes | ✅ Lista + historial + reimpresion |
| Gestion de usuarios desde la app | ⏳ Pendiente (hoy solo desde terminal/psql) |
| Confirmaciones del lab (formatos de informe, parametros, etc.) | ⏳ Esperando |

### Pendientes principales

1. Cuando llegue el disco externo de 2TB: cambiar `$DESTINO` en los scripts de backup y `BACKUP_LOG` en `api/.env`
2. Recibir confirmaciones del lab: valores predeterminados en parametros, tipo presencia, header/footer PDF, formatos especiales (01, 121)
3. Cargar clientes reales desde el sistema actual
4. Pantalla de gestion de usuarios (baja prioridad)

*Actualizado por Claude Code el 19/07/2026.*
