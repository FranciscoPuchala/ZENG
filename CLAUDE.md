# ZENG — Sistema de gestión para laboratorio de microbiología

> Contexto del proyecto. Claude Code lee este archivo automáticamente al abrir la carpeta,
> así que sirve para retomar el trabajo sin perder nada de lo conversado.

## Qué es esto
Sistema NUEVO para reemplazar el software actual del laboratorio **ZENG** (microbiología de
alimentos). Objetivo doble: (1) herramienta interna para ZENG, siendo dueños del sistema;
(2) a futuro, producto para vender a otros laboratorios chicos del rubro. ZENG es el sitio
de validación.

## Principios de trabajo
- Entender el problema en profundidad ANTES de construir.
- Hacer un MVP (un tipo de análisis de punta a punta) y correrlo EN PARALELO con el sistema
  viejo antes de reemplazar nada.
- Construir de forma **independiente y reservada** del programador externo que hizo el sistema
  actual: no copiar su código ni su esquema. Los datos y el formato del informe son del
  laboratorio y se pueden reproducir.

## Restricciones
- El laboratorio trabaja **100% offline** (sin internet).
- Meta: un **servidor local** con la base, usado desde todas las PC por la red.

## Cómo funciona el laboratorio hoy (relevado)
Flujo en 3 etapas sobre 2 programas:
1. **Cuaderno de Entrada** (app Access) — se ingresa la muestra (cliente, descripción, cantidad
   de análisis → códigos de ensayo). Genera el N° de muestra global.
2. **Resultados** (programa aparte, sobre SQL Server Express en 192.168.1.106) — se importa la
   muestra, se cargan los parámetros (queda "pendiente") y luego los valores/resultados.
