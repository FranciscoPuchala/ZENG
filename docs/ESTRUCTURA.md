# ZENG — Estructura del repositorio

Mapa de qué es cada carpeta y cada archivo. Sirve para ubicarse rápido al retomar el proyecto.

## Vista rápida (las carpetas)

| Carpeta | Qué es |
|---|---|
| `api/` | El **backend** (servidor Node/Express): recibe pedidos y habla con la base. |
| `web/` | El **frontend** (la app que se ve en el navegador). |
| `db/` | La **base de datos**: esquema, migraciones y datos. |
| `deploy/` | **Instalación y arranque** en el servidor. |
| `scripts/` | Los **backups** automáticos. |
| `docs/` | Toda la **documentación**. |
| (raíz) | Archivos de **contexto y configuración** general. |

---

## Raíz del repo

- `CLAUDE.md` — contexto del proyecto para **Claude Code**. Es la memoria compartida entre Cowork y Claude Code.
- `PARA_COWORK.md` — notas que deja Claude Code para que las lea Cowork (la otra mitad de esa memoria).
- `README.md` — presentación general del repositorio.
- `.gitignore` — qué archivos **no** se suben a git (node_modules, `.env`, la contraseña de backup).

---

## `api/` — Backend (Node/Express)

- `index.js` — **el backend entero**: todos los endpoints (login, muestras, resultados, informes, backups…).
- `crear_admin.js` — script para crear/actualizar el usuario **admin**.
- `seed_catalogos.js` — carga el **catálogo** (ensayos, parámetros, metodologías y sus relaciones) desde los CSV de `db/`.
- `package.json` / `package-lock.json` — lista de dependencias del backend.
- `.env` — configuración local (contraseñas, puerto). **No** se sube a git; lo crea el instalador.

---

## `web/` — Frontend (React + Vite)

**Configuración** (raíz de `web/`): `package.json`, `vite.config.ts`, `tsconfig*.json`, `index.html`,
`.oxlintrc.json`, `.env.development` — cómo se compila y arranca la app.

- `src/main.tsx` — punto de arranque de React.
- `src/App.tsx` — componente raíz: control de login y navegación entre pantallas.
- `src/index.css` — estilos globales y los **colores de marca** (navy + teal).

- `src/pages/` — **las pantallas**:
  - `Login.tsx` — inicio de sesión.
  - `Panel.tsx` — panel/dashboard con estadísticas.
  - `IngresoMuestra.tsx` — **Etapa 1**: ingreso de la muestra.
  - `CargaResultados.tsx` — **Etapa 2**: carga de resultados por parámetro.
  - `CuadernoAnalisis.tsx` — **Etapa 3**: armar el informe.
  - `Clientes.tsx` — lista e historial de clientes.
  - `EnsayosParametros.tsx` — catálogo de ensayos y parámetros.
  - `Configuracion.tsx` — cambiar contraseña y **gestión de usuarios**.
  - `Respaldo.tsx` — backups (ver/restaurar).
  - `InformeImpresion.tsx` — el **Informe de Ensayo** listo para imprimir.
  - `ReporteFicha.tsx` — la hoja de trabajo (**Reporte de Ficha**).

- `src/components/` — piezas reutilizables:
  - `Intro.tsx` — pantalla de bienvenida después del login.
  - `layout/AppShell.tsx` — el marco de la app (menú lateral + encabezado).
  - `ui/` — componentes base (`button`, `card`, `input`, `label`, `select`, `table`, `badge`, `toast`).

- `src/lib/` — utilidades:
  - `api.ts` — funciones para hablar con el backend.
  - `auth.ts` — manejo de la sesión (login, token, usuario actual).
  - `utils.ts` — ayudantes varios.

- `public/` — imágenes que usa la app:
  - `logo.png`, `favicon.svg`, `icons.svg` — logo e íconos.
  - `membretado_con_sello.jpg`, `membretado_sin_sello.jpg` — las hojas membretadas del informe.
  - `sello_oua.png` — el sello de acreditación OUA.

---

