-- =====================================================================
--  ZENG — Migración: sistema de login
--  Agregar autenticación a la tabla usuarios existente.
--
--  Correr con:
--    psql -U postgres -d zeng -f db/migracion_login.sql
-- =====================================================================

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS usuario       TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS rol           TEXT NOT NULL DEFAULT 'analista'
                                         CHECK (rol IN ('admin', 'analista'));
