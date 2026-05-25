import { AreaModel } from '../models/area.model.js';
import { ProgramaModel } from '../models/programa.model.js';
import { CompetenciaModel } from '../models/competencia.model.js';
import { RapModel } from '../models/rap.model.js';
import { NotFoundError } from '../utils/errors.js';

export const CatalogoService = {
  async getAreas() {
    return AreaModel.findAll();
  },

  async getProgramas() {
    return ProgramaModel.findAll();
  },

  async getProgramaById(id: number) {
    const programa = await ProgramaModel.findById(id);
    if (!programa) throw new NotFoundError('Programa no encontrado');
    return programa;
  },

  async getCompetenciasByPrograma(programaId: number) {
    const programa = await ProgramaModel.findById(programaId);
    if (!programa) throw new NotFoundError('Programa no encontrado');
    return CompetenciaModel.findByPrograma(programaId);
  },

  async getCompetenciaById(id: number) {
    const competencia = await CompetenciaModel.findById(id);
    if (!competencia) throw new NotFoundError('Competencia no encontrada');
    return competencia;
  },

  async getRapsByCompetencia(competenciaId: number) {
    const competencia = await CompetenciaModel.findById(competenciaId);
    if (!competencia) throw new NotFoundError('Competencia no encontrada');
    return RapModel.findByCompetencia(competenciaId);
  },
};
