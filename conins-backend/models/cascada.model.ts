import pool from '../config/db.js';

// Cascada de desactivacion/reactivacion consistente para toda la cadena.
// Al desactivar un "actor" (grupo, instructor, competencia, RAP, ambiente) se apagan
// sus datos dependientes con una MARCA de causa (motivo_baja en la cadena de asignacion,
// motivo_suspension en horarios).
//
// Reactivacion (reversible, decide coordinacion): revive los datos que se apagaron POR
// CASCADA y cuyos demas padres sigan activos.
//  - En la cadena de asignacion, `motivo_baja` SOLO lo pone la cascada (nunca una baja
//    manual), asi que "motivo_baja IS NOT NULL" identifica lo apagado por cascada y no
//    resucita algo retirado a mano. Esto ademas maneja causas apiladas (ej. grupo +
//    instructor): la fila revive cuando TODOS sus padres vuelven a estar activos.
//  - En horarios, `motivo_suspension` se comparte con suspensiones manuales (RF-36) y con
//    'Asignacion desactivada', por eso solo se reviven los que tengan una de las 5 causas
//    de cascada.
//
// El "campo ancla" de horarios es una union literal (no viene del request) -> sin inyeccion.

const CAUSA = {
  GRUPO: 'Grupo desactivado',
  INSTRUCTOR: 'Instructor desactivado',
  COMPETENCIA: 'Competencia desactivada',
  RAP: 'RAP desactivado',
  AMBIENTE: 'Ambiente desactivado',
} as const;

const CAUSAS_HORARIO = [CAUSA.GRUPO, CAUSA.INSTRUCTOR, CAUSA.COMPETENCIA, CAUSA.RAP, CAUSA.AMBIENTE];

type AnclaHorario = 'ficha_id' | 'instructor_id' | 'competencia_id' | 'ambiente_id' | 'rap_id';

async function horariosOff(ancla: AnclaHorario, id: number, causa: string) {
  await pool.query(
    `UPDATE horarios SET activo = FALSE, motivo_suspension = ?
     WHERE ${ancla} = ? AND activo = TRUE`,
    [causa, id],
  );
}

async function horariosOn(ancla: AnclaHorario, id: number) {
  await pool.query(
    `UPDATE horarios h
       JOIN fichas f        ON f.id = h.ficha_id
       JOIN instructores i  ON i.id = h.instructor_id
       JOIN competencias c  ON c.id = h.competencia_id
       LEFT JOIN ambientes ab ON ab.id = h.ambiente_id
       LEFT JOIN raps r       ON r.id = h.rap_id
     SET h.activo = TRUE, h.motivo_suspension = NULL
     WHERE h.${ancla} = ? AND h.activo = FALSE AND h.motivo_suspension IN (?, ?, ?, ?, ?)
       AND f.activo = TRUE AND i.activo = TRUE AND c.activo = TRUE
       AND (h.ambiente_id IS NULL OR ab.activo = TRUE)
       AND (h.rap_id IS NULL OR r.activo = TRUE)`,
    [id, ...CAUSAS_HORARIO],
  );
}

