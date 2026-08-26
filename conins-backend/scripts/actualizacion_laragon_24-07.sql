-- ============================================================
-- ACTUALIZACION LARAGON — CONINS — al 24/07/2026
-- Junta: modelo RAP directo (21/07) + sedes e historico (24/07).
-- Seguro de correr sobre una BD conIns existente: si algo ya existe,
-- lo salta sin error (usa checks en information_schema).
-- Ejecutar completo en phpMyAdmin (pestaña SQL de la BD conIns).
-- ============================================================

USE conIns;

-- ------------------------------------------------------------
-- 1. Tabla asignacion_rap (RF-42, modelo RAP directo)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS asignacion_rap (
    id                        INT AUTO_INCREMENT PRIMARY KEY,
    asignacion_competencia_id INT NOT NULL,
    rap_id                    INT NOT NULL,
    instructor_anterior_id    INT NULL,
    fecha_cambio              DATETIME NULL,
    activo                    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at                TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_asignacion_competencia_rap (asignacion_competencia_id, rap_id),
    FOREIGN KEY (asignacion_competencia_id) REFERENCES asignacion_competencia(id) ON DELETE CASCADE,
    FOREIGN KEY (rap_id)                    REFERENCES raps(id)                   ON DELETE RESTRICT,
    FOREIGN KEY (instructor_anterior_id)    REFERENCES instructores(id)           ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 2. Tabla sedes + sede principal
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sedes (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    nombre       VARCHAR(100) NOT NULL,
    direccion    VARCHAR(200) NULL,
    es_principal BOOLEAN NOT NULL DEFAULT FALSE,
    activo       BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

INSERT IGNORE INTO sedes (id, nombre, direccion, es_principal) VALUES
(1, 'CDMC Itagüí (Principal)', NULL, TRUE);

-- ------------------------------------------------------------
-- 3. Tabla instructor_historico
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS instructor_historico (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    instructor_id     INT NULL,
    nombre            VARCHAR(100) NOT NULL,
    documento         VARCHAR(20)  NULL,
    tipo_area         ENUM('transversal','tecnica') NULL,
    fecha_ingreso     DATE NULL,
    fecha_salida      DATE NOT NULL,
    motivo            TEXT NULL,
    registrado_por_id INT NULL,
    created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id)     REFERENCES instructores(id) ON DELETE SET NULL,
    FOREIGN KEY (registrado_por_id) REFERENCES usuarios(id)     ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 4. Columnas nuevas (solo se agregan si no existen)
-- ------------------------------------------------------------

-- horarios.rap_id
SET @x := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'horarios' AND COLUMN_NAME = 'rap_id');
SET @sql := IF(@x = 0,
  'ALTER TABLE horarios ADD COLUMN rap_id INT NULL AFTER competencia_id',
  'SELECT ''horarios.rap_id ya existe''');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @x := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'horarios' AND CONSTRAINT_NAME = 'fk_horarios_rap');
SET @sql := IF(@x = 0,
  'ALTER TABLE horarios ADD CONSTRAINT fk_horarios_rap FOREIGN KEY (rap_id) REFERENCES raps(id) ON DELETE SET NULL',
  'SELECT ''fk_horarios_rap ya existe''');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ambientes.sede_id
SET @x := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ambientes' AND COLUMN_NAME = 'sede_id');
SET @sql := IF(@x = 0,
  'ALTER TABLE ambientes ADD COLUMN sede_id INT NULL AFTER area_id',
  'SELECT ''ambientes.sede_id ya existe''');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @x := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ambientes' AND CONSTRAINT_NAME = 'fk_ambientes_sede');
SET @sql := IF(@x = 0,
  'ALTER TABLE ambientes ADD CONSTRAINT fk_ambientes_sede FOREIGN KEY (sede_id) REFERENCES sedes(id) ON DELETE SET NULL',
  'SELECT ''fk_ambientes_sede ya existe''');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- fichas.sede_id
SET @x := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fichas' AND COLUMN_NAME = 'sede_id');
SET @sql := IF(@x = 0,
  'ALTER TABLE fichas ADD COLUMN sede_id INT NULL AFTER ambiente_id',
  'SELECT ''fichas.sede_id ya existe''');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @x := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fichas' AND CONSTRAINT_NAME = 'fk_fichas_sede');
SET @sql := IF(@x = 0,
  'ALTER TABLE fichas ADD CONSTRAINT fk_fichas_sede FOREIGN KEY (sede_id) REFERENCES sedes(id) ON DELETE SET NULL',
  'SELECT ''fk_fichas_sede ya existe''');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- asignacion.jornada_id (feedback Laura 28/07 — jornada preferente de la asignacion)
SET @x := (SELECT COUNT(*) FROM information_schema.COLUMNS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'asignacion' AND COLUMN_NAME = 'jornada_id');
SET @sql := IF(@x = 0,
  'ALTER TABLE asignacion ADD COLUMN jornada_id INT NULL AFTER ficha_id',
  'SELECT ''asignacion.jornada_id ya existe''');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @x := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
           WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'asignacion' AND CONSTRAINT_NAME = 'fk_asignacion_jornada');
SET @sql := IF(@x = 0,
  'ALTER TABLE asignacion ADD CONSTRAINT fk_asignacion_jornada FOREIGN KEY (jornada_id) REFERENCES jornadas(id) ON DELETE SET NULL',
  'SELECT ''fk_asignacion_jornada ya existe''');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ------------------------------------------------------------
-- 5. (Opcional) asignar todo lo existente a la sede principal
-- Descomenta si quieres que ambientes/grupos actuales queden en la sede 1.
-- ------------------------------------------------------------
-- UPDATE ambientes SET sede_id = 1 WHERE sede_id IS NULL;
-- UPDATE fichas    SET sede_id = 1 WHERE sede_id IS NULL;

-- ------------------------------------------------------------
-- 6. Verificacion (usa information_schema — evita la rareza de SHOW COLUMNS
--    en phpMyAdmin que da "#1109 Unknown table in information_schema")
-- ------------------------------------------------------------
SELECT COUNT(*) AS total_tablas FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE();

SELECT TABLE_NAME AS tablas_nuevas
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('asignacion_rap','sedes','instructor_historico');

SELECT TABLE_NAME, COLUMN_NAME AS columnas_nuevas
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND ( (TABLE_NAME='horarios'  AND COLUMN_NAME='rap_id')
     OR (TABLE_NAME='ambientes' AND COLUMN_NAME='sede_id')
     OR (TABLE_NAME='fichas'    AND COLUMN_NAME='sede_id') );
