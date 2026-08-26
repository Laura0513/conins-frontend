import { InstructorModel } from '../models/instructor.model.js';
import { CompetenciaModel } from '../models/competencia.model.js';
import { UsuarioModel } from '../models/usuario.model.js';
import { NotFoundError, ForbiddenError, ValidationError, ConflictError } from '../utils/errors.js';
import pool from '../config/db.js';
import { auditStore } from '../config/audit-context.js';
import { getLunesSemanaActual } from '../utils/date.js';

export const InstructorService = {
  async getAll() {
    const instructors = await InstructorModel.findAll();
    const semana = getLunesSemanaActual();
    const horasMap = await InstructorModel.getHorasSemanalesTodos(semana);
    const result = [];
    for (const i of instructors) {
      const tieneNovedad = await InstructorModel.tieneNovedadActiva(i.usuario_id);
      result.push({
        ...i,
        horas_semana: horasMap.get(i.id) ?? 0,
        tiene_novedad: tieneNovedad,
      });
    }
    return result;
  },

  async getById(id: number) {
    const instructor = await InstructorModel.findById(id);
    if (!instructor) throw new NotFoundError('Instructor no encontrado');
    return instructor;
  },

  async getOwnProfile(usuarioId: number) {
    const instructor = await InstructorModel.findByUsuarioId(usuarioId);
    if (!instructor) throw new NotFoundError('Perfil de instructor no encontrado');
    const detalle = await InstructorModel.findById(instructor.id);
    if (!detalle) throw new NotFoundError('Instructor no encontrado');
    return detalle;
  },

  async update(id: number, tipo_area?: string) {
    const instructor = await InstructorModel.findById(id);
    if (!instructor) throw new NotFoundError('Instructor no encontrado');

    if (tipo_area && tipo_area !== instructor.tipo_area) {
      const hasActiveCompetencias = await InstructorModel.hasActiveCompetencias(instructor.usuario_id);
      if (hasActiveCompetencias) {
        throw new ValidationError('No se puede cambiar el tipo de area: el instructor tiene asignaciones activas');
      }
    }

    await InstructorModel.update(id, tipo_area);
    return InstructorModel.findById(id);
  },

  async toggleEstado(id: number) {
    const instructor = await InstructorModel.findById(id);
    if (!instructor) throw new NotFoundError('Instructor no encontrado');

    if (!instructor.activo) {
      const hasActiveCompetencias = await InstructorModel.hasActiveCompetencias(instructor.usuario_id);
      if (hasActiveCompetencias) {
        throw new ForbiddenError('No se puede activar: el instructor tiene asignaciones activas');
      }
    }

    const nuevoEstado = await InstructorModel.toggleActivo(id);
    return { activo: nuevoEstado };
  },

  async getCompetenciasHabilitadas(instructorId: number) {
    const instructor = await InstructorModel.findById(instructorId);
    if (!instructor) throw new NotFoundError('Instructor no encontrado');
    return InstructorModel.getCompetenciasHabilitadas(instructorId);
  },

  async addCompetencia(instructorId: number, competenciaId: number) {
    const instructor = await InstructorModel.findById(instructorId);
    if (!instructor) throw new NotFoundError('Instructor no encontrado');

    const competencia = await CompetenciaModel.findById(competenciaId);
    if (!competencia) throw new NotFoundError('Competencia no encontrada');

    await InstructorModel.addCompetencia(instructorId, competenciaId);
    return InstructorModel.getCompetenciasHabilitadas(instructorId);
  },

  async removeCompetencia(instructorId: number, competenciaId: number) {
    const instructor = await InstructorModel.findById(instructorId);
    if (!instructor) throw new NotFoundError('Instructor no encontrado');

    const competencia = await CompetenciaModel.findById(competenciaId);
    if (!competencia) throw new NotFoundError('Competencia no encontrada');

    await InstructorModel.removeCompetencia(instructorId, competenciaId);
    return InstructorModel.getCompetenciasHabilitadas(instructorId);
  },

  async create(nombre: string, email: string, tipoArea: string) {
    const exists = await UsuarioModel.emailExists(email);
    if (exists) throw new ConflictError('Ya existe un usuario con ese email');

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Atribucion de auditoria en la MISMA conexion de la transaccion (esta ruta
      // usa getConnection y no pasa por el wrapper de pool.query).
      const auditUid = auditStore.getStore()?.usuarioId ?? null;
      await conn.query('SET @audit_usuario_id = ?', [auditUid]);

      const [userResult] = await conn.query(
        'INSERT INTO usuarios (nombre, email) VALUES (?, ?)',
        [nombre, email],
      );
      const usuarioId = (userResult as any).insertId;

      await conn.query(
        'INSERT INTO usuario_roles (usuario_id, rol_id) VALUES (?, ?)',
        [usuarioId, 4], // ID 4 = Instructor (era 5 antes del cambio de roles 01/07/2026)
      );

      const [instResult] = await conn.query(
        'INSERT INTO instructores (usuario_id, tipo_area) VALUES (?, ?)',
        [usuarioId, tipoArea],
      );

      await conn.commit();
      return { id: (instResult as any).insertId, usuario_id: usuarioId };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  // Idempotente por email. Usado por el importador (P39): si el usuario ya
  // existe (p. ej. cargado por seed o import previo), reusa su instructor en
  // vez de romper con ConflictError; si el usuario existe pero no tiene fila
  // de instructor, la crea. Solo crea usuario nuevo cuando el email no existe.
  async findOrCreateByEmail(nombre: string, email: string, tipoArea: string) {
    const emailNorm = email.trim().toLowerCase();
    const usuario = await UsuarioModel.findByEmail(emailNorm);
    if (usuario) {
      const inst = await InstructorModel.findByUsuarioId(usuario.id);
      if (inst) return { id: inst.id, usuario_id: usuario.id, reused: true };
      await InstructorModel.create(usuario.id, tipoArea);
      const creado = await InstructorModel.findByUsuarioId(usuario.id);
      if (!creado) throw new NotFoundError('No se pudo crear el instructor para el usuario existente');
      return { id: creado.id, usuario_id: usuario.id, reused: true };
    }
    const nuevo = await this.create(nombre, emailNorm, tipoArea);
    return { ...nuevo, reused: false };
  },

  async registrarNovedad(
    instructorId: number,
    tipoNovedadId: number,
    fechaInicio: string,
    fechaRegreso: string,
    observacion?: string,
  ) {
    const instructor = await InstructorModel.findById(instructorId);
    if (!instructor) throw new NotFoundError('Instructor no encontrado');

    if (new Date(fechaRegreso) < new Date(fechaInicio)) {
      throw new ValidationError('La fecha de regreso debe ser posterior a la fecha de inicio');
    }

    const novedadId = await InstructorModel.crearNovedad(
      instructorId,
      tipoNovedadId,
      fechaInicio,
      fechaRegreso,
      observacion,
    );
    return { id: novedadId, instructor_id: instructorId };
  },

  async getDetalle(instructorId: number) {
    const detalle = await InstructorModel.getDetalle(instructorId);
    if (!detalle) throw new NotFoundError('Instructor no encontrado');
    return detalle;
  },
};
