-- =====================================================================
--  ZENG - Datos de prueba (seed)
--  Correr con: psql -U postgres -d zeng -f db/seed.sql
--
--  Solo carga datos CONFIRMADOS. Lo que depende de la 2a visita
--  (parámetros de otros ensayos, más clientes, usuarios reales)
--  se agrega después.
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

-- PARÁMETRO del ensayo 138
-- (nombre exacto pendiente de la 2a visita — esto es un placeholder razonable)
INSERT INTO parametros (ensayo_id, nombre, unidad, codigo, orden)
VALUES (
  (SELECT id FROM ensayos WHERE codigo = '138'),
  'Enterobacterias',
  'ufc/g',
  '0052',
  1
);
