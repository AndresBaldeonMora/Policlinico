import { useState } from "react";
import { Save, AlertCircle } from "lucide-react";
import { PacienteApiService } from "../../services/paciente.service";
import Swal from "sweetalert2";

type TabHC = "anamMedico" | "medicinaGeneral" | "pediatria" | "odontologia" | "reumatologia" | "ginecologia" | "cardiologia" | "endocrinologia" | "neumologia" | "gastroenterologia" | "psiquiatria";

interface Props {
  pacienteId: string;
  historiaClinica: Record<string, Record<string, string>>;
  tabActivo: TabHC;
  onActualizar: () => Promise<void>;
}

const TABS: { id: TabHC; label: string; nombre: string }[] = [
  { id: "anamMedico", label: "Anam. médico", nombre: "anamMedico" },
  { id: "medicinaGeneral", label: "Medicina General", nombre: "medicinaGeneral" },
  { id: "pediatria", label: "Pediatría", nombre: "pediatria" },
  { id: "odontologia", label: "Odontología", nombre: "odontologia" },
  { id: "reumatologia", label: "Reumatología", nombre: "reumatologia" },
  { id: "ginecologia", label: "Ginecología y Obstetricia", nombre: "ginecologia" },
  { id: "cardiologia", label: "Cardiología", nombre: "cardiologia" },
  { id: "endocrinologia", label: "Endocrinología", nombre: "endocrinologia" },
  { id: "neumologia", label: "Neumología", nombre: "neumologia" },
  { id: "gastroenterologia", label: "Gastroenterología", nombre: "gastroenterologia" },
  { id: "psiquiatria", label: "Psiquiatría", nombre: "psiquiatria" },
];

