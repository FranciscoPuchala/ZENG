-- =====================================================================
--  ZENG - Laboratorio Microbiologico
--  Esquema de base de datos  (v1 - BORRADOR)  -  PostgreSQL
--  Sistema nuevo e independiente. Hecho a partir del relevamiento.
--
--  Como usarlo en el servidor local (una sola vez):
--    1) Instalar PostgreSQL en el servidor (Windows, Linux o Raspberry).
--    2) Crear la base:         createdb zeng
--    3) Cargar este esquema:   psql -d zeng -f zeng_esquema_v1.sql
--
--  Convenciones:
--    - Cada tabla tiene su "id" propio (clave primaria, autonumerico).
--    - Las claves foraneas (xxx_id) conectan una tabla con otra.
--    - CATALOGO = datos fijos que cargas una vez;  OPERACION = lo de cada dia.
--  Lo marcado [PENDIENTE] se ajusta despues de la 2a visita.
-- =====================================================================


-- ============== CATALOGO (datos de referencia) =======================

-- Clientes del laboratorio
CREATE TABLE clientes (
    id              SERIAL PRIMARY KEY,
    numero_cliente  VARCHAR(20)  NOT NULL UNIQUE,   -- ej. '439', '026 A' (ojo: puede tener letras)
    nombre          VARCHAR(150) NOT NULL,
    direccion       VARCHAR(200),
    telefono        VARCHAR(60),
    fax             VARCHAR(60)
);

-- Usuarios / analistas (los que reciben, analizan o revisan)
CREATE TABLE usuarios (
    id          SERIAL PRIMARY KEY,
    iniciales   VARCHAR(10)  NOT NULL UNIQUE,        -- ej. 'sv', 'dq', 'fr', 'dg'
    nombre      VARCHAR(120)
);

-- Tipos de ensayo (catalogo de analisis del lab)
CREATE TABLE ensayos (
    id          SERIAL PRIMARY KEY,
    codigo      VARCHAR(10)  NOT NULL UNIQUE,        -- ej. '138', '140', '014' (texto: puede tener ceros adelante)
    nombre      VARCHAR(120) NOT NULL                -- ej. 'Enterobacterias'
);

-- Parametros que mide cada ensayo (un ensayo tiene varios)
CREATE TABLE parametros (
    id          SERIAL PRIMARY KEY,
    ensayo_id   INTEGER      NOT NULL REFERENCES ensayos(id),
    nombre      VARCHAR(150) NOT NULL,               -- ej. 'Enterobacterias (ufc/g)'
    unidad      VARCHAR(30),                         -- ej. 'ufc/g'
    codigo      VARCHAR(15),                         -- ej. '0052'
    orden       SMALLINT DEFAULT 0                   -- para mostrarlos siempre en el mismo orden
);


-- ============== OPERACION (lo que pasa cada dia) ======================

-- Muestras que entran  (etapa 1: Cuaderno de Entrada)
CREATE TABLE muestras (
    id              SERIAL PRIMARY KEY,
    numero_interno  BIGINT       NOT NULL UNIQUE,    -- contador GLOBAL (+1 por muestra, arranca en 1). Es el mismo N de las 3 etapas.
    cliente_id      INTEGER      NOT NULL REFERENCES clientes(id),
    descripcion     VARCHAR(250),                    -- ej. '5 muestras de carne'
    fecha_entrada   DATE         NOT NULL,
    hora_entrada    TIME,
    fecha_muestreo  DATE,                            -- 'Fecha Muestra': la da el CLIENTE, se carga a mano
    recibido_por    INTEGER      REFERENCES usuarios(id),
    observaciones   TEXT,
    creado_en       TIMESTAMP    DEFAULT now()
);

-- Informes que se entregan al cliente  (etapa 3 / agrupador)
CREATE TABLE informes (
    id              SERIAL PRIMARY KEY,
    cliente_id      INTEGER      NOT NULL REFERENCES clientes(id),
    numero_informe  VARCHAR(20)  NOT NULL,           -- N de informe del cliente   [PENDIENTE: regla exacta]
    fecha_muestreo  DATE,
    fecha_recepcion DATE,
    fecha_analisis  DATE,
    fecha_emision   DATE,
    publicado       BOOLEAN      NOT NULL DEFAULT FALSE,  -- 'Publicado' = aprobado para publicar
    fecha_publicado DATE                             -- cuando se aprobo
    -- [PENDIENTE] confirmar si un informe agrupa analisis de UNA muestra o de VARIAS del mismo cliente
);

-- Analisis: un ensayo aplicado a una muestra  (aca vive el "pendiente")
CREATE TABLE analisis (
    id              SERIAL PRIMARY KEY,
    muestra_id      INTEGER      NOT NULL REFERENCES muestras(id),
    ensayo_id       INTEGER      NOT NULL REFERENCES ensayos(id),
    informe_id      INTEGER      REFERENCES informes(id),   -- a que informe pertenece (vacio hasta agruparlo)
    numero_informe  VARCHAR(20),                     -- parte del "Nro. Analisis"   [PENDIENTE: regla]
    fecha_siembra   DATE,
    hora_siembra    TIME,
    estado          VARCHAR(12)  NOT NULL DEFAULT 'pendiente'
                    CHECK (estado IN ('pendiente','cargado','publicado'))
    -- "Nro. Analisis" = numero_cliente / numero_informe / fecha_siembra(aaaa-mm-dd)
    --  -> se arma en la aplicacion al mostrar/imprimir; no se guarda como texto.
);

-- Resultados: un valor por cada parametro de cada analisis  (etapa 2)
CREATE TABLE resultados (
    id               SERIAL PRIMARY KEY,
    analisis_id      INTEGER     NOT NULL REFERENCES analisis(id),
    parametro_id     INTEGER     NOT NULL REFERENCES parametros(id),
    valor            VARCHAR(60),                    -- texto: ej. '<1.0*10(1)', '1.9*10(3)', 'NEGATIVO'
    lectura_dilucion VARCHAR(60),
    analista_id      INTEGER     REFERENCES usuarios(id),
    revisado_por     INTEGER     REFERENCES usuarios(id),
    UNIQUE (analisis_id, parametro_id)               -- un solo resultado por parametro en cada analisis
);


-- ============== INDICES (para que las busquedas sean rapidas) =========
CREATE INDEX idx_muestras_cliente    ON muestras(cliente_id);
CREATE INDEX idx_analisis_muestra    ON analisis(muestra_id);
CREATE INDEX idx_analisis_informe    ON analisis(informe_id);
CREATE INDEX idx_resultados_analisis ON resultados(analisis_id);
CREATE INDEX idx_parametros_ensayo   ON parametros(ensayo_id);
