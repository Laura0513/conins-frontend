-- ============================================================
-- CONINS - Control Instructores SENA CDMC
-- Base de datos: conIns
-- Schema: v5 — con auditoria, triggers, procedures, vistas, utf8mb4
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

-- Datos de roles se insertan despues de CREATE TABLE usuario_roles
-- para que TRUNCATE no falle en importacion sobre BD vacia (ver linea ~106).

-- ============================================================
-- 2b. SEDES (24/07/2026 — el CDMC tiene sedes que dependen de el)
-- Ambientes y grupos pertenecen a una sede.
-- ============================================================
CREATE TABLE IF NOT EXISTS sedes (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    nombre       VARCHAR(100) NOT NULL,
    direccion    VARCHAR(200) NULL,
    es_principal BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'TRUE = sede central CDMC',
    activo       BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

INSERT IGNORE INTO sedes (id, nombre, direccion, es_principal) VALUES
(1, 'CDMC Itagüí (Principal)', NULL, TRUE);

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
    id             INT AUTO_INCREMENT PRIMARY KEY,
    nombre         VARCHAR(100) NOT NULL,
    email          VARCHAR(100) NOT NULL UNIQUE,
    password       VARCHAR(255) NULL DEFAULT NULL,
    tipo_documento ENUM('cc','ce','ti','pasaporte') NULL DEFAULT 'cc',
    documento      VARCHAR(20) NULL UNIQUE,
    ultimo_acceso  DATETIME NULL,
    activo         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Relación N:M usuarios ↔ roles
CREATE TABLE IF NOT EXISTS usuario_roles (
    usuario_id INT NOT NULL,
    rol_id     INT NOT NULL,
    PRIMARY KEY (usuario_id, rol_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (rol_id)     REFERENCES roles(id)    ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ⚠ CAMBIO 01/07/2026: 5 roles → 4 roles (Title Case con espacios).
-- Movido aqui para que TRUNCATE no falle en BD vacia (usuario_roles existe desde la linea anterior).
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE usuario_roles;
TRUNCATE TABLE roles;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO roles (id, nombre, nivel) VALUES
(1, 'Subdirector',             1),
(2, 'Coordinadora Academica',  2),
(3, 'Asistente Coordinacion',  3),
(4, 'Instructor',              4);

-- ============================================================
-- 5. INSTRUCTORES (perfil extendido de usuarios)
-- tipo_area: transversal | tecnica  ← eje pedagógico del instructor
-- tipo_contrato eliminado en sesión 14/07/2026 — RN-03 activa para todos.
-- ============================================================
CREATE TABLE IF NOT EXISTS instructores (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id    INT NOT NULL UNIQUE,
    tipo_area     ENUM('transversal','tecnica')   NOT NULL,
    activo        BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 5b. INSTRUCTOR_HISTORICO (24/07/2026)
-- Archivo persistente de instructores que salieron del CDMC. Guarda un
-- snapshot (nombre/documento/tipo_area) para que el historico sobreviva aunque
-- el registro vivo cambie. El instructor se mantiene soft-deleted en
-- `instructores` (activo=FALSE) para no romper sus asignaciones/horarios.
-- ============================================================
CREATE TABLE IF NOT EXISTS instructor_historico (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    instructor_id     INT NULL COMMENT 'FK viva; SET NULL si el registro se elimina',
    nombre            VARCHAR(100) NOT NULL COMMENT 'Snapshot al momento de la baja',
    documento         VARCHAR(20)  NULL,
    tipo_area         ENUM('transversal','tecnica') NULL,
    fecha_ingreso     DATE NULL,
    fecha_salida      DATE NOT NULL,
    motivo            TEXT NULL,
    registrado_por_id INT NULL COMMENT 'Usuario que registro la baja',
    created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id)     REFERENCES instructores(id) ON DELETE SET NULL,
    FOREIGN KEY (registrado_por_id) REFERENCES usuarios(id)     ON DELETE SET NULL
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
    sede_id   INT NULL COMMENT 'Sede a la que pertenece el ambiente (24/07/2026)',
    activo    BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE SET NULL,
    FOREIGN KEY (sede_id) REFERENCES sedes(id) ON DELETE SET NULL
) ENGINE=InnoDB;

INSERT IGNORE INTO ambientes (id, nombre, tipo, capacidad) VALUES
(1,  'Ambiente 200', 'aula',   30),
(2,  'Ambiente 201', 'aula',   30),
(3,  'Ambiente 202', 'aula',   30),
(4,  'Ambiente 203', 'aula',   30),
(5,  'Ambiente 204', 'aula',   30),
(6,  'Ambiente 205', 'aula',   30),
(7,  'Ambiente 206', 'aula',   30),
(8,  'Ambiente 207', 'aula',   30),
(9,  'Ambiente 208', 'aula',   30),
(10, 'Taller 1', 'taller', 50),
(11, 'Taller 2', 'taller', 50),
(12, 'Taller 3', 'taller', 50),
(13, 'Taller 4', 'taller', 50);

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
    sede_id              INT NULL COMMENT 'Sede del grupo (24/07/2026)',
    lider_id             INT NULL COMMENT 'Usuario lider de programa asignado a esta ficha',
    etapa                ENUM('lectiva','productiva') NOT NULL DEFAULT 'lectiva',
    fecha_inicio_lectiva    DATE NULL,
    fecha_fin_lectiva       DATE NULL,
    fecha_inicio_productiva DATE NULL,
    fecha_fin_productiva    DATE NULL,
    fecha_fin_ficha         DATE NULL,
    estado               VARCHAR(50) NOT NULL DEFAULT 'Activa',
    activo               BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (programa_id) REFERENCES programas(id)  ON DELETE RESTRICT,
    FOREIGN KEY (jornada_id)  REFERENCES jornadas(id)   ON DELETE RESTRICT,
    FOREIGN KEY (ambiente_id) REFERENCES ambientes(id)  ON DELETE SET NULL,
    FOREIGN KEY (sede_id)     REFERENCES sedes(id)       ON DELETE SET NULL,
    FOREIGN KEY (lider_id) REFERENCES usuarios(id)      ON DELETE SET NULL
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
    jornada_id          INT NULL COMMENT 'Jornada preferente de la asignacion (28/07/2026). NULL = usa la del grupo.',
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
    FOREIGN KEY (jornada_id)        REFERENCES jornadas(id)     ON DELETE SET NULL,
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
-- 12b. ASIGNACION_RAP (modelo RAP directo — RF-42, RN-15 redefinida 21/07/2026)
-- Asignacion EXPLICITA de cada RAP al instructor dentro de la competencia.
-- Reemplaza la herencia automatica. RN-06: un RAP solo puede estar a cargo
-- de un instructor por grupo (ficha) — se valida en el service via la cadena
-- asignacion_rap -> asignacion_competencia -> asignacion -> ficha_id.
-- ============================================================
CREATE TABLE IF NOT EXISTS asignacion_rap (
    id                        INT AUTO_INCREMENT PRIMARY KEY,
    asignacion_competencia_id INT NOT NULL,
    rap_id                    INT NOT NULL,
    instructor_anterior_id    INT NULL COMMENT 'Trazabilidad RN-16 al reasignar el RAP',
    fecha_cambio              DATETIME NULL,
    activo                    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at                TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_asignacion_competencia_rap (asignacion_competencia_id, rap_id),
    FOREIGN KEY (asignacion_competencia_id) REFERENCES asignacion_competencia(id) ON DELETE CASCADE,
    FOREIGN KEY (rap_id)                    REFERENCES raps(id)                   ON DELETE RESTRICT,
    FOREIGN KEY (instructor_anterior_id)    REFERENCES instructores(id)           ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- 13. RAP_FICHA_SEGUIMIENTO (agregado 01/07/2026)
-- Ciclo de vida de cada RAP dentro de una ficha específica.
-- Granularidad: RAP-001 puede estar evaluado mientras RAP-002
-- sigue pendiente — nivel que la coordinadora necesita monitorear.
-- estado_aprobacion solo aplica cuando estado_evaluacion = 'evaluado'.
-- ============================================================
CREATE TABLE IF NOT EXISTS rap_ficha_seguimiento (
    id                        INT AUTO_INCREMENT PRIMARY KEY,
    asignacion_competencia_id INT NOT NULL,
    rap_id                    INT NOT NULL,
    fecha_inicio              DATE NULL,
    fecha_fin_programada      DATE NULL,
    estado_evaluacion         ENUM('pendiente_por_evaluar','evaluado')
                                NOT NULL DEFAULT 'pendiente_por_evaluar',
    estado_aprobacion         ENUM('aprobado','no_aprobado') NULL
                                COMMENT 'Solo aplica si estado_evaluacion = evaluado',
    activo                    BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (asignacion_competencia_id)
        REFERENCES asignacion_competencia(id) ON DELETE CASCADE,
    FOREIGN KEY (rap_id)
        REFERENCES raps(id) ON DELETE RESTRICT,
    UNIQUE KEY uq_rap_asignacion (asignacion_competencia_id, rap_id)
) ENGINE=InnoDB;

-- ============================================================
-- 14. LIDER_PROGRAMA
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
-- 15. TIPOS_ACTIVIDAD (agregado 01/07/2026)
-- Catálogo de 9 tipos de bloque registrables en el horario semanal.
-- suma_carga_horaria: si FALSE (ej. "Disponible"), el bloque NO
-- cuenta para el rango 20–40h semanal del instructor.
-- ============================================================
CREATE TABLE IF NOT EXISTS tipos_actividad (
    id                   INT AUTO_INCREMENT PRIMARY KEY,
    nombre               VARCHAR(60) NOT NULL,
    suma_carga_horaria   BOOLEAN NOT NULL DEFAULT TRUE
        COMMENT 'Si FALSE, no suma a las 20-40h semanales (ej. Disponible)',
    requiere_ficha       BOOLEAN NOT NULL DEFAULT FALSE,
    requiere_ambiente    BOOLEAN NOT NULL DEFAULT FALSE,
    requiere_competencia BOOLEAN NOT NULL DEFAULT FALSE,
    activo               BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

INSERT IGNORE INTO tipos_actividad
    (nombre,                          suma_carga_horaria, requiere_ficha, requiere_ambiente, requiere_competencia) VALUES
    ('Formación Titulada',            TRUE,  TRUE,  TRUE,  TRUE),
    ('Complementaria',                TRUE,  TRUE,  TRUE,  FALSE),
    ('Investigación',                 TRUE,  FALSE, FALSE, FALSE),
    ('Desarrollo Curricular',         TRUE,  FALSE, FALSE, FALSE),
    ('Etapa Práctica',                TRUE,  TRUE,  FALSE, FALSE),
    ('Aseguramiento de la Calidad',   TRUE,  FALSE, FALSE, FALSE),
    ('Actividades de Apoyo',          TRUE,  FALSE, FALSE, FALSE),
    ('Disponible',                    FALSE, FALSE, FALSE, FALSE),
    ('Otros',                         TRUE,  FALSE, FALSE, FALSE);

-- ============================================================
-- 16. HORARIOS
-- Un bloque = un período de clase de un instructor en una ficha.
-- jornada_id FK → jornadas  (reemplaza ENUM jornada)
-- competencia_id: qué competencia se imparte en este bloque.
-- semana: DATE del lunes de esa semana (para agrupar por semana).
-- tipo_actividad_id FK → tipos_actividad (agregado 01/07/2026)
-- ============================================================
CREATE TABLE IF NOT EXISTS horarios (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    ficha_id      INT NOT NULL,
    instructor_id INT NOT NULL,
    competencia_id INT NOT NULL,
    rap_id            INT NULL COMMENT 'RF-34 — RAP que se dicta en el bloque; valida RN-27 (RAP dentro del programa del grupo)',
    ambiente_id       INT NULL COMMENT 'NULL para fichas virtuales (RN-14)',
    dia_semana        TINYINT UNSIGNED NOT NULL COMMENT '1=Lunes ... 7=Domingo',
    hora_inicio       TIME NOT NULL,
    hora_fin          TIME NOT NULL,
    tipo_actividad_id INT NULL COMMENT 'FK → tipos_actividad; NULL = sin clasificar (01/07/2026)',
    jornada_id        INT NOT NULL,
    semana        DATE NOT NULL COMMENT 'Fecha del lunes de la semana',
    estado        ENUM('pendiente','aprobado','rechazado') NOT NULL DEFAULT 'pendiente' COMMENT 'Flujo de aprobacion de horarios',
    motivo_rechazo TEXT NULL COMMENT 'Motivo del rechazo cuando estado = rechazado',
    motivo_suspension TEXT NULL COMMENT 'RF-36 — se registra al desactivar un horario',
    activo        BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (ficha_id)         REFERENCES fichas(id)          ON DELETE CASCADE,
    FOREIGN KEY (instructor_id)    REFERENCES instructores(id)    ON DELETE CASCADE,
    FOREIGN KEY (competencia_id)   REFERENCES competencias(id)    ON DELETE RESTRICT,
    FOREIGN KEY (rap_id)           REFERENCES raps(id)            ON DELETE SET NULL,
    FOREIGN KEY (ambiente_id)      REFERENCES ambientes(id)       ON DELETE SET NULL,
    FOREIGN KEY (jornada_id)       REFERENCES jornadas(id)        ON DELETE RESTRICT,
    FOREIGN KEY (tipo_actividad_id) REFERENCES tipos_actividad(id) ON DELETE RESTRICT,
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
    tipo          VARCHAR(60)  NOT NULL COMMENT 'HORAS_EXCEDIDAS | HORAS_INSUFICIENTES | AMBIENTE_OCUPADO | ASIGNACION_PROVISIONAL | INSTRUCTOR_PLANTA_JORNADA_NOCTURNA | RAP_COMPARTIDO',
    mensaje       VARCHAR(255) NOT NULL,
    semana        DATE         NULL COMMENT 'Lunes de la semana afectada (alertas de carga); NULL en alertas estructurales',
    total_horas   DECIMAL(5,2) NULL COMMENT 'Solo alertas de carga',
    ficha_id      INT NULL COMMENT 'Alertas estructurales (p.ej. RAP_COMPARTIDO)',
    rap_id        INT NULL COMMENT 'Alertas estructurales (p.ej. RAP_COMPARTIDO)',
    atendida      BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'admin marca aceptada/omitida; visible mientras FALSE',
    leida         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_alerta_instructor (instructor_id),
    INDEX idx_alerta_atendida (atendida),
    INDEX idx_alerta_ficha_rap (ficha_id, rap_id),
    FOREIGN KEY (instructor_id) REFERENCES instructores(id) ON DELETE CASCADE,
    FOREIGN KEY (ficha_id)      REFERENCES fichas(id)       ON DELETE CASCADE,
    FOREIGN KEY (rap_id)        REFERENCES raps(id)         ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 17. TIPOS DE NOVEDAD INSTRUCTOR
-- Catalogo de tipos de novedad administrativa.
-- ============================================================
CREATE TABLE IF NOT EXISTS tipos_novedad_instructor (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(60) NOT NULL UNIQUE,
    descripcion TEXT NULL,
    activo      BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

INSERT IGNORE INTO tipos_novedad_instructor (id, nombre, descripcion) VALUES
(1, 'licencia', 'Licencia de maternidad/paternidad o remunerada'),
(2, 'incapacidad', 'Incapacidad medica'),
(3, 'comision', 'Comision de servicios'),
(4, 'calamidad', 'Calamidad domestica'),
(5, 'ceso_sindical', 'Ceso por actividades sindicales'),
(6, 'otro', 'Otra novedad no clasificada');

-- ============================================================
-- 18. INSTRUCTOR_NOVEDADES (RF-16)
-- Licencias, incapacidades y comisiones de instructores.
-- ============================================================
CREATE TABLE IF NOT EXISTS instructor_novedades (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    instructor_id    INT NOT NULL,
    tipo_novedad_id  INT NOT NULL,
    fecha_inicio     DATE NOT NULL,
    fecha_regreso    DATE NOT NULL,
    observacion      TEXT NULL,
    activo           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES instructores(id) ON DELETE CASCADE,
    FOREIGN KEY (tipo_novedad_id) REFERENCES tipos_novedad_instructor(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================================
-- 19. AMBIENTE_BLOQUEOS (RF-31)
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
-- 20. TIPOS DE NOVEDAD AMBIENTE
-- Catalogo de tipos de novedad para ambientes.
-- ============================================================
CREATE TABLE IF NOT EXISTS tipos_novedad_ambiente (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(60) NOT NULL UNIQUE,
    descripcion TEXT NULL,
    activo      BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

INSERT IGNORE INTO tipos_novedad_ambiente (id, nombre, descripcion) VALUES
(1, 'mantenimiento', 'Mantenimiento preventivo o correctivo'),
(2, 'cerrado_administrativo', 'Cierre por decision administrativa'),
(3, 'danos_infraestructura', 'Danos en infraestructura'),
(4, 'evento_especial', 'Evento especial programado'),
(5, 'otro', 'Otra novedad no clasificada');

-- ============================================================
-- 21. TIPOS DE NOVEDAD FICHA
-- Catalogo de tipos de novedad para fichas.
-- ============================================================
CREATE TABLE IF NOT EXISTS tipos_novedad_ficha (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(60) NOT NULL UNIQUE,
    descripcion TEXT NULL,
    activo      BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

INSERT IGNORE INTO tipos_novedad_ficha (id, nombre, descripcion) VALUES
(1, 'comite', 'Comite de evaluacion'),
(2, 'paro', 'Paro o movilizacion'),
(3, 'actividad_fuera', 'Actividad academica fuera del CDMC'),
(4, 'suspension_clases', 'Suspension temporal de clases'),
(5, 'otro', 'Otra novedad no clasificada');

-- ============================================================
-- 22. FICHA_NOVEDADES
-- Novedades administrativas de fichas (comites, paros, etc).
-- ============================================================
CREATE TABLE IF NOT EXISTS ficha_novedades (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    ficha_id         INT NOT NULL,
    tipo_novedad_id  INT NOT NULL,
    fecha_inicio     DATE NOT NULL,
    fecha_regreso    DATE NOT NULL,
    observacion      TEXT NULL,
    activo           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ficha_id) REFERENCES fichas(id) ON DELETE CASCADE,
    FOREIGN KEY (tipo_novedad_id) REFERENCES tipos_novedad_ficha(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================================
-- 23. NOTIFICACIONES (RF-38 al RF-40)
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


-- ============================================================
-- 20. AUDITORIA (Bitácora del sistema)
-- Registra todas las operaciones CRUD en tablas críticas.
-- datos_anteriores/datos_nuevos: JSON con el estado antes/después.
-- ============================================================
CREATE TABLE IF NOT EXISTS auditoria (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id       INT NULL COMMENT 'NULL si es acción del sistema/trigger',
    accion           ENUM('INSERT','UPDATE','DELETE') NOT NULL,
    tabla_afectada   VARCHAR(60) NOT NULL,
    registro_id      INT NULL COMMENT 'ID del registro afectado',
    datos_anteriores JSON NULL COMMENT 'Estado antes del cambio (UPDATE/DELETE)',
    datos_nuevos     JSON NULL COMMENT 'Estado después del cambio (INSERT/UPDATE)',
    ip               VARCHAR(45) NULL COMMENT 'IPv4 o IPv6 del cliente',
    user_agent       VARCHAR(255) NULL COMMENT 'Navegador/cliente HTTP',
    fecha            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_usuario_fecha (usuario_id, fecha),
    INDEX idx_tabla_fecha (tabla_afectada, fecha),
    INDEX idx_fecha (fecha)
) ENGINE=InnoDB;

-- ============================================================
-- 21. TRIGGERS DE AUDITORÍA
-- Generan registros automáticos en la tabla auditoria.
-- ============================================================

-- --- Instructores ---
DROP TRIGGER IF EXISTS tr_instructores_after_insert;
DELIMITER $$
CREATE TRIGGER tr_instructores_after_insert
AFTER INSERT ON instructores
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_nuevos)
    VALUES (@audit_usuario_id, 'INSERT', 'instructores', NEW.id,
            JSON_OBJECT('usuario_id', NEW.usuario_id, 'tipo_area', NEW.tipo_area, 'activo', NEW.activo));
END$$
DELIMITER ;

DROP TRIGGER IF EXISTS tr_instructores_after_update;
DELIMITER $$
CREATE TRIGGER tr_instructores_after_update
AFTER UPDATE ON instructores
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores, datos_nuevos)
    VALUES (@audit_usuario_id, 'UPDATE', 'instructores', NEW.id,
            JSON_OBJECT('usuario_id', OLD.usuario_id, 'tipo_area', OLD.tipo_area, 'activo', OLD.activo),
            JSON_OBJECT('usuario_id', NEW.usuario_id, 'tipo_area', NEW.tipo_area, 'activo', NEW.activo));
END$$
DELIMITER ;

DROP TRIGGER IF EXISTS tr_instructores_after_delete;
DELIMITER $$
CREATE TRIGGER tr_instructores_after_delete
AFTER DELETE ON instructores
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores)
    VALUES (@audit_usuario_id, 'DELETE', 'instructores', OLD.id,
            JSON_OBJECT('usuario_id', OLD.usuario_id, 'tipo_area', OLD.tipo_area, 'activo', OLD.activo));
END$$
DELIMITER ;

-- --- Usuarios ---
DROP TRIGGER IF EXISTS tr_usuarios_after_insert;
DELIMITER $$
CREATE TRIGGER tr_usuarios_after_insert
AFTER INSERT ON usuarios
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_nuevos)
    VALUES (@audit_usuario_id, 'INSERT', 'usuarios', NEW.id,
            JSON_OBJECT('nombre', NEW.nombre, 'email', NEW.email, 'activo', NEW.activo));
END$$
DELIMITER ;

DROP TRIGGER IF EXISTS tr_usuarios_after_update;
DELIMITER $$
CREATE TRIGGER tr_usuarios_after_update
AFTER UPDATE ON usuarios
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores, datos_nuevos)
    VALUES (@audit_usuario_id, 'UPDATE', 'usuarios', NEW.id,
            JSON_OBJECT('nombre', OLD.nombre, 'email', OLD.email, 'activo', OLD.activo),
            JSON_OBJECT('nombre', NEW.nombre, 'email', NEW.email, 'activo', NEW.activo));
END$$
DELIMITER ;

DROP TRIGGER IF EXISTS tr_usuarios_after_delete;
DELIMITER $$
CREATE TRIGGER tr_usuarios_after_delete
AFTER DELETE ON usuarios
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores)
    VALUES (@audit_usuario_id, 'DELETE', 'usuarios', OLD.id,
            JSON_OBJECT('nombre', OLD.nombre, 'email', OLD.email, 'activo', OLD.activo));
END$$
DELIMITER ;

-- --- Asignacion ---
DROP TRIGGER IF EXISTS tr_asignacion_after_insert;
DELIMITER $$
CREATE TRIGGER tr_asignacion_after_insert
AFTER INSERT ON asignacion
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_nuevos)
    VALUES (@audit_usuario_id, 'INSERT', 'asignacion', NEW.id,
            JSON_OBJECT('instructor_id', NEW.instructor_id, 'ficha_id', NEW.ficha_id, 'es_lider_ficha', NEW.es_lider_ficha, 'es_provisional', NEW.es_provisional, 'activo', NEW.activo));
END$$
DELIMITER ;

DROP TRIGGER IF EXISTS tr_asignacion_after_update;
DELIMITER $$
CREATE TRIGGER tr_asignacion_after_update
AFTER UPDATE ON asignacion
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores, datos_nuevos)
    VALUES (@audit_usuario_id, 'UPDATE', 'asignacion', NEW.id,
            JSON_OBJECT('instructor_id', OLD.instructor_id, 'ficha_id', OLD.ficha_id, 'es_lider_ficha', OLD.es_lider_ficha, 'es_provisional', OLD.es_provisional, 'activo', OLD.activo),
            JSON_OBJECT('instructor_id', NEW.instructor_id, 'ficha_id', NEW.ficha_id, 'es_lider_ficha', NEW.es_lider_ficha, 'es_provisional', NEW.es_provisional, 'activo', NEW.activo));
END$$
DELIMITER ;

DROP TRIGGER IF EXISTS tr_asignacion_after_delete;
DELIMITER $$
CREATE TRIGGER tr_asignacion_after_delete
AFTER DELETE ON asignacion
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores)
    VALUES (@audit_usuario_id, 'DELETE', 'asignacion', OLD.id,
            JSON_OBJECT('instructor_id', OLD.instructor_id, 'ficha_id', OLD.ficha_id, 'es_lider_ficha', OLD.es_lider_ficha, 'es_provisional', OLD.es_provisional, 'activo', OLD.activo));
END$$
DELIMITER ;

-- --- Horarios ---
DROP TRIGGER IF EXISTS tr_horarios_after_insert;
DELIMITER $$
CREATE TRIGGER tr_horarios_after_insert
AFTER INSERT ON horarios
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_nuevos)
    VALUES (@audit_usuario_id, 'INSERT', 'horarios', NEW.id,
            JSON_OBJECT('ficha_id', NEW.ficha_id, 'instructor_id', NEW.instructor_id, 'competencia_id', NEW.competencia_id, 'ambiente_id', NEW.ambiente_id, 'dia_semana', NEW.dia_semana, 'hora_inicio', NEW.hora_inicio, 'hora_fin', NEW.hora_fin, 'jornada_id', NEW.jornada_id, 'semana', NEW.semana, 'activo', NEW.activo));
END$$
DELIMITER ;

DROP TRIGGER IF EXISTS tr_horarios_after_update;
DELIMITER $$
CREATE TRIGGER tr_horarios_after_update
AFTER UPDATE ON horarios
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores, datos_nuevos)
    VALUES (@audit_usuario_id, 'UPDATE', 'horarios', NEW.id,
            JSON_OBJECT('ficha_id', OLD.ficha_id, 'instructor_id', OLD.instructor_id, 'competencia_id', OLD.competencia_id, 'ambiente_id', OLD.ambiente_id, 'dia_semana', OLD.dia_semana, 'hora_inicio', OLD.hora_inicio, 'hora_fin', OLD.hora_fin, 'jornada_id', OLD.jornada_id, 'semana', OLD.semana, 'activo', OLD.activo, 'motivo_suspension', OLD.motivo_suspension),
            JSON_OBJECT('ficha_id', NEW.ficha_id, 'instructor_id', NEW.instructor_id, 'competencia_id', NEW.competencia_id, 'ambiente_id', NEW.ambiente_id, 'dia_semana', NEW.dia_semana, 'hora_inicio', NEW.hora_inicio, 'hora_fin', NEW.hora_fin, 'jornada_id', NEW.jornada_id, 'semana', NEW.semana, 'activo', NEW.activo, 'motivo_suspension', NEW.motivo_suspension));
END$$
DELIMITER ;

DROP TRIGGER IF EXISTS tr_horarios_after_delete;
DELIMITER $$
CREATE TRIGGER tr_horarios_after_delete
AFTER DELETE ON horarios
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores)
    VALUES (@audit_usuario_id, 'DELETE', 'horarios', OLD.id,
            JSON_OBJECT('ficha_id', OLD.ficha_id, 'instructor_id', OLD.instructor_id, 'competencia_id', OLD.competencia_id, 'ambiente_id', OLD.ambiente_id, 'dia_semana', OLD.dia_semana, 'hora_inicio', OLD.hora_inicio, 'hora_fin', OLD.hora_fin, 'jornada_id', OLD.jornada_id, 'semana', OLD.semana, 'activo', OLD.activo));
