-- ZENG — Migración: rol 'tecnico' → 'auxiliar'
-- Cómo correrla (UNA vez, en el servidor):
--   psql -U postgres -d zeng -f db\migracion_rol_auxiliar.sql
--
-- Es SEGURA: no borra datos. Actualiza la regla de roles permitidos y renombra
-- los usuarios que tenían 'tecnico'. Se puede correr varias veces sin problema.

-- 1. Permitir el rol 'auxiliar' (antes la base sólo dejaba 'admin' y 'analista').
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;
ALTER TABLE usuarios ADD  CONSTRAINT usuarios_rol_check CHECK (rol IN ('admin', 'analista', 'auxiliar'));

-- 2. Renombrar los usuarios que ya tuvieran 'tecnico'.
UPDATE usuarios SET rol = 'auxiliar' WHERE rol = 'tecnico';
