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

---

## Sesion — 20 jul 2026 — PAQUETE DE DEPLOY COMPLETO

### Resumen ejecutivo

Se completo el paquete de instalacion del servidor (`deploy/`) y se refactorizo la URL de la API en el frontend para que en produccion use rutas relativas (mismo origen) en lugar del localhost hardcodeado.

### Paso 1 — Frontend en modo produccion ✅

**`web/src/lib/api.ts`** (nuevo):
```ts
export const API = (import.meta.env.VITE_API_URL as string | undefined) ?? ""
```
- En produccion: `API = ""` → todas las rutas son relativas (ej. `/clientes`) → mismo origen que el servidor
- En desarrollo: `API = "http://localhost:3001"` via `web/.env.development`

Los 9 archivos de paginas (`*.tsx`) se actualizaron para importar `{ API } from "@/lib/api"` en lugar de tener `const API = "http://localhost:3001"` hardcodeado en cada uno.

**`api/index.js`** modificado:
- `PORT` ahora viene de `process.env.PORT` (configurable desde `.env`)
- En produccion: Express sirve `web/dist/` como estaticos con `express.static()` + fallback SPA
- En dev: `web/dist/` no existe, el fallback no se registra, el frontend sigue en :5173 como antes

### Paso 2 — Scripts de backup refactorizados ✅

