-- =====================================================================
--  ZENG - Datos de prueba (seed)
--  Correr con: psql -U postgres -d zeng -f db/seed.sql
--
--  Solo carga datos CONFIRMADOS. El catálogo real (151 ensayos,
--  158 parámetros, 68 metodologías) se carga con los CSVs en el Paso 2.
-- =====================================================================


-- CLIENTES (tomados de las capturas del sistema actual)
INSERT INTO clientes (numero_cliente, nombre) VALUES
  ('439',   'Cliente 439'),
  ('297',   'Cliente 297'),
  ('026 A', 'Cliente 026 A'),
  ('100',   'Cliente 100');


-- USUARIOS / ANALISTAS (iniciales vistas en las capturas)
INSERT INTO usuarios (iniciales, nombre) VALUES
  ('sv', 'S.V.'),
  ('dq', 'D.Q.'),
  ('fr', 'Francisco'),
  ('dg', 'D.G.');


-- ENSAYO CONFIRMADO: 138 = Enterobacterias
INSERT INTO ensayos (codigo, nombre) VALUES
  ('138', 'Enterobacterias');

-- PARÁMETRO standalone (nuevo esquema: parametros no tiene ensayo_id)
INSERT INTO parametros (codigo, descripcion, unidad, tipo_valor) VALUES
  ('0052', 'Enterobacterias', 'ufc/g', 'numerico');

-- RELACIÓN: el ensayo 138 tiene el parámetro 0052, en orden 1
INSERT INTO ensayo_parametros (ensayo_id, parametro_id, orden)
VALUES (
  (SELECT id FROM ensayos   WHERE codigo = '138'),
  (SELECT id FROM parametros WHERE codigo = '0052'),
  1
);