END$$
DELIMITER ;

-- --- Fichas ---
DROP TRIGGER IF EXISTS tr_fichas_after_insert;
DELIMITER $$
CREATE TRIGGER tr_fichas_after_insert
AFTER INSERT ON fichas
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_nuevos)
    VALUES (@audit_usuario_id, 'INSERT', 'fichas', NEW.id,
            JSON_OBJECT('numero_ficha', NEW.numero_ficha, 'programa_id', NEW.programa_id, 'jornada_id', NEW.jornada_id, 'ambiente_id', NEW.ambiente_id, 'etapa', NEW.etapa, 'estado', NEW.estado, 'activo', NEW.activo));
END$$
DELIMITER ;

DROP TRIGGER IF EXISTS tr_fichas_after_update;
DELIMITER $$
CREATE TRIGGER tr_fichas_after_update
AFTER UPDATE ON fichas
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores, datos_nuevos)
    VALUES (@audit_usuario_id, 'UPDATE', 'fichas', NEW.id,
            JSON_OBJECT('numero_ficha', OLD.numero_ficha, 'programa_id', OLD.programa_id, 'jornada_id', OLD.jornada_id, 'ambiente_id', OLD.ambiente_id, 'etapa', OLD.etapa, 'estado', OLD.estado, 'activo', OLD.activo),
            JSON_OBJECT('numero_ficha', NEW.numero_ficha, 'programa_id', NEW.programa_id, 'jornada_id', NEW.jornada_id, 'ambiente_id', NEW.ambiente_id, 'etapa', NEW.etapa, 'estado', NEW.estado, 'activo', NEW.activo));
