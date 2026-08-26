-- ============================================================
-- PERSISTENCIA DE ALERTAS (25/08/2026)
-- La tabla alertas nunca se escribia; se generaliza para soportar alertas de
-- carga (semana/horas) y estructurales (ficha/rap, p.ej. RAP_COMPARTIDO).
-- Idempotencia: revisar si las columnas ya existen antes de correr en una BD
-- que ya tenga el schema nuevo.
-- ============================================================
ALTER TABLE alertas
  MODIFY semana DATE NULL,
  MODIFY total_horas DECIMAL(5,2) NULL,
  ADD COLUMN ficha_id INT NULL AFTER total_horas,
  ADD COLUMN rap_id   INT NULL AFTER ficha_id;

-- El UNIQUE viejo (instructor, semana, tipo) no sirve para alertas estructurales
-- (semana NULL) y la deduplicacion pasa a la capa de servicio (null-safe).
ALTER TABLE alertas DROP INDEX uq_alerta_semana_tipo;

ALTER TABLE alertas
  ADD INDEX idx_alerta_instructor (instructor_id),
  ADD INDEX idx_alerta_atendida (atendida),
  ADD INDEX idx_alerta_ficha_rap (ficha_id, rap_id),
  ADD CONSTRAINT fk_alerta_ficha FOREIGN KEY (ficha_id) REFERENCES fichas(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_alerta_rap   FOREIGN KEY (rap_id)   REFERENCES raps(id)   ON DELETE CASCADE;
