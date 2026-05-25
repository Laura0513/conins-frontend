-- ============================================================
-- CONINS - Control Instructores SENA CDMC
-- Base de datos: conIns
-- Schema: v4
-- ============================================================

CREATE DATABASE IF NOT EXISTS conIns
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE conIns;

-- ============================================================
-- 1. JORNADAS
-- Tabla normalizada — reemplaza ENUMs de jornada en fichas/horarios.
-- valida_ambiente = FALSE para jornada virtual (no ocupa espacio físico).
-- ============================================================
CREATE TABLE IF NOT EXISTS jornadas (
    id          INT PRIMARY KEY,
    nombre      ENUM('manana','mixta','noche','virtual') NOT NULL,
    hora_inicio TIME NULL,
    hora_fin    TIME NULL
) ENGINE=InnoDB;

INSERT IGNORE INTO jornadas (id, nombre, hora_inicio, hora_fin) VALUES
(1, 'manana',  '06:00', '12:00'),
(2, 'mixta',   '12:00', '18:00'),
(3, 'noche',   '18:00', '22:00'),
(4, 'virtual',  NULL,    NULL);

-- ============================================================
-- 2. ROLES
-- Jerarquía: 1=Subdirector > 2=Coordinador > 3=Lider > 4=Instructor
-- Hay dos coordinadores (medular / transversal) — NOT se unifican.
-- LIDER_FICHA es flag administrativo en asignacion.es_lider_ficha.
-- NO es un rol del sistema — no aparece en usuario_roles ni en el JWT.
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
    id     INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(60) NOT NULL,
    nivel  TINYINT UNSIGNED NOT NULL COMMENT '1=Subdirector,2=Coordinador,3=Lider,4=Instructor',
    activo BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

INSERT IGNORE INTO roles (id, nombre, nivel) VALUES
(1, 'subdirector',             1),
(2, 'coordinador_medular',     2),
(3, 'coordinador_transversal', 2),
(4, 'lider_programa',          3),
(5, 'instructor',              4);

