-- ============================================================
-- CONINS — Alertas estructurales (co-docencia, RAP compartido, ambiente ocupado)
-- ============================================================
-- QUE HACE: recalcula las alertas ESTRUCTURALES a partir de los horarios ya
-- cargados. Son cruces que dependen del conjunto completo de horarios, no de una
-- sola fila, por eso conviene (re)calcularlas despues de importar.
--
-- CUANDO CORRERLO: DESPUES de importar el Excel (cuando la tabla horarios ya
-- tiene datos). NO va dentro de database.sql ni seed_maestro.sql, porque en el
-- seed aun no hay horarios y generaria 0 filas.
--
-- FLUJO COMPLETO:
--   1. DROP DATABASE conIns;
--   2. Ejecutar database.sql      (schema)
--   3. Ejecutar seed_maestro.sql  (catalogo + instructores)
--   4. Importar el Excel desde el sistema
--   5. Ejecutar ESTE archivo      (genera co-docencia / RAP compartido)
--
-- Es re-ejecutable: borra las estructurales y las vuelve a calcular. No toca las
-- alertas de carga horaria (HORAS_EXCEDIDAS / HORAS_INSUFICIENTES).
-- ============================================================

USE conIns;

-- 0) Limpiar estructurales previas (deja intactas las de carga horaria)
DELETE FROM alertas WHERE tipo IN ('CO_DOCENCIA','RAP_COMPARTIDO','AMBIENTE_OCUPADO');

-- 1) CO_DOCENCIA: 2+ instructores distintos en el MISMO grupo, dia, jornada y semana
INSERT INTO alertas (instructor_id, tipo, mensaje, semana, ficha_id)
SELECT
  MIN(h.instructor_id),
  'CO_DOCENCIA',
  LEFT(CONCAT(
    'Dos o mas instructores (',
    (SELECT GROUP_CONCAT(DISTINCT u2.nombre SEPARATOR ' y ')
       FROM horarios h2
       JOIN instructores i2 ON h2.instructor_id = i2.id
       JOIN usuarios u2     ON i2.usuario_id = u2.id
       WHERE h2.ficha_id = h.ficha_id AND h2.dia_semana = h.dia_semana
         AND h2.jornada_id = h.jornada_id AND h2.semana = h.semana AND h2.activo = TRUE),
    ') quedaron asignados al mismo grupo ', f.numero_ficha,
    ' el ', ELT(h.dia_semana,'lunes','martes','miercoles','jueves','viernes','sabado','domingo'),
    ' en la jornada ', j.nombre,
    ' (semana ', DATE_FORMAT(h.semana,'%d/%m/%Y'),
    '). Revisa si es co-docencia intencional o un cruce; la coordinacion decide.'
  ), 255),
  h.semana, h.ficha_id
FROM horarios h
JOIN fichas f   ON h.ficha_id = f.id
JOIN jornadas j ON h.jornada_id = j.id
WHERE h.activo = TRUE
GROUP BY h.ficha_id, h.dia_semana, h.jornada_id, h.semana
HAVING COUNT(DISTINCT h.instructor_id) >= 2;

-- 2) RAP_COMPARTIDO: mismo RAP a cargo de 2+ instructores en el mismo grupo
--    (solo genera filas si los horarios tienen rap_id; si estan NULL, 0 filas)
INSERT INTO alertas (instructor_id, tipo, mensaje, ficha_id, rap_id)
SELECT
  MIN(h.instructor_id),
  'RAP_COMPARTIDO',
  LEFT(CONCAT(
    'El resultado de aprendizaje "', r.nombre, '" quedo a cargo de ',
    (SELECT GROUP_CONCAT(DISTINCT u2.nombre SEPARATOR ' y ')
       FROM horarios h2
       JOIN instructores i2 ON h2.instructor_id = i2.id
       JOIN usuarios u2     ON i2.usuario_id = u2.id
       WHERE h2.ficha_id = h.ficha_id AND h2.rap_id = h.rap_id AND h2.activo = TRUE),
    ') en el grupo ', f.numero_ficha,
    '. Debe quedar con un solo instructor para poder evaluarlo.'
  ), 255),
  h.ficha_id, h.rap_id
FROM horarios h
JOIN fichas f ON h.ficha_id = f.id
JOIN raps r   ON h.rap_id = r.id
WHERE h.activo = TRUE AND h.rap_id IS NOT NULL
GROUP BY h.ficha_id, h.rap_id
HAVING COUNT(DISTINCT h.instructor_id) >= 2;

-- 3) AMBIENTE_OCUPADO: mismo ambiente/dia/jornada/semana en GRUPOS DISTINTOS
INSERT INTO alertas (instructor_id, tipo, mensaje, semana, ficha_id)
SELECT
  MIN(h.instructor_id),
  'AMBIENTE_OCUPADO',
  LEFT(CONCAT(
    'Dos o mas grupos (',
    (SELECT GROUP_CONCAT(DISTINCT f2.numero_ficha SEPARATOR ' y ')
       FROM horarios h2 JOIN fichas f2 ON h2.ficha_id = f2.id
       WHERE h2.ambiente_id = h.ambiente_id AND h2.dia_semana = h.dia_semana
         AND h2.jornada_id = h.jornada_id AND h2.semana = h.semana AND h2.activo = TRUE),
    ') tienen asignado el mismo ambiente (', a.nombre, ') el ',
    ELT(h.dia_semana,'lunes','martes','miercoles','jueves','viernes','sabado','domingo'),
    ' en la jornada ', j.nombre, ' (semana ', DATE_FORMAT(h.semana,'%d/%m/%Y'),
    '). Revisa el cruce de ambiente.'
  ), 255),
  h.semana, MIN(h.ficha_id)
FROM horarios h
JOIN ambientes a ON h.ambiente_id = a.id
JOIN jornadas j  ON h.jornada_id = j.id
WHERE h.activo = TRUE AND h.ambiente_id IS NOT NULL
GROUP BY h.ambiente_id, h.dia_semana, h.jornada_id, h.semana
HAVING COUNT(DISTINCT h.ficha_id) >= 2;

-- 4) Ver resultado
SELECT tipo, COUNT(*) AS n FROM alertas GROUP BY tipo ORDER BY n DESC;
