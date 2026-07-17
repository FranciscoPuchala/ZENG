-- =====================================================================
--  ZENG — Migración v2
--  Qué cambia respecto a v1:
--    1. `parametros` ya no pertenece a un ensayo; es un catálogo propio.
--       Se le agrega `tipo_valor` ('numerico' | 'presencia') y se borra ensayo_id.
--    2. Nueva tabla `metodologias` (catálogo de las 68 metodologías del lab).
--    3. Nueva tabla `ensayo_parametros` (qué parámetros tiene cada ensayo + orden).
--    4. Nueva tabla `ensayo_metodologias` (qué metodologías tiene cada ensayo + orden).
--
--  Cómo correrlo (UNA SOLA VEZ sobre la base ya cargada):
--    psql -U postgres -d zeng -f db/migracion_v2.sql
--
--  El script está envuelto en una TRANSACCIÓN: si algo falla, no queda nada
--  a medias — todo se deshace automáticamente.
-- =====================================================================

BEGIN;

-- ── 1. Borrar tablas que dependen de `parametros` (en orden inverso) ──
-- `resultados` tiene una FK a `parametros`, así que hay que borrarla primero.
DROP TABLE IF EXISTS resultados;

-- Ahora sí podemos borrar y recrear `parametros`.
DROP TABLE IF EXISTS parametros;

-- ── 2. `parametros` — nuevo catálogo standalone ───────────────────────
CREATE TABLE parametros (
    id          SERIAL PRIMARY KEY,
    codigo      TEXT NOT NULL UNIQUE,          -- ej. '0052'  (UNIQUE: cada código una sola vez)
    descripcion TEXT NOT NULL,                  -- ej. 'Enterobacterias'
    unidad      TEXT,                           -- ej. 'ufc/g'  (puede ser nulo en algunos)
    tipo_valor  TEXT NOT NULL DEFAULT 'numerico'
                CHECK (tipo_valor IN ('numerico', 'presencia'))
                                                -- 'numerico'  → campo de texto libre
                                                -- 'presencia' → selector  -  /  +
);

-- ── 3. `resultados` — igual que antes, solo se recreó ─────────────────
CREATE TABLE resultados (
    id               SERIAL PRIMARY KEY,
    analisis_id      INTEGER     NOT NULL REFERENCES analisis(id),
    parametro_id     INTEGER     NOT NULL REFERENCES parametros(id),
    valor            VARCHAR(60),               -- ej. '<1.0*10(1)', 'NEGATIVO', '-', '+'
    lectura_dilucion VARCHAR(60),
    analista_id      INTEGER     REFERENCES usuarios(id),
    revisado_por     INTEGER     REFERENCES usuarios(id),
    UNIQUE (analisis_id, parametro_id)
);

-- ── 4. `metodologias` — nuevo catálogo ───────────────────────────────
CREATE TABLE metodologias (
    id          SERIAL PRIMARY KEY,
    codigo      TEXT NOT NULL UNIQUE,           -- ej. '001'
    descripcion TEXT NOT NULL                   -- ej. 'NORMA UNIT - AGUA POTABLE...'
);

-- ── 5. `ensayo_parametros` — relación muchos-a-muchos ────────────────
-- Un ensayo tiene varios parámetros; el mismo parámetro puede estar en muchos ensayos.
CREATE TABLE ensayo_parametros (
    id           SERIAL PRIMARY KEY,
    ensayo_id    INTEGER  NOT NULL REFERENCES ensayos(id)    ON DELETE CASCADE,
    parametro_id INTEGER  NOT NULL REFERENCES parametros(id) ON DELETE CASCADE,
    orden        SMALLINT NOT NULL DEFAULT 0,
    UNIQUE (ensayo_id, parametro_id)
);

-- ── 6. `ensayo_metodologias` — relación muchos-a-muchos ──────────────
CREATE TABLE ensayo_metodologias (
    id             SERIAL PRIMARY KEY,
    ensayo_id      INTEGER  NOT NULL REFERENCES ensayos(id)      ON DELETE CASCADE,
    metodologia_id INTEGER  NOT NULL REFERENCES metodologias(id) ON DELETE CASCADE,
    orden          SMALLINT NOT NULL DEFAULT 0,
    UNIQUE (ensayo_id, metodologia_id)
);

-- ── 7. Índices ────────────────────────────────────────────────────────
DROP INDEX IF EXISTS idx_parametros_ensayo;    -- ya no existe ensayo_id en parametros

CREATE INDEX idx_resultados_analisis        ON resultados(analisis_id);
CREATE INDEX idx_ensayo_parametros_ensayo   ON ensayo_parametros(ensayo_id);
CREATE INDEX idx_ensayo_metodologias_ensayo ON ensayo_metodologias(ensayo_id);

COMMIT;
