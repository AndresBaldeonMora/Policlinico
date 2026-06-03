import { useState } from "react";
import { Save } from "lucide-react";
import { PacienteApiService } from "../../services/paciente.service";
import Swal from "sweetalert2";

type TabHC = "antecedentes" | "fisiologicos" | "familiares" | "habitos";

interface Props {
  pacienteId: string;
  historiaClinica: Record<string, Record<string, string>>;
  tabActivo: TabHC;
  sexoPaciente?: string;
  onActualizar: () => Promise<void>;
}

interface FormProps {
  datos: Record<string, string>;
  onGuardar: (campos: Record<string, string>) => Promise<void>;
  guardando: boolean;
  sexoPaciente?: string;
}

export default function HistoriaClinicaTabs({ pacienteId, historiaClinica, tabActivo, sexoPaciente, onActualizar }: Props) {
  const [guardando, setGuardando] = useState(false);

  const guardarSeccion = async (seccion: string, campos: Record<string, string>) => {
    setGuardando(true);
    try {
      await PacienteApiService.guardarHistoriaClinicaEspecialidad(pacienteId, seccion, campos);
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
      {tabActivo === "antecedentes" && (
        <FormAntecedentes
          datos={historiaClinica.antecedentes || {}}
          onGuardar={(campos) => guardarSeccion("antecedentes", campos)}
          guardando={guardando}
        />
      )}
      {tabActivo === "fisiologicos" && (
        <FormFisiologicos
          datos={historiaClinica.fisiologicos || {}}
          onGuardar={(campos) => guardarSeccion("fisiologicos", campos)}
          guardando={guardando}
          sexoPaciente={sexoPaciente}
        />
      )}
      {tabActivo === "familiares" && (
        <FormFamiliares
          datos={historiaClinica.familiares || {}}
          onGuardar={(campos) => guardarSeccion("familiares", campos)}
          guardando={guardando}
        />
      )}
      {tabActivo === "habitos" && (
        <FormHabitos
          datos={historiaClinica.habitos || {}}
          onGuardar={(campos) => guardarSeccion("habitos", campos)}
          guardando={guardando}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TAB 1 — ANTECEDENTES PERSONALES (NTS N°139-MINSA/2018)
// ─────────────────────────────────────────────────────────────

function FormAntecedentes({ datos, onGuardar, guardando }: FormProps) {
  const [form, setForm] = useState(datos);

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const check = (field: string, checked: boolean) =>
    setForm(prev => ({ ...prev, [field]: checked ? "si" : "" }));

  const enfermedades = [
    { id: "hta",        label: "Hipertensión Arterial (HTA)" },
    { id: "dm1",        label: "Diabetes Mellitus tipo 1" },
    { id: "dm2",        label: "Diabetes Mellitus tipo 2" },
    { id: "asma",       label: "Asma Bronquial" },
    { id: "epoc",       label: "EPOC / Enf. pulmonar crónica" },
    { id: "tbc",        label: "Tuberculosis (TBC)" },
    { id: "cancer",     label: "Cáncer" },
    { id: "cardiopatia",label: "Cardiopatía / Enf. cardiovascular" },
    { id: "nefropatia", label: "Nefropatía crónica" },
    { id: "vih",        label: "VIH/SIDA" },
    { id: "hepatitisB", label: "Hepatitis B" },
    { id: "hepatitisC", label: "Hepatitis C" },
    { id: "tiroides",   label: "Enfermedad tiroidea" },
    { id: "epilepsia",  label: "Epilepsia" },
    { id: "acv",        label: "Enf. cerebrovascular / ACV" },
    { id: "artritis",   label: "Artritis / Enf. reumatológica" },
    { id: "depresion",  label: "Depresión / Ansiedad" },
    { id: "obesidad",   label: "Obesidad" },
    { id: "gastritis",  label: "Gastritis / Úlcera péptica" },
    { id: "colitis",    label: "Crohn / Colitis ulcerosa" },
  ];

  return (
    <form className="hc-form-grid" onSubmit={(e) => { e.preventDefault(); onGuardar(form); }}>
      <h3 className="hc-section-title">ANTECEDENTES PATOLÓGICOS PERSONALES</h3>
      <p className="hc-section-hint">Marque las enfermedades diagnosticadas previamente al paciente</p>

      <div className="hc-checklist hc-checklist--2col">
        {enfermedades.map(e => (
          <label key={e.id} className="hc-checkbox-item">
            <input
              type="checkbox"
              checked={form[e.id] === "si"}
              onChange={ev => check(e.id, ev.target.checked)}
            />
            <span>{e.label}</span>
          </label>
        ))}
      </div>

      {form.cancer === "si" && (
        <div className="hc-field">
          <label>Tipo de cáncer</label>
          <input
            type="text"
            placeholder="Ej: mama, próstata, colon, pulmón"
            value={form.cancerTipo || ""}
            onChange={e => set("cancerTipo", e.target.value)}
          />
        </div>
      )}

      <div className="hc-field">
        <label>Otras enfermedades previas</label>
        <textarea
          placeholder="Describir otras enfermedades diagnosticadas no listadas arriba"
          value={form.otrasEnfermedades || ""}
          onChange={e => set("otrasEnfermedades", e.target.value)}
        />
      </div>

      <div className="hc-field">
        <label>Hospitalizaciones previas</label>
        <textarea
          placeholder="Año, motivo, establecimiento de salud (una por línea)"
          value={form.hospitalizaciones || ""}
          onChange={e => set("hospitalizaciones", e.target.value)}
        />
      </div>

      <h3 className="hc-section-title">ANTECEDENTES QUIRÚRGICOS</h3>

      <div className="hc-field">
        <label>Cirugías realizadas</label>
        <textarea
          placeholder="Procedimiento, año, hospital (una por línea)"
          value={form.cirugias || ""}
          onChange={e => set("cirugias", e.target.value)}
        />
      </div>

      <h3 className="hc-section-title">OTROS ANTECEDENTES</h3>

      <div className="hc-field">
        <label>Traumatismos / Fracturas previas</label>
        <textarea
          placeholder="Tipo, región afectada y año"
          value={form.traumatismos || ""}
          onChange={e => set("traumatismos", e.target.value)}
        />
      </div>

      <div className="hc-field-row hc-field-row--2col">
        <div className="hc-field">
          <label>Transfusiones sanguíneas</label>
          <select value={form.transfusiones || ""} onChange={e => set("transfusiones", e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="no">No</option>
            <option value="si">Sí</option>
          </select>
        </div>
        {form.transfusiones === "si" && (
          <div className="hc-field">
            <label>Reacciones / Observaciones</label>
            <input
              type="text"
              placeholder="Describir si hubo reacciones"
              value={form.transfusionesObs || ""}
              onChange={e => set("transfusionesObs", e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="hc-field">
        <label>Uso de terapias alternativas o complementarias</label>
        <textarea
          placeholder="Ej: acupuntura, hierbas medicinales, homeopatía"
          value={form.terapiasAlternativas || ""}
          onChange={e => set("terapiasAlternativas", e.target.value)}
        />
      </div>

      <h3 className="hc-section-title">FUNCIONES BIOLÓGICAS (BASELINE)</h3>
      <p className="hc-section-hint">Registre el estado habitual del paciente, no el actual por consulta</p>

      <div className="hc-field-row hc-field-row--2col">
        <div className="hc-field">
          <label>Apetito</label>
          <select value={form.apetito || ""} onChange={e => set("apetito", e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="normal">Normal</option>
            <option value="aumentado">Aumentado</option>
            <option value="disminuido">Disminuido</option>
            <option value="ausente">Ausente / Anorexia</option>
          </select>
        </div>
        <div className="hc-field">
          <label>Sed</label>
          <select value={form.sed || ""} onChange={e => set("sed", e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="normal">Normal</option>
            <option value="aumentada">Aumentada / Polidipsia</option>
            <option value="disminuida">Disminuida</option>
          </select>
        </div>
      </div>

      <div className="hc-field-row hc-field-row--2col">
        <div className="hc-field">
          <label>Orina</label>
          <select value={form.orina || ""} onChange={e => set("orina", e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="normal">Normal</option>
            <option value="poliuria">Poliuria (frecuente/abundante)</option>
            <option value="oliguria">Oliguria (escasa)</option>
            <option value="disuria">Disuria (dolorosa)</option>
            <option value="hematuria">Hematuria</option>
            <option value="otra">Otra alteración</option>
          </select>
        </div>
        <div className="hc-field">
          <label>Deposiciones</label>
          <select value={form.deposiciones || ""} onChange={e => set("deposiciones", e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="normal">Normal</option>
            <option value="constipacion">Constipación</option>
            <option value="diarrea">Diarrea</option>
            <option value="alternancia">Alternancia (diarrea/constipación)</option>
            <option value="otra">Otra alteración</option>
          </select>
        </div>
      </div>

      <div className="hc-field">
        <label>Observaciones sobre funciones biológicas</label>
        <input
          type="text"
          placeholder="Detalles adicionales si hay alteraciones"
          value={form.funcionesBiolObs || ""}
          onChange={e => set("funcionesBiolObs", e.target.value)}
        />
      </div>

      <h3 className="hc-section-title">ALERGIAS</h3>

      <div className="hc-field">
        <label>Alergia a medicamentos</label>
        <textarea
          placeholder="Medicamento y tipo de reacción (Ej: Penicilina — urticaria generalizada)"
          value={form.alergiaMedicamentos || ""}
          onChange={e => set("alergiaMedicamentos", e.target.value)}
        />
      </div>

      <div className="hc-field">
        <label>Alergia a alimentos</label>
        <textarea
          placeholder="Alimento y tipo de reacción"
          value={form.alergiaAlimentos || ""}
          onChange={e => set("alergiaAlimentos", e.target.value)}
        />
      </div>

      <div className="hc-field-row hc-field-row--2col">
        <div className="hc-field">
          <label>Alergia a látex</label>
          <select value={form.alergiaLatex || ""} onChange={e => set("alergiaLatex", e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="no">No</option>
            <option value="si">Sí</option>
          </select>
        </div>
        <div className="hc-field">
          <label>Alergia a contraste yodado</label>
          <select value={form.alergiaContraste || ""} onChange={e => set("alergiaContraste", e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="no">No</option>
            <option value="si">Sí</option>
          </select>
        </div>
      </div>

      <div className="hc-field">
        <label>Otras alergias</label>
        <input
          type="text"
          placeholder="Polvo, animales, picaduras, etc."
          value={form.alergiaOtras || ""}
          onChange={e => set("alergiaOtras", e.target.value)}
        />
      </div>

      <div className="hc-form-actions">
        <button type="submit" className="hc-save-btn" disabled={guardando}>
          <Save size={16} /> {guardando ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────
// TAB 2 — ANTECEDENTES FISIOLÓGICOS / VACUNAS
// ─────────────────────────────────────────────────────────────

function FormFisiologicos({ datos, onGuardar, guardando, sexoPaciente }: FormProps) {
  const [form, setForm] = useState(datos);
  const esMujer = sexoPaciente === "F";

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  return (
    <form className="hc-form-grid" onSubmit={(e) => { e.preventDefault(); onGuardar(form); }}>
      <h3 className="hc-section-title">DATOS DE NACIMIENTO</h3>

      <div className="hc-field-row hc-field-row--3col">
        <div className="hc-field">
          <label>Tipo de parto</label>
          <select value={form.tipoParto || ""} onChange={e => set("tipoParto", e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="vaginal">Vaginal / eutócico</option>
            <option value="cesarea">Cesárea</option>
            <option value="instrumental">Instrumentado (fórceps / vacuum)</option>
          </select>
        </div>
        <div className="hc-field hc-field--unit">
          <div>
            <label>Peso al nacer</label>
            <input
              type="number"
              step="1"
              placeholder="0"
              value={form.pesoNacer || ""}
              onChange={e => set("pesoNacer", e.target.value)}
            />
          </div>
          <span className="hc-unit">gr</span>
        </div>
        <div className="hc-field">
          <label>Semanas de gestación</label>
          <input
            type="number"
            value={form.semanasGestacion || ""}
            onChange={e => set("semanasGestacion", e.target.value)}
          />
        </div>
      </div>

      <div className="hc-field">
        <label>Complicaciones neonatales</label>
        <textarea
          placeholder="Ictericia, hipoxia, prematuridad, malformaciones, etc."
          value={form.compliNeonatal || ""}
          onChange={e => set("compliNeonatal", e.target.value)}
        />
      </div>

      <div className="hc-field">
        <label>Grupo sanguíneo</label>
        <select value={form.grupoSanguineo || ""} onChange={e => set("grupoSanguineo", e.target.value)}>
          <option value="">Seleccionar...</option>
          {["A+", "A−", "B+", "B−", "AB+", "AB−", "O+", "O−"].map(g => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      {esMujer && (
        <>
          <h3 className="hc-section-title">ANTECEDENTES GINECO-OBSTÉTRICOS</h3>

          <div className="hc-field-row hc-field-row--2col">
            <div className="hc-field">
              <label>Edad de menarquia (años)</label>
              <input
                type="number"
                value={form.menarquia || ""}
                onChange={e => set("menarquia", e.target.value)}
              />
            </div>
            <div className="hc-field">
              <label>Fórmula menstrual (días duración / días ciclo)</label>
              <input
                type="text"
                placeholder="Ej: 4-5/28-30"
                value={form.formulaMenstrual || ""}
                onChange={e => set("formulaMenstrual", e.target.value)}
              />
            </div>
          </div>

          <div className="hc-field-row hc-field-row--2col">
            <div className="hc-field">
              <label>Fecha de última regla (FUR)</label>
              <input
                type="date"
                value={form.fur || ""}
                onChange={e => set("fur", e.target.value)}
              />
            </div>
            <div className="hc-field">
              <label>Estado menopáusico</label>
              <select value={form.menopausia || ""} onChange={e => set("menopausia", e.target.value)}>
                <option value="">Seleccionar...</option>
                <option value="no">No</option>
                <option value="perimenopausia">Perimenopausia</option>
                <option value="menopausia">Menopausia</option>
              </select>
            </div>
          </div>

          <div className="hc-field">
            <label>Fórmula obstétrica G_P_A_V (Gestaciones / Partos / Abortos / Hijos vivos)</label>
            <input
              type="text"
              placeholder="G_ P_ A_ V_"
              value={form.formulaGPAV || ""}
              onChange={e => set("formulaGPAV", e.target.value)}
            />
          </div>

          <div className="hc-field">
            <label>Gestaciones anteriores (detalle)</label>
            <textarea
              placeholder="Año, tipo de parto, peso RN, sexo, complicaciones (uno por línea)"
              value={form.gestacionesPrevias || ""}
              onChange={e => set("gestacionesPrevias", e.target.value)}
            />
          </div>

          <div className="hc-field">
            <label>Método anticonceptivo actual</label>
            <select value={form.anticonceptivo || ""} onChange={e => set("anticonceptivo", e.target.value)}>
              <option value="">Seleccionar...</option>
              <option value="ninguno">Ninguno</option>
              <option value="pildora">Píldora anticonceptiva</option>
              <option value="inyectable">Inyectable</option>
              <option value="diu">DIU</option>
              <option value="preservativo">Preservativo</option>
              <option value="esterilizacion">Esterilización</option>
              <option value="otro">Otro</option>
            </select>
          </div>
        </>
      )}

      <h3 className="hc-section-title">ESQUEMA DE VACUNACIÓN</h3>
      <p className="hc-section-hint">Indicar fecha de última dosis, "Al día" o "N/A" según corresponda</p>

      <div className="hc-field-row hc-field-row--3col">
        <div className="hc-field">
          <label>BCG</label>
          <input type="text" placeholder="Fecha / Al día / N/A" value={form.vacBCG || ""} onChange={e => set("vacBCG", e.target.value)} />
        </div>
        <div className="hc-field">
          <label>Hepatitis B</label>
          <input type="text" placeholder="Fecha / Dosis / N/A" value={form.vacHepB || ""} onChange={e => set("vacHepB", e.target.value)} />
        </div>
        <div className="hc-field">
          <label>Pentavalente / DPT</label>
          <input type="text" placeholder="Dosis completadas" value={form.vacDPT || ""} onChange={e => set("vacDPT", e.target.value)} />
        </div>
      </div>

      <div className="hc-field-row hc-field-row--3col">
        <div className="hc-field">
          <label>MMR (SRP)</label>
          <input type="text" placeholder="Fecha / Dosis" value={form.vacMMR || ""} onChange={e => set("vacMMR", e.target.value)} />
        </div>
        <div className="hc-field">
          <label>Varicela</label>
          <input type="text" placeholder="Fecha / Enfermedad natural" value={form.vacVaricela || ""} onChange={e => set("vacVaricela", e.target.value)} />
        </div>
        <div className="hc-field">
          <label>Neumococo</label>
          <input type="text" placeholder="Dosis / Fecha" value={form.vacNeumo || ""} onChange={e => set("vacNeumo", e.target.value)} />
        </div>
      </div>

      <div className="hc-field-row hc-field-row--3col">
        <div className="hc-field">
          <label>Influenza (anual)</label>
          <input type="text" placeholder="Última dosis" value={form.vacInfluenza || ""} onChange={e => set("vacInfluenza", e.target.value)} />
        </div>
        <div className="hc-field">
          <label>Antitetánica</label>
          <input type="text" placeholder="Última dosis / Año" value={form.vacTetanos || ""} onChange={e => set("vacTetanos", e.target.value)} />
        </div>
        <div className="hc-field">
          <label>HPV</label>
          <input type="text" placeholder="Dosis / Fecha / N/A" value={form.vacHPV || ""} onChange={e => set("vacHPV", e.target.value)} />
        </div>
      </div>

      <div className="hc-field-row hc-field-row--2col">
        <div className="hc-field">
          <label>COVID-19 (vacuna y N° dosis)</label>
          <input type="text" placeholder="Vacuna, N° dosis" value={form.vacCovid || ""} onChange={e => set("vacCovid", e.target.value)} />
        </div>
        <div className="hc-field">
          <label>Otras vacunas</label>
          <input type="text" placeholder="Fiebre amarilla, cólera, etc." value={form.vacOtras || ""} onChange={e => set("vacOtras", e.target.value)} />
        </div>
      </div>

      <h3 className="hc-section-title">MEDICAMENTOS HABITUALES</h3>

      <div className="hc-field">
        <label>Medicación crónica actual</label>
        <textarea
          placeholder="Nombre genérico, dosis, vía, frecuencia (uno por línea)"
          value={form.medicamentosHabituales || ""}
          onChange={e => set("medicamentosHabituales", e.target.value)}
        />
      </div>

      <div className="hc-form-actions">
        <button type="submit" className="hc-save-btn" disabled={guardando}>
          <Save size={16} /> {guardando ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────
// TAB 3 — ANTECEDENTES FAMILIARES
// ─────────────────────────────────────────────────────────────

function FormFamiliares({ datos, onGuardar, guardando }: FormProps) {
  const [form, setForm] = useState(datos);

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const check = (field: string, checked: boolean) =>
    setForm(prev => ({ ...prev, [field]: checked ? "si" : "" }));

  const parientes = [
    { id: "padre",     label: "Padre" },
    { id: "madre",     label: "Madre" },
    { id: "hermanos",  label: "Hermanos" },
    { id: "abueloPat", label: "Abuelo paterno" },
    { id: "abuelaPat", label: "Abuela paterna" },
    { id: "abueloMat", label: "Abuelo materno" },
    { id: "abuelaMat", label: "Abuela materna" },
  ];

  const condicionesComunes = [
    { id: "famHTA",       label: "Hipertensión Arterial" },
    { id: "famDM",        label: "Diabetes Mellitus" },
    { id: "famCancer",    label: "Cáncer" },
    { id: "famTBC",       label: "Tuberculosis" },
    { id: "famCardio",    label: "Enf. cardiovascular / ACV" },
    { id: "famMental",    label: "Enf. psiquiátrica / mental" },
    { id: "famObesi",     label: "Obesidad" },
    { id: "famRenal",     label: "Nefropatía crónica" },
    { id: "famEpilepsia", label: "Epilepsia" },
    { id: "famCongenita", label: "Malformaciones congénitas" },
  ];

  return (
    <form className="hc-form-grid" onSubmit={(e) => { e.preventDefault(); onGuardar(form); }}>
      <h3 className="hc-section-title">ANTECEDENTES POR FAMILIAR</h3>
      <p className="hc-section-hint">Registre enfermedades conocidas de cada familiar. Si falleció, indique la causa</p>

      {parientes.map(p => (
        <div key={p.id} className="hc-field-row hc-field-row--2col">
          <div className="hc-field">
            <label>{p.label} — Enfermedades / estado de salud</label>
            <input
              type="text"
              placeholder="Ej: HTA, DM tipo 2"
              value={form[`${p.id}Cond`] || ""}
              onChange={e => set(`${p.id}Cond`, e.target.value)}
            />
          </div>
          <div className="hc-field">
            <label>{p.label} — Causa de fallecimiento (si aplica)</label>
            <input
              type="text"
              placeholder="Causa / edad al fallecer"
              value={form[`${p.id}Fallec`] || ""}
              onChange={e => set(`${p.id}Fallec`, e.target.value)}
            />
          </div>
        </div>
      ))}

      <h3 className="hc-section-title">CARGA FAMILIAR / CONDICIONES HEREDITARIAS</h3>
      <p className="hc-section-hint">Marque las enfermedades presentes en cualquier familiar</p>

      <div className="hc-checklist hc-checklist--2col">
        {condicionesComunes.map(c => (
          <label key={c.id} className="hc-checkbox-item">
            <input
              type="checkbox"
              checked={form[c.id] === "si"}
              onChange={ev => check(c.id, ev.target.checked)}
            />
            <span>{c.label}</span>
          </label>
        ))}
      </div>

      {form.famCancer === "si" && (
        <div className="hc-field">
          <label>Tipo de cáncer familiar</label>
          <input
            type="text"
            placeholder="Ej: mama, colon, pulmón, próstata"
            value={form.famCancerTipo || ""}
            onChange={e => set("famCancerTipo", e.target.value)}
          />
        </div>
      )}

      <div className="hc-field">
        <label>Observaciones adicionales</label>
        <textarea
          placeholder="Información adicional relevante sobre antecedentes familiares"
          value={form.famObservaciones || ""}
          onChange={e => set("famObservaciones", e.target.value)}
        />
      </div>

      <div className="hc-form-actions">
        <button type="submit" className="hc-save-btn" disabled={guardando}>
          <Save size={16} /> {guardando ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────
// TAB 4 — HÁBITOS Y ESTILO DE VIDA
// ─────────────────────────────────────────────────────────────

function FormHabitos({ datos, onGuardar, guardando }: FormProps) {
  const [form, setForm] = useState(datos);

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const check = (field: string, checked: boolean) =>
    setForm(prev => ({ ...prev, [field]: checked ? "si" : "" }));

  const packYears = (() => {
    const qty   = parseFloat(form.tabacoCantidad || "0");
    const years = parseFloat(form.tabacoAnios    || "0");
    if (qty && years) return ((qty / 20) * years).toFixed(1);
    return "—";
  })();

  const exposiciones = [
    { id: "expPolvo",    label: "Polvo / polvos industriales" },
    { id: "expQuimicos", label: "Químicos / disolventes" },
    { id: "expRuido",    label: "Ruido intenso (> 85 dB)" },
    { id: "expRadiac",   label: "Radiación ionizante" },
    { id: "expBio",      label: "Agentes biológicos" },
    { id: "expCalor",    label: "Calor extremo" },
  ];

  return (
    <form className="hc-form-grid" onSubmit={(e) => { e.preventDefault(); onGuardar(form); }}>
      <h3 className="hc-section-title">TABACO</h3>

      <div className="hc-field">
        <label>Estado tabáquico</label>
        <select value={form.tabacoEstado || ""} onChange={e => set("tabacoEstado", e.target.value)}>
          <option value="">Seleccionar...</option>
          <option value="nunca">Nunca fumador</option>
          <option value="exfumador">Exfumador</option>
          <option value="activo">Fumador activo</option>
        </select>
      </div>

      {form.tabacoEstado === "activo" && (
        <div className="hc-field-row hc-field-row--3col">
          <div className="hc-field">
            <label>Cigarrillos / día</label>
            <input
              type="number"
              value={form.tabacoCantidad || ""}
              onChange={e => set("tabacoCantidad", e.target.value)}
            />
          </div>
          <div className="hc-field">
            <label>Años fumando</label>
            <input
              type="number"
              value={form.tabacoAnios || ""}
              onChange={e => set("tabacoAnios", e.target.value)}
            />
          </div>
          <div className="hc-field">
            <label>Pack-years (calculado)</label>
            <input type="text" readOnly value={packYears} className="hc-input-readonly" />
          </div>
        </div>
      )}

      {form.tabacoEstado === "exfumador" && (
        <div className="hc-field">
          <label>Hace cuántos años dejó de fumar</label>
          <input
            type="number"
            value={form.tabacoDejoHace || ""}
            onChange={e => set("tabacoDejoHace", e.target.value)}
          />
        </div>
      )}

      <h3 className="hc-section-title">ALCOHOL</h3>

      <div className="hc-field-row hc-field-row--2col">
        <div className="hc-field">
          <label>Consumo de alcohol</label>
          <select value={form.alcoholEstado || ""} onChange={e => set("alcoholEstado", e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="no">No consume</option>
            <option value="ocasional">Ocasional (&lt; 1 vez/semana)</option>
            <option value="regular">Regular (1-4 veces/semana)</option>
            <option value="excesivo">Excesivo (diario)</option>
          </select>
        </div>
        {form.alcoholEstado && form.alcoholEstado !== "no" && (
          <div className="hc-field">
            <label>Tipo de bebida preferida</label>
            <input
              type="text"
              placeholder="Cerveza, vino, licor..."
              value={form.alcoholTipo || ""}
              onChange={e => set("alcoholTipo", e.target.value)}
            />
          </div>
        )}
      </div>

      <h3 className="hc-section-title">OTRAS SUSTANCIAS</h3>

      <div className="hc-field-row hc-field-row--2col">
        <div className="hc-field">
          <label>Drogas no farmacológicas</label>
          <select value={form.drogasEstado || ""} onChange={e => set("drogasEstado", e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="nunca">Nunca</option>
            <option value="exusuario">Exusuario</option>
            <option value="activo">Consumo activo</option>
          </select>
        </div>
        {form.drogasEstado && form.drogasEstado !== "nunca" && (
          <div className="hc-field">
            <label>Tipo de sustancia</label>
            <input
              type="text"
              placeholder="Marihuana, cocaína, etc."
              value={form.drogasTipo || ""}
              onChange={e => set("drogasTipo", e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="hc-field">
        <label>Café (tazas/día)</label>
        <input
          type="number"
          step="0.5"
          value={form.cafeCantidad || ""}
          onChange={e => set("cafeCantidad", e.target.value)}
        />
      </div>

      <h3 className="hc-section-title">ACTIVIDAD FÍSICA</h3>

      <div className="hc-field-row hc-field-row--3col">
        <div className="hc-field">
          <label>Tipo de ejercicio</label>
          <input
            type="text"
            placeholder="Caminar, natación, gym..."
            value={form.ejercicioTipo || ""}
            onChange={e => set("ejercicioTipo", e.target.value)}
          />
        </div>
        <div className="hc-field hc-field--unit">
          <div>
            <label>Frecuencia</label>
            <input
              type="number"
              value={form.ejercicioFrecuencia || ""}
              onChange={e => set("ejercicioFrecuencia", e.target.value)}
            />
          </div>
          <span className="hc-unit">días/sem</span>
        </div>
        <div className="hc-field hc-field--unit">
          <div>
            <label>Duración</label>
            <input
              type="number"
              value={form.ejercicioDuracion || ""}
              onChange={e => set("ejercicioDuracion", e.target.value)}
            />
          </div>
          <span className="hc-unit">min</span>
        </div>
      </div>

      <h3 className="hc-section-title">ALIMENTACIÓN Y SUEÑO</h3>

      <div className="hc-field-row hc-field-row--2col">
        <div className="hc-field">
          <label>Tipo de dieta</label>
          <select value={form.dietaTipo || ""} onChange={e => set("dietaTipo", e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="normal">Normal / sin restricciones</option>
            <option value="vegetariana">Vegetariana</option>
            <option value="vegana">Vegana</option>
            <option value="diabetica">Diabética</option>
            <option value="hipocalorica">Hipocalórica</option>
            <option value="hiposodica">Hiposódica</option>
            <option value="sinGluten">Sin gluten (celíaca)</option>
            <option value="otra">Otra</option>
          </select>
        </div>
        <div className="hc-field">
          <label>Número de comidas al día</label>
          <input
            type="number"
            value={form.comidasDia || ""}
            onChange={e => set("comidasDia", e.target.value)}
          />
        </div>
      </div>

      <div className="hc-field-row hc-field-row--2col">
        <div className="hc-field hc-field--unit">
          <div>
            <label>Horas de sueño</label>
            <input
              type="number"
              step="0.5"
              value={form.suenoHoras || ""}
              onChange={e => set("suenoHoras", e.target.value)}
            />
          </div>
          <span className="hc-unit">hrs/día</span>
        </div>
        <div className="hc-field">
          <label>Calidad del sueño</label>
          <select value={form.suenoCalidad || ""} onChange={e => set("suenoCalidad", e.target.value)}>
            <option value="">Seleccionar...</option>
            <option value="buena">Buena</option>
            <option value="regular">Regular</option>
            <option value="mala">Mala (insomnio / apnea)</option>
          </select>
        </div>
      </div>

      <h3 className="hc-section-title">OCUPACIÓN Y EXPOSICIÓN LABORAL</h3>

      <div className="hc-field-row hc-field-row--2col">
        <div className="hc-field">
          <label>Ocupación actual</label>
          <input
            type="text"
            value={form.ocupacion || ""}
            onChange={e => set("ocupacion", e.target.value)}
          />
        </div>
        <div className="hc-field hc-field--unit">
          <div>
            <label>Tiempo en la ocupación</label>
            <input
              type="number"
              value={form.ocupacionAnios || ""}
              onChange={e => set("ocupacionAnios", e.target.value)}
            />
          </div>
          <span className="hc-unit">años</span>
        </div>
      </div>

      <div className="hc-field">
        <label>Exposición laboral a factores de riesgo</label>
        <div className="hc-checklist hc-checklist--2col">
          {exposiciones.map(ex => (
            <label key={ex.id} className="hc-checkbox-item">
              <input
                type="checkbox"
                checked={form[ex.id] === "si"}
                onChange={ev => check(ex.id, ev.target.checked)}
              />
              <span>{ex.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="hc-field">
        <label>Observaciones adicionales</label>
        <textarea
          value={form.habitosObs || ""}
          onChange={e => set("habitosObs", e.target.value)}
        />
      </div>

      <div className="hc-form-actions">
        <button type="submit" className="hc-save-btn" disabled={guardando}>
          <Save size={16} /> {guardando ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}
