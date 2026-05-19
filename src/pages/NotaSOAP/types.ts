export interface SectionSData {
  motivoConsulta: string;
  tiempoEnfermedad: string;
  enfermedadActual: string;
  sintomas: Record<string, 'si' | 'no' | undefined>;
  sinoDetalle: Record<string, string>;
  otrosSintomas: string;
}

export interface SectionOData {
  temp: string;
  pa_s: string;
  pa_d: string;
  fc: string;
  fr: string;
  peso: string;
  talla: string;
  spo2: string;
  estadoGeneral: string;
  piel: string;
  edema: 'si' | 'no';
  edemaLoc: string;
  edemaGrado: string;
  edemaDetalle: string;
  cardiovascular: string;
  respiratorio: string;
  abdomen: string;
  neurologico: string;
  musculoesqueletico: string;
  otrosAp: string;
}

export interface Diagnostico {
  code: string;
  name: string;
  tipo: 'presuntivo' | 'confirmado';
}

// Grupo "Otros diagnósticos" exigido por la NTS-022 (Formato de Consulta Externa).
// Todos opcionales: se registran solo cuando el caso lo amerita.
export interface OtrosDiagnosticos {
  riesgo: string;          // Diagnóstico de riesgo
  nutricional: string;     // Diagnóstico nutricional
  saludMental: string;     // Diagnóstico de salud mental
  causaExterna: string;    // Diagnóstico de causa externa de morbilidad
  estadoFuncional: string; // Diagnóstico de discapacidad / estado funcional
}

export interface SectionAData {
  diagnoses: Diagnostico[];
  diferenciales: string;
  severidad: 'Leve' | 'Moderada' | 'Severa' | '';
  evaluacion: string;
  otrosDiagnosticos: OtrosDiagnosticos;
}

export interface SectionPData {
  medidas: string[];
  otrasIndicaciones: string;
  proximaCita: string;
  tiempoSeguimiento: string;
  criteriosAlarma: string;
}

export interface SOAPData {
  S: SectionSData;
  O: SectionOData;
  A: SectionAData;
  P: SectionPData;
}

export interface ExamenOrdenado {
  _uid?: string;
  nombre: string;
  tipo: 'Laboratorio' | 'Radiología' | 'Especializado';
  urgente: boolean;
}

export interface MedicamentoSOAP {
  _uid?: string;
  nombre: string;
  concentracion: string;
  forma: string;
  via: string;
  dosis: string;
  frecuencia: string;
  duracion: string;
  instrucciones?: string;
}

// El catálogo CIE-10 ya no se mantiene en el frontend: se consulta el catálogo
// oficial completo (SUSALUD, ~12,600 códigos) vía CIE10ApiService → /api/cie10.

export type EspecialidadData = Record<string, string>;

export const INITIAL_SOAP: SOAPData = {
  S: { motivoConsulta: '', tiempoEnfermedad: '', enfermedadActual: '', sintomas: {}, sinoDetalle: {}, otrosSintomas: '' },
  O: { temp: '', pa_s: '', pa_d: '', fc: '', fr: '', peso: '', talla: '', spo2: '', estadoGeneral: '', piel: '', edema: 'no', edemaLoc: '', edemaGrado: '', edemaDetalle: '', cardiovascular: '', respiratorio: '', abdomen: '', neurologico: '', musculoesqueletico: '', otrosAp: '' },
  A: { diagnoses: [], diferenciales: '', severidad: '', evaluacion: '', otrosDiagnosticos: { riesgo: '', nutricional: '', saludMental: '', causaExterna: '', estadoFuncional: '' } },
  P: { medidas: [], otrasIndicaciones: '', proximaCita: '', tiempoSeguimiento: '', criteriosAlarma: '' },
};
