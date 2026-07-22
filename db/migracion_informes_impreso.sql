-- ZENG — Migración: campo impreso en informes
-- Cómo correrlo (UNA SOLA VEZ):
--   psql -U postgres -d zeng -f db/migracion_informes_impreso.sql

BEGIN;
ALTER TABLE informes
  ADD COLUMN IF NOT EXISTS impreso BOOLEAN NOT NULL DEFAULT FALSE;
COMMIT;
