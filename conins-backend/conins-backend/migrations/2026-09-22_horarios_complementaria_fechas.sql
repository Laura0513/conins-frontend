-- Migracion 2026-09-22: fechas de la formacion complementaria (evento o rango).
-- Para BD ya montada. En BD nueva ya vienen en database.sql.
-- fecha_inicio: inicio del periodo de la complementaria.
-- fecha_fin: fin del periodo; NULL = evento de una sola semana.
-- Solo aplican a formacion complementaria; en horarios normales quedan NULL.

ALTER TABLE horarios
  ADD COLUMN fecha_inicio DATE NULL COMMENT 'Complementaria: inicio del periodo' AFTER observaciones,
  ADD COLUMN fecha_fin    DATE NULL COMMENT 'Complementaria: fin del periodo (NULL = una semana)' AFTER fecha_inicio;
