import type { SectionSData } from "../types";

interface Props {
  data: SectionSData;
  setData: (d: SectionSData) => void;
  onNext: () => void;
}

const SINTOMAS = [
  { id: "fiebre",        label: "Fiebre",            det: "Temperatura máxima (°C)" },
  { id: "tos",           label: "Tos",                det: "Características (seca, productiva...)" },
  { id: "disnea",        label: "Disnea",             det: "Tipo: esfuerzo / reposo / nocturna" },
  { id: "dolorToracico", label: "Dolor torácico",     det: "Características, irradiación" },
  { id: "palpitaciones", label: "Palpitaciones",      det: null },
  { id: "nauseas",       label: "Náuseas / vómitos",  det: null },
  { id: "pesoChange",    label: "Cambios en peso",    det: "¿Cuánto? ¿En cuánto tiempo?" },
  { id: "dolor",         label: "Dolor",              det: "Localización + intensidad (0-10)" },
  { id: "urinario",      label: "Cambios urinarios",  det: null },
  { id: "apetito",       label: "Cambios en apetito", det: null },
] as const;

export default function SectionS({ data, setData, onNext }: Props) {
  const up = <K extends keyof SectionSData>(key: K, val: SectionSData[K]) =>
    setData({ ...data, [key]: val });

  const upSintoma = (id: string, val: "si" | "no") =>
    setData({ ...data, sintomas: { ...data.sintomas, [id]: val } });

  const upDetalle = (id: string, val: string) =>
    setData({ ...data, sinoDetalle: { ...data.sinoDetalle, [id]: val } });

  return (
    <div className="soap-content-inner">
      {/* Motivo */}
      <div style={{ marginBottom: 18 }}>
        <label className="soap-section-label">
          Motivo de consulta <span className="soap-required">*</span>
        </label>
        <textarea
          className="soap-input soap-textarea"
          style={{ minHeight: 60 }}
          placeholder='"Refiere edemas en piernas y sensación de ahogo al caminar..."'
          value={data.motivoConsulta}
          onChange={e => up("motivoConsulta", e.target.value)}
        />
        <p className="soap-field-hint">Registre en primera persona cuando sea posible</p>
      </div>

      {/* Tiempo de enfermedad */}
      <div style={{ marginBottom: 18 }}>
        <label className="soap-section-label">
          Tiempo de enfermedad <span className="soap-required">*</span>
        </label>
        <input
          className="soap-input"
          style={{ maxWidth: 260 }}
          placeholder="Ej: 5 días, 2 semanas, 3 meses"
          value={data.tiempoEnfermedad}
          onChange={e => up("tiempoEnfermedad", e.target.value)}
        />
      </div>

      {/* Enfermedad actual */}
      <div style={{ marginBottom: 20 }}>
        <label className="soap-section-label">
          Descripción de la enfermedad actual <span className="soap-required">*</span>
        </label>
        <textarea
          className="soap-input soap-textarea"
          style={{ minHeight: 110 }}
          placeholder="Cronología, evolución, factores que mejoran o empeoran, síntomas asociados..."
          value={data.enfermedadActual}
          onChange={e => up("enfermedadActual", e.target.value)}
        />
      </div>

      {/* Interrogatorio */}
      <div className="soap-section-divider" />
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 12 }}>
        Interrogatorio Dirigido
      </p>

      <div className="soap-check-grid" style={{ marginBottom: 16 }}>
        {SINTOMAS.map(s => {
          const val = data.sintomas[s.id];
          const det = data.sinoDetalle[s.id] || "";
          return (
            <div key={s.id} className={`soap-sintoma-item ${val === "si" ? "si" : ""}`}>
              <div className="soap-sintoma-row">
                <span className="soap-sintoma-label">{s.label}</span>
                <div className="soap-sintoma-radios">
                  {(["si", "no"] as const).map(v => (
                    <label key={v} className="soap-sintoma-radio">
                      <input
                        type="radio"
                        name={`sint-${s.id}`}
                        value={v}
                        checked={val === v}
                        onChange={() => upSintoma(s.id, v)}
                        style={{ accentColor: "var(--primary)" }}
                      />
                      {v === "si" ? "Sí" : "No"}
                    </label>
                  ))}
                </div>
              </div>
              {val === "si" && s.det && (
                <input
                  className="soap-input"
                  style={{ marginTop: 8, fontSize: 12, padding: "5px 9px" }}
                  placeholder={s.det}
                  value={det}
                  onChange={e => upDetalle(s.id, e.target.value)}
                />
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginBottom: 20 }}>
        <label className="soap-section-label">Otros síntomas</label>
        <textarea
          className="soap-input soap-textarea"
          style={{ minHeight: 56 }}
          placeholder="Otros síntomas relevantes no incluidos arriba..."
          value={data.otrosSintomas}
          onChange={e => up("otrosSintomas", e.target.value)}
        />
      </div>

      <div className="soap-nav-row" style={{ justifyContent: "flex-end" }}>
        <button className="soap-btn-next" onClick={onNext}>
          Siguiente: Objetivo →
        </button>
      </div>
    </div>
  );
}
