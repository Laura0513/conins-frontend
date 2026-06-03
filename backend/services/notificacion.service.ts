import { NotificacionModel } from '../models/notificacion.model.js';
import pool from '../config/db.js';

export const NotificacionService = {
  async notificarInstructor(data: {
    instructor_id: number;
    tipo: string;
    mensaje: string;
    enviarCorreo?: boolean;
  }) {
    const correoEnviado = data.enviarCorreo ?? false;
    await NotificacionModel.crear({
      usuario_id: data.instructor_id,
      tipo: data.tipo,
      mensaje: data.mensaje,
      correo_enviado: correoEnviado,
    });

    if (correoEnviado) {
      await this.enviarCorreoInstructor(data.instructor_id, data.tipo, data.mensaje);
    }
  },

  async notificarLideresPrograma(fichaId: number, tipo: string, mensaje: string) {
    const [rows] = await pool.query(
      `SELECT DISTINCT u.id FROM lider_programa lp
       JOIN instructores i ON lp.instructor_id = i.id
       JOIN usuarios u ON i.usuario_id = u.id
       JOIN fichas f ON lp.programa_id = f.programa_id
       WHERE f.id = ?`,
      [fichaId],
    );
    for (const row of rows as any[]) {
      await NotificacionModel.crear({
        usuario_id: row.id,
        tipo,
        mensaje,
      });
    }
  },

  async notificarCoordinadoresYSubdirector(tipo: string, mensaje: string) {
    const [rows] = await pool.query(
      `SELECT DISTINCT u.id FROM usuario_roles ur
       JOIN roles r ON ur.rol_id = r.id
       JOIN usuarios u ON ur.usuario_id = u.id
       WHERE r.nivel <= 2`,
    );
    for (const row of rows as any[]) {
      await NotificacionModel.crear({
        usuario_id: row.id,
        tipo,
        mensaje,
      });
    }
  },

  async onAsignacionCreada(asignacion: any, instructor: any) {
    await this.notificarInstructor({
      instructor_id: instructor.usuario_id,
      tipo: 'ASIGNACION_CREADA',
      mensaje: `Se te ha asignado a la ficha ${asignacion.ficha_numero} - competencia: ${asignacion.competencia}`,
      enviarCorreo: true,
    });

    await this.notificarLideresPrograma(
      asignacion.ficha_id,
      'ASIGNACION_CREADA',
      `Nueva asignacion para instructor ${instructor.nombre} en ficha ${asignacion.ficha_numero}`,
    );
  },

  async onNovedadRegistrada(instructor: any, tipoNovedad: string, fechaInicio: string, fechaRegreso: string) {
    await this.notificarInstructor({
      instructor_id: instructor.usuario_id,
      tipo: 'NOVEDAD_REGISTRADA',
      mensaje: `Se registro una novedad de tipo ${tipoNovedad} desde ${fechaInicio} hasta ${fechaRegreso}`,
      enviarCorreo: true,
    });

    await this.notificarLideresPrograma(
      instructor.id,
      'NOVEDAD_REGISTRADA',
      `El instructor ${instructor.nombre} tiene una novedad de tipo ${tipoNovedad}`,
    );

    await this.notificarCoordinadoresYSubdirector(
      'NOVEDAD_REGISTRADA',
      `El instructor ${instructor.nombre} tiene una novedad de tipo ${tipoNovedad}`,
    );
  },

  async onAlertaCargaHoraria(instructor: any, horas: number) {
    await this.notificarCoordinadoresYSubdirector(
      'ALERTA_CARGA_HORARIA',
      `El instructor ${instructor.nombre} tiene ${horas}h semanales (fuera de rango 20-40h)`,
    );
  },

  async onAsignacionProvisional(asignacion: any, instructor: any, autorizadoPor: string) {
    await this.notificarInstructor({
      instructor_id: instructor.usuario_id,
      tipo: 'ASIGNACION_PROVISIONAL',
      mensaje: `Se te ha asignado provisionalmente a la ficha ${asignacion.ficha_numero}`,
      enviarCorreo: true,
    });

    await this.notificarCoordinadoresYSubdirector(
      'ASIGNACION_PROVISIONAL',
      `Asignacion provisional registrada para ${instructor.nombre} por ${autorizadoPor}`,
    );
  },

  async enviarCorreoInstructor(usuarioId: number, tipo: string, mensaje: string) {
    const [rows] = await pool.query(
      'SELECT email FROM usuarios WHERE id = ?',
      [usuarioId],
    );
    const email = (rows as any[])[0]?.email;
    if (!email) return;

    const transporter = (await import('../config/mail.js')).default;
    if (!transporter) return;

    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: `CONINS - ${tipo}`,
        text: mensaje,
      });
      await NotificacionModel.crear({
        usuario_id: usuarioId,
        tipo: `${tipo}_CORREO`,
        mensaje: `Correo enviado: ${mensaje}`,
        correo_enviado: true,
      });
    } catch {
      // Silenciar error de correo - no debe bloquear el flujo
    }
  },
};
