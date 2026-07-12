# PARA_COWORK.md — Novedades de Claude Code → Cowork

> Este archivo lo escribe **Claude Code** al terminar cada sesión de construcción.
> Cowork lo lee para saber qué se hizo en el repo y poder actualizar `CLAUDE.md`
> y tomar decisiones de planificación con información al día.
>
> Flujo inverso a `CLAUDE.md`:
> - `CLAUDE.md` → Cowork escribe, Claude Code lee (contexto y decisiones)
> - `PARA_COWORK.md` → Claude Code escribe, Cowork lee (lo que se construyó)

---

## Última sesión — 11 jul 2026

### 1. Reorganización de carpetas

El repo estaba todo en la raíz. Se movió a estructura limpia con `git mv`
(historial preservado):

```
ZENG/
├── CLAUDE.md
├── README.md
├── PARA_COWORK.md          ← este archivo (nuevo)
├── db/
│   └── zeng_esquema_v1.sql
├── docs/
│   ├── ZENG - Relevamiento del Sistema Actual.pdf
│   ├── ZENG - Checklist 2a visita.pdf
│   ├── ZENG - Estado del proyecto.pdf
│   ├── guia_relevamiento_ZENG.docx
│   └── Proyecto_ZENG_Innovacion_Laboratorios.pdf
└── web/                    ← frontend React (ver abajo)
```

Se actualizaron todas las referencias de rutas en `README.md` y `CLAUDE.md`.

---

### 2. Frontend — estado actual de `web/`

**Stack:** Vite + React 19 + TypeScript + Tailwind CSS v4 + Radix UI (estilo shadcn/ui propio). Sin CDNs externos (lab offline).

**Pantallas terminadas:**

| Pantalla | Archivo | Estado |
|---|---|---|
| Panel (dashboard) | `web/src/pages/Panel.tsx` | ✅ Hecho |
| Ingreso de Muestra | `web/src/pages/IngresoMuestra.tsx` | ✅ Hecho + mejorado |
| Carga de Resultados | `web/src/pages/CargaResultados.tsx` | ✅ Nuevo |
| Cuaderno de Análisis | `web/src/pages/CuadernoAnalisis.tsx` | ✅ Nuevo |
| Clientes | — | ⏳ Placeholder |
| Ensayos y Parámetros | — | ⏳ Placeholder |

**Cómo correrlo:**
```bash
cd web && npm install && npm run dev
```

---

### 3. Qué hace cada pantalla nueva

#### Carga de Resultados (`CargaResultados.tsx`)
- Lista lateral con los análisis en estado `pendiente`, filtrable por N° o cliente.
- Al seleccionar uno, aparece el formulario: fecha/hora de siembra, analista, revisor, y tabla de parámetros con inputs para cargar el `valor` y la `lectura_dilución` de cada uno.
- Los parámetros son **placeholder** (mapeo real ensayo → parámetros pendiente de la 2ª visita al lab).

#### Cuaderno de Análisis (`CuadernoAnalisis.tsx`)
- Tabla de análisis en estado `cargado` con checkboxes para seleccionar cuáles agrupar.
- Al seleccionar, aparece el formulario de informe: N° informe, fecha de recepción, fecha de emisión.
- Botón "Publicar informe" (mock, sin lógica todavía).
- Placeholder de "Vista previa del Informe de Ensayo" — el formato exacto se define después de la 2ª visita.

---

### 4. Mejoras de diseño aplicadas (sesión UI/UX)

Se usó el skill **UI/UX Pro Max** para auditar y mejorar. Cambios concretos:

**Animaciones y "vida":**
- Transición de página: fade + slide de 7px en 220ms con curva iOS (`cubic-bezier(0.16, 1, 0.3, 1)`) al navegar entre secciones. Respeta `prefers-reduced-motion`.
- Botones con `active:scale-[0.97]` — feedback físico de "press".
- Stat tiles del Panel: hover que levanta la card con sombra de color del propio ícono (ámbar/azul/verde).

**Sidebar:**
- Logo "Z" con gradiente teal y sombra de color.
- Íconos con color propio en estado activo (`text-teal-200`).
- Hover más suave (`navy-800/70`), bordes redondeados `rounded-lg`.
- Avatar con gradiente y ring sutil.

**Formularios (accesibilidad):**
- `aria-current="page"` en el ítem activo del nav.
- Campos de fecha → `type="date"`, hora → `type="time"` (picker nativo del navegador).
- Indicadores `*` en campos obligatorios + nota "* Campos obligatorios" al pie.
- `observaciones` → `<textarea>` en vez de input de una sola línea.
- `aria-label` en buscadores y checkboxes.

**Panel:**
- Números de stats: `text-2xl font-bold tabular-nums`.
- Íconos: `size-12 rounded-xl` (más grandes y redondeados).

---

### 5. Lo que todavía NO está hecho

- **Lógica real**: todo es mock/hardcodeado. Sin conexión a backend ni DB.
- **Parámetros reales**: los parámetros de cada ensayo son placeholder hasta la 2ª visita.
- **Formato del informe**: el Informe de Ensayo (etapa 3) no tiene formato real todavía.
- **Backend**: Node.js + PostgreSQL, sin empezar.
- **Pantallas Clientes y Ensayos y Parámetros**: placeholders "Próximamente".
- **Validación de formularios**: no hay validación client-side ni mensajes de error reales.

---

### 6. Decisiones tomadas en esta sesión

- Se instaló el skill **UI/UX Pro Max** globalmente en `~/.claude/skills/` para que esté disponible en todas las sesiones de Claude Code.
- Se mantuvo `system-ui` como tipografía (sin Google Fonts) por restricción offline del lab.
- Los parámetros de ensayo `140 / 141 / 142 / 014 / 121` siguen como placeholder — no se inventaron nombres. Solo `138 = Enterobacterias` está confirmado.

---

### 7. Ideas de animación / experiencia (a implementar o ya hechas)

#### Pantalla de bienvenida animada (intro splash) ✅ Implementado
Al cargar la app aparece una pantalla completa navy con el logo "Z" animado, el nombre ZENG
con efecto de tracking, y "Bienvenido, [nombre]". Luego se desliza hacia arriba revelando el panel.

Inspiración: TikToks de Claude haciendo animaciones tipo https://www.tiktok.com/@webloved/video/7638701785552588064

Concepto aplicable a otras transiciones:
- Cambio de sección importante → mini overlay o texto animado
- Publicación de informe → animación de "éxito" (confetti ligero, check animado)
- Login futuro → pantalla de bienvenida personalizada con el nombre del analista

---

*Actualizado por Claude Code el 11/07/2026.*