export default function HistoriaClinicaTabs({ pacienteId, historiaClinica, tabActivo, onActualizar }: Props) {
  const [guardando, setGuardando] = useState(false);

  const guardarFormulario = async (especialidad: string, campos: Record<string, string>) => {
    setGuardando(true);
    try {
      await PacienteApiService.guardarHistoriaClinicaEspecialidad(pacienteId, especialidad, campos);
      await onActualizar();
      Swal.fire({
        icon: "success",
        title: "Guardado",
        text: "Historia clínica actualizada correctamente",
        confirmButtonColor: "var(--primary)",
        timer: 2000,
      });
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "No se pudo guardar",
        confirmButtonColor: "var(--primary)",
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="hc-form-panel">
        {tabActivo === "anamMedico" && (
          <FormAnamMedico
            datos={historiaClinica.anamMedico || {}}
            onGuardar={(campos) => guardarFormulario("anamMedico", campos)}
            guardando={guardando}
          />
        )}
        {tabActivo === "medicinaGeneral" && (
          <FormMedicinaGeneral
            datos={historiaClinica.medicinaGeneral || {}}
            onGuardar={(campos) => guardarFormulario("medicinaGeneral", campos)}
            guardando={guardando}
          />
        )}
        {tabActivo === "pediatria" && (
          <FormPediatria
            datos={historiaClinica.pediatria || {}}
            onGuardar={(campos) => guardarFormulario("pediatria", campos)}
            guardando={guardando}
          />
        )}
        {tabActivo === "odontologia" && (
          <FormOdontologia
            datos={historiaClinica.odontologia || {}}
            onGuardar={(campos) => guardarFormulario("odontologia", campos)}
            guardando={guardando}
          />
        )}
        {tabActivo === "reumatologia" && (
          <FormReumatologia
            datos={historiaClinica.reumatologia || {}}
            onGuardar={(campos) => guardarFormulario("reumatologia", campos)}
            guardando={guardando}
          />
        )}
        {tabActivo === "ginecologia" && (
          <FormGinecologia
            datos={historiaClinica.ginecologia || {}}
            onGuardar={(campos) => guardarFormulario("ginecologia", campos)}
            guardando={guardando}
          />
        )}
        {tabActivo === "cardiologia" && (
          <FormCardiologia
            datos={historiaClinica.cardiologia || {}}
            onGuardar={(campos) => guardarFormulario("cardiologia", campos)}
            guardando={guardando}
          />
        )}
        {tabActivo === "endocrinologia" && (
          <FormEndocrinologia
            datos={historiaClinica.endocrinologia || {}}
            onGuardar={(campos) => guardarFormulario("endocrinologia", campos)}
            guardando={guardando}
          />
        )}
        {tabActivo === "neumologia" && (
          <FormNeumologia
            datos={historiaClinica.neumologia || {}}
            onGuardar={(campos) => guardarFormulario("neumologia", campos)}
            guardando={guardando}
          />
        )}
        {tabActivo === "gastroenterologia" && (
          <FormGastroenterologia
            datos={historiaClinica.gastroenterologia || {}}
            onGuardar={(campos) => guardarFormulario("gastroenterologia", campos)}
            guardando={guardando}
          />
        )}
        {tabActivo === "psiquiatria" && (
          <FormPsiquiatria
            datos={historiaClinica.psiquiatria || {}}
            onGuardar={(campos) => guardarFormulario("psiquiatria", campos)}
            guardando={guardando}
          />
        )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FORMULARIOS POR ESPECIALIDAD
// ─────────────────────────────────────────────────────────────

interface FormProps {
  datos: Record<string, string>;
  onGuardar: (campos: Record<string, string>) => Promise<void>;
  guardando: boolean;
}

function FormAnamMedico({ datos, onGuardar, guardando }: FormProps) {
  const [form, setForm] = useState(datos);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    await onGuardar(form);
  };

  return (
    <form className="hc-form-grid" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      <h3 className="hc-section-title">INFORMACIÓN ADMINISTRATIVA</h3>

      <div className="hc-field-row hc-field-row--2col">
        <div className="hc-field">
          <label>Fecha de atención</label>
          <input type="date" value={form.fechaAtencion || ""} onChange={(e) => handleChange("fechaAtencion", e.target.value)} />
        </div>
        <div className="hc-field">
          <label>Hora de atención</label>
          <input type="time" value={form.horaAtencion || ""} onChange={(e) => handleChange("horaAtencion", e.target.value)} />
        </div>
      </div>

      <div className="hc-field-row hc-field-row--2col">
        <div className="hc-field">
          <label>Documento de identidad (DNI/Pasaporte)</label>
          <input type="text" value={form.numDocumento || ""} onChange={(e) => handleChange("numDocumento", e.target.value)} />
        </div>
        <div className="hc-field">
          <label>Edad</label>
          <input type="number" value={form.edad || ""} onChange={(e) => handleChange("edad", e.target.value)} />
        </div>
      </div>

      <h3 className="hc-section-title">ENFERMEDAD ACTUAL</h3>

      <div className="hc-field">
        <label>Motivo de consulta</label>
        <textarea value={form.motivoConsulta || ""} onChange={(e) => handleChange("motivoConsulta", e.target.value)} />
      </div>

      <div className="hc-field-row hc-field-row--2col">
        <div className="hc-field">
          <label>Tiempo de evolución</label>
          <input type="text" placeholder="" value={form.tiempoEnfermedad || ""} onChange={(e) => handleChange("tiempoEnfermedad", e.target.value)} />
        </div>
        <div className="hc-field">
          <label>Síntomas acompañantes</label>
          <input type="text" value={form.sintomasAcompanantes || ""} onChange={(e) => handleChange("sintomasAcompanantes", e.target.value)} />
        </div>
      </div>

      <div className="hc-field">
        <label>Factores que alivian o empeoran</label>
        <textarea value={form.factoresAlivio || ""} onChange={(e) => handleChange("factoresAlivio", e.target.value)} />
      </div>

      <h3 className="hc-section-title">DATOS VITALES</h3>

      <div className="hc-field-row hc-field-row--4col">
        <div className="hc-field hc-field--unit">
          <div>
            <label>Presión Arterial</label>
            <input type="text" placeholder="" value={form.presionArterial || ""} onChange={(e) => handleChange("presionArterial", e.target.value)} />
          </div>
          <span className="hc-unit">mmHg</span>
        </div>
        <div className="hc-field hc-field--unit">
          <div>
            <label>Frecuencia Cardíaca</label>
            <input type="number" value={form.frecuenciaCardiaca || ""} onChange={(e) => handleChange("frecuenciaCardiaca", e.target.value)} />
          </div>
          <span className="hc-unit">lpm</span>
        </div>
        <div className="hc-field hc-field--unit">
          <div>
            <label>Frecuencia Respiratoria</label>
            <input type="number" value={form.frecuenciaRespiratoria || ""} onChange={(e) => handleChange("frecuenciaRespiratoria", e.target.value)} />
          </div>
          <span className="hc-unit">x/min</span>
        </div>
        <div className="hc-field hc-field--unit">
          <div>
            <label>Temperatura</label>
            <input type="number" step="0.1" value={form.temperatura || ""} onChange={(e) => handleChange("temperatura", e.target.value)} />
          </div>
          <span className="hc-unit">°C</span>
        </div>
      </div>

      <div className="hc-field-row hc-field-row--2col">
        <div className="hc-field hc-field--unit">
          <div>
            <label>Saturación de Oxígeno</label>
            <input type="number" step="0.1" value={form.satO2 || ""} onChange={(e) => handleChange("satO2", e.target.value)} />
          </div>
          <span className="hc-unit">%</span>
        </div>
      </div>

      <h3 className="hc-section-title">ANTROPOMETRÍA</h3>

      <div className="hc-field-row hc-field-row--3col">
        <div className="hc-field hc-field--unit">
          <div>
            <label>Peso</label>
            <input type="number" step="0.1" value={form.peso || ""} onChange={(e) => handleChange("peso", e.target.value)} />
          </div>
          <span className="hc-unit">kg</span>
        </div>
        <div className="hc-field hc-field--unit">
          <div>
            <label>Talla</label>
            <input type="number" step="0.1" value={form.talla || ""} onChange={(e) => handleChange("talla", e.target.value)} />
          </div>
          <span className="hc-unit">cm</span>
        </div>
        <div className="hc-field">
          <label>IMC</label>
          <input type="number" step="0.1" value={form.imc || ""} onChange={(e) => handleChange("imc", e.target.value)} />
        </div>
      </div>

      <h3 className="hc-section-title">ANTECEDENTES</h3>

      <div className="hc-field">
        <label>Antecedentes Patológicos (enfermedades crónicas previas)</label>
        <textarea value={form.antecedentesPatologicos || ""} onChange={(e) => handleChange("antecedentesPatologicos", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Antecedentes Quirúrgicos</label>
        <textarea value={form.antecedentesQuirurgicos || ""} onChange={(e) => handleChange("antecedentesQuirurgicos", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Antecedentes Traumáticos</label>
        <textarea value={form.antecedentesTraumaticos || ""} onChange={(e) => handleChange("antecedentesTraumaticos", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Antecedentes Fisiológicos (ciclos menstruales, pubertad, etc.)</label>
        <textarea value={form.antecedenteFisiologico || ""} onChange={(e) => handleChange("antecedenteFisiologico", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Antecedentes Familiares (enfermedades hereditarias)</label>
        <textarea value={form.antecedentesFamiliares || ""} onChange={(e) => handleChange("antecedentesFamiliares", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Medicamentos actuales (nombre genérico, dosis, vía, frecuencia)</label>
        <textarea value={form.medicamentosActuales || ""} onChange={(e) => handleChange("medicamentosActuales", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Alergias a medicamentos</label>
        <textarea value={form.alergiaMedicamentos || ""} onChange={(e) => handleChange("alergiaMedicamentos", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Alergias a alimentos / sustancias</label>
        <textarea value={form.alergiasAlimentos || ""} onChange={(e) => handleChange("alergiasAlimentos", e.target.value)} />
      </div>

      <h3 className="hc-section-title">EXAMEN FÍSICO GENERAL</h3>

      <div className="hc-field">
        <label>Estado general del paciente</label>
        <textarea value={form.estadoGeneral || ""} onChange={(e) => handleChange("estadoGeneral", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Piel y mucosas</label>
        <textarea value={form.pielMucosas || ""} onChange={(e) => handleChange("pielMucosas", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Cabeza y cuello</label>
        <textarea value={form.cabezaCuello || ""} onChange={(e) => handleChange("cabezaCuello", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Tórax y pulmones</label>
        <textarea value={form.torax || ""} onChange={(e) => handleChange("torax", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Corazón</label>
        <textarea value={form.corazon || ""} onChange={(e) => handleChange("corazon", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Abdomen</label>
        <textarea value={form.abdomen || ""} onChange={(e) => handleChange("abdomen", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Extremidades</label>
        <textarea value={form.extremidades || ""} onChange={(e) => handleChange("extremidades", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Signos neurológicos</label>
        <textarea value={form.signosNeurologicos || ""} onChange={(e) => handleChange("signosNeurologicos", e.target.value)} />
      </div>

      <h3 className="hc-section-title">DIAGNÓSTICO Y PLAN</h3>

      <div className="hc-field">
        <label>Diagnóstico Presuntivo (CIE-10)</label>
        <textarea value={form.diagnosticoPresuntivo || ""} onChange={(e) => handleChange("diagnosticoPresuntivo", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Diagnóstico Definitivo (CIE-10)</label>
        <textarea value={form.diagnostico || ""} onChange={(e) => handleChange("diagnostico", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Diagnósticos Diferenciales</label>
        <textarea value={form.diagnosticosDiferenciales || ""} onChange={(e) => handleChange("diagnosticosDiferenciales", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Estudios complementarios solicitados</label>
        <textarea value={form.examenesAuxiliares || ""} onChange={(e) => handleChange("examenesAuxiliares", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Tratamiento (nombre genérico, dosis, vía, frecuencia, duración)</label>
        <textarea value={form.tratamiento || ""} onChange={(e) => handleChange("tratamiento", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Medidas higiénico-dietéticas</label>
        <textarea value={form.medidasHigienicas || ""} onChange={(e) => handleChange("medidasHigienicas", e.target.value)} />
      </div>

      <div className="hc-field-row hc-field-row--2col">
        <div className="hc-field">
          <label>Fecha de próxima cita</label>
          <input type="date" value={form.proximaCita || ""} onChange={(e) => handleChange("proximaCita", e.target.value)} />
        </div>
        <div className="hc-field">
          <label>Referencia a otro servicio (si aplica)</label>
          <input type="text" value={form.referencia || ""} onChange={(e) => handleChange("referencia", e.target.value)} />
        </div>
      </div>

      <div className="hc-field">
        <label>Observaciones adicionales</label>
        <textarea value={form.observaciones || ""} onChange={(e) => handleChange("observaciones", e.target.value)} />
      </div>

      <div className="hc-form-actions">
        <button type="submit" className="hc-save-btn" disabled={guardando}>
          <Save size={16} /> {guardando ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}

function FormMedicinaGeneral({ datos, onGuardar, guardando }: FormProps) {
  const [form, setForm] = useState(datos);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setForm(prev => ({ ...prev, [field]: checked ? "si" : "" }));
  };

  const handleSubmit = async () => {
    await onGuardar(form);
  };

  const sistemas = [
    { id: "cardiovascular", label: "Cardiovascular" },
    { id: "respiratorio", label: "Respiratorio" },
    { id: "digestivo", label: "Digestivo" },
    { id: "genitourinario", label: "Genitourinario" },
    { id: "neurologico", label: "Neurológico" },
    { id: "musculoesqueletico", label: "Musculoesquelético" },
    { id: "hematologico", label: "Hematológico" },
    { id: "endocrino", label: "Endocrino" },
  ];

  return (
    <form className="hc-form-grid" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      <h3 className="hc-section-title">REVISIÓN POR SISTEMAS</h3>

      <div className="hc-field">
        <label>Sistemas afectados (seleccione según corresponda)</label>
        <div className="hc-checklist">
          {sistemas.map(s => (
            <label key={s.id} className="hc-checkbox-item">
              <input
                type="checkbox"
                checked={form[s.id] === "si"}
                onChange={(e) => handleCheckboxChange(s.id, e.target.checked)}
              />
              <span>{s.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="hc-field">
        <label>Descripción detallada de sistemas afectados</label>
        <textarea value={form.detallesSistemas || ""} onChange={(e) => handleChange("detallesSistemas", e.target.value)} />
      </div>

      <h3 className="hc-section-title">ANTROPOMETRÍA Y MEDIDAS</h3>

      <div className="hc-field-row hc-field-row--4col">
        <div className="hc-field hc-field--unit">
          <div>
            <label>Peso</label>
            <input type="number" step="0.1" value={form.peso || ""} onChange={(e) => handleChange("peso", e.target.value)} />
          </div>
          <span className="hc-unit">kg</span>
        </div>
        <div className="hc-field hc-field--unit">
          <div>
            <label>Talla</label>
            <input type="number" step="0.1" value={form.talla || ""} onChange={(e) => handleChange("talla", e.target.value)} />
          </div>
          <span className="hc-unit">cm</span>
        </div>
        <div className="hc-field">
          <label>IMC</label>
          <input type="number" step="0.1" value={form.imc || ""} onChange={(e) => handleChange("imc", e.target.value)} />
        </div>
        <div className="hc-field">
          <label>Relación cintura-cadera</label>
          <input type="number" step="0.01" value={form.relCinturaCadera || ""} onChange={(e) => handleChange("relCinturaCadera", e.target.value)} />
        </div>
      </div>

      <div className="hc-field-row hc-field-row--2col">
        <div className="hc-field hc-field--unit">
          <div>
            <label>Circunferencia cintura</label>
            <input type="number" step="0.1" value={form.circuncintura || ""} onChange={(e) => handleChange("circuncintura", e.target.value)} />
          </div>
          <span className="hc-unit">cm</span>
        </div>
        <div className="hc-field hc-field--unit">
          <div>
            <label>Circunferencia cadera</label>
            <input type="number" step="0.1" value={form.circuncadera || ""} onChange={(e) => handleChange("circuncadera", e.target.value)} />
          </div>
          <span className="hc-unit">cm</span>
        </div>
      </div>

      <h3 className="hc-section-title">HÁBITOS Y FACTORES DE RIESGO</h3>

      <div className="hc-field">
        <label>Tabaquismo</label>
        <select value={form.tabaquismo || ""} onChange={(e) => handleChange("tabaquismo", e.target.value)}>
          <option value="">Seleccionar...</option>
          <option value="nunca">Nunca fumador</option>
          <option value="exfumador">Exfumador</option>
          <option value="activo">Fumador activo</option>
        </select>
      </div>

      <div className="hc-field">
        <label>Consumo de alcohol</label>
        <select value={form.alcohol || ""} onChange={(e) => handleChange("alcohol", e.target.value)}>
          <option value="">Seleccionar...</option>
          <option value="no">No consume</option>
          <option value="ocasional">Ocasional</option>
          <option value="regular">Regular</option>
          <option value="excesivo">Excesivo</option>
        </select>
      </div>

      <div className="hc-field">
        <label>Actividad física</label>
        <input type="text" placeholder="" value={form.actividadFisica || ""} onChange={(e) => handleChange("actividadFisica", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Ocupación y exposición laboral</label>
        <textarea value={form.ocupacion || ""} onChange={(e) => handleChange("ocupacion", e.target.value)} />
      </div>

      <h3 className="hc-section-title">SCREENING PREVENTIVO</h3>

      <div className="hc-field">
        <label>Screening preventivo realizado</label>
        <textarea placeholder="" value={form.screeningPreventivo || ""} onChange={(e) => handleChange("screeningPreventivo", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Vacunas actualizadas</label>
        <textarea placeholder="" value={form.vacunas || ""} onChange={(e) => handleChange("vacunas", e.target.value)} />
      </div>

      <h3 className="hc-section-title">LABORATORIOS (si aplica)</h3>

      <div className="hc-field-row hc-field-row--4col">
        <div className="hc-field">
          <label>Glucosa basal</label>
          <input type="number" step="0.1" value={form.glucosa || ""} onChange={(e) => handleChange("glucosa", e.target.value)} />
        </div>
        <div className="hc-field">
          <label>Colesterol total</label>
          <input type="number" step="0.1" value={form.colesterolTotal || ""} onChange={(e) => handleChange("colesterolTotal", e.target.value)} />
        </div>
        <div className="hc-field">
          <label>HDL</label>
          <input type="number" step="0.1" value={form.hdl || ""} onChange={(e) => handleChange("hdl", e.target.value)} />
        </div>
        <div className="hc-field">
          <label>LDL</label>
          <input type="number" step="0.1" value={form.ldl || ""} onChange={(e) => handleChange("ldl", e.target.value)} />
        </div>
      </div>

      <h3 className="hc-section-title">DIAGNÓSTICO Y PLAN</h3>

      <div className="hc-field">
        <label>Diagnóstico (CIE-10)</label>
        <textarea value={form.diagnostico || ""} onChange={(e) => handleChange("diagnostico", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Plan terapéutico / Recomendaciones</label>
        <textarea value={form.planTerapeutico || ""} onChange={(e) => handleChange("planTerapeutico", e.target.value)} />
      </div>

      <div className="hc-form-actions">
        <button type="submit" className="hc-save-btn" disabled={guardando}>
          <Save size={16} /> {guardando ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}

function FormPediatria({ datos, onGuardar, guardando }: FormProps) {
  const [form, setForm] = useState(datos);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    await onGuardar(form);
  };

  return (
    <form className="hc-form-grid" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      <h3 className="hc-section-title">ANTECEDENTES OBSTÉTRICOS</h3>

      <div className="hc-field-row hc-field-row--3col">
        <div className="hc-field">
          <label>Edad materna</label>
          <input type="number" value={form.edadMaterna || ""} onChange={(e) => handleChange("edadMaterna", e.target.value)} />
        </div>
        <div className="hc-field">
          <label>Gestas/Partos/Abortos</label>
          <input type="text" placeholder="" value={form.gpa || ""} onChange={(e) => handleChange("gpa", e.target.value)} />
        </div>
        <div className="hc-field">
          <label>Controles prenatales</label>
          <input type="number" value={form.controlPrenatal || ""} onChange={(e) => handleChange("controlPrenatal", e.target.value)} />
        </div>
      </div>

      <div className="hc-field">
        <label>Control prenatal (número de controles)</label>
        <input type="number" value={form.controlPrenatal || ""} onChange={(e) => handleChange("controlPrenatal", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Complicaciones del embarazo</label>
        <textarea value={form.complicacionesEmbarazo || ""} onChange={(e) => handleChange("complicacionesEmbarazo", e.target.value)} />
      </div>

      <div className="hc-field-row hc-field-row--2col">
        <div className="hc-field">
          <label>Tipo de parto</label>
          <select value={form.tipoParto || ""} onChange={(e) => handleChange("tipoParto", e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="vaginal">Vaginal</option>
            <option value="cesarea">Cesárea</option>
          </select>
        </div>
        <div className="hc-field">
          <label>Complicaciones del parto</label>
          <input type="text" value={form.complicacionesParto || ""} onChange={(e) => handleChange("complicacionesParto", e.target.value)} />
        </div>
      </div>

      <h3 className="hc-section-title">DATOS DEL RECIÉN NACIDO</h3>

      <div className="hc-field-row hc-field-row--4col">
        <div className="hc-field">
          <label>Edad gestacional (sem)</label>
          <input type="number" value={form.edadGestacional || ""} onChange={(e) => handleChange("edadGestacional", e.target.value)} />
        </div>
        <div className="hc-field hc-field--unit">
          <div>
            <label>Peso</label>
            <input type="number" step="0.1" value={form.pesoNacimiento || ""} onChange={(e) => handleChange("pesoNacimiento", e.target.value)} />
          </div>
          <span className="hc-unit">gr</span>
        </div>
        <div className="hc-field hc-field--unit">
          <div>
            <label>Talla</label>
            <input type="number" step="0.1" value={form.tallaNacimiento || ""} onChange={(e) => handleChange("tallaNacimiento", e.target.value)} />
          </div>
          <span className="hc-unit">cm</span>
        </div>
        <div className="hc-field hc-field--unit">
          <div>
            <label>PC</label>
            <input type="number" step="0.1" value={form.perimetroCefalico || ""} onChange={(e) => handleChange("perimetroCefalico", e.target.value)} />
          </div>
          <span className="hc-unit">cm</span>
        </div>
      </div>

      <div className="hc-field-row hc-field-row--2col">
        <div className="hc-field">
          <label>Apgar 1 minuto</label>
          <input type="number" value={form.apgar1 || ""} onChange={(e) => handleChange("apgar1", e.target.value)} />
        </div>
        <div className="hc-field">
          <label>Apgar 5 minutos</label>
          <input type="number" value={form.apgar5 || ""} onChange={(e) => handleChange("apgar5", e.target.value)} />
        </div>
      </div>

      <div className="hc-field">
        <label>Complicaciones neonatales</label>
        <textarea value={form.complicacionesNeo || ""} onChange={(e) => handleChange("complicacionesNeo", e.target.value)} />
      </div>

      <h3 className="hc-section-title">ALIMENTACIÓN ACTUAL</h3>

      <div className="hc-field">
        <label>Tipo de alimentación</label>
        <select value={form.tipoAlimentacion || ""} onChange={(e) => handleChange("tipoAlimentacion", e.target.value)}>
          <option value="">Seleccionar...</option>
          <option value="lactanciaExclusiva">Lactancia materna exclusiva</option>
          <option value="lactanciaComplementada">Lactancia complementada</option>
          <option value="alimentacionArtificial">Alimentación artificial</option>
          <option value="alimentacionMixta">Alimentación mixta</option>
        </select>
      </div>

      <div className="hc-field">
        <label>Edad de inicio de complementarios (meses)</label>
        <input type="number" value={form.edadComplementarios || ""} onChange={(e) => handleChange("edadComplementarios", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Alimentos tolerados / Alergias alimentarias</label>
        <textarea value={form.alimentosTolerados || ""} onChange={(e) => handleChange("alimentosTolerados", e.target.value)} />
      </div>

      <h3 className="hc-section-title">DESARROLLO PSICOMOTOR (MESES)</h3>

      <div className="hc-field-row hc-field-row--4col">
        <div className="hc-field">
          <label>Control cefálico</label>
          <input type="number" value={form.controlCefalico || ""} onChange={(e) => handleChange("controlCefalico", e.target.value)} />
        </div>
        <div className="hc-field">
          <label>Sedente con apoyo</label>
          <input type="number" value={form.sedenteCon || ""} onChange={(e) => handleChange("sedenteCon", e.target.value)} />
        </div>
        <div className="hc-field">
          <label>Bipedestación</label>
          <input type="number" value={form.bipedestacion || ""} onChange={(e) => handleChange("bipedestacion", e.target.value)} />
        </div>
        <div className="hc-field">
          <label>Deambulación</label>
          <input type="number" value={form.deambulacion || ""} onChange={(e) => handleChange("deambulacion", e.target.value)} />
        </div>
      </div>

      <div className="hc-field">
        <label>Lenguaje (balbuceos, palabras, frases) - Edad</label>
        <textarea value={form.lenguaje || ""} onChange={(e) => handleChange("lenguaje", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Pinza fina (edad de adquisición)</label>
        <input type="number" value={form.pinzaFina || ""} onChange={(e) => handleChange("pinzaFina", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Área socio-adaptativa</label>
        <textarea value={form.socioAdaptativa || ""} onChange={(e) => handleChange("socioAdaptativa", e.target.value)} />
      </div>

      <h3 className="hc-section-title">CRECIMIENTO (PERCENTILES)</h3>

      <div className="hc-field-row hc-field-row--4col">
        <div className="hc-field">
          <label>Peso/edad</label>
          <input type="text" placeholder="P50" value={form.pesoPercentil || ""} onChange={(e) => handleChange("pesoPercentil", e.target.value)} />
        </div>
        <div className="hc-field">
          <label>Talla/edad</label>
          <input type="text" placeholder="P50" value={form.tallaPercentil || ""} onChange={(e) => handleChange("tallaPercentil", e.target.value)} />
        </div>
        <div className="hc-field">
          <label>Peso/talla</label>
          <input type="text" placeholder="P50" value={form.pesoTallaPercentil || ""} onChange={(e) => handleChange("pesoTallaPercentil", e.target.value)} />
        </div>
        <div className="hc-field">
          <label>PC</label>
          <input type="text" placeholder="P50" value={form.cefalPercentil || ""} onChange={(e) => handleChange("cefalPercentil", e.target.value)} />
        </div>
      </div>

      <h3 className="hc-section-title">ESQUEMA DE VACUNACIÓN</h3>

      <div className="hc-field">
        <label>BCG</label>
        <input type="date" value={form.bcg || ""} onChange={(e) => handleChange("bcg", e.target.value)} />
      </div>

      <div className="hc-field-row hc-field-row--2col">
        <div className="hc-field">
          <label>Hepatitis B (RN)</label>
          <input type="date" value={form.hepatitisB1 || ""} onChange={(e) => handleChange("hepatitisB1", e.target.value)} />
        </div>
        <div className="hc-field">
          <label>Hepatitis B (esquema)</label>
          <input type="text" placeholder="" value={form.hepatitisB2 || ""} onChange={(e) => handleChange("hepatitisB2", e.target.value)} />
        </div>
      </div>

      <div className="hc-field">
        <label>Pentavalente acellular (dosis)</label>
        <textarea placeholder="" value={form.pentavalente || ""} onChange={(e) => handleChange("pentavalente", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Rotavirus (dosis)</label>
        <textarea placeholder="Dosis 1, 2" value={form.rotavirus || ""} onChange={(e) => handleChange("rotavirus", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Neumococo (dosis)</label>
        <textarea placeholder="" value={form.neumococo || ""} onChange={(e) => handleChange("neumococo", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Influenza (dosis)</label>
        <textarea value={form.influenza || ""} onChange={(e) => handleChange("influenza", e.target.value)} />
      </div>

      <div className="hc-field-row hc-field-row--2col">
        <div className="hc-field">
          <label>MMR</label>
          <input type="date" value={form.mmr || ""} onChange={(e) => handleChange("mmr", e.target.value)} />
        </div>
        <div className="hc-field">
          <label>Varicela</label>
          <input type="date" value={form.varicela || ""} onChange={(e) => handleChange("varicela", e.target.value)} />
        </div>
      </div>

      <div className="hc-field">
        <label>Otras vacunas (HPV, etc.)</label>
        <textarea value={form.otrasVacunas || ""} onChange={(e) => handleChange("otrasVacunas", e.target.value)} />
      </div>

      <h3 className="hc-section-title">DIAGNÓSTICO Y PLAN</h3>

      <div className="hc-field">
        <label>Diagnóstico (CIE-10)</label>
        <textarea value={form.diagnostico || ""} onChange={(e) => handleChange("diagnostico", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Plan terapéutico</label>
        <textarea value={form.planTerapeutico || ""} onChange={(e) => handleChange("planTerapeutico", e.target.value)} />
      </div>

      <div className="hc-form-actions">
        <button type="submit" className="hc-save-btn" disabled={guardando}>
          <Save size={16} /> {guardando ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}

function FormOdontologia({ datos, onGuardar, guardando }: FormProps) {
  const [form, setForm] = useState(datos);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    await onGuardar(form);
  };

  return (
    <form className="hc-form-grid" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      <h3 className="hc-section-title">ANAMNESIS ODONTOLÓGICA</h3>

      <div className="hc-field">
        <label>Motivo de consulta</label>
        <textarea value={form.problemaActual || ""} onChange={(e) => handleChange("problemaActual", e.target.value)} />
      </div>

      <div className="hc-field-row hc-field-row--2col">
        <div className="hc-field">
          <label>Tiempo de evolución</label>
          <input type="text" value={form.tiempoEvolucion || ""} onChange={(e) => handleChange("tiempoEvolucion", e.target.value)} />
        </div>
        <div className="hc-field">
          <label>Diente afectado (notación FDI)</label>
          <input type="text" placeholder="" value={form.dienteAfectado || ""} onChange={(e) => handleChange("dienteAfectado", e.target.value)} />
        </div>
      </div>

      <div className="hc-field-row hc-field-row--2col">
        <div className="hc-field">
          <label>Tipo de dolor</label>
          <select value={form.tipoDolor || ""} onChange={(e) => handleChange("tipoDolor", e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="espontaneo">Espontáneo</option>
            <option value="provocado">Provocado</option>
            <option value="intermitente">Intermitente</option>
            <option value="continuo">Continuo</option>
          </select>
        </div>
        <div className="hc-field">
          <label>Intensidad (0-10)</label>
          <input type="number" value={form.intensidadDolor || ""} onChange={(e) => handleChange("intensidadDolor", e.target.value)} />
        </div>
      </div>

      <h3 className="hc-section-title">ANTECEDENTES ODONTOLÓGICOS</h3>

      <div className="hc-field">
        <label>Tratamientos dentales previos</label>
        <textarea value={form.tratamientosPrevios || ""} onChange={(e) => handleChange("tratamientosPrevios", e.target.value)} />
      </div>

      <div className="hc-field-row hc-field-row--2col">
        <div className="hc-field">
          <label>Bruxismo</label>
          <select value={form.bruxismo || ""} onChange={(e) => handleChange("bruxismo", e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="si">Sí</option>
            <option value="no">No</option>
          </select>
        </div>
        <div className="hc-field">
          <label>Piezas ausentes (número)</label>
          <input type="number" value={form.piezasAusentes || ""} onChange={(e) => handleChange("piezasAusentes", e.target.value)} />
        </div>
      </div>

      <div className="hc-field">
        <label>Prótesis / Implantes</label>
        <textarea value={form.protesis || ""} onChange={(e) => handleChange("protesis", e.target.value)} />
      </div>

      <h3 className="hc-section-title">EXAMEN EXTRAORAL</h3>

      <div className="hc-field">
        <label>Simetría facial</label>
        <textarea value={form.simetriaFacial || ""} onChange={(e) => handleChange("simetriaFacial", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Articulación Temporomandibular (ATM)</label>
        <textarea value={form.atm || ""} onChange={(e) => handleChange("atm", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Ganglios linfáticos cervicales</label>
        <textarea value={form.ganglios || ""} onChange={(e) => handleChange("ganglios", e.target.value)} />
      </div>

      <h3 className="hc-section-title">EXAMEN INTRAORAL - TEJIDOS BLANDOS</h3>

      <div className="hc-field">
        <label>Estado de mucosa bucal</label>
        <textarea value={form.mucosaBucal || ""} onChange={(e) => handleChange("mucosaBucal", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Estado de encías</label>
        <textarea value={form.encias || ""} onChange={(e) => handleChange("encias", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Aftas, úlceras o lesiones</label>
        <textarea value={form.lesiones || ""} onChange={(e) => handleChange("lesiones", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Lengua y piso de boca</label>
        <textarea value={form.lenguaPiso || ""} onChange={(e) => handleChange("lenguaPiso", e.target.value)} />
      </div>

      <h3 className="hc-section-title">EXAMEN INTRAORAL - DENTICIÓN</h3>

      <div className="hc-field">
        <label>Odontograma (estado por pieza 1-32, FDI)</label>
        <textarea placeholder="" value={form.odontograma || ""} onChange={(e) => handleChange("odontograma", e.target.value)} />
      </div>

      <div className="hc-field-row hc-field-row--2col">
        <div className="hc-field">
          <label>Índice de higiene oral (IHO-S)</label>
          <input type="text" placeholder="" value={form.indiceHigiene || ""} onChange={(e) => handleChange("indiceHigiene", e.target.value)} />
        </div>
        <div className="hc-field">
          <label>Índice CPOD/ceod</label>
          <input type="number" step="0.1" value={form.indiceCPOD || ""} onChange={(e) => handleChange("indiceCPOD", e.target.value)} />
        </div>
      </div>

      <div className="hc-field">
        <label>Presencia de cálculo y placa bacteriana</label>
        <select value={form.calculoPlaca || ""} onChange={(e) => handleChange("calculoPlaca", e.target.value)}>
          <option value="">Seleccionar...</option>
          <option value="ausente">Ausente</option>
          <option value="leve">Leve</option>
          <option value="moderado">Moderado</option>
          <option value="severo">Severo</option>
        </select>
      </div>

      <div className="hc-field_row hc-field-row--2col">
        <div className="hc-field">
          <label>Gingivitis/Periodontitis</label>
          <select value={form.gingivitis || ""} onChange={(e) => handleChange("gingivitis", e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="no">No</option>
            <option value="leve">Leve</option>
            <option value="moderada">Moderada</option>
            <option value="severa">Severa</option>
          </select>
        </div>
        <div className="hc-field">
          <label>Maloclusión</label>
          <select value={form.maloclusion || ""} onChange={(e) => handleChange("maloclusion", e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="clase1">Clase I</option>
            <option value="clase2">Clase II</option>
            <option value="clase3">Clase III</option>
          </select>
        </div>
      </div>

      <div className="hc-field">
        <label>Movilidad dentaria (si aplica)</label>
        <select value={form.movilidad || ""} onChange={(e) => handleChange("movilidad", e.target.value)}>
          <option value="">Seleccionar...</option>
          <option value="no">No</option>
          <option value="grado1">Grado 1</option>
          <option value="grado2">Grado 2</option>
          <option value="grado3">Grado 3</option>
        </select>
      </div>

      <h3 className="hc-section-title">PERIODONTOGRAMA</h3>

      <div className="hc-field">
        <label>Estado de encías y profundidad de bolsas</label>
        <textarea placeholder="Descripción por sextantes" value={form.periodontograma || ""} onChange={(e) => handleChange("periodontograma", e.target.value)} />
      </div>

      <h3 className="hc-section-title">PRUEBAS COMPLEMENTARIAS</h3>

      <div className="hc-field">
        <label>Radiografías solicitadas/realizadas</label>
        <select value={form.radiografias || ""} onChange={(e) => handleChange("radiografias", e.target.value)}>
          <option value="">Seleccionar...</option>
          <option value="periapical">Periapical</option>
          <option value="aletaMordible">Aleta Mordible</option>
          <option value="panoramica">Panorámica</option>
          <option value="cefalometrica">Cefalométrica</option>
          <option value="tomografia">Tomografía</option>
        </select>
      </div>

      <div className="hc-field">
        <label>Descripción de hallazgos radiológicos</label>
        <textarea value={form.hallazgosRadio || ""} onChange={(e) => handleChange("hallazgosRadio", e.target.value)} />
      </div>

      <h3 className="hc-section-title">DIAGNÓSTICO</h3>

      <div className="hc-field">
        <label>Diagnóstico Presuntivo</label>
        <textarea value={form.diagnosticoPresuntivo || ""} onChange={(e) => handleChange("diagnosticoPresuntivo", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Diagnóstico Definitivo (CIE-10)</label>
        <textarea value={form.diagnostico || ""} onChange={(e) => handleChange("diagnostico", e.target.value)} />
      </div>

      <h3 className="hc-section-title">PLAN DE TRATAMIENTO</h3>

      <div className="hc-field">
        <label>Plan de tratamiento dental (secuencia)</label>
        <textarea value={form.planTratamientoDental || ""} onChange={(e) => handleChange("planTratamientoDental", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Medicamentos prescritos</label>
        <textarea placeholder="" value={form.medicamentos || ""} onChange={(e) => handleChange("medicamentos", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Instrucciones de higiene oral y preventivas</label>
        <textarea value={form.instruccionesHigiene || ""} onChange={(e) => handleChange("instruccionesHigiene", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Pronóstico</label>
        <select value={form.pronostico || ""} onChange={(e) => handleChange("pronostico", e.target.value)}>
          <option value="">Seleccionar...</option>
          <option value="excelente">Excelente</option>
          <option value="bueno">Bueno</option>
          <option value="regular">Regular</option>
          <option value="malo">Malo</option>
        </select>
      </div>

      <div className="hc-form-actions">
        <button type="submit" className="hc-save-btn" disabled={guardando}>
          <Save size={16} /> {guardando ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}

function FormReumatologia({ datos, onGuardar, guardando }: FormProps) {
  const [form, setForm] = useState(datos);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    await onGuardar(form);
  };

  return (
    <form className="hc-form-grid" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      <h3 className="hc-section-title">ANTECEDENTES REUMATOLÓGICOS</h3>

      <div className="hc-field">
        <label>Enfermedades reumáticas previas</label>
        <textarea value={form.enfermedadesPrevias || ""} onChange={(e) => handleChange("enfermedadesPrevias", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Antecedentes familiares de enfermedad reumática</label>
        <textarea value={form.antecedentesFamiliares || ""} onChange={(e) => handleChange("antecedentesFamiliares", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Exposición a factores de riesgo (ambientales, ocupacionales)</label>
        <textarea value={form.exposicionFactores || ""} onChange={(e) => handleChange("exposicionFactores", e.target.value)} />
      </div>

      <h3 className="hc-section-title">ENFERMEDAD ACTUAL - ARTICULAR</h3>

      <div className="hc-field">
        <label>Articulaciones afectadas (especificar lateralidad)</label>
        <textarea placeholder="" value={form.articulacionesAfectadas || ""} onChange={(e) => handleChange("articulacionesAfectadas", e.target.value)} />
      </div>

      <div className="hc-field-row hc-field-row--2col">
        <div className="hc-field">
          <label>Número de articulaciones</label>
          <input type="number" value={form.numArticulaciones || ""} onChange={(e) => handleChange("numArticulaciones", e.target.value)} />
        </div>
        <div className="hc-field">
          <label>Tiempo de evolución</label>
          <input type="text" placeholder="" value={form.tiempoEvolucion || ""} onChange={(e) => handleChange("tiempoEvolucion", e.target.value)} />
        </div>
      </div>

      <div className="hc-field-row hc-field-row--2col">
        <div className="hc-field">
          <label>Afectación bilateral</label>
          <select value={form.simetria || ""} onChange={(e) => handleChange("simetria", e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="si">Sí</option>
            <option value="no">No</option>
          </select>
        </div>
        <div className="hc-field hc-field--unit">
          <div>
            <label>Rigidez matinal</label>
            <input type="number" value={form.rigidezMatinal || ""} onChange={(e) => handleChange("rigidezMatinal", e.target.value)} />
          </div>
          <span className="hc-unit">minutos</span>
        </div>
      </div>

      <div className="hc-field-row hc-field-row--2col">
        <div className="hc-field">
          <label>Inflamación articular</label>
          <select value={form.inflamacion || ""} onChange={(e) => handleChange("inflamacion", e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="presente">Presente</option>
            <option value="ausente">Ausente</option>
          </select>
        </div>
        <div className="hc-field hc-field--unit">
          <div>
            <label>Intensidad del dolor (0-10)</label>
            <input type="number" value={form.intensidadDolor || ""} onChange={(e) => handleChange("intensidadDolor", e.target.value)} />
          </div>
        </div>
      </div>

      <div className="hc-field">
        <label>Limitación funcional</label>
        <textarea value={form.limitacionFuncional || ""} onChange={(e) => handleChange("limitacionFuncional", e.target.value)} />
      </div>

      <h3 className="hc-section-title">EXAMEN FÍSICO REUMATOLÓGICO</h3>

      <div className="hc-field">
        <label>Inspección (deformidades, eritema, atrofia muscular)</label>
        <textarea value={form.inspeccion || ""} onChange={(e) => handleChange("inspeccion", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Palpación (calor, sensibilidad, crepitaciones)</label>
        <textarea value={form.palpacion || ""} onChange={(e) => handleChange("palpacion", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Amplitud de movimiento (grados)</label>
        <textarea placeholder="" value={form.amplitudMovimiento || ""} onChange={(e) => handleChange("amplitudMovimiento", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Maniobras específicas (Schober, rotación cervical, etc.)</label>
        <textarea value={form.maniobrasEspecificas || ""} onChange={(e) => handleChange("maniobrasEspecificas", e.target.value)} />
      </div>

      <h3 className="hc-section-title">LABORATORIO REUMATOLÓGICO</h3>

      <div className="hc-field">
        <label>VSG (Velocidad de Sedimentación Globular)</label>
        <input type="number" step="0.1" value={form.vsg || ""} onChange={(e) => handleChange("vsg", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>PCR (Proteína C Reactiva)</label>
        <input type="number" step="0.1" value={form.pcr || ""} onChange={(e) => handleChange("pcr", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Factor Reumatoide (FR)</label>
        <select value={form.fr || ""} onChange={(e) => handleChange("fr", e.target.value)}>
          <option value="">Seleccionar...</option>
          <option value="positivo">Positivo</option>
          <option value="negativo">Negativo</option>
        </select>
      </div>

      <div className="hc-field">
        <label>Anti-CCP</label>
        <select value={form.antiCcp || ""} onChange={(e) => handleChange("antiCcp", e.target.value)}>
          <option value="">Seleccionar...</option>
          <option value="positivo">Positivo</option>
          <option value="negativo">Negativo</option>
        </select>
      </div>

      <div className="hc-field">
        <label>ANA (Anticuerpos Anti-Nucleares)</label>
        <input type="text" placeholder="" value={form.ana || ""} onChange={(e) => handleChange("ana", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Anti-ADN de doble cadena (Anti-dsDNA)</label>
        <select value={form.antiDsDNA || ""} onChange={(e) => handleChange("antiDsDNA", e.target.value)}>
          <option value="">Seleccionar...</option>
          <option value="positivo">Positivo</option>
          <option value="negativo">Negativo</option>
        </select>
      </div>

      <div className="hc-field">
        <label>Biometría Hemática (Hb, Hto, Leucocitos, Plaquetas)</label>
        <textarea value={form.biometria || ""} onChange={(e) => handleChange("biometria", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Función renal (Creatinina, Urea)</label>
        <textarea value={form.funcionRenal || ""} onChange={(e) => handleChange("funcionRenal", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Ácido úrico</label>
        <input type="number" step="0.1" value={form.acidoUrico || ""} onChange={(e) => handleChange("acidoUrico", e.target.value)} />
      </div>

      <h3 className="hc-section-title">ESTUDIOS DE IMAGEN</h3>

      <div className="hc-field">
        <label>Radiografías (articulaciones, especificar hallazgos)</label>
        <textarea value={form.radiografias || ""} onChange={(e) => handleChange("radiografias", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Ultrasonido musculoesquelético</label>
        <textarea value={form.ultrasonido || ""} onChange={(e) => handleChange("ultrasonido", e.target.value)} />
      </div>

      <h3 className="hc-section-title">DIAGNÓSTICO Y PLAN</h3>

      <div className="hc-field">
        <label>Diagnóstico (CIE-10 / Criterios clasificatorios)</label>
        <textarea value={form.diagnostico || ""} onChange={(e) => handleChange("diagnostico", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Medicamentos (AINES, Corticoides, DMARDs, Agentes biológicos)</label>
        <textarea value={form.medicamentos || ""} onChange={(e) => handleChange("medicamentos", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Plan terapéutico y seguimiento</label>
        <textarea value={form.planTerapeutico || ""} onChange={(e) => handleChange("planTerapeutico", e.target.value)} />
      </div>

      <div className="hc-form-actions">
        <button type="submit" className="hc-save-btn" disabled={guardando}>
          <Save size={16} /> {guardando ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}

function FormGinecologia({ datos, onGuardar, guardando }: FormProps) {
  const [form, setForm] = useState(datos);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    await onGuardar(form);
  };

  return (
    <form className="hc-form-grid" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      <h3 className="hc-section-title">ANTECEDENTES GINECOLÓGICOS</h3>

      <div className="hc-field">
        <label>Edad de menarquia (primera menstruación)</label>
        <input type="number" value={form.menarquia || ""} onChange={(e) => handleChange("menarquia", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Fórmula menstrual (XX/XX - días duración/periodicidad)</label>
        <input type="text" placeholder="" value={form.formulaMenstrual || ""} onChange={(e) => handleChange("formulaMenstrual", e.target.value)} />
      </div>

      <div className="hc-field-row hc-field-row--2col">
        <div className="hc-field">
          <label>Volumen de flujo</label>
          <select value={form.volumenFlujo || ""} onChange={(e) => handleChange("volumenFlujo", e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="normal">Normal</option>
            <option value="hipermenorrea">Hipermenorrea</option>
            <option value="hipomenorrea">Hipomenorrea</option>
          </select>
        </div>
        <div className="hc-field">
          <label>Dismenorrea (dolor menstrual)</label>
          <select value={form.dismenorrea || ""} onChange={(e) => handleChange("dismenorrea", e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="no">No</option>
            <option value="leve">Leve</option>
            <option value="moderada">Moderada</option>
            <option value="severa">Severa</option>
          </select>
        </div>
      </div>

      <div className="hc-field">
        <label>FUR (Fecha de última menstruación)</label>
        <input type="date" value={form.fur || ""} onChange={(e) => handleChange("fur", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Estado menopaúsico</label>
        <select value={form.menopausia || ""} onChange={(e) => handleChange("menopausia", e.target.value)}>
          <option value="">Seleccionar...</option>
          <option value="no">No</option>
          <option value="si">Sí</option>
          <option value="perimenopausica">Perimenopaúsica</option>
        </select>
      </div>

      <h3 className="hc-section-title">ANTECEDENTES OBSTÉTRICOS</h3>

      <div className="hc-field">
        <label>Fórmula GAPV (G_P_A_V) - Gestaciones/Partos/Abortos/Hijos vivos</label>
        <input type="text" placeholder="" value={form.formulaGapv || ""} onChange={(e) => handleChange("formulaGapv", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Gestaciones anteriores (detalle por embarazo)</label>
        <textarea placeholder="Año, tipo parto (vaginal/cesárea), peso RN, sexo, complicaciones" value={form.gestacionesAnteriores || ""} onChange={(e) => handleChange("gestacionesAnteriores", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Abortos previos (número, tipo, complicaciones)</label>
        <textarea value={form.abortosPrevios || ""} onChange={(e) => handleChange("abortosPrevios", e.target.value)} />
      </div>

      <h3 className="hc-section-title">MÉTODOS ANTICONCEPTIVOS</h3>

      <div className="hc-field">
        <label>Método anticonceptivo actual</label>
        <select value={form.metodoAnticonceptivo || ""} onChange={(e) => handleChange("metodoAnticonceptivo", e.target.value)}>
          <option value="">Seleccionar...</option>
          <option value="ninguno">Ninguno</option>
          <option value="inyectado">Inyectable</option>
          <option value="pildora">Píldora anticonceptiva</option>
          <option value="diu">DIU</option>
          <option value="preservativo">Preservativo</option>
          <option value="barrera">Métodos de barrera</option>
          <option value="esterilizacion">Esterilización</option>
          <option value="otro">Otro</option>
        </select>
      </div>

      <div className="hc-field">
        <label>Duración del uso (en meses/años)</label>
        <input type="text" value={form.duracionMetodo || ""} onChange={(e) => handleChange("duracionMetodo", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Métodos anticonceptivos previos usados</label>
        <textarea value={form.metodosPrevios || ""} onChange={(e) => handleChange("metodosPrevios", e.target.value)} />
      </div>

      <h3 className="hc-section-title">HISTORIA SEXUAL</h3>

      <div className="hc-field">
        <label>Edad de inicio de relaciones sexuales</label>
        <input type="number" value={form.edadInicioRel || ""} onChange={(e) => handleChange("edadInicioRel", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Número de parejas sexuales</label>
        <input type="number" value={form.numParejas || ""} onChange={(e) => handleChange("numParejas", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Dispareunia (dolor con relaciones)</label>
        <select value={form.dispareunia || ""} onChange={(e) => handleChange("dispareunia", e.target.value)}>
          <option value="">Seleccionar...</option>
          <option value="no">No</option>
          <option value="leve">Leve</option>
          <option value="moderada">Moderada</option>
          <option value="severa">Severa</option>
        </select>
      </div>

      <h3 className="hc-section-title">SÍNTOMAS GINECOLÓGICOS</h3>

      <div className="hc-field">
        <label>Sangrado vaginal anormal</label>
        <textarea value={form.sangradoAnormal || ""} onChange={(e) => handleChange("sangradoAnormal", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Flujo vaginal (características, olor, color)</label>
        <textarea value={form.flujoVaginal || ""} onChange={(e) => handleChange("flujoVaginal", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Dolor pélvico (localización, intensidad, relación con ciclo)</label>
        <textarea value={form.dolorPelvico || ""} onChange={(e) => handleChange("dolorPelvico", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Incontinencia urinaria / Síntomas urinarios</label>
        <textarea value={form.incontinencia || ""} onChange={(e) => handleChange("incontinencia", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Sensación de masa / Prolapso</label>
        <textarea value={form.prolapso || ""} onChange={(e) => handleChange("prolapso", e.target.value)} />
      </div>

      <h3 className="hc-section-title">EXAMEN FÍSICO GINECOLÓGICO</h3>

      <div className="hc-field">
        <label>Inspección (genitales externos, lesiones, irritación)</label>
        <textarea value={form.inspeccion || ""} onChange={(e) => handleChange("inspeccion", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Especuloscopía (cervix, vagina, flujo cervical)</label>
        <textarea value={form.especulosCopia || ""} onChange={(e) => handleChange("especulosCopia", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Tacto vaginal (movilidad cervical, útero, anexos, masas)</label>
        <textarea value={form.tactoVaginal || ""} onChange={(e) => handleChange("tactoVaginal", e.target.value)} />
      </div>

      <h3 className="hc-section-title">CITOLOGÍA Y COLPOSCOPIA</h3>

      <div className="hc-field">
        <label>Fecha de último Papanicolaou</label>
        <input type="date" value={form.ultimoPap || ""} onChange={(e) => handleChange("ultimoPap", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Resultado de Papanicolaou</label>
        <select value={form.resultadoPap || ""} onChange={(e) => handleChange("resultadoPap", e.target.value)}>
          <option value="">Seleccionar...</option>
          <option value="normal">Normal</option>
          <option value="ascus">ASCUS</option>
          <option value="sil">SIL</option>
          <option value="carcinoma">Carcinoma</option>
        </select>
      </div>

      <div className="hc-field">
        <label>Colposcopia (si aplica) - Hallazgos</label>
        <textarea value={form.colposcopia || ""} onChange={(e) => handleChange("colposcopia", e.target.value)} />
      </div>

      <h3 className="hc-section-title">EMBARAZO ACTUAL (si aplica)</h3>

      <div className="hc-field-row hc-field-row--2col">
        <div className="hc-field">
          <label>Edad gestacional (semanas)</label>
          <input type="number" value={form.edadGestacional || ""} onChange={(e) => handleChange("edadGestacional", e.target.value)} />
        </div>
        <div className="hc-field">
          <label>Trimestre del embarazo</label>
          <select value={form.trimestre || ""} onChange={(e) => handleChange("trimestre", e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="1">Primero (0-13 semanas)</option>
            <option value="2">Segundo (14-27 semanas)</option>
            <option value="3">Tercero (28-40 semanas)</option>
          </select>
        </div>
      </div>

      <div className="hc-field-row hc-field-row--2col">
        <div className="hc-field">
          <label>Náuseas / Vómitos</label>
          <select value={form.nauseas || ""} onChange={(e) => handleChange("nauseas", e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="no">No</option>
            <option value="leve">Leve</option>
            <option value="moderada">Moderada</option>
            <option value="severa">Severa</option>
          </select>
        </div>
        <div className="hc-field">
          <label>Sangrado vaginal</label>
          <select value={form.sangradoEmb || ""} onChange={(e) => handleChange("sangradoEmb", e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="ausente">Ausente</option>
            <option value="presente">Presente</option>
          </select>
        </div>
      </div>

      <div className="hc-field">
        <label>Edema de extremidades</label>
        <select value={form.edemaExtremi || ""} onChange={(e) => handleChange("edemaExtremi", e.target.value)}>
          <option value="">Seleccionar...</option>
          <option value="no">No</option>
          <option value="leve">Leve</option>
          <option value="moderado">Moderado</option>
          <option value="severo">Severo</option>
        </select>
      </div>

      <div className="hc-field">
        <label>Síntomas de alarma (cambios visuales, epigastralgia, convulsiones)</label>
        <textarea value={form.sintomasAlarma || ""} onChange={(e) => handleChange("sintomasAlarma", e.target.value)} />
      </div>

      <h3 className="hc-section-title">ULTRASONIDO OBSTÉTRICO (si aplica)</h3>

      <div className="hc-field">
        <label>Hallazgos ecográficos (biometría, viabilidad, líquido amniótico, placentación)</label>
        <textarea value={form.ecografia || ""} onChange={(e) => handleChange("ecografia", e.target.value)} />
      </div>

      <h3 className="hc-section-title">LABORATORIO GINECOLÓGICO</h3>

      <div className="hc-field">
        <label>Grupo sanguíneo y factor RH</label>
        <input type="text" placeholder="" value={form.grupoSanguineo || ""} onChange={(e) => handleChange("grupoSanguineo", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>VDRL (sífilis)</label>
        <select value={form.vdrl || ""} onChange={(e) => handleChange("vdrl", e.target.value)}>
          <option value="">Seleccionar...</option>
          <option value="positivo">Positivo</option>
          <option value="negativo">Negativo</option>
        </select>
      </div>

      <div className="hc-field-row hc-field-row--2col">
        <div className="hc-field">
          <label>VIH</label>
          <select value={form.vih || ""} onChange={(e) => handleChange("vih", e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="positivo">Positivo</option>
            <option value="negativo">Negativo</option>
          </select>
        </div>
        <div className="hc-field">
          <label>Hepatitis B/C</label>
          <input type="text" value={form.hepatitis || ""} onChange={(e) => handleChange("hepatitis", e.target.value)} />
        </div>
      </div>

      <h3 className="hc-section-title">DIAGNÓSTICO Y PLAN</h3>

      <div className="hc-field">
        <label>Diagnóstico (CIE-10)</label>
        <textarea value={form.diagnostico || ""} onChange={(e) => handleChange("diagnostico", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Plan terapéutico / Recomendaciones</label>
        <textarea value={form.planTerapeutico || ""} onChange={(e) => handleChange("planTerapeutico", e.target.value)} />
      </div>

      <div className="hc-form-actions">
        <button type="submit" className="hc-save-btn" disabled={guardando}>
          <Save size={16} /> {guardando ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}

function FormCardiologia({ datos, onGuardar, guardando }: FormProps) {
  const [form, setForm] = useState(datos);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    await onGuardar(form);
  };

  return (
    <form className="hc-form-grid" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      <h3 className="hc-section-title">ANTECEDENTES CARDIOVASCULARES</h3>

      <div className="hc-field">
        <label>Hipertensión arterial</label>
        <select value={form.hipertension || ""} onChange={(e) => handleChange("hipertension", e.target.value)}>
          <option value="">Seleccionar...</option>
          <option value="no">No</option>
          <option value="si">Sí</option>
        </select>
      </div>

      <div className="hc-field">
        <label>Enfermedad coronaria previa</label>
        <textarea value={form.coronaria || ""} onChange={(e) => handleChange("coronaria", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Arritmias previas</label>
        <textarea value={form.arritmias || ""} onChange={(e) => handleChange("arritmias", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Valvulopatías conocidas</label>
        <textarea value={form.valvulopatias || ""} onChange={(e) => handleChange("valvulopatias", e.target.value)} />
      </div>

      <h3 className="hc-section-title">FACTORES DE RIESGO CARDIOVASCULAR</h3>

      <div className="hc-field">
        <label>Diabetes Mellitus</label>
        <select value={form.diabetes || ""} onChange={(e) => handleChange("diabetes", e.target.value)}>
          <option value="">Seleccionar...</option>
          <option value="no">No</option>
          <option value="tipo1">Tipo 1</option>
          <option value="tipo2">Tipo 2</option>
        </select>
      </div>

      <div className="hc-field">
        <label>Dislipidemia</label>
        <select value={form.dislipidemia || ""} onChange={(e) => handleChange("dislipidemia", e.target.value)}>
          <option value="">Seleccionar...</option>
          <option value="no">No</option>
          <option value="si">Sí</option>
        </select>
      </div>

      <div className="hc-field_row hc-field-row--2col">
        <div className="hc-field">
          <label>Tabaquismo</label>
          <select value={form.tabaquismo || ""} onChange={(e) => handleChange("tabaquismo", e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="nunca">Nunca</option>
            <option value="exfumador">Exfumador</option>
            <option value="activo">Activo</option>
          </select>
        </div>
        <div className="hc-field">
          <label>Sedentarismo</label>
          <select value={form.sedentarismo || ""} onChange={(e) => handleChange("sedentarismo", e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="no">No</option>
            <option value="si">Sí</option>
          </select>
        </div>
      </div>

      <h3 className="hc-section-title">SÍNTOMAS CARDIOVASCULARES</h3>

      <div className="hc-field">
        <label>Síntomas cardiovasculares</label>
        <textarea value={form.sintomas || ""} onChange={(e) => handleChange("sintomas", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Grado funcional de disnea (NYHA)</label>
        <select value={form.gradoNYHA || ""} onChange={(e) => handleChange("gradoNYHA", e.target.value)}>
          <option value="">Seleccionar...</option>
          <option value="I">I - Sin síntomas</option>
          <option value="II">II - Síntomas con esfuerzo intenso</option>
          <option value="III">III - Síntomas con esfuerzo moderado</option>
          <option value="IV">IV - Síntomas en reposo</option>
        </select>
      </div>

      <div className="hc-field-row hc-field-row--2col">
        <div className="hc-field hc-field--unit">
          <div>
            <label>Presión Arterial Sistólica</label>
            <input type="number" value={form.pasSistolica || ""} onChange={(e) => handleChange("pasSistolica", e.target.value)} />
          </div>
          <span className="hc-unit">mmHg</span>
        </div>
        <div className="hc-field hc-field--unit">
          <div>
            <label>Presión Arterial Diastólica</label>
            <input type="number" value={form.pasDiastolica || ""} onChange={(e) => handleChange("pasDiastolica", e.target.value)} />
          </div>
          <span className="hc-unit">mmHg</span>
        </div>
      </div>

      <h3 className="hc-section-title">EXAMEN FÍSICO CARDIOLÓGICO</h3>

      <div className="hc-field_row hc-field-row--2col">
        <div className="hc-field hc-field--unit">
          <div>
            <label>Frecuencia Cardíaca</label>
            <input type="number" value={form.fc || ""} onChange={(e) => handleChange("fc", e.target.value)} />
          </div>
          <span className="hc-unit">lpm</span>
        </div>
        <div className="hc-field">
          <label>Ritmo</label>
          <select value={form.ritmo || ""} onChange={(e) => handleChange("ritmo", e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="sinusal">Sinusal</option>
            <option value="irregular">Irregular</option>
            <option value="fibrilacion">Fibrilación auricular</option>
          </select>
        </div>
      </div>

      <div className="hc-field">
        <label>Auscultación cardíaca (ruidos, soplos, roces)</label>
        <textarea value={form.auscultacion || ""} onChange={(e) => handleChange("auscultacion", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Jugulares y edema periférico</label>
        <textarea value={form.jugularesEdema || ""} onChange={(e) => handleChange("jugularesEdema", e.target.value)} />
      </div>

      <h3 className="hc-section-title">ELECTROCARDIOGRAMA (ECG)</h3>

      <div className="hc-field">
        <label>Ritmo y frecuencia cardíaca</label>
        <input type="text" value={form.ecgRitmo || ""} onChange={(e) => handleChange("ecgRitmo", e.target.value)} />
      </div>

      <div className="hc-field-row hc-field-row--2col">
        <div className="hc-field">
          <label>Intervalo PR (ms)</label>
          <input type="number" value={form.pr || ""} onChange={(e) => handleChange("pr", e.target.value)} />
        </div>
        <div className="hc-field">
          <label>Duración QRS (ms)</label>
          <input type="number" value={form.qrs || ""} onChange={(e) => handleChange("qrs", e.target.value)} />
        </div>
      </div>

      <div className="hc-field">
        <label>Eje eléctrico</label>
        <select value={form.ejeElectrico || ""} onChange={(e) => handleChange("ejeElectrico", e.target.value)}>
          <option value="">Seleccionar...</option>
          <option value="normal">Normal</option>
          <option value="desviacionizq">Desviación izquierda</option>
          <option value="desviacionder">Desviación derecha</option>
        </select>
      </div>

      <div className="hc-field">
        <label>Cambios isquémicos / Alteraciones ST-T</label>
        <textarea value={form.cambiosIsquemicos || ""} onChange={(e) => handleChange("cambiosIsquemicos", e.target.value)} />
      </div>

      <h3 className="hc-section-title">ECOCARDIOGRAFÍA</h3>

      <div className="hc-field_row hc-field-row--2col">
        <div className="hc-field">
          <label>Fracción de eyección VD (%)</label>
          <input type="number" step="0.1" value={form.fe || ""} onChange={(e) => handleChange("fe", e.target.value)} />
        </div>
        <div className="hc-field">
          <label>Diámetro diastólico VI (mm)</label>
          <input type="number" step="0.1" value={form.ddvi || ""} onChange={(e) => handleChange("ddvi", e.target.value)} />
        </div>
      </div>

      <div className="hc-field">
        <label>Estado de válvulas (aórtica, mitral, tricúspide, pulmonar)</label>
        <textarea value={form.valvulas || ""} onChange={(e) => handleChange("valvulas", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Derrame pericárdico</label>
        <select value={form.derramePericardico || ""} onChange={(e) => handleChange("derramePericardico", e.target.value)}>
          <option value="">Seleccionar...</option>
          <option value="ausente">Ausente</option>
          <option value="leve">Leve</option>
          <option value="moderado">Moderado</option>
          <option value="severo">Severo</option>
        </select>
      </div>

      <h3 className="hc-section-title">LABORATORIO CARDIOLÓGICO</h3>

      <div className="hc-field">
        <label>Troponina</label>
        <input type="number" step="0.01" value={form.troponina || ""} onChange={(e) => handleChange("troponina", e.target.value)} />
      </div>

      <div className="hc-field-row hc-field-row--2col">
        <div className="hc-field">
          <label>BNP / NT-proBNP</label>
          <input type="number" value={form.bnp || ""} onChange={(e) => handleChange("bnp", e.target.value)} />
        </div>
      </div>

      <div className="hc-field">
        <label>Perfil lipídico completo</label>
        <textarea placeholder="Colesterol total, HDL, LDL, Triglicéridos" value={form.perfilLipidico || ""} onChange={(e) => handleChange("perfilLipidico", e.target.value)} />
      </div>

      <div className="hc-field_row hc-field-row--2col">
        <div className="hc-field">
          <label>Glucosa basal</label>
          <input type="number" step="0.1" value={form.glucosa || ""} onChange={(e) => handleChange("glucosa", e.target.value)} />
        </div>
        <div className="hc-field">
          <label>Creatinina / TFG</label>
          <input type="text" value={form.creatinina || ""} onChange={(e) => handleChange("creatinina", e.target.value)} />
        </div>
      </div>

      <h3 className="hc-section-title">DIAGNÓSTICO Y PLAN</h3>

      <div className="hc-field">
        <label>Diagnóstico (CIE-10)</label>
        <textarea value={form.diagnostico || ""} onChange={(e) => handleChange("diagnostico", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Medicamentos (betabloqueantes, ACE-I, estatinas, etc.)</label>
        <textarea value={form.medicamentos || ""} onChange={(e) => handleChange("medicamentos", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Plan de seguimiento y recomendaciones</label>
        <textarea value={form.planTerapeutico || ""} onChange={(e) => handleChange("planTerapeutico", e.target.value)} />
      </div>

      <div className="hc-form-actions">
        <button type="submit" className="hc-save-btn" disabled={guardando}>
          <Save size={16} /> {guardando ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}

function FormEndocrinologia({ datos, onGuardar, guardando }: FormProps) {
  const [form, setForm] = useState(datos);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    await onGuardar(form);
  };

  return (
    <form className="hc-form-grid" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      <h3 className="hc-section-title">ANTECEDENTES ENDOCRINOLÓGICOS</h3>

      <div className="hc-field">
        <label>Diabetes Mellitus</label>
        <select value={form.tipoDM || ""} onChange={(e) => handleChange("tipoDM", e.target.value)}>
          <option value="">No aplica</option>
          <option value="tipo1">Tipo 1</option>
          <option value="tipo2">Tipo 2</option>
          <option value="gestacional">Gestacional</option>
          <option value="prediabetes">Prediabetes</option>
        </select>
      </div>

      <div className="hc-field">
        <label>Tiempo de diagnóstico (años)</label>
        <input type="number" value={form.tiempoDx || ""} onChange={(e) => handleChange("tiempoDx", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Insulinodependencia</label>
        <select value={form.insulinodependencia || ""} onChange={(e) => handleChange("insulinodependencia", e.target.value)}>
          <option value="">Seleccionar...</option>
          <option value="no">No</option>
          <option value="si">Sí</option>
        </select>
      </div>

      <div className="hc-field">
        <label>Complicaciones previas de diabetes</label>
        <textarea value={form.complicaciones || ""} onChange={(e) => handleChange("complicaciones", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Otras enfermedades endocrinas</label>
        <textarea value={form.otrasEnfermedades || ""} onChange={(e) => handleChange("otrasEnfermedades", e.target.value)} />
      </div>

      <h3 className="hc-section-title">SÍNTOMAS ENDOCRINOLÓGICOS</h3>

      <div className="hc-field">
        <label>Síntomas endocrinológicos actuales</label>
        <textarea value={form.sintomas || ""} onChange={(e) => handleChange("sintomas", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Intolerancia al calor/frío, cambios de voz</label>
        <textarea value={form.intoleranciaTermica || ""} onChange={(e) => handleChange("intoleranciaTermica", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Irregularidades menstruales (si aplica)</label>
        <textarea value={form.irregularidades || ""} onChange={(e) => handleChange("irregularidades", e.target.value)} />
      </div>

      <h3 className="hc-section-title">ANTROPOMETRÍA</h3>

      <div className="hc-field-row hc-field-row--2col">
        <div className="hc-field hc-field--unit">
          <div>
            <label>Peso actual</label>
            <input type="number" step="0.1" value={form.peso || ""} onChange={(e) => handleChange("peso", e.target.value)} />
          </div>
          <span className="hc-unit">kg</span>
        </div>
        <div className="hc-field hc-field--unit">
          <div>
            <label>Talla</label>
            <input type="number" step="0.1" value={form.talla || ""} onChange={(e) => handleChange("talla", e.target.value)} />
          </div>
          <span className="hc-unit">cm</span>
        </div>
      </div>

      <div className="hc-field-row hc-field-row--2col">
        <div className="hc-field">
          <label>IMC (kg/m²)</label>
          <input type="number" step="0.1" value={form.imc || ""} onChange={(e) => handleChange("imc", e.target.value)} />
        </div>
        <div className="hc-field hc-field--unit">
          <div>
            <label>Circunferencia de cintura</label>
            <input type="number" step="0.1" value={form.cintura || ""} onChange={(e) => handleChange("cintura", e.target.value)} />
          </div>
          <span className="hc-unit">cm</span>
        </div>
      </div>

      <h3 className="hc-section-title">EXAMEN FÍSICO ENDOCRINOLÓGICO</h3>

      <div className="hc-field">
        <label>Palpación de glándula tiroides (tamaño, nódulos, consistencia)</label>
        <textarea value={form.tiroides || ""} onChange={(e) => handleChange("tiroides", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Signos de disfunción tiroidea (temblor, sequedad piel, edema facial)</label>
        <textarea value={form.signossTiroides || ""} onChange={(e) => handleChange("signossTiroides", e.target.value)} />
      </div>

      <h3 className="hc-section-title">LABORATORIO ENDOCRINOLÓGICO - DIABETES</h3>

      <div className="hc-field-row hc-field-row--2col">
        <div className="hc-field">
          <label>Glucosa plasmática basal (mg/dL)</label>
          <input type="number" step="0.1" value={form.glucosaBasal || ""} onChange={(e) => handleChange("glucosaBasal", e.target.value)} />
        </div>
        <div className="hc-field">
          <label>Glucosa postprandial (mg/dL)</label>
          <input type="number" step="0.1" value={form.glucosaPostprandial || ""} onChange={(e) => handleChange("glucosaPostprandial", e.target.value)} />
        </div>
      </div>

      <div className="hc-field-row hc-field-row--2col">
        <div className="hc-field">
          <label>HbA1c (%)</label>
          <input type="number" step="0.1" value={form.hba1c || ""} onChange={(e) => handleChange("hba1c", e.target.value)} />
        </div>
        <div className="hc-field">
          <label>Péptido C (pmol/L)</label>
          <input type="number" step="0.1" value={form.peptidoC || ""} onChange={(e) => handleChange("peptidoC", e.target.value)} />
        </div>
      </div>

      <div className="hc-field-row hc-field-row--2col">
        <div className="hc-field">
          <label>Insulina basal (mUI/L)</label>
          <input type="number" step="0.1" value={form.insulinaBasal || ""} onChange={(e) => handleChange("insulinaBasal", e.target.value)} />
        </div>
        <div className="hc-field">
          <label>HOMA-IR</label>
          <input type="number" step="0.01" value={form.homaIR || ""} onChange={(e) => handleChange("homaIR", e.target.value)} />
        </div>
      </div>

      <h3 className="hc-section-title">LABORATORIO ENDOCRINOLÓGICO - FUNCIÓN TIROIDEA</h3>

      <div className="hc-field-row hc-field-row--2col">
        <div className="hc-field">
          <label>TSH (mUI/L)</label>
          <input type="number" step="0.01" value={form.tsh || ""} onChange={(e) => handleChange("tsh", e.target.value)} />
        </div>
        <div className="hc-field">
          <label>T4 Libre (pmol/L)</label>
          <input type="number" step="0.1" value={form.t4Libre || ""} onChange={(e) => handleChange("t4Libre", e.target.value)} />
        </div>
      </div>

      <div className="hc-field_row hc-field-row--2col">
        <div className="hc-field">
          <label>Anti-TPO (UI/mL)</label>
          <input type="number" step="0.1" value={form.antiTPO || ""} onChange={(e) => handleChange("antiTPO", e.target.value)} />
        </div>
        <div className="hc-field">
          <label>Anti-Tiroglobulina (UI/mL)</label>
          <input type="number" step="0.1" value={form.antiTiroglobulina || ""} onChange={(e) => handleChange("antiTiroglobulina", e.target.value)} />
        </div>
      </div>

      <h3 className="hc-section-title">LABORATORIO ENDOCRINOLÓGICO - FUNCIÓN GONADAL</h3>

      <div className="hc-field">
        <label>Testosterona / Estradiol (si aplica)</label>
        <textarea value={form.hormonasSexuales || ""} onChange={(e) => handleChange("hormonasSexuales", e.target.value)} />
      </div>

      <div className="hc-field_row hc-field-row--2col">
        <div className="hc-field">
          <label>LH (mUI/mL)</label>
          <input type="number" step="0.1" value={form.lh || ""} onChange={(e) => handleChange("lh", e.target.value)} />
        </div>
        <div className="hc-field">
          <label>FSH (mUI/mL)</label>
          <input type="number" step="0.1" value={form.fsh || ""} onChange={(e) => handleChange("fsh", e.target.value)} />
        </div>
      </div>

      <h3 className="hc-section-title">PERFIL LIPÍDICO COMPLETO</h3>

      <div className="hc-field">
        <label>Colesterol total (mg/dL)</label>
        <input type="number" step="0.1" value={form.colesterolTotal || ""} onChange={(e) => handleChange("colesterolTotal", e.target.value)} />
      </div>

      <div className="hc-field-row hc-field-row--2col">
        <div className="hc-field">
          <label>HDL (mg/dL)</label>
          <input type="number" step="0.1" value={form.hdl || ""} onChange={(e) => handleChange("hdl", e.target.value)} />
        </div>
        <div className="hc-field">
          <label>LDL (mg/dL)</label>
          <input type="number" step="0.1" value={form.ldl || ""} onChange={(e) => handleChange("ldl", e.target.value)} />
        </div>
      </div>

      <div className="hc-field">
        <label>Triglicéridos (mg/dL)</label>
        <input type="number" step="0.1" value={form.trigliceridos || ""} onChange={(e) => handleChange("trigliceridos", e.target.value)} />
      </div>

      <h3 className="hc-section-title">COMPLICACIONES DE DIABETES (si aplica)</h3>

      <div className="hc-field">
        <label>Screening de retinopatía diabética</label>
        <select value={form.retinopatia || ""} onChange={(e) => handleChange("retinopatia", e.target.value)}>
          <option value="">Seleccionar...</option>
          <option value="ausente">Ausente</option>
          <option value="leve">Leve</option>
          <option value="moderada">Moderada</option>
          <option value="severa">Severa</option>
        </select>
      </div>

      <div className="hc-field">
        <label>Screening de nefropatía diabética (proteinuria, TFG)</label>
        <textarea value={form.nefropatia || ""} onChange={(e) => handleChange("nefropatia", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Screening de neuropatía diabética</label>
        <textarea value={form.neuropatia || ""} onChange={(e) => handleChange("neuropatia", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Evaluación de pie diabético</label>
        <textarea value={form.pieDiabetico || ""} onChange={(e) => handleChange("pieDiabetico", e.target.value)} />
      </div>

      <h3 className="hc-section-title">DIAGNÓSTICO Y PLAN</h3>

      <div className="hc-field">
        <label>Diagnóstico (CIE-10)</label>
        <textarea value={form.diagnostico || ""} onChange={(e) => handleChange("diagnostico", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Medicamentos (insulina, metformina, antitiroideos, etc.)</label>
        <textarea value={form.medicamentos || ""} onChange={(e) => handleChange("medicamentos", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Plan terapéutico y educación del paciente</label>
        <textarea value={form.planTerapeutico || ""} onChange={(e) => handleChange("planTerapeutico", e.target.value)} />
      </div>

      <div className="hc-form-actions">
        <button type="submit" className="hc-save-btn" disabled={guardando}>
          <Save size={16} /> {guardando ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}

function FormNeumologia({ datos, onGuardar, guardando }: FormProps) {
  const [form, setForm] = useState(datos);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    await onGuardar(form);
  };

  return (
    <form className="hc-form-grid" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      <h3 className="hc-section-title">ANTECEDENTES RESPIRATORIOS</h3>

      <div className="hc-field">
        <label>Asma / EPOC</label>
        <select value={form.asmaEPOC || ""} onChange={(e) => handleChange("asmaEPOC", e.target.value)}>
          <option value="">Seleccionar...</option>
          <option value="no">No</option>
          <option value="asma">Asma</option>
          <option value="epoc">EPOC</option>
          <option value="ambas">Ambas</option>
        </select>
      </div>

      <div className="hc-field">
        <label>Tuberculosis previa o actual</label>
        <select value={form.tuberculosis || ""} onChange={(e) => handleChange("tuberculosis", e.target.value)}>
          <option value="">Seleccionar...</option>
          <option value="no">No</option>
          <option value="previa">Previa</option>
          <option value="actual">Actual</option>
        </select>
      </div>

      <div className="hc-field">
        <label>Neumonías recurrentes / Otras enfermedades pulmonares</label>
        <textarea value={form.otrasEnfermedades || ""} onChange={(e) => handleChange("otrasEnfermedades", e.target.value)} />
      </div>

      <h3 className="hc-section-title">HÁBITO TABÁQUICO</h3>

      <div className="hc-field">
        <label>Estado actual</label>
        <select value={form.estadoTabaco || ""} onChange={(e) => handleChange("estadoTabaco", e.target.value)}>
          <option value="">Seleccionar...</option>
          <option value="nunca">Nunca fumador</option>
          <option value="exfumador">Exfumador</option>
          <option value="activo">Fumador activo</option>
        </select>
      </div>

      <div className="hc-field_row hc-field-row--2col">
        <div className="hc-field">
          <label>Cigarrillos por día</label>
          <input type="number" value={form.cigarrosDia || ""} onChange={(e) => handleChange("cigarrosDia", e.target.value)} />
        </div>
        <div className="hc-field">
          <label>Años de fumador</label>
          <input type="number" value={form.anosFumador || ""} onChange={(e) => handleChange("anosFumador", e.target.value)} />
        </div>
      </div>

      <div className="hc-field">
        <label>Índice paquete-año</label>
        <input type="number" step="0.1" value={form.paqueteAno || ""} onChange={(e) => handleChange("paqueteAno", e.target.value)} />
      </div>

      <h3 className="hc-section-title">EXPOSICIÓN LABORAL/AMBIENTAL</h3>

      <div className="hc-field">
        <label>Profesión / Ocupación actual</label>
        <input type="text" value={form.ocupacion || ""} onChange={(e) => handleChange("ocupacion", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Exposición a polvo, humos, químicos</label>
        <textarea value={form.exposicion || ""} onChange={(e) => handleChange("exposicion", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Años de exposición</label>
        <input type="number" value={form.anosExposicion || ""} onChange={(e) => handleChange("anosExposicion", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Uso de equipo de protección personal</label>
        <select value={form.epp || ""} onChange={(e) => handleChange("epp", e.target.value)}>
          <option value="">Seleccionar...</option>
          <option value="no">No</option>
          <option value="ocasional">Ocasional</option>
          <option value="siempre">Siempre</option>
        </select>
      </div>

      <h3 className="hc-section-title">SÍNTOMAS RESPIRATORIOS</h3>

      <div className="hc-field">
        <label>Tos (seca / productiva)</label>
        <textarea value={form.tos || ""} onChange={(e) => handleChange("tos", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Características del esputo (color, cantidad, consistencia)</label>
        <textarea value={form.esputo || ""} onChange={(e) => handleChange("esputo", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Disnea (escala mMRC)</label>
        <select value={form.disnea || ""} onChange={(e) => handleChange("disnea", e.target.value)}>
          <option value="">Seleccionar...</option>
          <option value="0">Grado 0 - Sin disnea</option>
          <option value="1">Grado 1 - Con esfuerzo grave</option>
          <option value="2">Grado 2 - Al caminar rápido/subir leve</option>
          <option value="3">Grado 3 - Limita caminar</option>
          <option value="4">Grado 4 - En reposo</option>
        </select>
      </div>

      <div className="hc-field">
        <label>Sibilancias, dolor torácico pleurítico</label>
        <textarea value={form.sibilancias || ""} onChange={(e) => handleChange("sibilancias", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Fiebre, sudoración nocturna, pérdida de peso</label>
        <textarea value={form.sintomasGenerales || ""} onChange={(e) => handleChange("sintomasGenerales", e.target.value)} />
      </div>

      <h3 className="hc-section-title">EXAMEN FÍSICO NEUMOLÓGICO</h3>

      <div className="hc-field">
        <label>Inspección (forma tórax, movimiento pared torácica, FR)</label>
        <textarea value={form.inspeccion || ""} onChange={(e) => handleChange("inspeccion", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Palpación (vibraciones vocales, movilidad costillas)</label>
        <textarea value={form.palpacion || ""} onChange={(e) => handleChange("palpacion", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Percusión (sonoridad, nivel diafragma)</label>
        <textarea value={form.percusion || ""} onChange={(e) => handleChange("percusion", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Auscultación (murmullo vesicular, ruidos adventicios - crepitantes, sibilancias, roncos)</label>
        <textarea value={form.auscultacion || ""} onChange={(e) => handleChange("auscultacion", e.target.value)} />
      </div>

      <h3 className="hc-section-title">PRUEBAS DE FUNCIÓN PULMONAR</h3>

      <div className="hc-field">
        <label>Espirometría (FVC, FEV1, FEV1/FVC, FEF25-75%)</label>
        <textarea placeholder="" value={form.espirometria || ""} onChange={(e) => handleChange("espirometria", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Patrón espirométrico</label>
        <select value={form.patronEspirometrico || ""} onChange={(e) => handleChange("patronEspirometrico", e.target.value)}>
          <option value="">Seleccionar...</option>
          <option value="normal">Normal</option>
          <option value="obstructivo">Obstructivo</option>
          <option value="restrictivo">Restrictivo</option>
          <option value="mixto">Mixto</option>
        </select>
      </div>

      <div className="hc-field">
        <label>Reversibilidad con broncodilatador (%)</label>
        <input type="number" step="0.1" value={form.reversibilidad || ""} onChange={(e) => handleChange("reversibilidad", e.target.value)} />
      </div>

      <h3 className="hc-section-title">GASES ARTERIALES Y OXIMETRÍA</h3>

      <div className="hc-field_row hc-field-row--2col">
        <div className="hc-field hc-field--unit">
          <div>
            <label>Saturación de Oxígeno (SpO2) basal</label>
            <input type="number" step="0.1" value={form.satO2Basal || ""} onChange={(e) => handleChange("satO2Basal", e.target.value)} />
          </div>
          <span className="hc-unit">%</span>
        </div>
        <div className="hc-field hc-field--unit">
          <div>
            <label>SpO2 con ejercicio</label>
            <input type="number" step="0.1" value={form.satO2Ejercicio || ""} onChange={(e) => handleChange("satO2Ejercicio", e.target.value)} />
          </div>
          <span className="hc-unit">%</span>
        </div>
      </div>

      <h3 className="hc-section-title">RADIOLOGÍA</h3>

      <div className="hc-field">
        <label>Radiografía de Tórax (hallazgos)</label>
        <textarea value={form.radiografia || ""} onChange={(e) => handleChange("radiografia", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>TAC de Tórax (si aplica)</label>
        <textarea value={form.tac || ""} onChange={(e) => handleChange("tac", e.target.value)} />
      </div>

      <h3 className="hc-section-title">DIAGNÓSTICO Y PLAN</h3>

      <div className="hc-field">
        <label>Diagnóstico (CIE-10)</label>
        <textarea value={form.diagnostico || ""} onChange={(e) => handleChange("diagnostico", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Medicamentos inhalados (tipo, dosis, frecuencia, técnica)</label>
        <textarea value={form.medicamentos || ""} onChange={(e) => handleChange("medicamentos", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Plan terapéutico y seguimiento</label>
        <textarea value={form.planTerapeutico || ""} onChange={(e) => handleChange("planTerapeutico", e.target.value)} />
      </div>

      <div className="hc-form-actions">
        <button type="submit" className="hc-save-btn" disabled={guardando}>
          <Save size={16} /> {guardando ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}

function FormGastroenterologia({ datos, onGuardar, guardando }: FormProps) {
  const [form, setForm] = useState(datos);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    await onGuardar(form);
  };

  return (
    <form className="hc-form-grid" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      <h3 className="hc-section-title">ANTECEDENTES GASTROINTESTINALES</h3>

      <div className="hc-field">
        <label>Úlcera péptica / Gastritis / GERD crónico</label>
        <textarea value={form.antecedentes || ""} onChange={(e) => handleChange("antecedentes", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Enfermedad Inflamatoria Intestinal (Crohn, Colitis Ulcerativa)</label>
        <textarea value={form.eiI || ""} onChange={(e) => handleChange("eiI", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Intolerancias alimentarias (gluten, lactosa, otras)</label>
        <textarea value={form.intolerancias || ""} onChange={(e) => handleChange("intolerancias", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Antecedente de cáncer gastrointestinal familiar</label>
        <select value={form.cancerFamiliar || ""} onChange={(e) => handleChange("cancerFamiliar", e.target.value)}>
          <option value="">Seleccionar...</option>
          <option value="no">No</option>
          <option value="si">Sí</option>
        </select>
      </div>

      <h3 className="hc-section-title">HÁBITOS Y FACTORES DE RIESGO</h3>

      <div className="hc-field">
        <label>Consumo de alcohol (cantidad, frecuencia)</label>
        <textarea value={form.alcohol || ""} onChange={(e) => handleChange("alcohol", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Consumo de AINES (frecuencia, tipo)</label>
        <textarea value={form.aines || ""} onChange={(e) => handleChange("aines", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Dieta (picante, grasas, comidas copiosas)</label>
        <textarea value={form.dieta || ""} onChange={(e) => handleChange("dieta", e.target.value)} />
      </div>

      <h3 className="hc-section-title">SÍNTOMAS GASTROINTESTINALES</h3>

      <h4>Síntomas Esofágicos:</h4>
      <div className="hc-field">
        <label>Disfagia, odinofagia, pirosis, regurgitación</label>
        <textarea value={form.sintomasEsofago || ""} onChange={(e) => handleChange("sintomasEsofago", e.target.value)} />
      </div>

      <h4>Síntomas Gástricos:</h4>
      <div className="hc-field">
        <label>Náuseas, vómitos, dolor epigástrico, plenitud postprandial</label>
        <textarea value={form.sintomasGastrico || ""} onChange={(e) => handleChange("sintomasGastrico", e.target.value)} />
      </div>

      <h4>Síntomas Intestinales:</h4>
      <div className="hc-field">
        <label>Dolor abdominal (localización, carácter, relación con defecación)</label>
        <textarea value={form.dolorAbdominal || ""} onChange={(e) => handleChange("dolorAbdominal", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Deposiciones (frecuencia, consistencia, color, presencia de sangre/moco)</label>
        <textarea value={form.deposiciones || ""} onChange={(e) => handleChange("deposiciones", e.target.value)} />
      </div>

      <div className="hc-field_row hc-field-row--2col">
        <div className="hc-field">
          <label>Constipación</label>
          <select value={form.constipacion || ""} onChange={(e) => handleChange("constipacion", e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="no">No</option>
            <option value="ocasional">Ocasional</option>
            <option value="cronica">Crónica</option>
          </select>
        </div>
        <div className="hc-field">
          <label>Diarrea</label>
          <select value={form.diarrea || ""} onChange={(e) => handleChange("diarrea", e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="no">No</option>
            <option value="ocasional">Ocasional</option>
            <option value="cronica">Crónica</option>
          </select>
        </div>
      </div>

      <div className="hc-field">
        <label>Melena (heces negras) / Rectorragia (sangre roja)</label>
        <textarea value={form.sangradoGI || ""} onChange={(e) => handleChange("sangradoGI", e.target.value)} />
      </div>

      <h3 className="hc-section-title">EXAMEN FÍSICO GASTROINTESTINAL</h3>

      <div className="hc-field">
        <label>Inspección abdominal (distensión, cicatrices, masas)</label>
        <textarea value={form.inspeccion || ""} onChange={(e) => handleChange("inspeccion", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Auscultación (ruidos intestinales)</label>
        <textarea value={form.auscultacion || ""} onChange={(e) => handleChange("auscultacion", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Palpación (sensibilidad, masas, hepatomegalia, esplenomegalia)</label>
        <textarea value={form.palpacion || ""} onChange={(e) => handleChange("palpacion", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Tacto rectal (sangre, hemorroides, masas)</label>
        <textarea value={form.tactoRectal || ""} onChange={(e) => handleChange("tactoRectal", e.target.value)} />
      </div>

      <h3 className="hc-section-title">ENDOSCOPIA ALTA (EGD)</h3>

      <div className="hc-field">
        <label>Hallazgos esófago (varices, erosiones, hernia hiato)</label>
        <textarea value={form.esofago || ""} onChange={(e) => handleChange("esofago", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Hallazgos estómago (úlceras, gastritis, pólipos, cáncer)</label>
        <textarea value={form.estomago || ""} onChange={(e) => handleChange("estomago", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Hallazgos duodeno</label>
        <textarea value={form.duodeno || ""} onChange={(e) => handleChange("duodeno", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Biopsias realizadas / Resultado CLO (H. pylori)</label>
        <textarea value={form.biopsias || ""} onChange={(e) => handleChange("biopsias", e.target.value)} />
      </div>

      <h3 className="hc-section-title">COLONOSCOPIA</h3>

      <div className="hc-field">
        <label>Hallazgos colon (pólipos, úlceras, estenosis, divertículos, malignidad)</label>
        <textarea value={form.colonoscopia || ""} onChange={(e) => handleChange("colonoscopia", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Calidad de preparación</label>
        <select value={form.preparacionColono || ""} onChange={(e) => handleChange("preparacionColono", e.target.value)}>
          <option value="">Seleccionar...</option>
          <option value="excelente">Excelente</option>
          <option value="buena">Buena</option>
          <option value="aceptable">Aceptable</option>
          <option value="pobre">Pobre</option>
        </select>
      </div>

      <h3 className="hc-section-title">LABORATORIO GASTROINTESTINAL</h3>

      <div className="hc-field">
        <label>Hemograma (Hb, Hto, Leucocitos, Plaquetas)</label>
        <textarea value={form.hemograma || ""} onChange={(e) => handleChange("hemograma", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Química sanguínea (glucosa, creatinina, proteína total, albúmina)</label>
        <textarea value={form.quimica || ""} onChange={(e) => handleChange("quimica", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Función hepática (AST, ALT, fosfatasa alcalina, bilirrubina, GGT)</label>
        <textarea value={form.funcionHepatica || ""} onChange={(e) => handleChange("funcionHepatica", e.target.value)} />
      </div>

      <div className="hc-field_row hc-field-row--2col">
        <div className="hc-field">
          <label>Amilasa</label>
          <input type="number" value={form.amilasa || ""} onChange={(e) => handleChange("amilasa", e.target.value)} />
        </div>
        <div className="hc-field">
          <label>Lipasa</label>
          <input type="number" value={form.lipasa || ""} onChange={(e) => handleChange("lipasa", e.target.value)} />
        </div>
      </div>

      <div className="hc-field">
        <label>Helicobacter pylori (antígeno / anticuerpo / CLO)</label>
        <select value={form.hpylori || ""} onChange={(e) => handleChange("hpylori", e.target.value)}>
          <option value="">No evaluado</option>
          <option value="positivo">Positivo</option>
          <option value="negativo">Negativo</option>
        </select>
      </div>

      <div className="hc-field">
        <label>Calprotectina fecal (si sospecha de EII)</label>
        <input type="number" value={form.calprotectina || ""} onChange={(e) => handleChange("calprotectina", e.target.value)} />
      </div>

      <h3 className="hc-section-title">ESTUDIOS DE IMAGEN</h3>

      <div className="hc-field">
        <label>Ecografía / TAC abdominal (hallazgos)</label>
        <textarea value={form.imagenes || ""} onChange={(e) => handleChange("imagenes", e.target.value)} />
      </div>

      <h3 className="hc-section-title">DIAGNÓSTICO Y PLAN</h3>

      <div className="hc-field">
        <label>Diagnóstico (CIE-10)</label>
        <textarea value={form.diagnostico || ""} onChange={(e) => handleChange("diagnostico", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Medicamentos (IBP, antacidos, procinéticos, antiinflamatorios)</label>
        <textarea value={form.medicamentos || ""} onChange={(e) => handleChange("medicamentos", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Plan terapéutico y seguimiento</label>
        <textarea value={form.planTerapeutico || ""} onChange={(e) => handleChange("planTerapeutico", e.target.value)} />
      </div>

      <div className="hc-form-actions">
        <button type="submit" className="hc-save-btn" disabled={guardando}>
          <Save size={16} /> {guardando ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}

function FormPsiquiatria({ datos, onGuardar, guardando }: FormProps) {
  const [form, setForm] = useState(datos);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    await onGuardar(form);
  };

  return (
    <form className="hc-form-grid" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      <h3 className="hc-section-title">ANTECEDENTES PSIQUIÁTRICOS</h3>

      <div className="hc-field">
        <label>Trastornos mentales previos (diagnóstico, edad de inicio, duración)</label>
        <textarea value={form.trastornosPrevios || ""} onChange={(e) => handleChange("trastornosPrevios", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Hospitalizaciones psiquiátricas previas</label>
        <textarea value={form.hospitalizaciones || ""} onChange={(e) => handleChange("hospitalizaciones", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Antecedentes de autolesiones / intentos de suicidio</label>
        <textarea value={form.autolesiones || ""} onChange={(e) => handleChange("autolesiones", e.target.value)} />
      </div>

      <h3 className="hc-section-title">MEDICAMENTOS PSIQUIÁTRICOS PREVIOS/ACTUALES</h3>

      <div className="hc-field">
        <label>Medicamentos actuales (nombre, dosis, frecuencia, duración)</label>
        <textarea value={form.medicamentosActuales || ""} onChange={(e) => handleChange("medicamentosActuales", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Respuesta previa a medicamentos</label>
        <textarea value={form.respuestaMedicamentos || ""} onChange={(e) => handleChange("respuestaMedicamentos", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Efectos adversos a medicamentos</label>
        <textarea value={form.efectosAdversos || ""} onChange={(e) => handleChange("efectosAdversos", e.target.value)} />
      </div>

      <h3 className="hc-section-title">HISTORIA PSICOSOCIAL</h3>

      <div className="hc-field">
        <label>Antecedentes médicos relevantes</label>
        <textarea value={form.antecedentes || ""} onChange={(e) => handleChange("antecedentes", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Historia familiar de trastornos mentales</label>
        <textarea value={form.historiasimiliaresFamilia || ""} onChange={(e) => handleChange("historiasimiliaresFamilia", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Situación social (vivienda, relaciones, trabajo, ingresos)</label>
        <textarea value={form.situacionSocial || ""} onChange={(e) => handleChange("situacionSocial", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Uso de sustancias (alcohol, drogas, tabaco)</label>
        <textarea value={form.sustancias || ""} onChange={(e) => handleChange("sustancias", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Traumas o eventos estresantes significativos</label>
        <textarea value={form.traumas || ""} onChange={(e) => handleChange("traumas", e.target.value)} />
      </div>

      <h3 className="hc-section-title">ENFERMEDAD ACTUAL</h3>

      <div className="hc-field">
        <label>Motivo de consulta</label>
        <textarea value={form.quejaActual || ""} onChange={(e) => handleChange("quejaActual", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Síntomas psiquiátricos actuales</label>
        <textarea value={form.sintomas || ""} onChange={(e) => handleChange("sintomas", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Tiempo de evolución de síntomas actuales</label>
        <input type="text" value={form.tiempoEvolucion || ""} onChange={(e) => handleChange("tiempoEvolucion", e.target.value)} />
      </div>

      <h3 className="hc-section-title">EXAMEN DEL ESTADO MENTAL</h3>

      <div className="hc-field">
        <label>Apariencia (aseo, arreglo, ropa, estado nutricional)</label>
        <textarea value={form.apariencia || ""} onChange={(e) => handleChange("apariencia", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Orientación</label>
        <textarea value={form.conciencia || ""} onChange={(e) => handleChange("conciencia", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Estado del ánimo</label>
        <textarea value={form.animo || ""} onChange={(e) => handleChange("animo", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Afecto</label>
        <textarea value={form.afecto || ""} onChange={(e) => handleChange("afecto", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Lenguaje</label>
        <textarea value={form.lenguaje || ""} onChange={(e) => handleChange("lenguaje", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Pensamiento</label>
        <textarea value={form.pensamiento || ""} onChange={(e) => handleChange("pensamiento", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Alucinaciones (visuales, auditivas, táctiles)</label>
        <textarea value={form.percepciones || ""} onChange={(e) => handleChange("percepciones", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Memoria</label>
        <textarea value={form.memoria || ""} onChange={(e) => handleChange("memoria", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Insight y Juicio</label>
        <textarea value={form.insightJuicio || ""} onChange={(e) => handleChange("insightJuicio", e.target.value)} />
      </div>

      <h3 className="hc-section-title">EVALUACIÓN DE RIESGO</h3>

      <div className="hc-field">
        <label>Riesgo suicida</label>
        <select value={form.riesgoSuicida || ""} onChange={(e) => handleChange("riesgoSuicida", e.target.value)}>
          <option value="">Seleccionar...</option>
          <option value="bajo">Bajo</option>
          <option value="moderado">Moderado</option>
          <option value="alto">Alto</option>
        </select>
      </div>

      <div className="hc-field">
        <label>Riesgo de heteroagresión</label>
        <select value={form.riesgoHeteroagresion || ""} onChange={(e) => handleChange("riesgoHeteroagresion", e.target.value)}>
          <option value="">Seleccionar...</option>
          <option value="bajo">Bajo</option>
          <option value="moderado">Moderado</option>
          <option value="alto">Alto</option>
        </select>
      </div>

      <div className="hc-field">
        <label>Ideación suicida / Ideación homicida</label>
        <textarea value={form.planes || ""} onChange={(e) => handleChange("planes", e.target.value)} />
      </div>

      <h3 className="hc-section-title">ESCALAS DE EVALUACIÓN</h3>

      <div className="hc-field_row hc-field-row--2col">
        <div className="hc-field">
          <label>PHQ-9 (Depresión) - Puntuación</label>
          <input type="number" value={form.phq9 || ""} onChange={(e) => handleChange("phq9", e.target.value)} />
        </div>
        <div className="hc-field">
          <label>GAD-7 (Ansiedad) - Puntuación</label>
          <input type="number" value={form.gad7 || ""} onChange={(e) => handleChange("gad7", e.target.value)} />
        </div>
      </div>

      <div className="hc-field">
        <label>Otras escalas administradas</label>
        <textarea value={form.otrasEscalas || ""} onChange={(e) => handleChange("otrasEscalas", e.target.value)} />
      </div>

      <h3 className="hc-section-title">DIAGNÓSTICO</h3>

      <div className="hc-field">
        <label>Diagnóstico(s) principal(es) (DSM-5 / CIE-10)</label>
        <textarea value={form.diagnostico || ""} onChange={(e) => handleChange("diagnostico", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Diagnósticos secundarios / Comorbilidad</label>
        <textarea value={form.diagnosticosSecundarios || ""} onChange={(e) => handleChange("diagnosticosSecundarios", e.target.value)} />
      </div>

      <h3 className="hc-section-title">PLAN TERAPÉUTICO</h3>

      <div className="hc-field">
        <label>Medicamentos prescritos (nombre, dosis, frecuencia, duración)</label>
        <textarea value={form.medicamentos || ""} onChange={(e) => handleChange("medicamentos", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Psicoterapia / Intervenciones psicosociales</label>
        <textarea value={form.psicoterapia || ""} onChange={(e) => handleChange("psicoterapia", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Necesidad de hospitalización / Internamiento</label>
        <select value={form.hospitalizacion || ""} onChange={(e) => handleChange("hospitalizacion", e.target.value)}>
          <option value="">Seleccionar...</option>
          <option value="no">No</option>
          <option value="observacion">Observación</option>
          <option value="internamiento">Internamiento</option>
        </select>
      </div>

      <div className="hc-field">
        <label>Seguimiento y próximas citas</label>
        <textarea value={form.seguimiento || ""} onChange={(e) => handleChange("seguimiento", e.target.value)} />
      </div>

      <div className="hc-field">
        <label>Recomendaciones y orientación al paciente/familia</label>
        <textarea value={form.recomendaciones || ""} onChange={(e) => handleChange("recomendaciones", e.target.value)} />
      </div>

      <div className="hc-form-actions">
        <button type="submit" className="hc-save-btn" disabled={guardando}>
          <Save size={16} /> {guardando ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}