export const CascadaModel = {
  causas: CAUSA,

  // ---------------- GRUPO (ficha) ----------------
  async grupoOff(fichaId: number): Promise<void> {
    await pool.query(
      'UPDATE asignacion SET activo = FALSE, motivo_baja = ? WHERE ficha_id = ? AND activo = TRUE',
      [CAUSA.GRUPO, fichaId]);
    await pool.query(
      `UPDATE asignacion_competencia ac JOIN asignacion a ON a.id = ac.asignacion_id
       SET ac.activo = FALSE, ac.motivo_baja = ? WHERE a.ficha_id = ? AND ac.activo = TRUE`,
      [CAUSA.GRUPO, fichaId]);
    await pool.query(
      `UPDATE asignacion_rap ar
         JOIN asignacion_competencia ac ON ac.id = ar.asignacion_competencia_id
         JOIN asignacion a ON a.id = ac.asignacion_id
       SET ar.activo = FALSE, ar.motivo_baja = ? WHERE a.ficha_id = ? AND ar.activo = TRUE`,
      [CAUSA.GRUPO, fichaId]);
    await pool.query(
      `UPDATE rap_ficha_seguimiento rfs
         JOIN asignacion_competencia ac ON ac.id = rfs.asignacion_competencia_id
         JOIN asignacion a ON a.id = ac.asignacion_id
       SET rfs.activo = FALSE, rfs.motivo_baja = ? WHERE a.ficha_id = ? AND rfs.activo = TRUE`,
      [CAUSA.GRUPO, fichaId]);
    await horariosOff('ficha_id', fichaId, CAUSA.GRUPO);
    await pool.query('UPDATE alertas SET atendida = TRUE WHERE ficha_id = ? AND atendida = FALSE', [fichaId]);
  },

  async grupoOn(fichaId: number): Promise<void> {
    await this._asignacionChainOn('a.ficha_id = ?', [fichaId]);
    await horariosOn('ficha_id', fichaId);
  },

  // ---------------- INSTRUCTOR ----------------
  async instructorOff(instructorId: number): Promise<void> {
    await pool.query(
      'UPDATE asignacion SET activo = FALSE, motivo_baja = ? WHERE instructor_id = ? AND activo = TRUE',
      [CAUSA.INSTRUCTOR, instructorId]);
    await pool.query(
      `UPDATE asignacion_competencia ac JOIN asignacion a ON a.id = ac.asignacion_id
       SET ac.activo = FALSE, ac.motivo_baja = ? WHERE a.instructor_id = ? AND ac.activo = TRUE`,
      [CAUSA.INSTRUCTOR, instructorId]);
    await pool.query(
      `UPDATE asignacion_rap ar
         JOIN asignacion_competencia ac ON ac.id = ar.asignacion_competencia_id
         JOIN asignacion a ON a.id = ac.asignacion_id
       SET ar.activo = FALSE, ar.motivo_baja = ? WHERE a.instructor_id = ? AND ar.activo = TRUE`,
      [CAUSA.INSTRUCTOR, instructorId]);
    await pool.query(
      `UPDATE rap_ficha_seguimiento rfs
         JOIN asignacion_competencia ac ON ac.id = rfs.asignacion_competencia_id
         JOIN asignacion a ON a.id = ac.asignacion_id
       SET rfs.activo = FALSE, rfs.motivo_baja = ? WHERE a.instructor_id = ? AND rfs.activo = TRUE`,
      [CAUSA.INSTRUCTOR, instructorId]);
    await horariosOff('instructor_id', instructorId, CAUSA.INSTRUCTOR);
    await pool.query('UPDATE alertas SET atendida = TRUE WHERE instructor_id = ? AND atendida = FALSE', [instructorId]);
  },

  async instructorOn(instructorId: number): Promise<void> {
    await this._asignacionChainOn('a.instructor_id = ?', [instructorId]);
    await horariosOn('instructor_id', instructorId);
  },

  // ---------------- COMPETENCIA ----------------
  // No apaga la asignacion (el instructor puede dictar otras competencias del grupo),
  // solo las asignacion_competencia de esta competencia y sus descendientes.
  async competenciaOff(competenciaId: number): Promise<void> {
    await pool.query(
      'UPDATE asignacion_competencia SET activo = FALSE, motivo_baja = ? WHERE competencia_id = ? AND activo = TRUE',
      [CAUSA.COMPETENCIA, competenciaId]);
    await pool.query(
      `UPDATE asignacion_rap ar
         JOIN asignacion_competencia ac ON ac.id = ar.asignacion_competencia_id
       SET ar.activo = FALSE, ar.motivo_baja = ? WHERE ac.competencia_id = ? AND ar.activo = TRUE`,
      [CAUSA.COMPETENCIA, competenciaId]);
    await pool.query(
      `UPDATE rap_ficha_seguimiento rfs
         JOIN asignacion_competencia ac ON ac.id = rfs.asignacion_competencia_id
       SET rfs.activo = FALSE, rfs.motivo_baja = ? WHERE ac.competencia_id = ? AND rfs.activo = TRUE`,
      [CAUSA.COMPETENCIA, competenciaId]);
    await horariosOff('competencia_id', competenciaId, CAUSA.COMPETENCIA);
  },

  async competenciaOn(competenciaId: number): Promise<void> {
    // ac: revive si su asignacion esta activa y la competencia (esta) activa.
    await pool.query(
      `UPDATE asignacion_competencia ac JOIN asignacion a ON a.id = ac.asignacion_id
       SET ac.activo = TRUE, ac.motivo_baja = NULL
       WHERE ac.competencia_id = ? AND ac.motivo_baja IS NOT NULL AND a.activo = TRUE`,
      [competenciaId]);
    await pool.query(
      `UPDATE asignacion_rap ar
         JOIN asignacion_competencia ac ON ac.id = ar.asignacion_competencia_id
         JOIN raps r ON r.id = ar.rap_id
       SET ar.activo = TRUE, ar.motivo_baja = NULL
       WHERE ac.competencia_id = ? AND ar.motivo_baja IS NOT NULL AND ac.activo = TRUE AND r.activo = TRUE`,
      [competenciaId]);
    await pool.query(
      `UPDATE rap_ficha_seguimiento rfs
         JOIN asignacion_competencia ac ON ac.id = rfs.asignacion_competencia_id
         JOIN raps r ON r.id = rfs.rap_id
       SET rfs.activo = TRUE, rfs.motivo_baja = NULL
       WHERE ac.competencia_id = ? AND rfs.motivo_baja IS NOT NULL AND ac.activo = TRUE AND r.activo = TRUE`,
      [competenciaId]);
    await horariosOn('competencia_id', competenciaId);
  },

  // ---------------- RAP ----------------
  async rapOff(rapId: number): Promise<void> {
    await pool.query(
      'UPDATE asignacion_rap SET activo = FALSE, motivo_baja = ? WHERE rap_id = ? AND activo = TRUE',
      [CAUSA.RAP, rapId]);
    await pool.query(
      'UPDATE rap_ficha_seguimiento SET activo = FALSE, motivo_baja = ? WHERE rap_id = ? AND activo = TRUE',
      [CAUSA.RAP, rapId]);
    await horariosOff('rap_id', rapId, CAUSA.RAP);
    await pool.query('UPDATE alertas SET atendida = TRUE WHERE rap_id = ? AND atendida = FALSE', [rapId]);
  },

  async rapOn(rapId: number): Promise<void> {
    await pool.query(
      `UPDATE asignacion_rap ar JOIN asignacion_competencia ac ON ac.id = ar.asignacion_competencia_id
       SET ar.activo = TRUE, ar.motivo_baja = NULL
       WHERE ar.rap_id = ? AND ar.motivo_baja IS NOT NULL AND ac.activo = TRUE`,
      [rapId]);
    await pool.query(
      `UPDATE rap_ficha_seguimiento rfs JOIN asignacion_competencia ac ON ac.id = rfs.asignacion_competencia_id
       SET rfs.activo = TRUE, rfs.motivo_baja = NULL
       WHERE rfs.rap_id = ? AND rfs.motivo_baja IS NOT NULL AND ac.activo = TRUE`,
      [rapId]);
    await horariosOn('rap_id', rapId);
  },

  // ---------------- AMBIENTE (solo horarios) ----------------
  async ambienteOff(ambienteId: number): Promise<void> {
    await horariosOff('ambiente_id', ambienteId, CAUSA.AMBIENTE);
  },

  async ambienteOn(ambienteId: number): Promise<void> {
    await horariosOn('ambiente_id', ambienteId);
  },

  // Revive la cadena asignacion -> ac -> ar -> seguimiento apagada por cascada
  // (motivo_baja no nulo) cuyos padres sigan activos. `anchor` filtra sobre `asignacion a`.
  async _asignacionChainOn(anchor: string, params: any[]): Promise<void> {
    await pool.query(
      `UPDATE asignacion a JOIN fichas f ON f.id = a.ficha_id JOIN instructores i ON i.id = a.instructor_id
       SET a.activo = TRUE, a.motivo_baja = NULL
       WHERE ${anchor} AND a.motivo_baja IS NOT NULL AND f.activo = TRUE AND i.activo = TRUE`,
      params);
    await pool.query(
      `UPDATE asignacion_competencia ac
         JOIN asignacion a ON a.id = ac.asignacion_id
         JOIN competencias c ON c.id = ac.competencia_id
       SET ac.activo = TRUE, ac.motivo_baja = NULL
       WHERE ${anchor} AND ac.motivo_baja IS NOT NULL AND a.activo = TRUE AND c.activo = TRUE`,
      params);
    await pool.query(
      `UPDATE asignacion_rap ar
         JOIN asignacion_competencia ac ON ac.id = ar.asignacion_competencia_id
         JOIN asignacion a ON a.id = ac.asignacion_id
         JOIN raps r ON r.id = ar.rap_id
       SET ar.activo = TRUE, ar.motivo_baja = NULL
       WHERE ${anchor} AND ar.motivo_baja IS NOT NULL AND ac.activo = TRUE AND r.activo = TRUE`,
      params);
    await pool.query(
      `UPDATE rap_ficha_seguimiento rfs
         JOIN asignacion_competencia ac ON ac.id = rfs.asignacion_competencia_id
         JOIN asignacion a ON a.id = ac.asignacion_id
         JOIN raps r ON r.id = rfs.rap_id
       SET rfs.activo = TRUE, rfs.motivo_baja = NULL
       WHERE ${anchor} AND rfs.motivo_baja IS NOT NULL AND ac.activo = TRUE AND r.activo = TRUE`,
      params);
  },
};
