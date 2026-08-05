-- ============================================================
-- AUDITORIA DE LA BD VIVA — CONINS (29/07/2026)
-- SOLO LECTURA: no modifica nada, solo reporta.
-- Detecta sobrantes: tablas extra, objetos que aun referencian columnas
-- eliminadas (tipo_contrato), y columnas nuevas faltantes.
-- Ejecutar completo en phpMyAdmin (BD conIns -> pestaña SQL).
-- ============================================================

-- 1. Conteo de tablas (esperado: 31)
SELECT COUNT(*) AS total_tablas
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE';

-- 2. TABLAS SOBRANTES: base tables que NO estan en la lista oficial de 31
SELECT TABLE_NAME AS tabla_sobrante
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'
  AND TABLE_NAME NOT IN (
    'sedes','jornadas','roles','areas','usuarios','usuario_roles','instructores',
    'instructor_historico','programas','competencias','raps','ambientes','fichas',
    'asignacion','asignacion_competencia','asignacion_rap','lider_programa',
    'instructor_competencias_habilitadas','horarios','alertas',
    'tipos_novedad_instructor','instructor_novedades','ambiente_bloqueos',
    'tipos_novedad_ambiente','tipos_novedad_ficha','ficha_novedades',
    'notificaciones','auditoria','tipos_actividad','rap_ficha_seguimiento',
    'password_reset_tokens'
  );
-- (Sin filas = no hay tablas sobrantes)

-- 3. TABLAS FALTANTES: las oficiales que NO existen en la BD
SELECT t.nombre AS tabla_faltante
FROM (
  SELECT 'sedes' AS nombre UNION ALL SELECT 'instructor_historico' UNION ALL
  SELECT 'asignacion_rap' UNION ALL SELECT 'rap_ficha_seguimiento' UNION ALL
  SELECT 'password_reset_tokens' UNION ALL SELECT 'tipos_actividad'
) t
LEFT JOIN information_schema.TABLES x
  ON x.TABLE_SCHEMA = DATABASE() AND x.TABLE_NAME = t.nombre
WHERE x.TABLE_NAME IS NULL;
-- (Sin filas = no falta ninguna de las tablas nuevas clave)

-- 4. SOBRANTES CRITICOS: triggers/procedimientos que aun referencian tipo_contrato
--    (columna eliminada el 14/07 — cualquier objeto que la use fallara)
SELECT ROUTINE_NAME AS objeto, ROUTINE_TYPE AS tipo
FROM information_schema.ROUTINES
WHERE ROUTINE_SCHEMA = DATABASE()
  AND ROUTINE_DEFINITION LIKE '%tipo_contrato%';

SELECT TRIGGER_NAME AS trigger_con_tipo_contrato
FROM information_schema.TRIGGERS
WHERE TRIGGER_SCHEMA = DATABASE()
  AND ACTION_STATEMENT LIKE '%tipo_contrato%';

SELECT TABLE_NAME AS vista_con_tipo_contrato
FROM information_schema.VIEWS
WHERE TABLE_SCHEMA = DATABASE()
  AND VIEW_DEFINITION LIKE '%tipo_contrato%';
-- (Sin filas en las tres = no hay sobrantes de tipo_contrato)

-- 5. COLUMNAS NUEVAS: deben existir todas (sin filas = todo OK)
SELECT c.tabla, c.col AS columna_faltante
FROM (
  SELECT 'horarios' AS tabla, 'rap_id' AS col UNION ALL
  SELECT 'ambientes', 'sede_id' UNION ALL
  SELECT 'fichas', 'sede_id' UNION ALL
  SELECT 'asignacion', 'jornada_id'
) c
LEFT JOIN information_schema.COLUMNS x
  ON x.TABLE_SCHEMA = DATABASE() AND x.TABLE_NAME = c.tabla AND x.COLUMN_NAME = c.col
WHERE x.COLUMN_NAME IS NULL;

-- 6. INVENTARIO: todos los objetos actuales (para revision manual)
SELECT 'TRIGGER' AS tipo, TRIGGER_NAME AS nombre FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = DATABASE()
UNION ALL
SELECT ROUTINE_TYPE, ROUTINE_NAME FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = DATABASE()
UNION ALL
SELECT 'VIEW', TABLE_NAME FROM information_schema.VIEWS WHERE TABLE_SCHEMA = DATABASE()
ORDER BY tipo, nombre;