END$$
DELIMITER ;

DROP TRIGGER IF EXISTS tr_fichas_after_delete;
DELIMITER $$
CREATE TRIGGER tr_fichas_after_delete
AFTER DELETE ON fichas
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores)
    VALUES (@audit_usuario_id, 'DELETE', 'fichas', OLD.id,
            JSON_OBJECT('numero_ficha', OLD.numero_ficha, 'programa_id', OLD.programa_id, 'jornada_id', OLD.jornada_id, 'ambiente_id', OLD.ambiente_id, 'etapa', OLD.etapa, 'estado', OLD.estado, 'activo', OLD.activo));
END$$
DELIMITER ;

-- --- Ambientes ---
DROP TRIGGER IF EXISTS tr_ambientes_after_insert;
DELIMITER $$
CREATE TRIGGER tr_ambientes_after_insert
AFTER INSERT ON ambientes
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_nuevos)
    VALUES (@audit_usuario_id, 'INSERT', 'ambientes', NEW.id,
            JSON_OBJECT('nombre', NEW.nombre, 'tipo', NEW.tipo, 'capacidad', NEW.capacidad, 'area_id', NEW.area_id, 'activo', NEW.activo));
END$$
DELIMITER ;

DROP TRIGGER IF EXISTS tr_ambientes_after_update;
DELIMITER $$
CREATE TRIGGER tr_ambientes_after_update
AFTER UPDATE ON ambientes
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores, datos_nuevos)
    VALUES (@audit_usuario_id, 'UPDATE', 'ambientes', NEW.id,
            JSON_OBJECT('nombre', OLD.nombre, 'tipo', OLD.tipo, 'capacidad', OLD.capacidad, 'area_id', OLD.area_id, 'activo', OLD.activo),
            JSON_OBJECT('nombre', NEW.nombre, 'tipo', NEW.tipo, 'capacidad', NEW.capacidad, 'area_id', NEW.area_id, 'activo', NEW.activo));
