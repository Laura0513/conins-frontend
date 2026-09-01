import { AlertaModel, AlertaInput } from '../models/alerta.model.js';
import { AsignacionRapModel } from '../models/asignacion-rap.model.js';
import { NotificacionService } from './notificacion.service.js';

// Genera y persiste alertas SOFT (no bloquean la carga). Quedan visibles en
// GET /api/alertas mientras atendida = FALSE; el admin las acepta/omite con
// PATCH /api/alertas/:id/atendida. Best-effort: un fallo al alertar nunca debe
// tumbar la operacion de negocio que la origino.
export const TIPOS_ALERTA = {
  HORAS_EXCEDIDAS: 'HORAS_EXCEDIDAS',
  HORAS_INSUFICIENTES: 'HORAS_INSUFICIENTES',
  AMBIENTE_OCUPADO: 'AMBIENTE_OCUPADO',
  ASIGNACION_PROVISIONAL: 'ASIGNACION_PROVISIONAL',
  JORNADA_RESTRINGIDA: 'INSTRUCTOR_PLANTA_JORNADA_NOCTURNA',
  RAP_COMPARTIDO: 'RAP_COMPARTIDO',
} as const;

export const AlertaService = {
  // Devuelve true si se creo una alerta NUEVA (no habia una abierta igual). Se
  // usa para disparar la notificacion de campanita solo en alertas nuevas.
  async crear(a: AlertaInput): Promise<boolean> {
    try {
      if (await AlertaModel.existsAbierta(a)) return false;
      await AlertaModel.crear(a);
      return true;
    } catch (err) {
      console.error('[alerta] no se pudo registrar la alerta:', err);
      return false;
    }
  },

  // RN-06 (regla firme, confirmada con coordinacion y lider tecnico): un RAP no
  // puede estar a cargo de dos instructores en el mismo grupo, porque al
  // evaluarlo los aprendices no pueden tener dos juicios distintos del mismo RAP.
  // No se bloquea la carga masiva (para no rechazar el archivo real); se levanta
  // una alerta persistente que queda visible hasta que se CORRIJA el dato
  // (reasignar el RAP a un solo instructor) o el admin/lider la marque atendida.
  async rapCompartido(instructor_id: number, ficha_id: number, rap_id: number): Promise<void> {
    // Mensaje legible para coordinacion: nombre del resultado de aprendizaje,
    // grupo e instructores involucrados (para saber donde esta el error).
    const ctx = await AlertaModel.contextoRapCompartido(ficha_id, rap_id);
    const quienes = ctx.instructores.length >= 2
      ? ctx.instructores.join(' y ')
      : (ctx.instructores[0] ?? 'varios instructores');
    const mensaje = `El resultado de aprendizaje "${ctx.rapNombre}" quedo a cargo de ${ctx.instructores.length || 'varios'} instructores (${quienes}) en el grupo ${ctx.fichaNumero}. Debe quedar con un solo instructor para poder evaluarlo. Revisa y corrige la asignacion.`;

    const creada = await this.crear({ instructor_id, tipo: TIPOS_ALERTA.RAP_COMPARTIDO, mensaje, ficha_id, rap_id });
    if (!creada) return;
    // Notificacion directa (personal) a lideres del programa y a coordinacion:
    // el RAP compartido lo introduce el lider al armar el Excel, y coordinacion
    // debe enterarse. La campanita general se alimenta del CONTEO de alertas no
    // atendidas (ver alerta.controller.contarNoAtendidas); esto es un aviso extra.
    try {
      await NotificacionService.notificarLideresPrograma(ficha_id, TIPOS_ALERTA.RAP_COMPARTIDO, mensaje);
      await NotificacionService.notificarCoordinadoresYSubdirector(TIPOS_ALERTA.RAP_COMPARTIDO, mensaje);
    } catch (err) {
      console.error('[alerta] no se pudo notificar RAP compartido:', err);
    }
  },

  async cerrarRapCompartido(ficha_id: number, rap_id: number): Promise<void> {
    try {
      await AlertaModel.cerrarEstructural(TIPOS_ALERTA.RAP_COMPARTIDO, ficha_id, rap_id);
    } catch (err) {
      console.error('[alerta] no se pudo cerrar la alerta estructural:', err);
    }
  },

  // Tras una edicion en el grupo, cierra las alertas de RAP compartido que ya
  // quedaron resueltas (el RAP dejo de estar a cargo de 2+ instructores).
  async recomputarRapCompartido(ficha_id: number): Promise<void> {
    try {
      const abiertas = await AlertaModel.rapCompartidoAbiertasByFicha(ficha_id);
      for (const { rap_id } of abiertas) {
        const n = await AsignacionRapModel.countInstructoresConRap(ficha_id, rap_id);
        if (n < 2) {
          await AlertaModel.cerrarEstructural(TIPOS_ALERTA.RAP_COMPARTIDO, ficha_id, rap_id);
        }
      }
    } catch (err) {
      console.error('[alerta] no se pudo recomputar RAP compartido:', err);
    }
  },
};
