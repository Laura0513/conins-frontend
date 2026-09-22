-- Migracion suelta: tipo de vinculacion del instructor (define su carga maxima semanal).
-- contrato = 40h, planta = 32.5h. Correr UNA vez sobre una BD ya montada; no hace falta
-- en flujo limpio (db:reset): database.sql ya la trae.

ALTER TABLE instructores
  ADD COLUMN tipo_vinculacion ENUM('contrato','planta') NOT NULL DEFAULT 'contrato'
  COMMENT 'Define el maximo de carga semanal: contrato=40h, planta=32.5h'
  AFTER tipo_area;

-- Verificacion:
-- SHOW COLUMNS FROM instructores LIKE 'tipo_vinculacion';