END$$
DELIMITER ;

DROP TRIGGER IF EXISTS tr_ambientes_after_delete;
DELIMITER $$
CREATE TRIGGER tr_ambientes_after_delete
AFTER DELETE ON ambientes
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores)
    VALUES (@audit_usuario_id, 'DELETE', 'ambientes', OLD.id,
            JSON_OBJECT('nombre', OLD.nombre, 'tipo', OLD.tipo, 'capacidad', OLD.capacidad, 'area_id', OLD.area_id, 'activo', OLD.activo));
END$$
DELIMITER ;

-- --- Asignacion Competencia ---
DROP TRIGGER IF EXISTS tr_asignacion_competencia_after_insert;
DELIMITER $$
CREATE TRIGGER tr_asignacion_competencia_after_insert
AFTER INSERT ON asignacion_competencia
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_nuevos)
    VALUES (@audit_usuario_id, 'INSERT', 'asignacion_competencia', NEW.id,
            JSON_OBJECT('asignacion_id', NEW.asignacion_id, 'competencia_id', NEW.competencia_id, 'instructor_anterior_id', NEW.instructor_anterior_id, 'fecha_cambio', NEW.fecha_cambio, 'ambiente_excepcion_id', NEW.ambiente_excepcion_id, 'activo', NEW.activo));
END$$
DELIMITER ;

DROP TRIGGER IF EXISTS tr_asignacion_competencia_after_update;
DELIMITER $$
CREATE TRIGGER tr_asignacion_competencia_after_update
AFTER UPDATE ON asignacion_competencia
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores, datos_nuevos)
    VALUES (@audit_usuario_id, 'UPDATE', 'asignacion_competencia', NEW.id,
            JSON_OBJECT('asignacion_id', OLD.asignacion_id, 'competencia_id', OLD.competencia_id, 'instructor_anterior_id', OLD.instructor_anterior_id, 'fecha_cambio', OLD.fecha_cambio, 'ambiente_excepcion_id', OLD.ambiente_excepcion_id, 'activo', OLD.activo),
            JSON_OBJECT('asignacion_id', NEW.asignacion_id, 'competencia_id', NEW.competencia_id, 'instructor_anterior_id', NEW.instructor_anterior_id, 'fecha_cambio', NEW.fecha_cambio, 'ambiente_excepcion_id', NEW.ambiente_excepcion_id, 'activo', NEW.activo));
END$$
DELIMITER ;

DROP TRIGGER IF EXISTS tr_asignacion_competencia_after_delete;
DELIMITER $$
CREATE TRIGGER tr_asignacion_competencia_after_delete
AFTER DELETE ON asignacion_competencia
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores)
    VALUES (@audit_usuario_id, 'DELETE', 'asignacion_competencia', OLD.id,
            JSON_OBJECT('asignacion_id', OLD.asignacion_id, 'competencia_id', OLD.competencia_id, 'instructor_anterior_id', OLD.instructor_anterior_id, 'fecha_cambio', OLD.fecha_cambio, 'ambiente_excepcion_id', OLD.ambiente_excepcion_id, 'activo', OLD.activo));
END$$
DELIMITER ;

-- --- Instructor Novedades ---
DROP TRIGGER IF EXISTS tr_instructor_novedades_after_insert;
DELIMITER $$
CREATE TRIGGER tr_instructor_novedades_after_insert
AFTER INSERT ON instructor_novedades
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_nuevos)
    VALUES (@audit_usuario_id, 'INSERT', 'instructor_novedades', NEW.id,
            JSON_OBJECT('instructor_id', NEW.instructor_id, 'tipo_novedad_id', NEW.tipo_novedad_id, 'fecha_inicio', NEW.fecha_inicio, 'fecha_regreso', NEW.fecha_regreso, 'activo', NEW.activo));
END$$
DELIMITER ;

DROP TRIGGER IF EXISTS tr_instructor_novedades_after_update;
DELIMITER $$
CREATE TRIGGER tr_instructor_novedades_after_update
AFTER UPDATE ON instructor_novedades
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores, datos_nuevos)
    VALUES (@audit_usuario_id, 'UPDATE', 'instructor_novedades', NEW.id,
            JSON_OBJECT('instructor_id', OLD.instructor_id, 'tipo_novedad_id', OLD.tipo_novedad_id, 'fecha_inicio', OLD.fecha_inicio, 'fecha_regreso', OLD.fecha_regreso, 'activo', OLD.activo),
            JSON_OBJECT('instructor_id', NEW.instructor_id, 'tipo_novedad_id', NEW.tipo_novedad_id, 'fecha_inicio', NEW.fecha_inicio, 'fecha_regreso', NEW.fecha_regreso, 'activo', NEW.activo));
END$$
DELIMITER ;

DROP TRIGGER IF EXISTS tr_instructor_novedades_after_delete;
DELIMITER $$
CREATE TRIGGER tr_instructor_novedades_after_delete
AFTER DELETE ON instructor_novedades
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores)
    VALUES (@audit_usuario_id, 'DELETE', 'instructor_novedades', OLD.id,
            JSON_OBJECT('instructor_id', OLD.instructor_id, 'tipo_novedad_id', OLD.tipo_novedad_id, 'fecha_inicio', OLD.fecha_inicio, 'fecha_regreso', OLD.fecha_regreso, 'activo', OLD.activo));
END$$
DELIMITER ;

-- ============================================================
-- 22. TRIGGERS DE VALIDACIÓN
-- Bloquean operaciones que violan reglas de negocio.
-- ============================================================

-- --- Validar solapamiento de horarios (RN-04) ---
DROP TRIGGER IF EXISTS tr_validar_solapamiento_before_insert;
DELIMITER $$
CREATE TRIGGER tr_validar_solapamiento_before_insert
BEFORE INSERT ON horarios
FOR EACH ROW
BEGIN
    DECLARE overlap_count INT;
    SELECT COUNT(*) INTO overlap_count
    FROM horarios
    WHERE instructor_id = NEW.instructor_id
      AND dia_semana = NEW.dia_semana
      AND semana = NEW.semana
      AND activo = TRUE
      AND hora_inicio < NEW.hora_fin
      AND hora_fin > NEW.hora_inicio;
    IF overlap_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'RN-04: El instructor ya tiene un horario en ese día y franja horaria';
    END IF;
END$$
DELIMITER ;

DROP TRIGGER IF EXISTS tr_validar_solapamiento_before_update;
DELIMITER $$
CREATE TRIGGER tr_validar_solapamiento_before_update
BEFORE UPDATE ON horarios
FOR EACH ROW
BEGIN
    DECLARE overlap_count INT;
    SELECT COUNT(*) INTO overlap_count
    FROM horarios
    WHERE instructor_id = NEW.instructor_id
      AND dia_semana = NEW.dia_semana
      AND semana = NEW.semana
      AND activo = TRUE
      AND id != NEW.id
      AND hora_inicio < NEW.hora_fin
      AND hora_fin > NEW.hora_inicio;
    IF overlap_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'RN-04: El instructor ya tiene un horario en ese día y franja horaria';
    END IF;
