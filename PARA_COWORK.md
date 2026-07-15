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

*Actualizado por Claude Code el 15/07/2026.*
