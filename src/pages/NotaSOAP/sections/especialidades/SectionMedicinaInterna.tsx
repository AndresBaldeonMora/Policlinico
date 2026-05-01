import type { EspecialidadData } from "../../types";

interface Props {
  data: EspecialidadData;
  setData: (d: EspecialidadData) => void;
  onPrev: () => void;
}

export default function SectionMedicinaInterna({ data, setData, onPrev }: Props) {
  const up = (k: string, v: string) => setData({ ...data, [k]: v });
  const val = (k: string) => data[k] ?? '';

  return (
    <div className="soap-content-inner">

      {/* ANTECEDENTES ESPECÍFICOS */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Antecedentes Específicos
      </p>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Enfermedades crónicas sistémicas</label>
        <textarea className="soap-input soap-textarea" style={{ minHeight: 56 }} value={val('enfermedadesCronicas')} onChange={e => up('enfermedadesCronicas', e.target.value)} placeholder="HTA, DM2, dislipidemia, ERC, EPOC, hepatopatía…" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">Transfusiones sanguíneas previas</label>
          <select className="soap-input" value={val('transfusiones')} onChange={e => up('transfusiones', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>No</option>
            <option>Sí — sin reacción</option>
            <option>Sí — con reacción</option>
          </select>
        </div>
        <div>
          <label className="soap-section-label">Exposición ocupacional</label>
          <input className="soap-input" value={val('exposicionOcupacional')} onChange={e => up('exposicionOcupacional', e.target.value)} placeholder="Sustancias tóxicas, polvo, vapores…" />
        </div>
      </div>

      <div className="soap-section-divider" />

      {/* FR CARDIOVASCULAR */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Factores de Riesgo Cardiovascular
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">Tabaquismo</label>
          <select className="soap-input" value={val('tabaquismo')} onChange={e => up('tabaquismo', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>No fumador</option>
            <option>Ex-fumador</option>
            <option>Fumador activo</option>
          </select>
        </div>
        <div>
          <label className="soap-section-label">Paquetes/año (si fumador)</label>
          <input className="soap-input" value={val('paquetesAno')} onChange={e => up('paquetesAno', e.target.value)} placeholder="Ej: 10" />
        </div>
        <div>
          <label className="soap-section-label">Actividad física</label>
          <select className="soap-input" value={val('actividadFisica')} onChange={e => up('actividadFisica', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Sedentario</option>
            <option>Leve (&lt;3 días/sem)</option>
            <option>Moderado (3–5 días/sem)</option>
            <option>Intenso (&gt;5 días/sem)</option>
          </select>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">Colesterol total (mg/dL)</label>
          <input className="soap-input" value={val('colesterolTotal')} onChange={e => up('colesterolTotal', e.target.value)} placeholder="Ej: 200" />
        </div>
        <div>
          <label className="soap-section-label">LDL / HDL / Triglicéridos (mg/dL)</label>
          <input className="soap-input" value={val('perfilLipidico')} onChange={e => up('perfilLipidico', e.target.value)} placeholder="Ej: LDL 130 / HDL 45 / TG 180" />
        </div>
        <div>
          <label className="soap-section-label">Glucemia (mg/dL)</label>
          <input className="soap-input" value={val('glucemia')} onChange={e => up('glucemia', e.target.value)} placeholder="Ej: 98" />
        </div>
        <div>
          <label className="soap-section-label">Perímetro abdominal (cm)</label>
          <input className="soap-input" value={val('perimetroAbdominal')} onChange={e => up('perimetroAbdominal', e.target.value)} placeholder="Ej: 92" />
        </div>
      </div>

      <div className="soap-section-divider" />

      {/* EVALUACIÓN METABÓLICA */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Evaluación Metabólica
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">Peso ideal estimado (kg)</label>
          <input className="soap-input" value={val('pesoIdeal')} onChange={e => up('pesoIdeal', e.target.value)} placeholder="Ej: 68" />
        </div>
        <div>
          <label className="soap-section-label">Cambio de peso reciente</label>
          <input className="soap-input" value={val('cambioPeso')} onChange={e => up('cambioPeso', e.target.value)} placeholder="Ej: –5 kg en 3 meses" />
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Síntomas de desregulación metabólica</label>
        <input className="soap-input" value={val('sintomasMetabolicos')} onChange={e => up('sintomasMetabolicos', e.target.value)} placeholder="Polidipsia, polifagia, poliuria, intolerancia al calor/frío…" />
      </div>

      <div className="soap-section-divider" />

      {/* SÍNTOMAS SISTÉMICOS */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Síntomas Sistémicos
      </p>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Fiebre (patrón y duración)</label>
        <input className="soap-input" value={val('fiebrePatron')} onChange={e => up('fiebrePatron', e.target.value)} placeholder="Ej: Continua 5 días, T° máx 38.5°C" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Evaluación por sistemas</label>
        <textarea className="soap-input soap-textarea" style={{ minHeight: 80 }} value={val('evaluacionSistemas')} onChange={e => up('evaluacionSistemas', e.target.value)} placeholder="Cardiovascular: …&#10;Respiratorio: …&#10;GI: …&#10;Neurológico: …&#10;Dermatológico: …" />
      </div>

      <div className="soap-section-divider" />

      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Notas adicionales de Medicina Interna</label>
        <textarea className="soap-input soap-textarea" style={{ minHeight: 60 }} value={val('notasAdicionales')} onChange={e => up('notasAdicionales', e.target.value)} placeholder="Observaciones clínicas adicionales…" />
      </div>

      <div className="soap-nav-row" style={{ justifyContent: "flex-start", marginTop: 8 }}>
        <button className="soap-btn-secondary" onClick={onPrev}>← Volver al Plan</button>
      </div>
    </div>
  );
}