END$$
DELIMITER ;

-- --- RN-05: Ambiente ocupado es ALERTA SOFT, no bloqueo (19/08/2026) ---
-- Los triggers tr_validar_ambiente_ocupado_before_insert/update fueron
-- ELIMINADOS: hacian SIGNAL (hard block) y contradecian RN-05, que es una
-- alerta soft ("los talleres pueden albergar varios grupos"). El aviso lo
-- resuelve horario.service (alerta_ambiente_ocupado), sin impedir el registro.
-- Se conservan los DROP para que una BD nueva no tenga estos triggers.
DROP TRIGGER IF EXISTS tr_validar_ambiente_ocupado_before_insert;
DROP TRIGGER IF EXISTS tr_validar_ambiente_ocupado_before_update;

-- ============================================================
-- 23. PROCEDIMIENTOS ALMACENADOS
-- ============================================================

-- --- sp_crear_instructor: Crea usuario + instructor en transacción ---
DROP PROCEDURE IF EXISTS sp_crear_instructor;
DELIMITER $$
CREATE PROCEDURE sp_crear_instructor(
    IN p_nombre VARCHAR(100),
    IN p_email VARCHAR(100),
    IN p_password VARCHAR(255),
    IN p_tipo_area VARCHAR(20),
    OUT p_usuario_id INT,
    OUT p_instructor_id INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    INSERT INTO usuarios (nombre, email, password)
    VALUES (p_nombre, p_email, p_password);
    SET p_usuario_id = LAST_INSERT_ID();

    INSERT INTO instructores (usuario_id, tipo_area)
    VALUES (p_usuario_id, p_tipo_area);
    SET p_instructor_id = LAST_INSERT_ID();

    INSERT INTO usuario_roles (usuario_id, rol_id)
    VALUES (p_usuario_id, 4); -- ID 4 = Instructor (corregido 06/07/2026)

    COMMIT;
END$$
DELIMITER ;

-- --- sp_asignar_competencias: Asigna competencias a una asignación ---
DROP PROCEDURE IF EXISTS sp_asignar_competencias;
DELIMITER $$
CREATE PROCEDURE sp_asignar_competencias(
    IN p_instructor_id INT,
    IN p_ficha_id INT,
    IN p_competencia_ids JSON,
    IN p_es_lider_ficha BOOLEAN,
    OUT p_asignacion_id INT
)
BEGIN
    DECLARE v_i INT DEFAULT 0;
    DECLARE v_count INT;
    DECLARE v_comp_id INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    INSERT INTO asignacion (instructor_id, ficha_id, es_lider_ficha, fecha_asignacion)
    VALUES (p_instructor_id, p_ficha_id, p_es_lider_ficha, CURDATE());
    SET p_asignacion_id = LAST_INSERT_ID();

    SET v_count = JSON_LENGTH(p_competencia_ids);

    WHILE v_i < v_count DO
        SET v_comp_id = JSON_EXTRACT(p_competencia_ids, CONCAT('$[', v_i, ']'));
        INSERT INTO asignacion_competencia (asignacion_id, competencia_id)
        VALUES (p_asignacion_id, v_comp_id);
        SET v_i = v_i + 1;
    END WHILE;

    COMMIT;
END$$
DELIMITER ;

-- --- sp_registrar_novedad: Registra novedad + desactiva horarios ---
DROP PROCEDURE IF EXISTS sp_registrar_novedad;
DELIMITER $$
CREATE PROCEDURE sp_registrar_novedad(
    IN p_instructor_id INT,
    IN p_tipo_novedad_id INT,
    IN p_fecha_inicio DATE,
    IN p_fecha_regreso DATE,
    IN p_observacion TEXT,
    OUT p_novedad_id INT
)
BEGIN
    DECLARE v_tipo_nombre VARCHAR(100) DEFAULT '';
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    SELECT nombre INTO v_tipo_nombre FROM tipos_novedad_instructor WHERE id = p_tipo_novedad_id LIMIT 1;

    INSERT INTO instructor_novedades (instructor_id, tipo_novedad_id, fecha_inicio, fecha_regreso, observacion)
    VALUES (p_instructor_id, p_tipo_novedad_id, p_fecha_inicio, p_fecha_regreso, p_observacion);
    SET p_novedad_id = LAST_INSERT_ID();

    UPDATE horarios
    SET activo = FALSE, motivo_suspension = CONCAT('Novedad: ', v_tipo_nombre)
    WHERE instructor_id = p_instructor_id
      AND activo = TRUE
      AND semana >= p_fecha_inicio
      AND semana <= p_fecha_regreso;

    COMMIT;
END$$
DELIMITER ;

-- --- sp_desactivar_asignacion: Desactiva asignación + competencias + trazabilidad ---
DROP PROCEDURE IF EXISTS sp_desactivar_asignacion;
DELIMITER $$
CREATE PROCEDURE sp_desactivar_asignacion(
    IN p_asignacion_id INT,
    IN p_motivo TEXT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    UPDATE asignacion_competencia
    SET activo = FALSE, observacion = COALESCE(observacion, p_motivo)
    WHERE asignacion_id = p_asignacion_id AND activo = TRUE;

    UPDATE asignacion
    SET activo = FALSE
    WHERE id = p_asignacion_id;

    UPDATE horarios
    SET activo = FALSE, motivo_suspension = COALESCE(motivo_suspension, p_motivo)
    WHERE ficha_id = (SELECT ficha_id FROM asignacion WHERE id = p_asignacion_id)
      AND instructor_id = (SELECT instructor_id FROM asignacion WHERE id = p_asignacion_id)
      AND activo = TRUE;

    COMMIT;
END$$
DELIMITER ;

-- --- sp_finalizar_ficha: Finaliza ficha + desactiva asignaciones ---
DROP PROCEDURE IF EXISTS sp_finalizar_ficha;
DELIMITER $$
CREATE PROCEDURE sp_finalizar_ficha(
    IN p_ficha_id INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    UPDATE fichas
    SET estado = 'Finalizada', fecha_fin_ficha = CURDATE()
    WHERE id = p_ficha_id;

    UPDATE asignacion
    SET activo = FALSE
    WHERE ficha_id = p_ficha_id AND activo = TRUE;

    UPDATE asignacion_competencia ac
    JOIN asignacion a ON ac.asignacion_id = a.id
    SET ac.activo = FALSE
    WHERE a.ficha_id = p_ficha_id AND ac.activo = TRUE;

    UPDATE horarios
    SET activo = FALSE
    WHERE ficha_id = p_ficha_id AND activo = TRUE;

    COMMIT;
END$$
DELIMITER ;

-- ============================================================
-- 24. VISTAS
-- Consultas predefinidas para reportes y dashboards.
-- ============================================================

-- --- vw_carga_horaria_instructor: Horas semanales por instructor ---
CREATE OR REPLACE VIEW vw_carga_horaria_instructor AS
SELECT
    i.id AS instructor_id,
    u.nombre AS instructor_nombre,
    i.tipo_area,
    h.semana,
    COUNT(DISTINCT h.dia_semana) AS dias_trabajados,
    COALESCE(SUM(TIMESTAMPDIFF(MINUTE, h.hora_inicio, h.hora_fin)) / 60, 0) AS total_horas_semana,
    COUNT(DISTINCT h.ficha_id) AS fichas_asignadas,
    i.activo AS instructor_activo
FROM instructores i
JOIN usuarios u ON i.usuario_id = u.id
LEFT JOIN horarios h ON h.instructor_id = i.id AND h.activo = TRUE
GROUP BY i.id, u.nombre, i.tipo_area, h.semana, i.activo;

-- --- vw_ambientes_ocupados: Ambientes con horarios activos ---
CREATE OR REPLACE VIEW vw_ambientes_ocupados AS
SELECT
    ab.id AS ambiente_id,
    ab.nombre AS ambiente_nombre,
    ab.tipo AS ambiente_tipo,
    ab.capacidad,
    h.dia_semana,
    j.nombre AS jornada_nombre,
    h.hora_inicio,
    h.hora_fin,
    h.ficha_id,
    f.numero_ficha,
    h.instructor_id,
    u.nombre AS instructor_nombre,
    h.semana
FROM ambientes ab
JOIN horarios h ON h.ambiente_id = ab.id AND h.activo = TRUE
JOIN jornadas j ON h.jornada_id = j.id
JOIN fichas f ON h.ficha_id = f.id
JOIN instructores i ON h.instructor_id = i.id
JOIN usuarios u ON i.usuario_id = u.id
WHERE ab.activo = TRUE;

-- --- vw_asignaciones_activas: Asignaciones activas con detalle ---
CREATE OR REPLACE VIEW vw_asignaciones_activas AS
SELECT
    a.id AS asignacion_id,
    u.nombre AS instructor_nombre,
    f.numero_ficha,
    p.nombre AS programa_nombre,
    p.tipo_linea,
    c.nombre AS competencia_nombre,
    COALESCE(ab.nombre, 'Sin asignar') AS ambiente_nombre,
    j.nombre AS jornada_nombre,
    a.es_lider_ficha,
    a.es_provisional,
    a.fecha_asignacion,
    a.activo
FROM asignacion a
JOIN instructores i ON a.instructor_id = i.id
JOIN usuarios u ON i.usuario_id = u.id
JOIN fichas f ON a.ficha_id = f.id
JOIN programas p ON f.programa_id = p.id
JOIN asignacion_competencia ac ON ac.asignacion_id = a.id AND ac.activo = TRUE
JOIN competencias c ON ac.competencia_id = c.id
JOIN jornadas j ON f.jornada_id = j.id
LEFT JOIN ambientes ab ON COALESCE(ac.ambiente_excepcion_id, f.ambiente_id) = ab.id
WHERE a.activo = TRUE;

-- --- vw_instructores_con_novedad: Instructores con novedad vigente ---
CREATE OR REPLACE VIEW vw_instructores_con_novedad AS
SELECT
    i.id AS instructor_id,
    u.nombre AS instructor_nombre,
    u.email AS instructor_email,
    tni.nombre AS tipo_novedad,
    n.fecha_inicio,
    n.fecha_regreso,
    n.observacion,
    DATEDIFF(n.fecha_regreso, n.fecha_inicio) + 1 AS dias_novedad,
    n.activo AS novedad_activa
FROM instructores i
JOIN usuarios u ON i.usuario_id = u.id
JOIN instructor_novedades n ON n.instructor_id = i.id
JOIN tipos_novedad_instructor tni ON n.tipo_novedad_id = tni.id
WHERE n.activo = TRUE
  AND n.fecha_inicio <= CURDATE()
  AND n.fecha_regreso >= CURDATE();

-- --- vw_alertas_pendientes: Alertas no atendidas con prioridad ---
CREATE OR REPLACE VIEW vw_alertas_pendientes AS
SELECT
    al.id AS alerta_id,
    u.nombre AS instructor_nombre,
    al.tipo AS alerta_tipo,
    al.mensaje,
    al.semana,
    al.total_horas,
    al.atendida,
    al.leida,
    al.created_at,
    CASE
        WHEN al.tipo = 'HORAS_EXCEDIDAS' THEN 'alta'
        WHEN al.tipo = 'INSTRUCTOR_PLANTA_JORNADA_NOCTURNA' THEN 'alta'
        WHEN al.tipo = 'AMBIENTE_OCUPADO' THEN 'media'
        ELSE 'baja'
    END AS prioridad
FROM alertas al
JOIN instructores i ON al.instructor_id = i.id
JOIN usuarios u ON i.usuario_id = u.id
WHERE al.atendida = FALSE
ORDER BY
    FIELD(CASE
        WHEN al.tipo = 'HORAS_EXCEDIDAS' THEN 'alta'
        WHEN al.tipo = 'INSTRUCTOR_PLANTA_JORNADA_NOCTURNA' THEN 'alta'
        WHEN al.tipo = 'AMBIENTE_OCUPADO' THEN 'media'
        ELSE 'baja'
    END, 'alta', 'media', 'baja'),
    al.created_at DESC;

-- ============================================================
-- FIN DEL SCHEMA (v5 → 27 tablas a partir de 01/07/2026)
-- Tablas nuevas: tipos_actividad (26), rap_ficha_seguimiento (27)
-- ============================================================

-- ============================================================
-- 28. PASSWORD RESET TOKENS (recuperar contrasena)
-- token: hex(32) = 64 chars, expira en 1 hora, un solo uso
-- ============================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id   INT NOT NULL,
    token        VARCHAR(64) NOT NULL UNIQUE,
    expira_en    DATETIME NOT NULL,
    usado        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 25. UTF-8 COLLATION
-- Todas las tablas en utf8mb4_general_ci para caracteres especiales
-- ============================================================

ALTER DATABASE conIns CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

ALTER TABLE jornadas CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE roles CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE areas CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE usuarios CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE usuario_roles CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE instructores CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE programas CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE competencias CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE raps CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE ambientes CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE fichas CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE asignacion CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE asignacion_competencia CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE lider_programa CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE instructor_competencias_habilitadas CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE horarios CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE alertas CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE instructor_novedades CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE ambiente_bloqueos CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE notificaciones CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE tipos_actividad CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE rap_ficha_seguimiento CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
ALTER TABLE auditoria CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;


-- ============================================================
-- 29. COBERTURA DE AUDITORIA EXTENDIDA (25/08/2026) — ver migracion_auditoria_cobertura_2026-08-25.sql
-- ============================================================
-- ============================================================
-- COBERTURA DE AUDITORIA EXTENDIDA (25/08/2026)
-- Triggers de auditoria para las tablas operativas que faltaban (RF-59/RNF-24).
-- Usan @audit_usuario_id (seteado por el backend en la conexion del DML).
-- Idempotente: DROP TRIGGER IF EXISTS antes de cada CREATE.
-- ============================================================

-- --- usuario_roles ---
DROP TRIGGER IF EXISTS tr_usuario_roles_after_insert;
DELIMITER $$
CREATE TRIGGER tr_usuario_roles_after_insert AFTER INSERT ON usuario_roles
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_nuevos)
    VALUES (@audit_usuario_id, 'INSERT', 'usuario_roles', NEW.usuario_id, JSON_OBJECT('usuario_id', NEW.usuario_id, 'rol_id', NEW.rol_id));
END$$
DELIMITER ;
DROP TRIGGER IF EXISTS tr_usuario_roles_after_update;
DELIMITER $$
CREATE TRIGGER tr_usuario_roles_after_update AFTER UPDATE ON usuario_roles
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores, datos_nuevos)
    VALUES (@audit_usuario_id, 'UPDATE', 'usuario_roles', NEW.usuario_id, JSON_OBJECT('usuario_id', OLD.usuario_id, 'rol_id', OLD.rol_id), JSON_OBJECT('usuario_id', NEW.usuario_id, 'rol_id', NEW.rol_id));
END$$
DELIMITER ;
DROP TRIGGER IF EXISTS tr_usuario_roles_after_delete;
DELIMITER $$
CREATE TRIGGER tr_usuario_roles_after_delete AFTER DELETE ON usuario_roles
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores)
    VALUES (@audit_usuario_id, 'DELETE', 'usuario_roles', OLD.usuario_id, JSON_OBJECT('usuario_id', OLD.usuario_id, 'rol_id', OLD.rol_id));
