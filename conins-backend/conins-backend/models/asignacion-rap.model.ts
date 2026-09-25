import pool from '../config/db.js';
import { RowDataPacket } from 'mysql2';

// ============================================================
// ASIGNACION_RAP — modelo RAP directo (RF-42, RN-15 redefinida)
// Asignacion explicita de RAPs al instructor dentro de una competencia.
// La cadena para resolver el grupo (ficha):
//   asignacion_rap -> asignacion_competencia -> asignacion -> ficha_id
// ============================================================

export interface RapAsignado extends RowDataPacket {
  id: number;
  rap_id: number;
  codigo: string;
  descripcion: string;
  activo: boolean;
}

export const AsignacionRapModel = {
  // Resuelve el asignacion_competencia activo para (asignacion, competencia).
  async findAcId(asignacionId: number, competenciaId: number): Promise<number | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM asignacion_competencia
       WHERE asignacion_id = ? AND competencia_id = ? AND activo = TRUE
       LIMIT 1`,
      [asignacionId, competenciaId],
    );
    return rows.length ? (rows[0] as any).id : null;
  },

  // RAPs asignados (activos) de un asignacion_competencia.
  async getRapsByAc(acId: number): Promise<RapAsignado[]> {
    const [rows] = await pool.query<RapAsignado[]>(
      `SELECT ar.id, ar.rap_id, r.codigo, r.nombre AS descripcion, ar.activo
       FROM asignacion_rap ar
       JOIN raps r ON ar.rap_id = r.id
       WHERE ar.asignacion_competencia_id = ? AND ar.activo = TRUE
       ORDER BY r.codigo`,
      [acId],
    );
    return rows;
  },

  // Verifica que un RAP pertenezca a la competencia indicada.
  async rapBelongsToCompetencia(rapId: number, competenciaId: number): Promise<boolean> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT 1 FROM raps WHERE id = ? AND competencia_id = ? AND activo = TRUE LIMIT 1',
      [rapId, competenciaId],
    );
    return rows.length > 0;
  },

  // RN-06: ¿el RAP ya esta asignado (activo) a OTRO instructor en la misma ficha?
  // Excluye el asignacion_competencia actual (mismo instructor/competencia).
  async rapTakenByOtherInFicha(fichaId: number, rapId: number, excludeAcId: number): Promise<boolean> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 1
       FROM asignacion_rap ar
       JOIN asignacion_competencia ac ON ar.asignacion_competencia_id = ac.id
       JOIN asignacion a ON ac.asignacion_id = a.id
       WHERE ar.rap_id = ?
         AND ar.activo = TRUE AND ac.activo = TRUE AND a.activo = TRUE
         AND a.ficha_id = ?
         AND ar.asignacion_competencia_id != ?
       LIMIT 1`,
      [rapId, fichaId, excludeAcId],
    );
    return rows.length > 0;
  },

  // RN-26: ¿el RAP tiene alguna asignacion activa a un instructor?
  // Se usa para impedir deshabilitar un RAP que esta en uso.
  async isRapAsignadoActivo(rapId: number): Promise<boolean> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 1
       FROM asignacion_rap ar
       JOIN asignacion_competencia ac ON ar.asignacion_competencia_id = ac.id
       JOIN asignacion a ON ac.asignacion_id = a.id
       WHERE ar.rap_id = ?
         AND ar.activo = TRUE AND ac.activo = TRUE AND a.activo = TRUE
       LIMIT 1`,
      [rapId],
    );
    return rows.length > 0;
  },

  // Devuelve el ficha_id de un asignacion_competencia.
  async getFichaIdByAc(acId: number): Promise<number | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT a.ficha_id
       FROM asignacion_competencia ac
       JOIN asignacion a ON ac.asignacion_id = a.id
       WHERE ac.id = ? LIMIT 1`,
      [acId],
    );
    return rows.length ? (rows[0] as any).ficha_id : null;
  },

  // Cuantos instructores distintos tienen ese RAP activo en el grupo (RN-06).
  async countInstructoresConRap(fichaId: number, rapId: number): Promise<number> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(DISTINCT a.instructor_id) AS n
       FROM asignacion_rap ar
       JOIN asignacion_competencia ac ON ar.asignacion_competencia_id = ac.id
       JOIN asignacion a ON ac.asignacion_id = a.id
       WHERE a.ficha_id = ? AND ar.rap_id = ? AND ar.activo = TRUE AND a.activo = TRUE`,
      [fichaId, rapId],
    );
    return Number((rows[0] as any)?.n ?? 0);
  },

  async getInstructorIdByAc(acId: number): Promise<number | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT a.instructor_id
       FROM asignacion_competencia ac
       JOIN asignacion a ON ac.asignacion_id = a.id
       WHERE ac.id = ? LIMIT 1`,
      [acId],
    );
    return rows.length ? (rows[0] as any).instructor_id : null;
  },

  async competenciaIdByAc(acId: number): Promise<number | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT competencia_id FROM asignacion_competencia WHERE id = ? LIMIT 1',
      [acId],
    );
    return rows.length ? (rows[0] as any).competencia_id : null;
  },

  // Sincroniza el conjunto de RAPs de un AC con la lista rapIds:
  // desactiva los que sobran, activa/inserta los que faltan.
  async syncRaps(acId: number, rapIds: number[]): Promise<void> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Desactivar los que ya no estan en la lista
      if (rapIds.length > 0) {
        const placeholders = rapIds.map(() => '?').join(',');
        await conn.query(
          `UPDATE asignacion_rap SET activo = FALSE
           WHERE asignacion_competencia_id = ? AND rap_id NOT IN (${placeholders})`,
          [acId, ...rapIds],
        );
      } else {
        await conn.query(
          'UPDATE asignacion_rap SET activo = FALSE WHERE asignacion_competencia_id = ?',
          [acId],
        );
      }

      // Insertar o reactivar los de la lista (UNIQUE evita duplicados)
      for (const rapId of rapIds) {
        await conn.query(
          `INSERT INTO asignacion_rap (asignacion_competencia_id, rap_id, activo)
           VALUES (?, ?, TRUE)
           ON DUPLICATE KEY UPDATE activo = TRUE`,
          [acId, rapId],
        );
      }

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  // RAPs asignados de todo un asignacion (agrupados por competencia).
  async getRapsByAsignacion(asignacionId: number): Promise<RowDataPacket[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ac.id AS asignacion_competencia_id, ac.competencia_id,
              ar.rap_id, r.codigo, r.nombre AS descripcion
       FROM asignacion_competencia ac
       LEFT JOIN asignacion_rap ar ON ar.asignacion_competencia_id = ac.id AND ar.activo = TRUE
       LEFT JOIN raps r ON ar.rap_id = r.id
       WHERE ac.asignacion_id = ? AND ac.activo = TRUE
       ORDER BY ac.competencia_id, r.codigo`,
      [asignacionId],
    );
    return rows;
  },
};
