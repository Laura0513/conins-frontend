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

-- ============================================================
-- RECOMENDACIONES OPERATIVAS (auditoria 25/08/2026) — NO se ejecutan solas
-- ============================================================
--
-- B5 — Retencion de auditoria: con la cobertura ampliada, la tabla `auditoria`
-- crece rapido. Purga sugerida (ejecutar manual o via evento programado), p.ej.
-- conservar 12 meses:
--
--   DELETE FROM auditoria WHERE fecha < (NOW() - INTERVAL 12 MONTH);
--
-- Opcional, como EVENT nocturno (requiere event_scheduler = ON):
--   CREATE EVENT IF NOT EXISTS ev_purga_auditoria
--     ON SCHEDULE EVERY 1 DAY
--     DO DELETE FROM auditoria WHERE fecha < (NOW() - INTERVAL 12 MONTH);
--
-- B7 — Indices: al volumen actual del CDMC (cientos de filas) los indices de FK
-- e `idx_semana_instructor` en horarios son suficientes. Si el historico crece,
-- considerar indices compuestos sobre (activo) + FK en asignacion/horarios segun
-- los planes EXPLAIN reales, no de forma especulativa.
--
-- B8 — ON DELETE: el schema mezcla CASCADE/RESTRICT/SET NULL. Con RN-10 (nunca
-- DELETE fisico, solo activo=FALSE) los CASCADE son defensivos. Mantener la regla
-- de no borrar fisicamente; un DELETE fisico propagaria en cadena por los CASCADE.
