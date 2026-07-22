-- =====================================================================
--  ZENG — Migración: campo acreditado en metodologias
--  Fuente: Certificado OUA OUAIMP034 Rev.12, alcance actualizado 31/07/2025
--
--  Cómo correrlo (UNA SOLA VEZ):
--    psql -U postgres -d zeng -f db/migracion_metodologias_acreditadas.sql
-- =====================================================================

BEGIN;

-- Agregar columna (si ya existe, no hace nada)
ALTER TABLE metodologias
  ADD COLUMN IF NOT EXISTS acreditado BOOLEAN NOT NULL DEFAULT FALSE;

-- Marcar las metodologías dentro del alcance OUA LE 006
-- Fuente: OUAIMP034 Rev.12, Fecha de revisión: 31/07/2025
UPDATE metodologias SET acreditado = TRUE
WHERE codigo IN (
  '004',   -- UNE-EN ISO 6579-1:2017/Amd 1:2021 — Detección de Salmonella spp (cultivo)
  '034',   -- ITLAB 075 v14 — BAX® PCR E. coli O157:H7/NM
  '036',   -- ITLAB 083 v8  — BAX® PCR Salmonella spp
  '040',   -- ITLAB 091 v6  — Petrifilm Enterobacteriaceae Count Plate (≥10 ufc/g)
  '041',   -- 3M Petrifilm Aerobic Count Plate AOAC 990.12 (≥10 ufc/g)
  '045',   -- ITLAB 055 v12 — Coliformes totales agua, membrana, 9222B (≥1 ufc/100mL)
  '054'    -- ITLAB 099 v7  — BAX® PCR E. coli no O157 STEC
);

COMMIT;

-- Verificación:
SELECT codigo, acreditado, LEFT(descripcion, 80) AS descripcion
FROM metodologias
WHERE acreditado = TRUE
ORDER BY codigo;