END$$
DELIMITER ;

-- --- programas ---
DROP TRIGGER IF EXISTS tr_programas_after_insert;
DELIMITER $$
CREATE TRIGGER tr_programas_after_insert AFTER INSERT ON programas
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_nuevos)
    VALUES (@audit_usuario_id, 'INSERT', 'programas', NEW.id, JSON_OBJECT('codigo', NEW.codigo, 'nombre', NEW.nombre, 'nivel', NEW.nivel, 'area_id', NEW.area_id, 'tipo_linea', NEW.tipo_linea, 'tipo_area', NEW.tipo_area, 'tipo_formacion', NEW.tipo_formacion, 'modalidad', NEW.modalidad, 'activo', NEW.activo));
END$$
DELIMITER ;
DROP TRIGGER IF EXISTS tr_programas_after_update;
DELIMITER $$
CREATE TRIGGER tr_programas_after_update AFTER UPDATE ON programas
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores, datos_nuevos)
    VALUES (@audit_usuario_id, 'UPDATE', 'programas', NEW.id, JSON_OBJECT('codigo', OLD.codigo, 'nombre', OLD.nombre, 'nivel', OLD.nivel, 'area_id', OLD.area_id, 'tipo_linea', OLD.tipo_linea, 'tipo_area', OLD.tipo_area, 'tipo_formacion', OLD.tipo_formacion, 'modalidad', OLD.modalidad, 'activo', OLD.activo), JSON_OBJECT('codigo', NEW.codigo, 'nombre', NEW.nombre, 'nivel', NEW.nivel, 'area_id', NEW.area_id, 'tipo_linea', NEW.tipo_linea, 'tipo_area', NEW.tipo_area, 'tipo_formacion', NEW.tipo_formacion, 'modalidad', NEW.modalidad, 'activo', NEW.activo));
END$$
DELIMITER ;
DROP TRIGGER IF EXISTS tr_programas_after_delete;
DELIMITER $$
CREATE TRIGGER tr_programas_after_delete AFTER DELETE ON programas
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores)
    VALUES (@audit_usuario_id, 'DELETE', 'programas', OLD.id, JSON_OBJECT('codigo', OLD.codigo, 'nombre', OLD.nombre, 'nivel', OLD.nivel, 'area_id', OLD.area_id, 'tipo_linea', OLD.tipo_linea, 'tipo_area', OLD.tipo_area, 'tipo_formacion', OLD.tipo_formacion, 'modalidad', OLD.modalidad, 'activo', OLD.activo));
END$$
DELIMITER ;

-- --- competencias ---
DROP TRIGGER IF EXISTS tr_competencias_after_insert;
DELIMITER $$
CREATE TRIGGER tr_competencias_after_insert AFTER INSERT ON competencias
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_nuevos)
    VALUES (@audit_usuario_id, 'INSERT', 'competencias', NEW.id, JSON_OBJECT('nombre', NEW.nombre, 'codigo', NEW.codigo, 'programa_id', NEW.programa_id, 'activo', NEW.activo));
END$$
DELIMITER ;
DROP TRIGGER IF EXISTS tr_competencias_after_update;
DELIMITER $$
CREATE TRIGGER tr_competencias_after_update AFTER UPDATE ON competencias
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores, datos_nuevos)
    VALUES (@audit_usuario_id, 'UPDATE', 'competencias', NEW.id, JSON_OBJECT('nombre', OLD.nombre, 'codigo', OLD.codigo, 'programa_id', OLD.programa_id, 'activo', OLD.activo), JSON_OBJECT('nombre', NEW.nombre, 'codigo', NEW.codigo, 'programa_id', NEW.programa_id, 'activo', NEW.activo));
END$$
DELIMITER ;
DROP TRIGGER IF EXISTS tr_competencias_after_delete;
DELIMITER $$
CREATE TRIGGER tr_competencias_after_delete AFTER DELETE ON competencias
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores)
    VALUES (@audit_usuario_id, 'DELETE', 'competencias', OLD.id, JSON_OBJECT('nombre', OLD.nombre, 'codigo', OLD.codigo, 'programa_id', OLD.programa_id, 'activo', OLD.activo));
