-- ============================================================
-- Migracion 21/07/2026 — Modelo RAP directo (RF-42, RF-34)
-- Aplicar sobre una BD conIns YA existente (sin reimportar database.sql).
-- Si reimportas database.sql desde cero, NO necesitas esto.
-- ============================================================

USE conIns;

-- 1. Tabla asignacion_rap (RF-42, RN-15 redefinida)
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

-- 2. Columna rap_id en horarios (RF-34, RN-27)
-- MySQL 8 no soporta ADD COLUMN IF NOT EXISTS de forma portable;
-- si ya existe la columna, este ALTER dara error 1060 (ignorable).
ALTER TABLE horarios
  ADD COLUMN rap_id INT NULL COMMENT 'RF-34 — RAP que se dicta en el bloque' AFTER competencia_id;

ALTER TABLE horarios
  ADD CONSTRAINT fk_horarios_rap FOREIGN KEY (rap_id) REFERENCES raps(id) ON DELETE SET NULL;

-- Verificacion:
-- SHOW COLUMNS FROM horarios LIKE 'rap_id';
-- SHOW TABLES LIKE 'asignacion_rap';
