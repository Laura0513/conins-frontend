// Maximo semanal autorizado por tipo de vinculacion (feedback 16/09/2026):
//   contrato = 40 h · planta = 32.5 h. Minimo 20 h para ambos (dispara 'bajo carga').
export const LIMITES_HORAS: Record<string, { min: number; max: number }> = {
  contrato: { min: 20, max: 40 },
  planta: { min: 20, max: 32.5 },
};

// Vinculacion por defecto si el instructor no la tiene definida.
export const VINCULACION_DEFAULT = 'contrato';

export function limitesDe(vinculacion?: string | null) {
  return LIMITES_HORAS[(vinculacion ?? VINCULACION_DEFAULT).toLowerCase()] ?? LIMITES_HORAS.contrato;
}
