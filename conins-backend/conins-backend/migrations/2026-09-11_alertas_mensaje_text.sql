-- Migracion suelta: ampliar alertas.mensaje de VARCHAR(255) a TEXT.
-- Motivo: los mensajes autocontenidos de CO_DOCENCIA y RAP_COMPARTIDO superan los 255
-- caracteres (dos nombres de instructor + grupo + semana + explicacion), lo que hacia
-- fallar el INSERT (ER_DATA_TOO_LONG) y esas alertas NO se guardaban (best-effort las
-- silenciaba). Con TEXT ya caben. Correr UNA vez sobre una BD ya montada; no hace falta
-- en flujo limpio (db:reset): database.sql ya la trae.

ALTER TABLE alertas MODIFY mensaje TEXT NOT NULL;

-- Verificacion:
-- SHOW COLUMNS FROM alertas LIKE 'mensaje';
--
-- Para regenerar las alertas que se perdieron: reimporta el Excel (recomputa
-- estructurales) o corre db:reset + importar.
