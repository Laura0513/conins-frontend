-- Migracion suelta: tabla enlaces_externos + seed
-- Correr UNA vez sobre una BD ya montada (phpMyAdmin o cliente mysql).
-- No hace falta si se hace flujo limpio (db:reset / recargar database.sql):
-- database.sql ya la incluye (linea ~1371).

CREATE TABLE IF NOT EXISTS enlaces_externos (
    id      INT AUTO_INCREMENT PRIMARY KEY,
    nombre  VARCHAR(100) NOT NULL,
    url     VARCHAR(500) NOT NULL,
    orden   INT NOT NULL DEFAULT 0,
    activo  BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

INSERT IGNORE INTO enlaces_externos (id, nombre, url, orden) VALUES
  (1, 'Sofia Plus', 'https://oferta.senasofiaplus.edu.co/sofia-oferta/', 1),
  (2, 'SENA', 'https://www.sena.edu.co/', 2),
  (3, 'Zajuna', 'https://zajuna.sena.edu.co/', 3);

-- Verificacion:
-- SELECT * FROM enlaces_externos;
