Estoy retomando en Claude Code el diseño visual de ZENG que arranqué en otra sesión (Cowork). Quiero que uses el skill **UI/UX Pro Max** (con sus sub-skills: brand, design, design-system, ui-styling) para revisar y mejorar lo que ya existe, y después seguir con las pantallas que faltan.

Primero leé `CLAUDE.md` en la raíz del repo — tiene toda la sección "Frontend — diseño visual" actualizada con el contexto.

## Lo que ya existe en `web/`

- **Stack:** Vite + React 19 + TypeScript + Tailwind v4, sin CDNs externos a propósito (el laboratorio trabaja 100% offline).
- **Paleta:** navy (`#16324f`) + teal (`#0f766e`), tomada de la identidad que ya tiene el Informe de Ensayo actual de ZENG (banda superior navy, acentos teal) — para que la app nueva se sienta de la misma marca. Tokens en `web/src/index.css` (bloque `@theme`).
- **Tipografía:** system-ui, sin fuentes externas (mismo motivo: offline).
- **Layout:** `AppShell` (sidebar navy con las 3 etapas del flujo + Panel/Clientes/Ensayos) en `web/src/components/layout/AppShell.tsx`.
- **Componentes UI propios** estilo shadcn/ui (hechos a mano con Radix UI + class-variance-authority, no con el CLI de shadcn) en `web/src/components/ui/`: button, card, input, label, select, table, badge.
- **Pantallas hechas** en `web/src/pages/`: `Panel.tsx` (dashboard básico) e `IngresoMuestra.tsx` (etapa 1 completa — formulario de nueva muestra + tabla de muestras recientes con badges de estado).
- **Datos:** todo mock/hardcodeado por ahora, sin conexión a backend ni DB.
- El resto de las pantallas están como placeholder "Próximamente" en `App.tsx`.

Antes de correrlo: `cd web && npm install` (node_modules no está versionado).

## Lo que te pido

1. Activá el skill UI/UX Pro Max y revisá el sistema de diseño actual (paleta, tipografía, espaciado, jerarquía de componentes). Decime qué mejorarías y por qué antes de tocar nada.
2. Con el skill, refiná la pantalla de Ingreso de Muestra si ves mejoras de jerarquía visual, espaciado, accesibilidad, microinteracciones, etc.
3. Seguí con las próximas pantallas del MVP dentro del mismo sistema de diseño: **Carga de Resultados** (etapa 2) y **Cuaderno de Análisis** (etapa 3). El detalle de campos y flujo está en `docs/ZENG - Relevamiento del Sistema Actual.pdf`.
4. Cuando termines una tanda de cambios, actualizá la sección "Frontend — diseño visual" de `CLAUDE.md` con lo que cambió, para que quede sincronizado con lo que vea en Cowork.

## Importante

El mapeo completo ensayo → parámetros todavía NO está confirmado (falta la 2ª visita al laboratorio, ver `docs/ZENG - Checklist 2a visita.pdf`). Por eso los ensayos 140/141/142/014/121 están como placeholder en el código ("a confirmar"). Lo único confirmado es: **138 = Enterobacterias**. No inventes nombres ni parámetros reales para esos códigos — dejalos como placeholder hasta la visita.
