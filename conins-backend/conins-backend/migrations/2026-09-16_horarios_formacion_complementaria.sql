-- Migracion suelta: formacion complementaria sobre la tabla horarios.
-- La complementaria es un bloque de horario SIN grupo ni competencia/RAP (llena carga
-- baja). Se ancla a un programa complementario y guarda modalidad + observaciones.
-- Correr UNA vez sobre una BD ya montada; no hace falta en db:reset (database.sql ya la trae).

ALTER TABLE horarios MODIFY ficha_id INT NULL;
ALTER TABLE horarios MODIFY competencia_id INT NULL;
ALTER TABLE horarios ADD COLUMN programa_id INT NULL COMMENT 'Programa de la formacion complementaria (sin grupo)' AFTER competencia_id;
ALTER TABLE horarios ADD COLUMN modalidad ENUM('presencial','virtual') NULL COMMENT 'Modalidad, para formacion complementaria' AFTER programa_id;
ALTER TABLE horarios ADD COLUMN observaciones TEXT NULL COMMENT 'Observaciones, para formacion complementaria' AFTER modalidad;
ALTER TABLE horarios ADD CONSTRAINT fk_horarios_programa FOREIGN KEY (programa_id) REFERENCES programas(id) ON DELETE RESTRICT;

-- Verificacion:
-- SHOW COLUMNS FROM horarios LIKE 'programa_id';
-- SHOW COLUMNS FROM horarios LIKE 'modalidad';
