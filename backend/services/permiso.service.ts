export const PermisoService = {
  // 01/07/2026: lider_programa ya NO es un rol del sistema.
  // La restriccion de asignaciones provisionales para lideres fue removida.
  // Funcion mantenida para no romper callers en asignacion.service.ts.
  async validarNoLiderParaProvisional(_usuarioId: number): Promise<void> {
    return;
  },

  // 01/07/2026: la distincion medular/transversal fue eliminada (feedback coordinadora).
  // Coordinadora Academica y Asistente Coordinacion gestionan todas las fichas.
  // Funcion conservada para no romper callers; ya no aplica restriccion de tipo_linea.
  async validarAlcanceCoordinador(_usuarioId: number, _fichaId: number): Promise<void> {
    return;
  },
};
