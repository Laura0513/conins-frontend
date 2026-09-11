// CONINS — Bootstrap de la BD (automatiza database.sql + seed_maestro.sql)
//
// Uso (desde backend/):
//   npm run db:setup   -> crea schema + catalogo + instructores (no borra si ya existe)
//   npm run db:reset   -> DROP + schema + catalogo + instructores (BD limpia)
//
// Luego: importar el Excel desde el sistema. Las alertas estructurales y los
// seguimientos de RAP se generan solos al final del import (no hay paso manual).
//
// Requiere el cliente `mysql` en el PATH (Laragon lo trae). Lee credenciales del
// .env (DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME). Los .sql se ejecutan con el
// cliente mysql para respetar los bloques DELIMITER (triggers de auditoria).

import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendDir = join(__dirname, '..');

const HOST = process.env.DB_HOST ?? 'localhost';
const PORT = process.env.DB_PORT ?? '3306';
const USER = process.env.DB_USER ?? 'root';
const PASSWORD = process.env.DB_PASSWORD ?? 'root';
const NAME = process.env.DB_NAME ?? 'conIns';

const mode = (process.argv[2] ?? 'setup').toLowerCase(); // 'setup' | 'reset'

function mysqlRun({ sqlText, inline }) {
  const args = ['-h', HOST, '-P', String(PORT), '-u', USER];
  if (inline) args.push('-e', inline);
  const r = spawnSync('mysql', args, {
    input: inline ? undefined : sqlText,
    env: { ...process.env, MYSQL_PWD: PASSWORD }, // evita el warning de -p y no filtra la clave
    encoding: 'utf8',
  });
  if (r.error) {
    console.error('\n✗ No se encontro el cliente "mysql" en el PATH.');
    console.error('  Abre la terminal de Laragon (o agrega mysql al PATH) y reintenta.');
    console.error('  Alternativa: pega database.sql y seed_maestro.sql en phpMyAdmin.\n');
    process.exit(1);
  }
  if (r.status !== 0) {
    console.error(r.stderr || 'Error ejecutando SQL');
    process.exit(r.status ?? 1);
  }
}

function runFile(file) {
  const p = join(backendDir, file);
  if (!existsSync(p)) { console.error(`✗ No existe ${file}`); process.exit(1); }
  console.log(`→ Ejecutando ${file} ...`);
  mysqlRun({ sqlText: readFileSync(p, 'utf8') });
}

console.log(`CONINS db:${mode}  (host=${HOST}:${PORT} db=${NAME} user=${USER})`);

if (mode === 'reset') {
  console.log(`→ DROP DATABASE ${NAME} ...`);
  mysqlRun({ inline: `DROP DATABASE IF EXISTS \`${NAME}\`;` });
}

runFile('database.sql');     // schema + admin + ambientes + tablas nuevas + triggers
runFile('seed_maestro.sql'); // catalogo + instructores (planeacion vacia)

console.log('\n✓ Listo: schema + catalogo + instructores cargados.');
console.log('  Siguiente paso: importa el Excel desde el sistema.');
console.log('  Las alertas estructurales (co-docencia/RAP) y los seguimientos de RAP se generan solos al final del import.\n');
