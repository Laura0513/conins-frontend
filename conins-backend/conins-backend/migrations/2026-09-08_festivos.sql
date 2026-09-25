-- Migracion suelta: tabla festivos + seed (Colombia 2026-2027).
-- Correr UNA vez sobre una BD ya montada (phpMyAdmin o cliente mysql).
-- No hace falta si se hace flujo limpio (db:reset): database.sql ya la incluye.
-- Un festivo dentro de una semana descuenta de la carga los bloques de ese dia.

CREATE TABLE IF NOT EXISTS festivos (
    fecha       DATE PRIMARY KEY,
    descripcion VARCHAR(120) NOT NULL,
    activo      BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

INSERT IGNORE INTO festivos (fecha, descripcion) VALUES
  ('2026-01-01', 'Ano Nuevo'),
  ('2026-01-12', 'Reyes Magos'),
  ('2026-03-23', 'San Jose'),
  ('2026-04-02', 'Jueves Santo'),
  ('2026-04-03', 'Viernes Santo'),
  ('2026-05-01', 'Dia del Trabajo'),
  ('2026-05-18', 'Ascension del Senor'),
  ('2026-06-08', 'Corpus Christi'),
  ('2026-06-15', 'Sagrado Corazon'),
  ('2026-06-29', 'San Pedro y San Pablo'),
  ('2026-07-20', 'Independencia de Colombia'),
  ('2026-08-07', 'Batalla de Boyaca'),
  ('2026-08-17', 'Asuncion de la Virgen'),
  ('2026-10-12', 'Dia de la Raza'),
  ('2026-11-02', 'Todos los Santos'),
  ('2026-11-16', 'Independencia de Cartagena'),
  ('2026-12-08', 'Inmaculada Concepcion'),
  ('2026-12-25', 'Navidad'),
  ('2027-01-01', 'Ano Nuevo'),
  ('2027-01-11', 'Reyes Magos'),
  ('2027-03-22', 'San Jose'),
  ('2027-03-25', 'Jueves Santo'),
  ('2027-03-26', 'Viernes Santo'),
  ('2027-05-01', 'Dia del Trabajo'),
  ('2027-05-10', 'Ascension del Senor'),
  ('2027-05-31', 'Corpus Christi'),
  ('2027-06-07', 'Sagrado Corazon'),
  ('2027-07-05', 'San Pedro y San Pablo'),
  ('2027-07-20', 'Independencia de Colombia'),
  ('2027-08-07', 'Batalla de Boyaca'),
  ('2027-08-16', 'Asuncion de la Virgen'),
  ('2027-10-18', 'Dia de la Raza'),
  ('2027-11-01', 'Todos los Santos'),
  ('2027-11-15', 'Independencia de Cartagena'),
  ('2027-12-08', 'Inmaculada Concepcion'),
  ('2027-12-25', 'Navidad');

-- Verificacion:
-- SELECT * FROM festivos ORDER BY fecha;
