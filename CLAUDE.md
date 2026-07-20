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

## Tarea actual (jul 2026) — Paquete de instalación del servidor (carpeta `deploy/`), PASO A PASO

> **IMPORTANTE para Claude Code:** Francisco está aprendiendo. Explicá cada paso simple, de a
> UNO, esperá que confirme, y enseñá el concepto (qué es un build de producción, un servicio de
> Windows, el firewall, etc.). Es una tarea grande: hacerla por etapas.

**Objetivo:** crear en el repo una carpeta **`deploy/`** con scripts + instructivo para montar
TODO el sistema en **una sola PC (el servidor)** — la que corre PostgreSQL + backend, siempre
prendida. Las otras 3 PC **no** llevan nada instalado: solo abren el navegador apuntando a la IP
del servidor. Meta: instalar el servidor = "correr un script + un par de datos".
(Ver la sección "Despliegue en producción" de este archivo.)

### Paso 1 — Preparar la app para producción (un solo proceso)
- Hoy en dev corren separados: frontend (`web`, :5173) y backend (`api`, :3001). En producción,
  **una sola app:** hacer el **build del frontend** (`cd web && npm run build` → `web/dist`) y que
  el **backend (Express) sirva ese build** como estáticos, en un solo puerto.
- El frontend hoy llama a `http://localhost:3001` **hardcodeado** → cambiarlo a **ruta relativa**
  (mismo origen) o a una variable `VITE_API_URL`, para que en el servidor apunte bien.

### Paso 2 — Script de instalación (PowerShell, en `deploy/`)
Que en la PC servidor haga:
1. Verifica que estén **PostgreSQL** y **Node** (o guía para instalarlos).
2. Crea la base `zeng` y corre en orden: `db/zeng_esquema_v1.sql`, `db/migracion_v2.sql`,
   `db/migracion_login.sql`, y los seeds (catálogos + `api/crear_admin.js` para el primer admin).
3. Instala deps del backend (`cd api && npm install`) y genera el `.env` desde una plantilla
   (pide la contraseña de Postgres y genera el `JWT_SECRET`).
4. Build del frontend y backend sirviéndolo.
5. Deja el **backend en auto-arranque** (servicio de Windows con NSSM, o pm2 + pm2-startup, o
   tarea "al iniciar"). PostgreSQL ya arranca solo como servicio.
6. Configura el **firewall de Windows** para permitir el puerto del servidor en la LAN, y muestra
   la **IP del servidor** (las otras PC entran por `http://IP:puerto`).

### Paso 3 — Backups (parte del servidor)
- Instalar el backup automático decidido: `pg_dump` de `zeng` **cada 30 min** (horario de trabajo)
  al **disco externo de 2 TB** + **1 diario**, con rotación (frecuentes ~7 días, diarios ~1 año),
  **log** de OK/ERROR, y programado con el **Programador de tareas**. Script(s) en `deploy/` o
  `scripts/`. **Probar una restauración** para confirmar que sirve.

### Paso 4 — `.env.example` + README de instalación
- `deploy/.env.example` con todas las variables (DB_*, JWT_SECRET, PUERTO, carpeta de backups).
- `deploy/README.md` paso a paso: prerequisitos, correr el script, cómo verificar que anda, cómo
  entran las otras PC, cómo **actualizar** (git pull + rebuild + reiniciar el backend) y qué hacer
  si algo falla (apoyarse en `docs/GUIA_BASE_DE_DATOS.md`).

**Nota:** esto es **preparar el paquete**. NO poner en producción real hasta cerrar el Informe de
Ensayo (faltan las confirmaciones del lab).

Al terminar la sesión, actualizá `PARA_COWORK.md`.
