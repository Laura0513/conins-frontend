// Nomenclatura configurable (RN-17)
// Para cambiar "Ficha" por "Grupo" en el futuro, solo modificar este archivo.

export const TERMINOLOGY = {
  ficha: "Grupo",
  fichas: "Grupos",
  registrarFicha: "Registrar grupo",
  noFicha: "No. Grupo",
  fichaPlaceholder: "2995403",
  fichasGestion: "Gestión de grupos de formación",
} as const

// Mapeo de valores del backend a texto legible con tildes
const JORNADAS_DISPLAY: Record<string, string> = {
  manana: "Mañana",
  Manana: "Mañana",
  mixta: "Mixta",
  Mixta: "Mixta",
  noche: "Noche",
  Noche: "Noche",
  virtual: "Virtual",
  Virtual: "Virtual",
  tarde: "Tarde",
  Tarde: "Tarde",
}

const ETAPAS_DISPLAY: Record<string, string> = {
  lectiva: "Lectiva",
  productiva: "Productiva",
}

const MODALIDADES_DISPLAY: Record<string, string> = {
  presencial: "Presencial",
  virtual: "Virtual",
}

export function formatJornada(valor: string): string {
  return JORNADAS_DISPLAY[valor] || valor
}

export function formatEtapa(valor: string): string {
  return ETAPAS_DISPLAY[valor.toLowerCase()] || valor
}

export function formatModalidad(valor: string): string {
  return MODALIDADES_DISPLAY[valor.toLowerCase()] || valor
}