END$$
DELIMITER ;

-- --- raps ---
DROP TRIGGER IF EXISTS tr_raps_after_insert;
DELIMITER $$
CREATE TRIGGER tr_raps_after_insert AFTER INSERT ON raps
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_nuevos)
    VALUES (@audit_usuario_id, 'INSERT', 'raps', NEW.id, JSON_OBJECT('nombre', NEW.nombre, 'codigo', NEW.codigo, 'competencia_id', NEW.competencia_id, 'fecha_limite', NEW.fecha_limite, 'activo', NEW.activo));
END$$
DELIMITER ;
DROP TRIGGER IF EXISTS tr_raps_after_update;
DELIMITER $$
CREATE TRIGGER tr_raps_after_update AFTER UPDATE ON raps
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores, datos_nuevos)
    VALUES (@audit_usuario_id, 'UPDATE', 'raps', NEW.id, JSON_OBJECT('nombre', OLD.nombre, 'codigo', OLD.codigo, 'competencia_id', OLD.competencia_id, 'fecha_limite', OLD.fecha_limite, 'activo', OLD.activo), JSON_OBJECT('nombre', NEW.nombre, 'codigo', NEW.codigo, 'competencia_id', NEW.competencia_id, 'fecha_limite', NEW.fecha_limite, 'activo', NEW.activo));
END$$
DELIMITER ;
DROP TRIGGER IF EXISTS tr_raps_after_delete;
DELIMITER $$
CREATE TRIGGER tr_raps_after_delete AFTER DELETE ON raps
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores)
    VALUES (@audit_usuario_id, 'DELETE', 'raps', OLD.id, JSON_OBJECT('nombre', OLD.nombre, 'codigo', OLD.codigo, 'competencia_id', OLD.competencia_id, 'fecha_limite', OLD.fecha_limite, 'activo', OLD.activo));
END$$
DELIMITER ;

-- --- sedes ---
DROP TRIGGER IF EXISTS tr_sedes_after_insert;
DELIMITER $$
CREATE TRIGGER tr_sedes_after_insert AFTER INSERT ON sedes
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_nuevos)
    VALUES (@audit_usuario_id, 'INSERT', 'sedes', NEW.id, JSON_OBJECT('nombre', NEW.nombre, 'direccion', NEW.direccion, 'es_principal', NEW.es_principal, 'activo', NEW.activo));
END$$
DELIMITER ;
DROP TRIGGER IF EXISTS tr_sedes_after_update;
DELIMITER $$
CREATE TRIGGER tr_sedes_after_update AFTER UPDATE ON sedes
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores, datos_nuevos)
    VALUES (@audit_usuario_id, 'UPDATE', 'sedes', NEW.id, JSON_OBJECT('nombre', OLD.nombre, 'direccion', OLD.direccion, 'es_principal', OLD.es_principal, 'activo', OLD.activo), JSON_OBJECT('nombre', NEW.nombre, 'direccion', NEW.direccion, 'es_principal', NEW.es_principal, 'activo', NEW.activo));
END$$
DELIMITER ;
DROP TRIGGER IF EXISTS tr_sedes_after_delete;
DELIMITER $$
CREATE TRIGGER tr_sedes_after_delete AFTER DELETE ON sedes
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores)
    VALUES (@audit_usuario_id, 'DELETE', 'sedes', OLD.id, JSON_OBJECT('nombre', OLD.nombre, 'direccion', OLD.direccion, 'es_principal', OLD.es_principal, 'activo', OLD.activo));
END$$
DELIMITER ;

-- --- lider_programa ---
DROP TRIGGER IF EXISTS tr_lider_programa_after_insert;
DELIMITER $$
CREATE TRIGGER tr_lider_programa_after_insert AFTER INSERT ON lider_programa
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_nuevos)
    VALUES (@audit_usuario_id, 'INSERT', 'lider_programa', NEW.instructor_id, JSON_OBJECT('instructor_id', NEW.instructor_id, 'programa_id', NEW.programa_id));
END$$
DELIMITER ;
DROP TRIGGER IF EXISTS tr_lider_programa_after_update;
DELIMITER $$
CREATE TRIGGER tr_lider_programa_after_update AFTER UPDATE ON lider_programa
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores, datos_nuevos)
    VALUES (@audit_usuario_id, 'UPDATE', 'lider_programa', NEW.instructor_id, JSON_OBJECT('instructor_id', OLD.instructor_id, 'programa_id', OLD.programa_id), JSON_OBJECT('instructor_id', NEW.instructor_id, 'programa_id', NEW.programa_id));
END$$
DELIMITER ;
DROP TRIGGER IF EXISTS tr_lider_programa_after_delete;
DELIMITER $$
CREATE TRIGGER tr_lider_programa_after_delete AFTER DELETE ON lider_programa
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores)
    VALUES (@audit_usuario_id, 'DELETE', 'lider_programa', OLD.instructor_id, JSON_OBJECT('instructor_id', OLD.instructor_id, 'programa_id', OLD.programa_id));
END$$
DELIMITER ;

-- --- instructor_competencias_habilitadas ---
DROP TRIGGER IF EXISTS tr_instructor_competencias_habilitadas_after_insert;
DELIMITER $$
CREATE TRIGGER tr_instructor_competencias_habilitadas_after_insert AFTER INSERT ON instructor_competencias_habilitadas
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_nuevos)
    VALUES (@audit_usuario_id, 'INSERT', 'instructor_competencias_habilitadas', NEW.instructor_id, JSON_OBJECT('instructor_id', NEW.instructor_id, 'competencia_id', NEW.competencia_id));
END$$
DELIMITER ;
DROP TRIGGER IF EXISTS tr_instructor_competencias_habilitadas_after_update;
DELIMITER $$
CREATE TRIGGER tr_instructor_competencias_habilitadas_after_update AFTER UPDATE ON instructor_competencias_habilitadas
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores, datos_nuevos)
    VALUES (@audit_usuario_id, 'UPDATE', 'instructor_competencias_habilitadas', NEW.instructor_id, JSON_OBJECT('instructor_id', OLD.instructor_id, 'competencia_id', OLD.competencia_id), JSON_OBJECT('instructor_id', NEW.instructor_id, 'competencia_id', NEW.competencia_id));
END$$
DELIMITER ;
DROP TRIGGER IF EXISTS tr_instructor_competencias_habilitadas_after_delete;
DELIMITER $$
CREATE TRIGGER tr_instructor_competencias_habilitadas_after_delete AFTER DELETE ON instructor_competencias_habilitadas
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores)
    VALUES (@audit_usuario_id, 'DELETE', 'instructor_competencias_habilitadas', OLD.instructor_id, JSON_OBJECT('instructor_id', OLD.instructor_id, 'competencia_id', OLD.competencia_id));
END$$
DELIMITER ;

-- --- instructor_historico ---
DROP TRIGGER IF EXISTS tr_instructor_historico_after_insert;
DELIMITER $$
CREATE TRIGGER tr_instructor_historico_after_insert AFTER INSERT ON instructor_historico
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_nuevos)
    VALUES (@audit_usuario_id, 'INSERT', 'instructor_historico', NEW.id, JSON_OBJECT('instructor_id', NEW.instructor_id, 'nombre', NEW.nombre, 'documento', NEW.documento, 'tipo_area', NEW.tipo_area, 'fecha_ingreso', NEW.fecha_ingreso, 'fecha_salida', NEW.fecha_salida, 'motivo', NEW.motivo, 'registrado_por_id', NEW.registrado_por_id));
END$$
DELIMITER ;
DROP TRIGGER IF EXISTS tr_instructor_historico_after_update;
DELIMITER $$
CREATE TRIGGER tr_instructor_historico_after_update AFTER UPDATE ON instructor_historico
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores, datos_nuevos)
    VALUES (@audit_usuario_id, 'UPDATE', 'instructor_historico', NEW.id, JSON_OBJECT('instructor_id', OLD.instructor_id, 'nombre', OLD.nombre, 'documento', OLD.documento, 'tipo_area', OLD.tipo_area, 'fecha_ingreso', OLD.fecha_ingreso, 'fecha_salida', OLD.fecha_salida, 'motivo', OLD.motivo, 'registrado_por_id', OLD.registrado_por_id), JSON_OBJECT('instructor_id', NEW.instructor_id, 'nombre', NEW.nombre, 'documento', NEW.documento, 'tipo_area', NEW.tipo_area, 'fecha_ingreso', NEW.fecha_ingreso, 'fecha_salida', NEW.fecha_salida, 'motivo', NEW.motivo, 'registrado_por_id', NEW.registrado_por_id));
END$$
DELIMITER ;
DROP TRIGGER IF EXISTS tr_instructor_historico_after_delete;
DELIMITER $$
CREATE TRIGGER tr_instructor_historico_after_delete AFTER DELETE ON instructor_historico
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores)
    VALUES (@audit_usuario_id, 'DELETE', 'instructor_historico', OLD.id, JSON_OBJECT('instructor_id', OLD.instructor_id, 'nombre', OLD.nombre, 'documento', OLD.documento, 'tipo_area', OLD.tipo_area, 'fecha_ingreso', OLD.fecha_ingreso, 'fecha_salida', OLD.fecha_salida, 'motivo', OLD.motivo, 'registrado_por_id', OLD.registrado_por_id));
END$$
DELIMITER ;

