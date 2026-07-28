-- ============================================================
-- Migracion 24/07/2026 — Sedes + Histórico de instructores
-- Aplicar sobre una BD conIns YA existente (sin reimportar database.sql).
-- Si reimportas database.sql desde cero, NO necesitas esto.
-- ============================================================

USE conIns;

-- 1. Tabla sedes + sede principal
CREATE TABLE IF NOT EXISTS sedes (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    nombre       VARCHAR(100) NOT NULL,
    direccion    VARCHAR(200) NULL,
    es_principal BOOLEAN NOT NULL DEFAULT FALSE,
    activo       BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

INSERT IGNORE INTO sedes (id, nombre, direccion, es_principal) VALUES
(1, 'CDMC Itagüí (Principal)', NULL, TRUE);

-- 2. sede_id en ambientes y fichas (si ya existen, el ALTER da error 1060 ignorable)
ALTER TABLE ambientes ADD COLUMN sede_id INT NULL AFTER area_id;
ALTER TABLE ambientes ADD CONSTRAINT fk_ambientes_sede FOREIGN KEY (sede_id) REFERENCES sedes(id) ON DELETE SET NULL;

ALTER TABLE fichas ADD COLUMN sede_id INT NULL AFTER ambiente_id;
ALTER TABLE fichas ADD CONSTRAINT fk_fichas_sede FOREIGN KEY (sede_id) REFERENCES sedes(id) ON DELETE SET NULL;

-- Opcional: asignar todo lo existente a la sede principal
-- UPDATE ambientes SET sede_id = 1 WHERE sede_id IS NULL;
-- UPDATE fichas    SET sede_id = 1 WHERE sede_id IS NULL;

-- 3. Tabla instructor_historico
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

-- Verificacion:
-- SHOW TABLES LIKE 'sedes';
-- SHOW TABLES LIKE 'instructor_historico';
-- SHOW COLUMNS FROM ambientes LIKE 'sede_id';
-- SHOW COLUMNS FROM fichas LIKE 'sede_id';