-- ============================================================
-- 3. ÁREAS
-- Un área puede tener subtipo (ej. Técnico Operario Medular).
-- ============================================================
CREATE TABLE IF NOT EXISTS areas (
    id      INT AUTO_INCREMENT PRIMARY KEY,
    nombre  VARCHAR(100) NOT NULL,
    subtipo VARCHAR(100) NULL COMMENT 'Subtipo opcional, ej. Tecnico Operario Medular',
    activa  BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

INSERT IGNORE INTO areas (id, nombre, subtipo) VALUES
(1,  'ADSO',                            NULL),
(2,  'Talento Humano',                  NULL),
(3,  'Contabilidad',                    NULL),
(4,  'Logística',                       NULL),
(5,  'Sistemas Integrados de Gestión',  NULL),
(6,  'Transversales',                   NULL),
(7,  'Bilingüismo',                     NULL),
(8,  'Virtualidad',                     NULL),
(9,  'Técnico Medular',                 'Técnico Operario Medular'),
(10, 'Tecnólogo Medular',               NULL);

-- ============================================================
-- 4. USUARIOS
-- Multi-rol vía usuario_roles.
-- Campo de login definitivo pendiente (Bloqueador B2).
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    nombre     VARCHAR(100) NOT NULL,
    email      VARCHAR(100) NOT NULL UNIQUE,
    password   VARCHAR(255) NULL DEFAULT NULL,
    activo     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Relación N:M usuarios ↔ roles
CREATE TABLE IF NOT EXISTS usuario_roles (
    usuario_id INT NOT NULL,
    rol_id     INT NOT NULL,
    PRIMARY KEY (usuario_id, rol_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (rol_id)     REFERENCES roles(id)    ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Admin inicial: password = 'Admin2026!' (bcrypt)
INSERT IGNORE INTO usuarios (id, nombre, email, password) VALUES
(1, 'Administrador', 'admin@conins.sena', '$2b$10$6SGt41o5yycSr3yLoDLcG.sfVJ3R411abaYXvNPPbLoAFH.wW7PS.');

-- Admin tiene rol Subdirector por defecto
INSERT IGNORE INTO usuario_roles (usuario_id, rol_id) VALUES (1, 1);

-- ============================================================
-- 5. INSTRUCTORES (perfil extendido de usuarios)
-- tipo_contrato: contratista | de_planta
-- tipo_area:     transversal | tecnica  ← eje pedagógico del instructor
-- ============================================================
CREATE TABLE IF NOT EXISTS instructores (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id    INT NOT NULL UNIQUE,
    tipo_contrato ENUM('contratista','de_planta') NOT NULL,
    tipo_area     ENUM('transversal','tecnica')   NOT NULL,
    activo        BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 6. PROGRAMAS DE FORMACIÓN
-- tipo_linea:    medular | transversal  ← clasificación administrativa CDMC
-- tipo_area:     tecnica | transversal  ← clasificación pedagógica
-- tipo_formacion: titulada | complementaria
-- modalidad:     presencial | virtual | a_distancia
-- NOTA: tipo_linea e tipo_area son ejes INDEPENDIENTES — no mezclar.
-- ============================================================
CREATE TABLE IF NOT EXISTS programas (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    codigo         VARCHAR(20)  NOT NULL,
    nombre         VARCHAR(150) NOT NULL,
    nivel          ENUM('tecnico','tecnologo','curso_especial') NOT NULL,
    area_id        INT NOT NULL,
    tipo_linea     ENUM('medular','transversal') NOT NULL,
    tipo_area      ENUM('tecnica','transversal') NOT NULL,
    tipo_formacion ENUM('titulada','complementaria','operario') NOT NULL,
    modalidad      ENUM('presencial','virtual','a_distancia') NOT NULL,
    activo         BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================================
-- 7. COMPETENCIAS
-- ============================================================
CREATE TABLE IF NOT EXISTS competencias (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(200) NOT NULL,
    codigo      VARCHAR(30)  NOT NULL,
    programa_id INT NOT NULL,
    activo      BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (programa_id) REFERENCES programas(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================================
-- 8. RESULTADOS DE APRENDIZAJE (RAPs)
-- Se heredan automáticamente al asignar la competencia.
-- NO se asignan individualmente.
-- ============================================================
CREATE TABLE IF NOT EXISTS raps (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    nombre         VARCHAR(255) NOT NULL,
    codigo         VARCHAR(30)  NOT NULL,
    competencia_id INT NOT NULL,
    fecha_limite   DATE NULL,
    activo         BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (competencia_id) REFERENCES competencias(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================================
-- 9. AMBIENTES DE FORMACIÓN
-- Seed inicial: aulas 200–208, talleres 1–4.
-- ============================================================
CREATE TABLE IF NOT EXISTS ambientes (
    id        INT AUTO_INCREMENT PRIMARY KEY,
    nombre    VARCHAR(60)  NOT NULL,
    tipo      ENUM('aula','taller','laboratorio') NOT NULL DEFAULT 'aula',
    capacidad SMALLINT UNSIGNED NULL,
    area_id   INT NULL COMMENT 'NULL = ambiente compartido entre áreas',
    activo    BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE SET NULL
) ENGINE=InnoDB;

INSERT IGNORE INTO ambientes (id, nombre, tipo) VALUES
(1,  'Aula 200', 'aula'),
(2,  'Aula 201', 'aula'),
(3,  'Aula 202', 'aula'),
(4,  'Aula 203', 'aula'),
(5,  'Aula 204', 'aula'),
(6,  'Aula 205', 'aula'),
(7,  'Aula 206', 'aula'),
(8,  'Aula 207', 'aula'),
(9,  'Aula 208', 'aula'),
(10, 'Taller 1', 'taller'),
(11, 'Taller 2', 'taller'),
(12, 'Taller 3', 'taller'),
(13, 'Taller 4', 'taller');

-- ============================================================
-- 10. FICHAS (grupos de formación)
-- jornada_id FK → jornadas  (reemplaza ENUM jornada)
-- ambiente_id FK → ambientes (ambiente base de la ficha)
-- lider_responsable eliminado → ver asignacion.es_lider_ficha
-- ============================================================
CREATE TABLE IF NOT EXISTS fichas (
    id                   INT AUTO_INCREMENT PRIMARY KEY,
    numero_ficha         VARCHAR(50)  NOT NULL UNIQUE,
    programa_id          INT NOT NULL,
    jornada_id           INT NOT NULL,
    ambiente_id          INT NULL,
    etapa                ENUM('lectiva','productiva') NOT NULL DEFAULT 'lectiva',
    fecha_inicio_lectiva DATE NULL,
    fecha_fin_lectiva    DATE NULL,
    fecha_fin_ficha      DATE NULL,
    estado               VARCHAR(50) NOT NULL DEFAULT 'Activa',
    activo               BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (programa_id) REFERENCES programas(id)  ON DELETE RESTRICT,
    FOREIGN KEY (jornada_id)  REFERENCES jornadas(id)   ON DELETE RESTRICT,
    FOREIGN KEY (ambiente_id) REFERENCES ambientes(id)  ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- 11. ASIGNACION
-- Unidad base: instructor → ficha.
-- es_lider_ficha: flag administrativo, no otorga permisos en el sistema.
-- es_provisional: instructor fuera de su área/programa raíz.
-- ============================================================
CREATE TABLE IF NOT EXISTS asignacion (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    instructor_id       INT NOT NULL,
    ficha_id            INT NOT NULL,
    es_lider_ficha      BOOLEAN NOT NULL DEFAULT FALSE,
    es_provisional      BOOLEAN NOT NULL DEFAULT FALSE,
    autorizado_por_id   INT NULL,
    fecha_autorizacion  DATE NULL,
    motivo_provisional  TEXT NULL,
    fecha_asignacion    DATE NULL,
    activo              BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE KEY uq_instructor_ficha (instructor_id, ficha_id),
    FOREIGN KEY (instructor_id)     REFERENCES instructores(id) ON DELETE RESTRICT,
    FOREIGN KEY (ficha_id)          REFERENCES fichas(id)       ON DELETE CASCADE,
    FOREIGN KEY (autorizado_por_id) REFERENCES usuarios(id)     ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- 12. ASIGNACION_COMPETENCIA
-- Unidad operativa: asignacion → competencia.
-- Los RAPs se heredan automáticamente — no se asignan uno a uno.
-- instructor_anterior_id: trazabilidad RN-08 (cambio de instructor activo).
-- ambiente_excepcion_id: override del ambiente base de la ficha.
-- ambiente_efectivo = ambiente_excepcion_id ?? ficha.ambiente_id
-- ============================================================
CREATE TABLE IF NOT EXISTS asignacion_competencia (
    id                    INT AUTO_INCREMENT PRIMARY KEY,
    asignacion_id         INT NOT NULL,
    competencia_id        INT NOT NULL,
    instructor_anterior_id INT NULL,
    fecha_cambio          DATE NULL,
    ambiente_excepcion_id INT NULL,
    observacion           TEXT NULL,
    activo                BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE KEY uq_asignacion_competencia (asignacion_id, competencia_id),
    FOREIGN KEY (asignacion_id)          REFERENCES asignacion(id)   ON DELETE CASCADE,
    FOREIGN KEY (competencia_id)         REFERENCES competencias(id) ON DELETE RESTRICT,
    FOREIGN KEY (instructor_anterior_id) REFERENCES instructores(id) ON DELETE SET NULL,
    FOREIGN KEY (ambiente_excepcion_id)  REFERENCES ambientes(id)    ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- 13. LIDER_PROGRAMA
-- Instructor designado como líder de un programa específico.
-- Acceso contextual: ve y gestiona fichas de su programa.
-- ============================================================
CREATE TABLE IF NOT EXISTS lider_programa (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    instructor_id INT NOT NULL,
    programa_id   INT NOT NULL,
    UNIQUE KEY uq_lider_programa (instructor_id, programa_id),
    FOREIGN KEY (instructor_id) REFERENCES instructores(id) ON DELETE CASCADE,
    FOREIGN KEY (programa_id)   REFERENCES programas(id)    ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 14. INSTRUCTOR_COMPETENCIAS_HABILITADAS
-- Competencias que un instructor tiene contratadas.
-- Validación obligatoria antes de INSERT en asignacion_competencia.
-- ============================================================
CREATE TABLE IF NOT EXISTS instructor_competencias_habilitadas (
    instructor_id  INT NOT NULL,
    competencia_id INT NOT NULL,
    PRIMARY KEY (instructor_id, competencia_id),
    FOREIGN KEY (instructor_id)  REFERENCES instructores(id)  ON DELETE CASCADE,
    FOREIGN KEY (competencia_id) REFERENCES competencias(id)  ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 15. HORARIOS
-- Un bloque = un período de clase de un instructor en una ficha.
-- jornada_id FK → jornadas  (reemplaza ENUM jornada)
-- competencia_id: qué competencia se imparte en este bloque.
-- semana: DATE del lunes de esa semana (para agrupar por semana).
-- ============================================================
CREATE TABLE IF NOT EXISTS horarios (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    ficha_id      INT NOT NULL,
    instructor_id INT NOT NULL,
    competencia_id INT NOT NULL,
    dia_semana    TINYINT UNSIGNED NOT NULL COMMENT '1=Lunes ... 7=Domingo',
    hora_inicio   TIME NOT NULL,
    hora_fin      TIME NOT NULL,
    jornada_id    INT NOT NULL,
    semana        DATE NOT NULL COMMENT 'Fecha del lunes de la semana',
    motivo_suspension TEXT NULL COMMENT 'RF-36 — se registra al desactivar un horario',
    activo        BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (ficha_id)       REFERENCES fichas(id)       ON DELETE CASCADE,
    FOREIGN KEY (instructor_id)  REFERENCES instructores(id) ON DELETE CASCADE,
    FOREIGN KEY (competencia_id) REFERENCES competencias(id) ON DELETE RESTRICT,
    FOREIGN KEY (jornada_id)     REFERENCES jornadas(id)     ON DELETE RESTRICT,
    INDEX idx_semana_instructor (semana, instructor_id)
) ENGINE=InnoDB;

-- ============================================================
-- 16. ALERTAS HORARIAS
-- Generadas automáticamente por horarioService.
-- Tipos válidos: HORAS_EXCEDIDAS | HORAS_INSUFICIENTES |
--   AMBIENTE_OCUPADO | ASIGNACION_PROVISIONAL |
--   INSTRUCTOR_PLANTA_JORNADA_NOCTURNA
-- Todas son alertas soft — no bloquean el INSERT.
-- UNIQUE por (instructor, semana, tipo): permite múltiples tipos simultáneos.
-- ============================================================
CREATE TABLE IF NOT EXISTS alertas (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    instructor_id INT NOT NULL,
    tipo          VARCHAR(60)  NOT NULL COMMENT 'HORAS_EXCEDIDAS | HORAS_INSUFICIENTES | AMBIENTE_OCUPADO | ASIGNACION_PROVISIONAL | INSTRUCTOR_PLANTA_JORNADA_NOCTURNA',
    mensaje       VARCHAR(255) NOT NULL,
    semana        DATE         NOT NULL COMMENT 'Fecha del lunes de la semana afectada',
    total_horas   DECIMAL(5,2) NOT NULL,
    atendida      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_alerta_semana_tipo (instructor_id, semana, tipo),
    FOREIGN KEY (instructor_id) REFERENCES instructores(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 17. INSTRUCTOR_NOVEDADES (RF-16)
-- Licencias, incapacidades y comisiones de instructores.
-- ============================================================
CREATE TABLE IF NOT EXISTS instructor_novedades (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    instructor_id  INT NOT NULL,
    tipo_novedad   ENUM('licencia','incapacidad','comision','otro') NOT NULL,
    fecha_inicio   DATE NOT NULL,
    fecha_regreso  DATE NOT NULL,
    observacion    TEXT NULL,
    activo         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES instructores(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 18. AMBIENTE_BLOQUEOS (RF-31)
-- Períodos en que un ambiente no está disponible.
-- ============================================================
CREATE TABLE IF NOT EXISTS ambiente_bloqueos (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    ambiente_id  INT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin    DATE NOT NULL,
    motivo       TEXT NOT NULL,
    activo       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ambiente_id) REFERENCES ambientes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 19. NOTIFICACIONES (RF-38 al RF-40)
-- correo_enviado = TRUE solo para instructores (RF-38).
-- ============================================================
CREATE TABLE IF NOT EXISTS notificaciones (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id     INT NOT NULL,
    tipo           VARCHAR(60)  NOT NULL,
    mensaje        TEXT NOT NULL,
    leida          BOOLEAN NOT NULL DEFAULT FALSE,
    correo_enviado BOOLEAN NOT NULL DEFAULT FALSE
      COMMENT 'TRUE solo para instructores — RF-38',
    generada_en    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario_leida (usuario_id, leida)
) ENGINE=InnoDB;