`scripts/backup_frecuente.ps1` y `scripts/backup_diario.ps1` reescritos: ya no tienen ninguna ruta hardcodeada de Francisco. Toda la configuracion (`PG_BIN`, `BACKUP_DESTINO`, `DB_PASSWORD`) se lee del `api/.env` via la funcion `Read-EnvVar` y `$PSScriptRoot`. Si una variable no esta en el `.env`, hay fallback por defecto (`PG_BIN = C:\Program Files\PostgreSQL\18\bin`, `DESTINO = D:\`).

### Paso 3 — `deploy/instalar.ps1` ✅

Script PowerShell para instalar todo en la PC servidor (Administrador). Hace en orden:
1. Verifica Node.js (v18+) y PostgreSQL (busca pg_dump.exe en versiones 18/17/16/15)
2. Pide contrasena de postgres, puerto (default 3001), carpeta de backups (default `D:\`)
3. Prueba la conexion a Postgres
4. Crea la base `zeng` y corre migraciones: `zeng_esquema_v1.sql`, `migracion_v2.sql`, `migracion_login.sql`
5. Genera `api/.env` con JWT_SECRET aleatorio de 48 bytes
6. `npm install` del backend + corre `api/crear_admin.js`
7. `npm install` + `npm run build` del frontend
8. Registra 3 tareas programadas: `ZENG_Backend` (arranque con Windows), `ZENG_Backup_Frecuente` (08:00-19:00 cada 30 min), `ZENG_Backup_Diario` (23:00)
9. Abre el puerto en el firewall con `New-NetFirewallRule`
10. Muestra la IP del servidor (las otras PCs entran por `http://IP:puerto`)

### Paso 4 — `deploy/.env.example` y `deploy/README.md` ✅

**`deploy/.env.example`:** plantilla con todas las variables del `api/.env`.

**`deploy/README.md`:** guia de instalacion completa: prerequisitos, correr el script, verificar, URL para otras PCs, como actualizar, troubleshooting.

### Build verificado

`npm run build` en `web/` compilo sin errores de tipos. Warning de chunk size (521 KB) es esperado — Framer Motion, irrelevante en LAN.

### Estado actual (20 jul 2026)

| Componente | Estado |
|---|---|
| Paquete de deploy (`deploy/`) | ✅ Completo — instalar.ps1, .env.example, README |
| API URL configurable | ✅ Refactorizado en los 9 archivos de paginas |
| Express sirve frontend en produccion | ✅ express.static + fallback SPA |
| Scripts de backup sin rutas hardcodeadas | ✅ Todo desde `api/.env` |
| Las 3 etapas del flujo | ✅ Funcionando de punta a punta |

### Pendientes principales

1. Cuando llegue el disco externo de 2TB: ajustar `BACKUP_DESTINO` en `api/.env` (los scripts lo leen de ahi automaticamente)
2. Instalar en la PC servidor del lab con `deploy/instalar.ps1`
3. Cargar clientes reales desde el sistema actual del lab
4. Confirmaciones del lab: valores predeterminados, tipo presencia, formatos especiales (01, 121)

*Actualizado por Claude Code el 20/07/2026.*

---

## Sesion — 20 jul 2026 (tarde/noche) — PREDETERMINADOS + FONDO GALACTICO

### Resumen ejecutivo

Cuatro mejoras sobre el sistema completo: corrección de un bug crítico del backend, carga de los 431 clientes reales, sistema de valores predeterminados en los parámetros, y pantalla de login con fondo galáctico interactivo.

---

### Bug corregido — backend no arrancaba ✅

**Causa:** `app.get("*", ...)` en `api/index.js` — path-to-regexp v8 ya no acepta el wildcard `*` como nombre de parámetro.

**Fix:** reemplazado por `app.use((_req, res) => res.sendFile(...))` — evita el parser de rutas por completo. El fallback SPA sigue funcionando igual.

---

### 431 clientes reales cargados ✅

Nuevo archivo: `db/seed_clientes.sql`

- 431 clientes extraídos de las capturas de pantalla del sistema Access (relevamiento 20/07/2026)
- Códigos en todos los formatos usados por el lab: `'026 A'`, `'003'`, `'150A'`, `'D 26'`, `'3296'`, etc.
- `ON CONFLICT (numero_cliente) DO UPDATE SET nombre = EXCLUDED.nombre` — idempotente, se puede volver a correr sin duplicar.
- Resultado al correr: `INSERT 0 431`

---

### Sistema de valores predeterminados en parámetros ✅

#### Por qué

El 95% de los resultados de muchos parámetros es siempre el mismo valor (ej. `<1.0*10(1)`, `Ausencia`, `Negativo`). En vez de que el analista escriba el mismo valor una y otra vez, la app lo pre-carga y el analista solo lo cambia si el resultado es diferente.

#### Migración de base de datos — `db/migracion_parametros_defaults.sql` (nuevo)

```sql
ALTER TABLE parametros
  ADD COLUMN IF NOT EXISTS valor_predeterminado VARCHAR(100),
  ADD COLUMN IF NOT EXISTS valor_referencia     VARCHAR(100),
  ADD COLUMN IF NOT EXISTS tipo_campo           VARCHAR(30) NOT NULL DEFAULT 'texto';
```

Los 4 valores posibles de `tipo_campo`:
- `'texto'` — campo libre (el analista escribe)
- `'ausencia'` — botones `Ausencia` / `No Detectado`
- `'negativo'` — botones `Negativo` / `Presuntivo Positivo`
- `'no_detectado'` — botones `No Detectado` / `Detectado`

#### Seed de parámetros — `db/seed_parametros.sql` (nuevo)

- 149 parámetros (códigos 0001–0158 + código 50) con `tipo_campo`, `valor_predeterminado`, `valor_referencia`
- 4 descripciones reales confirmadas (del informe de Potabilidad): 0001, 0002, 0003, 0004
- El resto tiene descripciones placeholder `'Parámetro 00XX'` — a actualizar en la 2ª visita
- El `ON CONFLICT` NO sobreescribe `descripcion` — solo actualiza los 3 campos nuevos
- Resultado al correr: `INSERT 0 149`

Los parámetros con "Aceptable" en el sistema viejo tienen `tipo_campo = 'texto'` y `valor_predeterminado = NULL` — el analista tiene que escribir el valor (no tiene un valor típico fijo).

---

### Carga de Resultados — predeterminados y selectores de botones ✅

`web/src/pages/CargaResultados.tsx` actualizado:

**Valores predeterminados:**
- Al seleccionar un análisis, cada parámetro se inicializa con su `valor_predeterminado` (si existe)
- Interface `Parametro` ampliada: `tipo_campo`, `valor_predeterminado`

**Selectores de botones (reemplazó los dropdowns):**
- Parámetros con `tipo_campo != 'texto'` muestran dos botones lado a lado en lugar de un campo de texto
- El botón seleccionado se resalta en verde claro (`border-green-400 bg-green-100 text-green-800`)
- El otro botón queda en gris neutro con hover suave
- Tabla ampliada de `w-52` a `w-64` para que "Presuntivo Positivo" entre sin cortar

**API actualizada (`api/index.js`):**
- `/ensayos/:id/parametros` y `/ensayos/:codigo/plantilla` ahora devuelven `p.tipo_campo, p.valor_predeterminado`
- `/informes/:id/reporte` devuelve `p.valor_referencia`

---

### Informe de Ensayo — columna "Valores de Referencia" ✅

`web/src/pages/InformeImpresion.tsx` actualizado:

- Interface `Resultado` ampliada: `valor_referencia: string | null`
- Tabla de resultados cambiada de 2 a 3 columnas:
  - Columna 1 (48%): descripción del parámetro
  - Columna 2 (26%): Resultados
  - Columna 3 (26%): Valores de Referencia
- Sub-cabecera de columnas debajo del bloque del N° ANÁLISIS
- Las celdas de `valor_referencia` muestran `""` (vacío) si el parámetro no tiene referencia — sin guión, para que el informe quede limpio

---

### Pantalla de Login — fondo galáctico interactivo ✅

`web/src/pages/Login.tsx` reescrito con el componente `FondoGalactico`:

**Técnica:** Canvas `requestAnimationFrame` con `dt` calculado desde `performance.now()`.

**230 estrellas en 3 capas de profundidad:**
- Near (18 estrellas, depth 0.1–0.25): radio 1.5–3.5px, paralaje de hasta 36px, con halo brillante
- Mid (62 estrellas, depth 0.4–0.6): radio 0.5–1.6px, paralaje ~16px
- Far (150 estrellas, depth 0.7–0.95): radio 0.15–0.8px, casi sin paralaje

**Paralaje con mouse:**
- Fórmula: `par = 40 * (1 - depth)` → estrellas cercanas se mueven más
- Lerp suave: `sm.x += (mouse.x - sm.x) * 0.07` (60fps, lag visual intencional)

**Nebulosas animadas (3 elipses):**
- Una teal (izquierda), una violeta (derecha arriba), una azul (abajo)
- Pulso de opacidad: `0.65 + 0.35 * sin(t * 0.25 + i * 2.1)`
- Dibujadas con `ctx.save() + ctx.scale(rw*W, rh*H) + createRadialGradient(0,0,0,0,0,1)`

**Estrellas fugaces:**
- Aparecen cada 3–8s aleatoriamente
- Trayectoria diagonal, trail con `createLinearGradient`, `life -= dt * 1.6`
- Cabeza brillante (círculo blanco 2px)

**Tarjeta de login:** glassmorphism — `background: rgba(3,8,26,0.70)` + `backdropFilter: blur(20px)`

---

### Estado actual del proyecto (20 jul 2026, noche)

| Componente | Estado |
|---|---|
| Paquete de deploy (`deploy/`) | ✅ Completo |
| 431 clientes reales | ✅ Cargados en la base |
| Valores predeterminados en parámetros | ✅ 149 parámetros con tipo_campo + predeterminado + referencia |
| CargaResultados con predeterminados y botones | ✅ Funciona |
| Informe con columna Valores de Referencia | ✅ Funciona |
| Pantalla Login con fondo galáctico | ✅ Interactivo (paralaje + fugaces + nebulosas) |

### Pendientes principales

1. Descriptions de los 145 parámetros placeholder — se rellenan después de la 2ª visita al lab
2. Instalar en la PC servidor del lab con `deploy/instalar.ps1`
3. Cuando llegue el disco externo de 2TB: ajustar `BACKUP_DESTINO` en `api/.env`
4. Confirmaciones del lab: formatos especiales de informe (códigos 01 y 121), header/footer multi-página

*Actualizado por Claude Code el 20/07/2026.*

---

## Sesión — 21 jul 2026 — CORRECCIÓN DE 19 BUGS (backend + frontend)

### Resumen ejecutivo

Sesión de corrección masiva de bugs encontrados por un análisis exhaustivo del código. Se reescribió `api/index.js` completo y se corrigieron 8 archivos del frontend. El build TypeScript pasa sin errores. **Ningún cambio de comportamiento visible en uso normal — todos los fixes son de robustez y seguridad.**

---

### Backend — `api/index.js` reescrito completo ✅

**Helpers nuevos:**

| Helper | Qué hace |
|---|---|
| `wrap(fn)` | Captura errores async y responde 500 — evita que el proceso crashee o cuelgue |
| `spawnAsync(cmd, args, opts)` | Ejecuta procesos externos sin bloquear el event loop (reemplaza `spawnSync`) |
| `validarRutaBackup(base, carpeta, archivo)` | Previene path traversal — valida que el archivo quede dentro del directorio permitido |

**Fixes aplicados:**

1. **JWT_SECRET validation al arrancar** — si no está en `.env`, el servidor imprime el error y sale (`process.exit(1)`) en vez de arrancar sin funcionar.
2. **`wrap()` en todos los endpoints** — antes: un throw crasheaba Node o dejaba la request colgada. Ahora: siempre responde 500 JSON.
3. **`auth` middleware en todos los endpoints de datos** — antes: los endpoints no verificaban el JWT. Ahora: sin token válido → 401.
4. **Bcrypt null guard en `/login`** — si el usuario no tiene `password_hash` (NULL), responde 401 en vez de crashear.
5. **Transacción + advisory lock en `POST /muestras`** — `pg_advisory_xact_lock(42)` serializa el `MAX(numero_interno) + 1`. Antes: dos peticiones simultáneas podían generar el mismo número.
6. **Transacción en `POST /informes`** — antes: si fallaba al actualizar un análisis, el informe quedaba creado pero los análisis seguían como `cargado`. Ahora: todo o nada.
7. **Fix query de estado de muestra** — antes: `ORDER BY id LIMIT 1` podía devolver `publicado` aunque hubiera análisis pendientes. Ahora: `ORDER BY CASE estado WHEN 'pendiente' THEN 1 ...`.
8. **N+1 eliminado en `GET /informes/:id/reporte`** — antes: una query por análisis para traer sus resultados. Ahora: una sola query con `json_agg(json_build_object(...)) FILTER (WHERE r.id IS NOT NULL)`.
9. **`spawnSync` → `spawnAsync`** en todos los endpoints de backup — antes: bloqueaba el event loop hasta 120s.
10. **`pgBin` desde `process.env.PG_BIN`** — antes: hardcodeado a `C:\Program Files\PostgreSQL\18\bin`.
11. **Path traversal en backup** — `validarRutaBackup()` valida que `carpeta` sea `frecuentes` o `diarios` y que el path resuelto quede dentro del directorio base.

---

### Base de datos — `db/migracion_unique_informe.sql` (nuevo) ✅

```sql
ALTER TABLE informes
  ADD CONSTRAINT informes_numero_informe_unique UNIQUE (numero_informe);
```

**Antes de aplicar:** verificar que no haya duplicados:
```sql
SELECT numero_informe, COUNT(*) FROM informes GROUP BY numero_informe HAVING COUNT(*) > 1;
```

---

### Frontend — `web/src/lib/auth.ts` ✅

**Fix:** `leerSesion()` — el bloque `catch` ahora llama `borrarToken()`. Antes: si el token estaba malformado, la sesión parecía inválida pero el token corrupto seguía en `sessionStorage`.

---

### Frontend — `web/src/lib/api.ts` ✅

**Nuevo:** función `apiFetch(path, options?)` — agrega el header `Authorization: Bearer <token>` automáticamente en todas las llamadas a la API. Reemplaza los ~30 `fetch(${API}/...)` dispersos en las páginas.

---

### Frontend — 7 páginas corregidas ✅

| Archivo | Fixes |
|---|---|
| `IngresoMuestra.tsx` | try/catch en `cargar()`, check `res.ok` en `guardarMuestra()` (antes mostraba éxito aunque fallara), apiFetch |
| `CargaResultados.tsx` | try/catch en `cargar()`, `AbortController` en `seleccionar()` (cancela fetch anterior si usuario cambia rápido), error cuando `!res.ok` en `guardar()`, apiFetch |
| `CuadernoAnalisis.tsx` | Fix doble publicación — análisis se sacan de `cargados` inmediatamente al publicar; apiFetch |
| `InformeImpresion.tsx` | apiFetch |
| `Panel.tsx` | apiFetch, fix `key={i}` → `key={inf.numero_informe}` |
| `Respaldo.tsx` | apiFetch reemplaza headers manuales, fix `key={i}` → `key={e.fecha + e.detalle}` |
| `Clientes.tsx` | try/catch en `verCliente()` (antes: spinner infinito si fallaba), apiFetch |

---

### Estado actual del proyecto (21 jul 2026)

| Componente | Estado |
|---|---|
| Backend — robustez y seguridad | ✅ wrap() + auth + transacciones + advisory lock + spawnAsync |
| Frontend — auth centralizada | ✅ apiFetch con Authorization header automático |
| Frontend — manejo de errores | ✅ try/catch + res.ok en todas las páginas |
| DB — constraint UNIQUE en numero_informe | ✅ Script listo — HAY QUE APLICARLO |
| Las 3 etapas del flujo | ✅ Sin cambio de comportamiento en uso normal |

### Para hacer en la base de datos (aplicar manualmente)

```powershell
$env:Path = $env:Path + ";C:\Program Files\PostgreSQL\18\bin"
psql -U postgres -d zeng -f db/migracion_unique_informe.sql
```

*Actualizado por Claude Code el 21/07/2026.*

---

## Sesión — 21 jul 2026 (continuación) — CHECKLIST DE PERSONALIZACIÓN

### Resumen

Se creó `docs/PERSONALIZAR_NUEVO_LAB.md` — checklist completo de todo lo específico de ZENG que hay que cambiar para instalar el sistema en otro laboratorio. Se generó escaneando el código completo.

### Lo que cubre

12 secciones:

1. **Logo** — reemplazar `web/public/logo.png` (un solo archivo, se propaga solo)
2. **Nombre en la UI** — 4 archivos: `index.html`, `AppShell.tsx`, `Login.tsx`, `Panel.tsx`
3. **Informe de Ensayo** — toda la sección de datos del lab en `InformeImpresion.tsx`: LE 006, MGAP N° 0018, dirección, Telefax, emails, web, firma
4. **Nombre de la base de datos** — `zeng` en 6 archivos (opcional cambiarlo)
5. **Rutas de backup** — carpetas `backups_zeng/` en scripts y `.env`
6. **Tareas programadas de Windows** — `ZENG_Backend`, `ZENG_Backup_Frecuente`, `ZENG_Backup_Diario`
7. **Credenciales** — `JWT_SECRET` y `DB_PASSWORD` siempre nuevos; el instalador los genera automáticamente
8. **Usuario admin** — cosmético en `crear_admin.js`
9. **sessionStorage key** — `"zeng_token"` en `auth.ts` (solo importa si hay dos labs en una misma PC)
10. **Nombre npm** — `"zeng-web"` en `package.json` (cosmético)
11. **Catálogo** — los 431 clientes y los seeds de ensayos/parámetros/metodologías son de ZENG y NO se copian
12. **Mensaje de consola** — cosmético en `api/index.js`

### Checklist rápido (orden de trabajo)

1. Reemplazar `logo.png`
2. Editar `deploy/instalar.ps1` antes de correrlo
3. Correr `instalar.ps1` (genera credenciales nuevas automáticamente)
4. Editar `InformeImpresion.tsx` (datos del lab en el informe)
5. Editar los 4 textos de marca
6. Cargar catálogo del nuevo lab
7. Cargar clientes del nuevo lab
8. `npm run build`

*Actualizado por Claude Code el 21/07/2026.*

---

## Sesión — 21 jul 2026 (noche) — INFORME REAL CON MEMBRETADO + OUA + MEJORAS UX

### Resumen ejecutivo

Sesión intensa de mejoras al Informe de Ensayo. El informe ahora usa las hojas membretadas reales del lab como fondo, el criterio de sello OUA pasó a ser una columna en la base de datos, se ocultó la columna de referencias cuando no hay valores, y se agregó el botón "Impreso" para gestionar la lista de informes publicados.

---

### Membretado real como fondo del informe ✅

**Problema:** el header y footer del informe estaban re-creados en HTML/CSS y no coincidían con los originales.

**Solución:** las dos hojas membretadas del lab (PDFs) se convirtieron a JPG con PyMuPDF a 150dpi y se usan como `background-image` en el div del informe A4.

**Archivos creados:**
- `web/public/membretado_sin_sello.jpg` — HOJA MEMBRETADA 1.PDF (sin sello OUA), 1240×1754px
- `web/public/membretado_con_sello.jpg` — HOJA MEMBRETADA 2.PDF (con sello OUA en esquina superior derecha), 1240×1754px
- `web/public/sello_oua.png` — sello OUA extraído del PDF (solo referencia; no se usa en el informe, el membretado ya lo incluye)

**CSS en `InformeImpresion.tsx`:**
```tsx
backgroundImage: `url('/membretado_${conSello ? "con" : "sin"}_sello.jpg')`,
backgroundSize: "100% 100%",
printColorAdjust: "exact",
WebkitPrintColorAdjust: "exact",
padding: "38mm 13mm 34mm 13mm",
```

Ya no hay HTML de header ni footer — todo viene del JPG. El contenido queda centrado dentro del área imprimible del membretado.

---

### Criterio de sello OUA → columna `acreditado` en DB ✅

**Antes:** la app chequeaba si el nombre del parámetro empezaba con `(-)` para decidir si el ensayo era OUA o no. Era frágil y no tenía base en los datos.

**Ahora:** tabla `metodologias` tiene columna `acreditado BOOLEAN DEFAULT FALSE`. La función `usaSellosOUA()` en el informe hace `metodologias.some(m => m.acreditado)`.

**Migración:** `db/migracion_metodologias_acreditadas.sql` — aplica `ALTER TABLE` y marca las 7 metodologías acreditadas según el certificado OUA OUAIMP034 Rev.12 (Fuente: PDF oficial del alcance de acreditación):

| Código | Metodología |
|--------|-------------|
| 004 | UNE-EN ISO 6579-1:2017/Amd 1:2021 — Salmonella (cultivo) |
| 034 | ITLAB 075 v14 — BAX PCR E. coli O157:H7/NM |
| 036 | ITLAB 083 v8 — BAX PCR Salmonella spp |
| 040 | ITLAB 091 v6 — Petrifilm Enterobacteriaceae (≥10 ufc/g) |
| 041 | 3M Petrifilm Aerobic Count Plate AOAC 990.12 |
| 045 | ITLAB 055 v12 — Coliformes totales agua, 9222B |
| 054 | ITLAB 099 v7 — BAX PCR E. coli no O157 STEC |

Migración ya aplicada en la base. ✅

**API actualizada:** `GET /ensayos/:codigo/plantilla` y `GET /informes/:id/reporte` ahora incluyen `m.acreditado` en el SELECT de metodologías.

---

### Columna "Valores de Referencia" se oculta cuando no hay valores ✅

**`InformeImpresion.tsx`:** lógica `tieneReferencias` por bloque de análisis:
```ts
const tieneReferencias = a.resultados.some(r => r.valor_referencia != null && r.valor_referencia !== "")
```
- Si `tieneReferencias = true`: tabla de 3 columnas (48% / 26% / 26%) con la tercera columna "Valores de Referencia"
- Si `tieneReferencias = false`: tabla de 2 columnas (65% / 35%), sin columna de referencias

También se corrigió un bug visual: con `border-collapse`, el `borderRight: "none"` del td de Resultados colapsaba y quedaba la celda "abierta". Fix: `borderRight: tieneReferencias ? "none" : "1px solid black"`.

---

### Botón "Impreso" para limpiar la lista de informes publicados ✅

**Problema:** la tabla de "Informes publicados" acumula todos los informes sin forma de marcarlos como entregados.

**Solución:** botón verde "Impreso ✓" al lado de "Imprimir" en cada fila. Al hacer click el informe desaparece de la lista (se marca en la base, no se borra).

**Migración:** `db/migracion_informes_impreso.sql`
```sql
ALTER TABLE informes ADD COLUMN IF NOT EXISTS impreso BOOLEAN NOT NULL DEFAULT FALSE;
```
Migración ya aplicada en la base. ✅

**API:**
- `GET /informes` ahora filtra `WHERE i.impreso = FALSE` — solo muestra los no entregados
- `PUT /informes/:id/impreso` — nuevo endpoint, marca `impreso = TRUE`

**Frontend (`CuadernoAnalisis.tsx`):**
- Botón "Impreso ✓" (verde, `border-green-200`) al lado de "Imprimir"
- `marcarImpreso(id)` llama al endpoint y saca la fila del estado local inmediatamente
- Al cerrar el modal de impresión, scroll suave a la sección "Informes publicados" (`scrollIntoView`)

---

### Cierre automático del modal al imprimir ⚠️ EN PROCESO

**Problema:** después de imprimir, el modal de InformeImpresion no se cierra solo.

**Intentos realizados:**
1. `afterprint` + `focus` con `flushSync` → no funcionó (Chrome no dispara `focus` para su diálogo interno)
2. `afterprint` + `matchMedia('print')` sin `flushSync` → implementado, pendiente de validar

**Estado actual del handler:**
```tsx
const mq = window.matchMedia("print")
const mqHandler = (e) => { if (!e.matches) cerrar() }
mq.addEventListener("change", mqHandler)
window.addEventListener("afterprint", cerrar)
window.print()
```

**A confirmar con Francisco:** ¿el modal se cierra solo al cancelar/confirmar el diálogo de Chrome?

---

### Estado actual del proyecto (21 jul 2026, noche)

| Componente | Estado |
|---|---|
| Informe — membretado real (JPG de fondo) | ✅ Membretado sin sello y con sello según OUA |
| Informe — criterio OUA via DB | ✅ Columna `acreditado` en `metodologias`, 7 métodos marcados |
| Informe — columna referencias oculta si no hay valores | ✅ Lógica `tieneReferencias` por bloque |
| Botón "Impreso" en lista de informes | ✅ Marca en DB + saca de la lista |
| `GET /informes` filtra entregados | ✅ `WHERE impreso = FALSE` |
| Cierre automático del modal al imprimir | ⚠️ Implementado, pendiente validar en Chrome |
| Migraciones pendientes de aplicar | ✅ Ambas ya aplicadas |

### Pendientes principales

1. **Validar cierre del modal** al imprimir desde Chrome — si sigue sin cerrarse, investigar con `console.log` si `afterprint` llega
2. **Padding del membretado** (`38mm 13mm 34mm 13mm`) — revisar que el contenido no pise el header/footer del JPG en casos con muchos análisis
3. **Descripciones de los ~145 parámetros placeholder** — pendiente 2ª visita al lab
4. **Instalar en la PC servidor del lab** con `deploy/instalar.ps1`
5. **Disco externo de 2TB** — cambiar `BACKUP_DESTINO` en `api/.env`

*Actualizado por Claude Code el 21/07/2026.*
