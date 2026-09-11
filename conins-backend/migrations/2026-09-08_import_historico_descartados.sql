-- Migracion suelta: columna descartados en import_historico (filas caidas en el
-- preview: fuera de rango, sin coincidencia en catalogo, etc.). Se cuentan aparte de
-- 'errores' (rechazos del confirm, ej. RN-04) para que el historico refleje todo lo
-- que no se cargo. Correr UNA vez sobre una BD ya montada. No hace falta en db:reset.

ALTER TABLE import_historico
  ADD COLUMN descartados INT NOT NULL DEFAULT 0
  COMMENT 'Filas caidas en el preview (fuera de rango, sin catalogo, ...)';

-- Verificacion:
-- SHOW COLUMNS FROM import_historico LIKE 'descartados';
