# ZENG — Sistema de gestión para laboratorio de microbiología

Sistema nuevo, **independiente** y **100% offline**, para el laboratorio de microbiología de
alimentos **ZENG**. Reemplaza el software actual (Access + un programa de resultados sobre SQL
Server) y, a futuro, se piensa vender a otros laboratorios chicos del rubro.

> El contexto completo, las decisiones y la **tarea actual** están en **[`CLAUDE.md`](CLAUDE.md)**.
> Este README es la referencia rápida de desarrollo.

## Estado actual
- **Relevamiento** del sistema viejo: completo (ver `docs/`).
- **Base de datos:** esquema v1 en `db/zeng_esquema_v1.sql` (PostgreSQL). En revisión para sumar
  catálogos reales y las tablas puente (ver *Tarea actual* en `CLAUDE.md`).
- **Backend (`api/`):** Node + Express + PostgreSQL. La **etapa 1 (Ingreso de Muestra)** ya
  funciona de punta a punta (pantalla → API → base).
- **Frontend (`web/`):** React + Vite + TypeScript + Tailwind. Pantallas hechas (algunas aún mock).
- **Catálogos reales del lab** ya extraídos a `db/` (ensayos, parámetros, metodologías y el mapeo
  entre ellos).

## Estructura del repo
```
ZENG/
├── CLAUDE.md          contexto del proyecto + tarea actual (lo lee Claude Code)
├── PARA_COWORK.md     novedades que escribe Claude Code para Cowork
├── db/                base de datos
│   ├── zeng_esquema_v1.sql        esquema (estructura de las tablas)
│   ├── seed.sql                   datos de prueba iniciales
│   ├── seed_metodologias.csv      catálogo de metodologías (68)
│   ├── seed_ensayo_parametros.csv   qué parámetros tiene cada ensayo (376 pares)
│   ├── seed_ensayo_metodologias.csv qué metodologías tiene cada ensayo (283 pares)
│   └── fuentes/                   documentos originales del lab (ensayos, parámetros, metodologías)
├── api/               backend Node/Express (index.js) — necesita api/.env con DB_*
├── web/               frontend React
└── docs/              relevamiento, checklist 2ª visita, estado del proyecto (PDF)
```

## Cómo correrlo (desarrollo local)
**1. Base de datos** (PostgreSQL instalado):
```
createdb zeng
psql -d zeng -f db/zeng_esquema_v1.sql
```
**2. Backend:**
```
cd api && npm install && npm run dev      # http://localhost:3001
```
(Requiere `api/.env` con `DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD`.)

**3. Frontend:**
```
cd web && npm install && npm run dev       # http://localhost:5173
```

## Conceptos del dominio (importante entenderlos)
- **El código de ensayo es una PLANTILLA.** Cada código (01–151) agrupa un conjunto **fijo** de
  **parámetros** (los resultados a cargar) y de **metodologías**. Al escribir el código, la app
  debe traer solos esos parámetros y metodologías. No se edita nada; lo único permitido es
  **borrar** un parámetro que en un caso puntual no se hizo (las metodologías se mantienen).
- **Parámetros** (catálogo, ~158): cada uno tiene un **`tipo_valor`**: **numérico** (ej.
  `1.9*10(3)`) o **presencia** (`-` / `+`, "incluye / no incluye").
- **Metodologías** (catálogo, ~68): normas/métodos (ISO, AOAC, "Método interno ITLAB…"). Aparecen
  en la sección "Método Analítico" del informe al cliente.
- **Relaciones muchos-a-muchos:** un parámetro se repite en muchos códigos, y un código tiene N
  parámetros. Idem metodologías. Por eso hay dos tablas puente: **`ensayo_parametros`** y
  **`ensayo_metodologias`**. Los parámetros y las metodologías van en **listas separadas** por
  código (no apareados 1 a 1).
- **⚠️ El prefijo `(-)` en la descripción de un parámetro NO es lógica de la app.** Marca los
  ensayos **no acreditados** (no llegan al sello O.U.A.); es info del laboratorio para el pie del
  informe ("(–): Estos ensayos NO están comprendidos en el alcance de la acreditación O.U.A. LE
  006"). **No confundir** con el `tipo_valor` de presencia `-`/`+`.
- **Numeración:** el **N° de muestra** es un contador global (+1), el mismo en las 3 etapas. El
  **Nº de Análisis** = `N°cliente / N°informe / fecha de siembra` (formato año-mes-día); se arma
  en la app al mostrar/imprimir, no se guarda como texto.

## Flujo de trabajo (dos herramientas)
- **Claude Code (VS Code)** construye (código, SQL, git). Al terminar cada sesión, actualiza
  `PARA_COWORK.md`.
- **Cowork** planifica, investiga, arma documentos y mantiene `CLAUDE.md` al día.
