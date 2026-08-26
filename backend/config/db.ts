import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { auditStore } from './audit-context.js';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? 'root',
  database: process.env.DB_NAME ?? 'conIns',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
});

// --- Atribucion de auditoria (RNF-24) ---
// Para sentencias de ESCRITURA de un usuario autenticado, tomamos una conexion
// dedicada, seteamos @audit_usuario_id y ejecutamos el DML en ESA misma conexion
// para que los triggers de auditoria registren el autor. Las lecturas (SELECT) y
// los requests sin usuario usan la ruta normal, sin overhead adicional.
// Nota: las transacciones que usan pool.getConnection() directamente deben setear
// @audit_usuario_id por su cuenta (ver instructor.service.create).
const rawQuery = pool.query.bind(pool);
const isWriteStmt = (sql: unknown): boolean => {
  const text = typeof sql === 'string' ? sql : ((sql as any)?.sql ?? '');
  return /^\s*(INSERT|UPDATE|DELETE|REPLACE)\b/i.test(text);
};

(pool as any).query = async (sql: any, params?: any) => {
  const usuarioId = auditStore.getStore()?.usuarioId ?? null;
  if (usuarioId == null || !isWriteStmt(sql)) {
    return rawQuery(sql, params);
  }
  const conn = await pool.getConnection();
  try {
    await conn.query('SET @audit_usuario_id = ?', [usuarioId]);
    return await conn.query(sql, params);
  } finally {
    conn.release();
  }
};

export default pool;
