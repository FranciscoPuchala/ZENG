-- Agrega restricción UNIQUE en numero_informe para evitar informes duplicados.
-- Verificar duplicados antes de aplicar:
--   SELECT numero_informe, COUNT(*) FROM informes GROUP BY numero_informe HAVING COUNT(*) > 1;
-- Si hay duplicados, resolverlos manualmente antes de ejecutar este script.

ALTER TABLE informes
  ADD CONSTRAINT informes_numero_informe_unique UNIQUE (numero_informe);
