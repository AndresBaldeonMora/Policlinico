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

export interface SectionAData {
  diagnoses: Diagnostico[];
  diferenciales: string;
  severidad: 'Leve' | 'Moderada' | 'Severa' | '';
  evaluacion: string;
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
  nombre: string;
  tipo: 'Laboratorio' | 'Radiología' | 'Especializado';
  urgente: boolean;
}

export interface MedicamentoSOAP {
  nombre: string;
  concentracion: string;
  forma: string;
  via: string;
  dosis: string;
  frecuencia: string;
  duracion: string;
  instrucciones?: string;
}

export const CIE10_DB: { code: string; name: string }[] = [
  { code: 'I10',   name: 'Hipertensión arterial esencial' },
  { code: 'I50.0', name: 'Insuficiencia cardíaca congestiva' },
  { code: 'I50.1', name: 'Insuficiencia ventricular izquierda' },
  { code: 'I50.9', name: 'Insuficiencia cardíaca no especificada' },
  { code: 'E11',   name: 'Diabetes mellitus tipo 2' },
  { code: 'E11.9', name: 'DM tipo 2 sin complicaciones' },
  { code: 'J06.9', name: 'IRA vías respiratorias superiores' },
  { code: 'J18.9', name: 'Neumonía no especificada' },
  { code: 'J45.9', name: 'Asma no especificada' },
  { code: 'J20.9', name: 'Bronquitis aguda no especificada' },
  { code: 'J02.9', name: 'Faringitis aguda no especificada' },
  { code: 'N39.0', name: 'Infección de vías urinarias' },
  { code: 'M54.5', name: 'Lumbalgia' },
  { code: 'K29.7', name: 'Gastritis no especificada' },
  { code: 'E78',   name: 'Trastornos del metabolismo de lipoproteínas' },
  { code: 'Z34',   name: 'Supervisión del embarazo normal' },
  { code: 'A09',   name: 'Gastroenteritis y colitis infecciosa' },
  { code: 'R51',   name: 'Cefalea' },
  { code: 'D50',   name: 'Anemia ferropénica' },
  { code: 'F32.9', name: 'Episodio depresivo, no especificado' },
  { code: 'G43.9', name: 'Migraña, no especificada' },
  { code: 'L20.9', name: 'Dermatitis atópica, no especificada' },
  { code: 'B34.9', name: 'Infección viral, no especificada' },
];

export type EspecialidadData = Record<string, string>;

export const INITIAL_SOAP: SOAPData = {
  S: { motivoConsulta: '', tiempoEnfermedad: '', enfermedadActual: '', sintomas: {}, sinoDetalle: {}, otrosSintomas: '' },
  O: { temp: '', pa_s: '', pa_d: '', fc: '', fr: '', peso: '', talla: '', spo2: '', estadoGeneral: '', piel: '', edema: 'no', edemaLoc: '', edemaGrado: '', edemaDetalle: '', cardiovascular: '', respiratorio: '', abdomen: '', neurologico: '', musculoesqueletico: '', otrosAp: '' },
  A: { diagnoses: [], diferenciales: '', severidad: '', evaluacion: '' },
  P: { medidas: [], otrasIndicaciones: '', proximaCita: '', tiempoSeguimiento: '', criteriosAlarma: '' },
};
