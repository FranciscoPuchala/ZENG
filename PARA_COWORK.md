# PARA_COWORK.md — Novedades de Claude Code → Cowork

> Este archivo lo escribe **Claude Code** al terminar cada sesión de construcción.
> Cowork lo lee para saber qué se hizo en el repo y poder actualizar `CLAUDE.md`
> y tomar decisiones de planificación con información al día.
>
> Flujo inverso a `CLAUDE.md`:
> - `CLAUDE.md` → Cowork escribe, Claude Code lee (contexto y decisiones)
> - `PARA_COWORK.md` → Claude Code escribe, Cowork lee (lo que se construyó)

---

## Sesión anterior — 11 jul 2026

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

### 2. Frontend — pantallas terminadas

**Stack:** Vite + React 19 + TypeScript + Tailwind CSS v4 + Radix UI (estilo shadcn/ui propio). Sin CDNs externos (lab offline).

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
cd web && npm run dev
```

### 3. Mejoras de diseño (sesión UI/UX)

- Transición de página: fade + slide 7px, 220ms, curva iOS. Respeta `prefers-reduced-motion`.
- Botones: `active:scale-[0.97]` — feedback físico de "press".
- Sidebar: logo teal con sombra de color, íconos con color activo, avatar con gradiente.
- Formularios: `type="date"` y `type="time"` nativos, campos obligatorios marcados, textarea para observaciones.

---

## Última sesión — 11 jul 2026 (continuación)

### 4. Pantalla de intro (splash screen) — estado final

La pantalla de bienvenida está completamente terminada en:
- `web/src/components/Intro.tsx`
- `web/src/index.css` (keyframes)
- `web/public/logo.png` (logo real del laboratorio, PNG con fondo transparente)

#### Cómo funciona la secuencia

| Tiempo | Qué pasa |
|---|---|
| 0s | Logo ZENG real aparece desde el centro: zoom desde scale(8) + 2 giros rotateY |
| ~4.5s | Logo frena y queda quieto en posición final |
| 4.2s | Línea separadora se expande de izquierda a derecha (scaleX) |
| 4.4s | "BIENVENIDO, FRANCISCO" aparece con efecto telescopio |
| 5.0s | "LABORATORIO MICROBIOLÓGICO" aparece con efecto telescopio |
| 7.5s | Pantalla empieza a desvanecerse (opacity-0) |
| 8.5s | Panel carga |

#### Efecto telescopio (lo más importante)

Los textos de bienvenida tienen una animación personalizada que simula mirar a través de un telescopio:

1. **Apertura de iris** — `clip-path: circle(0%)` → `circle(200%)`: el texto emerge desde un punto central como el diafragma de un lente abriéndose.
2. **Enfoque desde lejos** — `filter: blur(14px)` → `blur(0)` + `scale(0.6)` → `scale(1)`: como cuando ajustás el foco de un telescopio y el objeto va apareciendo nítido.
3. **Letras que convergen** — `letter-spacing: 1em` → `0.25em`: las letras arrancan muy separadas y se juntan, como si vinieran desde la distancia.

```css
/* En web/src/index.css */
@keyframes intro-telescopio {
  0%   { clip-path: circle(0% at 50% 50%); transform: scale(0.6); filter: blur(14px); letter-spacing: 1em; opacity: 0; }
  18%  { opacity: 1; }
  100% { clip-path: circle(200% at 50% 50%); transform: scale(1); filter: blur(0); letter-spacing: 0.25em; opacity: 1; }
}
```

#### Animación del logo

Dos divs anidados con animaciones independientes:
- **Externo** (`animate-intro-logo-scale`): maneja el zoom `scale(8) → scale(1)` con `cubic-bezier(0.3, 0, 0.1, 1)`.
- **Interno** (`animate-intro-logo-spin`): maneja la rotación `rotateY(360°) → rotateY(0°)` con la **misma curva**. Usar la misma curva es clave: hace que zoom y giro frenen juntos, entonces cuando el logo deja de girar ya está en posición final (no sigue achicándose después).

#### Logo real

Francisco proveyó el logo real del laboratorio. Se copió a `web/public/logo.png`. Es PNG con fondo transparente, por eso no necesita ningún tratamiento — flota directamente sobre el fondo navy. Se le agrega un `drop-shadow` teal para que resalte:

```tsx
style={{ filter: "drop-shadow(0 0 24px rgb(15 118 110 / 0.7))" }}
```

#### Textos

- "BIENVENIDO, FRANCISCO": `text-5xl font-bold` — muy grande, en teal.
- "LABORATORIO MICROBIOLÓGICO": `text-xl` — secundario, en `navy-100/50`.
- `NOMBRE_USUARIO` está hardcodeado como constante en `Intro.tsx` — a futuro se reemplaza por el usuario logueado.

---

### 5. Lo que todavía NO está hecho

- **Lógica real**: todo es mock/hardcodeado. Sin conexión a backend ni DB.
- **Parámetros reales**: los parámetros de cada ensayo son placeholder hasta la 2ª visita.
- **Formato del informe**: el Informe de Ensayo (etapa 3) no tiene formato real todavía.
- **Backend**: Node.js + PostgreSQL, sin empezar.
- **Pantallas Clientes y Ensayos y Parámetros**: placeholders "Próximamente".
- **Validación de formularios**: no hay validación client-side ni mensajes de error reales.
- **Login / usuarios reales**: `NOMBRE_USUARIO` es una constante hardcodeada. A futuro el intro debe recibir el nombre del analista que se logueó.

---

### 6. Decisiones técnicas importantes

- **`system-ui` como tipografía**: sin Google Fonts por restricción offline del lab. No cambiar.
- **Parámetros de ensayo**: `140 / 141 / 142 / 014 / 121` son placeholder. Solo `138 = Enterobacterias` está confirmado. No inventar nombres.
- **`scale()` en vez de `translateZ`** para el zoom del intro: mucho más performante, la GPU lo maneja sin trabarse. `translateZ` cerca del límite de `perspective` causaba choppiness.
- **Dos capas para animar**: siempre que se necesite animar dos propiedades con distinto easing (ej. zoom + rotación), usar dos divs anidados — cada uno con su propia animación CSS.

---

*Actualizado por Claude Code el 11/07/2026.*