## `db/` — Base de datos

- `zeng_esquema_v1.sql` — el **esquema base** (crea las tablas).
- `migracion_*.sql` — **cambios sucesivos** al esquema, en orden:
  `migracion_v2`, `migracion_login`, `migracion_parametros_defaults`,
  `migracion_metodologias_acreditadas`, `migracion_informes_impreso`,
  `migracion_unique_informe`, `migracion_rol_auxiliar`.
- `seed_ensayos.csv`, `seed_parametros.csv`, `seed_metodologias.csv`,
  `seed_ensayo_parametros.csv`, `seed_ensayo_metodologias.csv` — el **catálogo real** en CSV (lo carga `seed_catalogos.js`).
- `seed_parametros.sql` — descripciones, valores por defecto y de referencia de los parámetros.
- `seed_clientes.sql` — los **clientes reales** del lab.
- `seed.sql` — datos de **prueba** (no se usa en la instalación real).
- `fuentes/` — archivos **originales** del lab de donde salió el catálogo (PDF, xlsx, docx).

---

## `deploy/` — Instalación y arranque

- `instalar.ps1` — el **instalador** del servidor (base, catálogo, backend, auto-arranque, firewall).
- `crear_acceso.ps1` — crea el **acceso directo** "ZENG" en el escritorio (modo app).
- `zeng.ico` — el ícono de la app.
- `.env.example` — plantilla del archivo `.env`.
- `README.md` — documentación técnica del instalador.
- `reiniciar_servidor.ps1` — reinicia el backend (la tarea ZENG_Backend) **sin apagar la PC**. El
  instalador crea un acceso directo "Reiniciar servidor ZENG" en el Escritorio que lo ejecuta.
- `reiniciar_servidor.vbs` — versión vieja con ruta fija. **Reemplazada por el `.ps1`** → se puede borrar.

---

## `scripts/` — Backups

- `backup_frecuente.ps1` — backup cada 30 min en horario de trabajo.
- `backup_diario.ps1` — un backup diario.
- `backup_password.ps1` — la contraseña de la base para los backups. **Nunca se sube a git** (está en `.gitignore`). ✅

---

## `docs/` — Documentación

- `ESTRUCTURA.md` — este mapa.
- `COMANDOS_INSTALACION.md` — comandos de instalación para copiar y pegar.
- `INSTALACION.md` — guía de instalación explicada.
- `ACTUALIZACIONES.md` — cómo actualizar el sistema + registro de cambios.
- `DOCUMENTACION_SISTEMA.md` — documentación completa de cómo funciona el sistema.
- `GUIA_BASE_DE_DATOS.md` — fundamentos de la base y guía para emergencias.
- `PERSONALIZAR_NUEVO_LAB.md` — checklist para instalar/vender el sistema a otro laboratorio.
- PDFs y `.docx` del relevamiento (`ZENG - Relevamiento…`, `ZENG - Checklist 2a visita`,
  `Proyecto_ZENG…`, `guia_relevamiento_ZENG`) — material del análisis del sistema viejo.

---

## Limpieza sugerida (ordenar el repo)

Archivos sueltos o repetidos que conviene acomodar (borralos/movés desde VS Code):

1. **Raíz** — `zen_laboratorio_microbiologico-1 (1).png`: es una **copia del logo** (idéntico a `web/public/logo.png`) → se puede **borrar**.
2. **Raíz** — `prompt-claude-code-ui-ux.md`: un prompt viejo de diseño → moverlo a `docs/` o **borrarlo**.
3. **Raíz** — `ZENG - Estado del proyecto.pdf` y `ZENG_-_Estado_del_proyecto.pdf`: son **dos versiones** del mismo PDF → quedate con la última y movela a `docs/`.
4. **docs/** — `ACTUALIZAR_SISTEMA.md`: quedó como un simple **puntero** a `ACTUALIZACIONES.md` → se puede **borrar**.
5. **deploy/** — `reiniciar_servidor.vbs`: reemplazado por `reiniciar_servidor.ps1` → se puede **borrar**.
