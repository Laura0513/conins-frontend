import { Request, Response, NextFunction } from 'express';
import { auditStore } from '../config/audit-context.js';

// Establece el contexto de auditoria por-request. El usuarioId se completa en
// verifyToken cuando hay un token valido (ver middleware/auth.ts). El wrapper de
// pool.query (config/db.ts) usa ese id para atribuir los triggers de auditoria.
//
// Reemplaza al antiguo auditLogger, que insertaba una fila 'API_CALL' por cada
// request: usaba una accion inexistente en el ENUM de auditoria (fallaba en modo
// estricto), con usuario_id siempre NULL (corria antes de verifyToken), y seteaba
// @audit_usuario_id en una conexion del pool distinta a la del DML (inutil para
// los triggers).
export const auditContext = (_req: Request, _res: Response, next: NextFunction) => {
  auditStore.run({ usuarioId: null }, () => next());
};
