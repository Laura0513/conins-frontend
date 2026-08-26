import { AsyncLocalStorage } from 'node:async_hooks';

// Contexto de auditoria por-request (RNF-24 / RF-59).
// verifyToken guarda aqui el id del usuario autenticado; el wrapper de
// pool.query (config/db.ts) lo lee para setear @audit_usuario_id en la MISMA
// conexion que ejecuta el INSERT/UPDATE/DELETE, de modo que los triggers de
// auditoria registren el autor correcto (antes quedaba siempre NULL porque el
// SET y el DML corrian en conexiones distintas del pool).
export interface AuditStore {
  usuarioId: number | null;
}

export const auditStore = new AsyncLocalStorage<AuditStore>();