3. **Cuaderno de Análisis / Informe** (app Access) — imprime la hoja de trabajo ("Reporte de
   Ficha") para anotar a mano, y el **Informe de Ensayo** final que se entrega al cliente.
   **El informe debe reproducirse EXACTAMENTE igual.**

Detalle completo en `docs/ZENG - Relevamiento del Sistema Actual.pdf`.

## Arquitectura (dirección elegida)
- **Base de datos:** PostgreSQL (relacional, libre, corre en Windows/Linux/Raspberry).
- **Backend:** Node.js / JavaScript.
- **Cliente:** preferentemente **app web en la LAN** (navegador en cada PC, sin instalar por
  máquina), servida desde el servidor local. Alternativa: escritorio (Electron).
- **Servidor:** una máquina siempre prendida (reusar la dedicada actual, un mini-PC, o una
  Raspberry Pi con SSD + backups + UPS). Nota: SQL Server NO corre en Raspberry; PostgreSQL sí.
- Falta confirmar con el lab: motor (Postgres vs seguir SQL Server), tipo de servidor, web vs escritorio.

## Modelo de datos
Esquema v1 (PostgreSQL) en **`db/zeng_esquema_v1.sql`**. 8 tablas:
- Catálogo: `clientes`, `usuarios`, `ensayos`, `parametros`.
- Operación: `muestras`, `analisis`, `resultados`, `informes`.
Notas: `numero_cliente` es texto (ej. "026 A"); `valor` del resultado es texto (ej. "<1.0*10(1)",
"NEGATIVO"); el "Nro. Análisis" = `numero_cliente / numero_informe / fecha_siembra(aaaa-mm-dd)`
se arma en la app, no se guarda como texto.

## Campos ya confirmados
- Nro. Análisis = cliente / N° informe / **fecha de siembra** (formato año-mes-día; 26-06-19 = 2026-06-19).
- "Inf. De En…" = info de ensayo → **se ignora**.
- "Publicado" = informe **aprobado para publicar**.
- "Fecha Muestra" = **fecha de muestreo**, la da el cliente, **manual**.
- "Muestra Interna" = "Muestra" en todas las etapas = mismo contador global.
- **Ensayos sin parámetros en la base**: algunos códigos de ensayo NO tienen parámetros cargados en `ensayo_parametros`. Esto es **intencional y correcto** — el laboratorio carga esos resultados a mano, fuera del sistema. La app no debe tratar esto como un error; simplemente muestra el ensayo sin tabla de parámetros.

## Pendiente (2ª visita al lab)
Ver `docs/ZENG - Checklist 2a visita.pdf`. Lo grande: mapeo **ensayo → parámetros**, copia de **cada
formato de informe**, **acceso a los datos** (Access / exportar / credenciales SQL), **infra y red**
(PCs, máquina dedicada, backups), regla fina del **N° de informe por cliente**, y si un **informe
agrupa una o varias muestras**. Negocio: cuánto pagan al programador hoy y cuántos labs hay.

## Roadmap (orden)
1. 2ª visita (cerrar pendientes). 2. Fijar las 3 decisiones de arquitectura. 3. Cerrar el esquema SQL.
4. Montar Postgres + Node en el servidor local. 5. Cargar catálogo / migrar. 6. Backend de las 3 etapas.
7. Informe idéntico (PDF). 8. Frontend web. 9. MVP de un análisis + correr en paralelo.
10. Completar + producción. 11. Validar precio y vender a un 2º lab.

## Frontend — diseño visual (arrancado jul 2026, en paralelo a la 2ª visita)
Se adelantó el diseño VISUAL de la app (decisión consciente de Francisco: no espera a
cerrar el mapeo del problema, porque las pantallas generales no dependen de esas
respuestas — el informe/reporte de ficha exactos sí van a esperar a la 2ª visita).

- **Carpeta:** `web/` — proyecto Vite + React 19 + TypeScript, independiente del backend.
- **Stack de UI:** Tailwind CSS v4 + componentes propios estilo shadcn/ui (Radix UI +
  class-variance-authority) en `web/src/components/ui/`. Iconos: lucide-react.
  Animaciones: **motion** (Framer Motion) instalado vía npm (sin CDN, 100% offline).
- **Paleta:** navy (`#16324f`) + teal (`#0f766e`), tomada de la identidad que ya tiene el
  Informe de Ensayo actual (banda superior navy, acentos teal) — para que la app nueva se
  sienta de la misma marca. Tokens en `web/src/index.css` (`@theme`).
- **Tipografía:** system-ui, sin fuentes externas — el lab es 100% offline, no puede
  depender de un CDN de fuentes (ni de ningún CDN en general, a futuro).
- **Layout:** `AppShell` (sidebar navy con las 3 etapas + Panel/Clientes/Ensayos) en
  `web/src/components/layout/AppShell.tsx`.
- **Pantallas hechas** en `web/src/pages/`:
  - `Panel.tsx` — dashboard con 4 stat tiles (mock).
  - `IngresoMuestra.tsx` — etapa 1 completa: formulario + tabla de recientes.
  - `CargaResultados.tsx` — etapa 2: lista de análisis pendientes (seleccionable) +
    formulario de carga de valores por parámetro.
  - `CuadernoAnalisis.tsx` — etapa 3: tabla de análisis cargados con checkboxes para
    agrupar en informe + form de datos del informe + placeholder de vista previa.
- **Datos:** todo hardcodeado/mock. Ensayos 140/141/142/014/121 son placeholders —
  sólo 138 = Enterobacterias está confirmado. Parámetros de cada ensayo también son
  placeholder hasta la 2ª visita al lab.
- **Animaciones de interacción** (jul 2026, agregadas con `motion`):
  - Transición de página: fade + deslizamiento sutil al cambiar de sección (AppShell,
    `motion.div key={active}`). Reemplazó la animación CSS anterior.
  - Botones: `active:scale-[0.97] active:opacity-90` (CSS, sin motion — más liviano).
  - Focus de inputs: `transition-all duration-150` — el ring teal aparece suavemente.
  - Filas de tabla (IngresoMuestra): entrada escalonada con `motion.tr`, delay máximo
    capado en 180ms para que no se sienta lenta en listas largas.
  - Toast animado (`web/src/components/ui/toast.tsx`): sube desde abajo al guardar
    una muestra, se cierra solo a los 3.5s, tiene `aria-live="polite"`.
  - `<MotionConfig reducedMotion="user">` en App.tsx: todas las animaciones de motion
    se deshabilitan automáticamente si el usuario tiene "reducir movimiento" activado
    en el sistema operativo.
- **Cómo correrlo:** `cd web && npm install && npm run dev`. `npm run build` para verificar
  que compila (ya validado en jul 2026, sin errores de tipos).
- **Pendiente:** validar las 3 pantallas con Francisco, conectar al backend (Node +
  PostgreSQL, todavía sin construir), y definir el formato exacto del Informe de Ensayo
  después de la 2ª visita.

## Archivos
- `db/` — base de datos: `zeng_esquema_v1.sql` (esquema PostgreSQL, estructura de la base).
  A futuro: migraciones y seeds del catálogo también van acá.
- `web/` — frontend (diseño visual en progreso, ver sección de arriba).
- `docs/` — toda la documentación del relevamiento y planificación:
  - `ZENG - Relevamiento del Sistema Actual.pdf` — mapa completo del sistema actual.
  - `ZENG - Checklist 2a visita.pdf` — qué confirmar/traer de la próxima visita.
  - `ZENG - Estado del proyecto.pdf` — resumen de dónde quedó el proyecto (jul 2026).
  - `guia_relevamiento_ZENG.docx`, `Proyecto_ZENG_Innovacion_Laboratorios.pdf` — material previo.

## Sobre quién desarrolla
Francisco programa en JS/Node (principiante/intermedio, facultad), sin experiencia previa de
bases de datos ni infraestructura. Explicar conceptos de DB/redes/servidores sin asumir
experiencia. Proyecto y comunicación en español.

## Cómo trabajamos (Cowork + Claude Code)
Dos herramientas que NO comparten memoria automáticamente. Este archivo `CLAUDE.md` es la
**memoria compartida**: mantenerlo actualizado es lo que las mantiene en sincronía.

- **Claude Code (VS Code)** → CONSTRUIR: escribir y correr el código del repo (SQL, backend
  Node, frontend), pruebas, git, debug.
- **Cowork (chat de escritorio)** → PLANIFICAR e INVESTIGAR: estrategia, investigación
  (precios/tecnología/mercado), documentos, diagramas y PDFs, preparar las visitas al lab.
  Además mantiene este `CLAUDE.md` al día.
- **Regla:** toda decisión importante se escribe acá (o

## Despliegue en producción (4 PC, un servidor) — DECIDIDO
Modelo **cliente-servidor** con **una sola base compartida**:
- **Una máquina = servidor** (siempre prendida): corre **PostgreSQL + el backend Node**. Es la única que tiene la base.
- **Las otras PC = clientes:** NO tienen base ni backend. Abren la **app web en el navegador** apuntando a la IP del servidor (ej. `http://192.168.1.50`). **Nada instalado por PC.**
- **Actualizaciones:** se hacen **una sola vez en el servidor**; todas las PC ven la versión nueva al refrescar. (Por eso web y no escritorio.)
- **Concurrencia:** PostgreSQL maneja varios usuarios a la vez; el cambio de uno lo ven las demás al refrescar/navegar (sync instantáneo = websockets, opcional a futuro).
- **De dev a prod:** hoy todo corre en `localhost`. En prod: Postgres + backend en el servidor, y el frontend (`web`) apunta su URL de API a la IP del servidor (variable de entorno). Es cambio de config, no rehacer nada.
- **Servidor:** una de las 4 PC (la más confiable, siempre prendida) o un equipo dedicado (mini-PC / Raspberry). A definir.

## Tarea actual (jul 2026) — Listado de personalización para vender a OTRO laboratorio

> **IMPORTANTE para Claude Code:** hoy todo está hecho a medida de ZENG. Francisco necesita, para
> cuando venda el sistema a otro laboratorio, un **checklist claro de TODO lo específico de ZENG que
> hay que cambiar**. Crear un README en el repo (ej. `docs/PERSONALIZAR_NUEVO_LAB.md`) con ese
> listado y subirlo.

**Cómo armarlo:** **escaneá el código** (grep por `zeng`, `ZENG`, `Zeng`, `LE 006`, `MGAP`, la
dirección/teléfono/emails/web de ZENG, etc.) y listá cada cosa específica del laboratorio, indicando
**en qué archivo está** y **qué hay que cambiar**. Cubrir al menos:

1. **Marca / identidad:** el nombre "ZENG", el logo (`web/public/logo.png`), el favicon, y los textos
   de marca (intro, títulos).
2. **Datos del lab en el Informe de Ensayo:** nombre, dirección, teléfono, fax, emails, web, N° de
   acreditación (O.U.A. **LE 006**), Reg. MGAP Nº 0018 — todo lo que hoy dice ZENG en el informe.
3. **Secretos y credenciales (nuevos por cada lab):** `JWT_SECRET`, contraseña de Postgres,
   usuarios/admin. `instalar.ps1` ya los genera nuevos, pero dejarlo explícito en el listado.
4. **Datos propios del lab:** los **clientes** (los 431 cargados son de ZENG) y el **catálogo**
   (ensayos, parámetros, metodologías, formatos de informe) — otro lab puede tener los suyos.
   Explicar qué se recarga y cómo.
5. **Constantes / hardcode** con "zeng" (incluido el nombre de la base `zeng` si conviene
   parametrizarlo) o rutas específicas.

Para cada punto: **archivo (y línea si aplica) + qué reemplazar.** El objetivo es que personalizar
para un lab nuevo sea **seguir una lista**, no cazar cosas por el código.

Al terminar, actualizá `PARA_COWORK.md`.
