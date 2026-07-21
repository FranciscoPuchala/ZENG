-- Agrega soporte de valores predeterminados y tipos de campo a la tabla parametros.
-- Se puede correr varias veces sin error (IF NOT EXISTS).

ALTER TABLE parametros
  ADD COLUMN IF NOT EXISTS valor_predeterminado VARCHAR(100),
  ADD COLUMN IF NOT EXISTS valor_referencia     VARCHAR(100),
  ADD COLUMN IF NOT EXISTS tipo_campo           VARCHAR(30) NOT NULL DEFAULT 'texto';

-- tipo_campo valores posibles:
--   'texto'       → campo de texto libre (puede tener predeterminado o estar vacío)
--   'ausencia'    → select: Ausencia (default) / No Detectado
--   'negativo'    → select: Negativo (default) / Presuntivo Positivo
--   'no_detectado'→ select: No Detectado (default) / Detectado
