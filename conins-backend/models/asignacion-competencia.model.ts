import pool from '../config/db.js';
import { RowDataPacket } from 'mysql2';

export interface AsignacionCompetenciaRecord extends RowDataPacket {
  id: number;
  asignacion_id: number;
  competencia_id: number;
  instructor_anterior_id: number | null;
  fecha_cambio: Date | null;
  ambiente_excepcion_id: number | null;
  observacion: string | null;
  activo: boolean;
}

export const AsignacionCompetenciaModel = {
  async registrarCambioInstructor(
    asignacionId: number,
    competenciaId: number,
    instructorAnteriorId: number,
  ): Promise<void> {
    await pool.query(
      `UPDATE asignacion_competencia
       SET instructor_anterior_id = ?, fecha_cambio = CURDATE()
       WHERE asignacion_id = ? AND competencia_id = ?`,
      [instructorAnteriorId, asignacionId, competenciaId],
    );
  },

  async findByAsignacion(asignacionId: number): Promise<AsignacionCompetenciaRecord[]> {
    const [rows] = await pool.query<AsignacionCompetenciaRecord[]>(
      `SELECT * FROM asignacion_competencia WHERE asignacion_id = ? AND activo = TRUE`,
      [asignacionId],
    );
    return rows;
  },

  async updateCompetencia(
    asignacionId: number,
    competenciaIdAnterior: number,
    competenciaIdNuevo: number,
    instructorAnteriorId?: number | null,
  ): Promise<void> {
    await pool.query(
      `UPDATE asignacion_competencia
       SET competencia_id = ?, instructor_anterior_id = ?, fecha_cambio = CURDATE()
       WHERE asignacion_id = ? AND competencia_id = ?`,
      [competenciaIdNuevo, instructorAnteriorId ?? null, asignacionId, competenciaIdAnterior],
    );
  },

  async updateAmbiente(
    asignacionId: number,
    ambienteExcepcionId: number | null,
  ): Promise<void> {
    await pool.query(
      `UPDATE asignacion_competencia SET ambiente_excepcion_id = ? WHERE asignacion_id = ?`,
      [ambienteExcepcionId, asignacionId],
    );
  },
};
