-- ZENG — Migración: renombrar el rol 'tecnico' a 'auxiliar'
-- Cómo correrla (UNA vez, en el servidor):
--   psql -U postgres -d zeng -f db\migracion_rol_auxiliar.sql
--
-- Es SEGURA: no borra ni pierde datos. Sólo cambia el NOMBRE del rol en los
-- usuarios que ya tenían 'tecnico'. Se puede correr varias veces sin problema.

UPDATE usuarios SET rol = 'auxiliar' WHERE rol = 'tecnico';
