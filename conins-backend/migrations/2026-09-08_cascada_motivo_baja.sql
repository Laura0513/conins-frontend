-- Migracion suelta: columna motivo_baja en la cadena de asignacion, para la cascada
-- reversible de desactivacion (grupo/instructor/competencia/RAP). Correr UNA vez sobre
-- una BD ya montada. No hace falta en flujo limpio (db:reset): database.sql ya la trae.
-- MySQL 8 no soporta ADD COLUMN IF NOT EXISTS: si ya existe, ignora el error de esa linea.

ALTER TABLE asignacion             ADD COLUMN motivo_baja VARCHAR(80) NULL COMMENT 'Causa de la baja en cascada (para reactivar con precision)';
ALTER TABLE asignacion_competencia ADD COLUMN motivo_baja VARCHAR(80) NULL COMMENT 'Causa de la baja en cascada (para reactivar con precision)';
ALTER TABLE asignacion_rap         ADD COLUMN motivo_baja VARCHAR(80) NULL COMMENT 'Causa de la baja en cascada (para reactivar con precision)';
ALTER TABLE rap_ficha_seguimiento  ADD COLUMN motivo_baja VARCHAR(80) NULL COMMENT 'Causa de la baja en cascada (para reactivar con precision)';

-- Verificacion:
-- SHOW COLUMNS FROM asignacion LIKE 'motivo_baja';