-- --- ambiente_bloqueos ---
DROP TRIGGER IF EXISTS tr_ambiente_bloqueos_after_insert;
DELIMITER $$
CREATE TRIGGER tr_ambiente_bloqueos_after_insert AFTER INSERT ON ambiente_bloqueos
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_nuevos)
    VALUES (@audit_usuario_id, 'INSERT', 'ambiente_bloqueos', NEW.id, JSON_OBJECT('ambiente_id', NEW.ambiente_id, 'fecha_inicio', NEW.fecha_inicio, 'fecha_fin', NEW.fecha_fin, 'motivo', NEW.motivo, 'activo', NEW.activo));
END$$
DELIMITER ;
DROP TRIGGER IF EXISTS tr_ambiente_bloqueos_after_update;
DELIMITER $$
CREATE TRIGGER tr_ambiente_bloqueos_after_update AFTER UPDATE ON ambiente_bloqueos
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores, datos_nuevos)
    VALUES (@audit_usuario_id, 'UPDATE', 'ambiente_bloqueos', NEW.id, JSON_OBJECT('ambiente_id', OLD.ambiente_id, 'fecha_inicio', OLD.fecha_inicio, 'fecha_fin', OLD.fecha_fin, 'motivo', OLD.motivo, 'activo', OLD.activo), JSON_OBJECT('ambiente_id', NEW.ambiente_id, 'fecha_inicio', NEW.fecha_inicio, 'fecha_fin', NEW.fecha_fin, 'motivo', NEW.motivo, 'activo', NEW.activo));
END$$
DELIMITER ;
DROP TRIGGER IF EXISTS tr_ambiente_bloqueos_after_delete;
DELIMITER $$
CREATE TRIGGER tr_ambiente_bloqueos_after_delete AFTER DELETE ON ambiente_bloqueos
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores)
    VALUES (@audit_usuario_id, 'DELETE', 'ambiente_bloqueos', OLD.id, JSON_OBJECT('ambiente_id', OLD.ambiente_id, 'fecha_inicio', OLD.fecha_inicio, 'fecha_fin', OLD.fecha_fin, 'motivo', OLD.motivo, 'activo', OLD.activo));
END$$
DELIMITER ;

-- --- ficha_novedades ---
DROP TRIGGER IF EXISTS tr_ficha_novedades_after_insert;
DELIMITER $$
CREATE TRIGGER tr_ficha_novedades_after_insert AFTER INSERT ON ficha_novedades
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_nuevos)
    VALUES (@audit_usuario_id, 'INSERT', 'ficha_novedades', NEW.id, JSON_OBJECT('ficha_id', NEW.ficha_id, 'tipo_novedad_id', NEW.tipo_novedad_id, 'fecha_inicio', NEW.fecha_inicio, 'fecha_regreso', NEW.fecha_regreso, 'observacion', NEW.observacion, 'activo', NEW.activo));
END$$
DELIMITER ;
DROP TRIGGER IF EXISTS tr_ficha_novedades_after_update;
DELIMITER $$
CREATE TRIGGER tr_ficha_novedades_after_update AFTER UPDATE ON ficha_novedades
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores, datos_nuevos)
    VALUES (@audit_usuario_id, 'UPDATE', 'ficha_novedades', NEW.id, JSON_OBJECT('ficha_id', OLD.ficha_id, 'tipo_novedad_id', OLD.tipo_novedad_id, 'fecha_inicio', OLD.fecha_inicio, 'fecha_regreso', OLD.fecha_regreso, 'observacion', OLD.observacion, 'activo', OLD.activo), JSON_OBJECT('ficha_id', NEW.ficha_id, 'tipo_novedad_id', NEW.tipo_novedad_id, 'fecha_inicio', NEW.fecha_inicio, 'fecha_regreso', NEW.fecha_regreso, 'observacion', NEW.observacion, 'activo', NEW.activo));
END$$
DELIMITER ;
DROP TRIGGER IF EXISTS tr_ficha_novedades_after_delete;
DELIMITER $$
CREATE TRIGGER tr_ficha_novedades_after_delete AFTER DELETE ON ficha_novedades
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores)
    VALUES (@audit_usuario_id, 'DELETE', 'ficha_novedades', OLD.id, JSON_OBJECT('ficha_id', OLD.ficha_id, 'tipo_novedad_id', OLD.tipo_novedad_id, 'fecha_inicio', OLD.fecha_inicio, 'fecha_regreso', OLD.fecha_regreso, 'observacion', OLD.observacion, 'activo', OLD.activo));
END$$
DELIMITER ;

-- --- asignacion_rap ---
DROP TRIGGER IF EXISTS tr_asignacion_rap_after_insert;
DELIMITER $$
CREATE TRIGGER tr_asignacion_rap_after_insert AFTER INSERT ON asignacion_rap
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_nuevos)
    VALUES (@audit_usuario_id, 'INSERT', 'asignacion_rap', NEW.id, JSON_OBJECT('asignacion_competencia_id', NEW.asignacion_competencia_id, 'rap_id', NEW.rap_id, 'instructor_anterior_id', NEW.instructor_anterior_id, 'fecha_cambio', NEW.fecha_cambio, 'activo', NEW.activo));
END$$
DELIMITER ;
DROP TRIGGER IF EXISTS tr_asignacion_rap_after_update;
DELIMITER $$
CREATE TRIGGER tr_asignacion_rap_after_update AFTER UPDATE ON asignacion_rap
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores, datos_nuevos)
    VALUES (@audit_usuario_id, 'UPDATE', 'asignacion_rap', NEW.id, JSON_OBJECT('asignacion_competencia_id', OLD.asignacion_competencia_id, 'rap_id', OLD.rap_id, 'instructor_anterior_id', OLD.instructor_anterior_id, 'fecha_cambio', OLD.fecha_cambio, 'activo', OLD.activo), JSON_OBJECT('asignacion_competencia_id', NEW.asignacion_competencia_id, 'rap_id', NEW.rap_id, 'instructor_anterior_id', NEW.instructor_anterior_id, 'fecha_cambio', NEW.fecha_cambio, 'activo', NEW.activo));
END$$
DELIMITER ;
DROP TRIGGER IF EXISTS tr_asignacion_rap_after_delete;
DELIMITER $$
CREATE TRIGGER tr_asignacion_rap_after_delete AFTER DELETE ON asignacion_rap
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores)
    VALUES (@audit_usuario_id, 'DELETE', 'asignacion_rap', OLD.id, JSON_OBJECT('asignacion_competencia_id', OLD.asignacion_competencia_id, 'rap_id', OLD.rap_id, 'instructor_anterior_id', OLD.instructor_anterior_id, 'fecha_cambio', OLD.fecha_cambio, 'activo', OLD.activo));
END$$
DELIMITER ;

-- --- rap_ficha_seguimiento ---
DROP TRIGGER IF EXISTS tr_rap_ficha_seguimiento_after_insert;
DELIMITER $$
CREATE TRIGGER tr_rap_ficha_seguimiento_after_insert AFTER INSERT ON rap_ficha_seguimiento
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_nuevos)
    VALUES (@audit_usuario_id, 'INSERT', 'rap_ficha_seguimiento', NEW.id, JSON_OBJECT('asignacion_competencia_id', NEW.asignacion_competencia_id, 'rap_id', NEW.rap_id, 'fecha_inicio', NEW.fecha_inicio, 'fecha_fin_programada', NEW.fecha_fin_programada, 'estado_evaluacion', NEW.estado_evaluacion, 'estado_aprobacion', NEW.estado_aprobacion, 'activo', NEW.activo));
END$$
DELIMITER ;
DROP TRIGGER IF EXISTS tr_rap_ficha_seguimiento_after_update;
DELIMITER $$
CREATE TRIGGER tr_rap_ficha_seguimiento_after_update AFTER UPDATE ON rap_ficha_seguimiento
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores, datos_nuevos)
    VALUES (@audit_usuario_id, 'UPDATE', 'rap_ficha_seguimiento', NEW.id, JSON_OBJECT('asignacion_competencia_id', OLD.asignacion_competencia_id, 'rap_id', OLD.rap_id, 'fecha_inicio', OLD.fecha_inicio, 'fecha_fin_programada', OLD.fecha_fin_programada, 'estado_evaluacion', OLD.estado_evaluacion, 'estado_aprobacion', OLD.estado_aprobacion, 'activo', OLD.activo), JSON_OBJECT('asignacion_competencia_id', NEW.asignacion_competencia_id, 'rap_id', NEW.rap_id, 'fecha_inicio', NEW.fecha_inicio, 'fecha_fin_programada', NEW.fecha_fin_programada, 'estado_evaluacion', NEW.estado_evaluacion, 'estado_aprobacion', NEW.estado_aprobacion, 'activo', NEW.activo));
END$$
DELIMITER ;
DROP TRIGGER IF EXISTS tr_rap_ficha_seguimiento_after_delete;
DELIMITER $$
CREATE TRIGGER tr_rap_ficha_seguimiento_after_delete AFTER DELETE ON rap_ficha_seguimiento
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (usuario_id, accion, tabla_afectada, registro_id, datos_anteriores)
    VALUES (@audit_usuario_id, 'DELETE', 'rap_ficha_seguimiento', OLD.id, JSON_OBJECT('asignacion_competencia_id', OLD.asignacion_competencia_id, 'rap_id', OLD.rap_id, 'fecha_inicio', OLD.fecha_inicio, 'fecha_fin_programada', OLD.fecha_fin_programada, 'estado_evaluacion', OLD.estado_evaluacion, 'estado_aprobacion', OLD.estado_aprobacion, 'activo', OLD.activo));
END$$
DELIMITER ;
