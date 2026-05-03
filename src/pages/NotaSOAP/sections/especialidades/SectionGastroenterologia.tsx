import type { EspecialidadData } from "../../types";

interface Props {
  data: EspecialidadData;
  setData: (d: EspecialidadData) => void;
  onPrev: () => void;
}

export default function SectionGastroenterologia({ data, setData, onPrev }: Props) {
  const up = (k: string, v: string) => setData({ ...data, [k]: v });
  const val = (k: string) => data[k] ?? '';

  return (
    <div className="soap-content-inner">

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Antecedentes Gastrointestinales
      </p>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Patología GI previa</label>
        <input className="soap-input" value={val('patologiaGI')} onChange={e => up('patologiaGI', e.target.value)} placeholder="Úlcera péptica, gastritis, EII, diverticulosis, pólipos, cirugía GI…" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">H. pylori (estado)</label>
          <select className="soap-input" value={val('hPylori')} onChange={e => up('hPylori', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Positivo — en tratamiento</option>
            <option>Positivo — sin tratamiento</option>
            <option>Negativo (erradicado)</option>
            <option>No estudiado</option>
          </select>
        </div>
        <div>
          <label className="soap-section-label">Consumo de AINES</label>
          <select className="soap-input" value={val('consumoAines')} onChange={e => up('consumoAines', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>No</option>
            <option>Ocasional</option>
            <option>Crónico sin protección</option>
            <option>Crónico con IBP</option>
          </select>
        </div>
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Síntomas Gastrointestinales Actuales
      </p>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Dolor abdominal (localización, carácter, factores)</label>
        <textarea className="soap-input soap-textarea" style={{ minHeight: 60 }} value={val('dolorAbdominal')} onChange={e => up('dolorAbdominal', e.target.value)} placeholder="Epigástrico / hipocondrio derecho / difuso, tipo cólico/ardor, relación con comidas…" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">Pirosis / Reflujo</label>
          <select className="soap-input" value={val('pirosis')} onChange={e => up('pirosis', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Ausente</option>
            <option>Ocasional</option>
            <option>Frecuente (&gt;2 días/sem)</option>
            <option>Diario</option>
          </select>
        </div>
        <div>
          <label className="soap-section-label">Náuseas / Vómitos</label>
          <input className="soap-input" value={val('nauseasVomitos')} onChange={e => up('nauseasVomitos', e.target.value)} placeholder="Frecuencia, contenido, relación con comidas…" />
        </div>
        <div>
          <label className="soap-section-label">Disfagia</label>
          <select className="soap-input" value={val('disfagia')} onChange={e => up('disfagia', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Ausente</option>
            <option>A sólidos</option>
            <option>A líquidos</option>
            <option>A sólidos y líquidos</option>
          </select>
        </div>
        <div>
          <label className="soap-section-label">Hábito intestinal</label>
          <select className="soap-input" value={val('habitoIntestinal')} onChange={e => up('habitoIntestinal', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Normal</option>
            <option>Estreñimiento</option>
            <option>Diarrea</option>
            <option>Alternancia diarrea-estreñimiento</option>
          </select>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">Hematoquecia (sangre roja en heces)</label>
          <select className="soap-input" value={val('hematoquecia')} onChange={e => up('hematoquecia', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>No</option>
            <option>Sí — esporádica</option>
            <option>Sí — frecuente</option>
          </select>
        </div>
        <div>
          <label className="soap-section-label">Melena (heces negras alquitranadas)</label>
          <select className="soap-input" value={val('melena')} onChange={e => up('melena', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>No</option>
            <option>Sí</option>
          </select>
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Distensión / meteorismo / flatulencia</label>
        <input className="soap-input" value={val('distension')} onChange={e => up('distension', e.target.value)} placeholder="Frecuencia, relación con alimentos…" />
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Evaluación Nutricional
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">Pérdida de peso reciente</label>
          <input className="soap-input" value={val('perdidaPeso')} onChange={e => up('perdidaPeso', e.target.value)} placeholder="Ej: –4 kg en 2 meses" />
        </div>
        <div>
          <label className="soap-section-label">Intolerancias alimentarias</label>
          <input className="soap-input" value={val('intolerancias')} onChange={e => up('intolerancias', e.target.value)} placeholder="Lactosa, gluten, fructosa…" />
        </div>
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Examen Físico Abdominal
      </p>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Hallazgos abdominales (palpación, percusión)</label>
        <textarea className="soap-input soap-textarea" style={{ minHeight: 60 }} value={val('examenAbdominal')} onChange={e => up('examenAbdominal', e.target.value)} placeholder="Dolor a la palpación en…, hepatomegalia x cm, esplenomegalia, masa palpable, ascitis (matidez desplazable), Murphy+/-…" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Signos de alarma presentes</label>
        <input className="soap-input" value={val('signosAlarma')} onChange={e => up('signosAlarma', e.target.value)} placeholder="Disfagia progresiva, pérdida de peso, vómitos persistentes, anemia, hemorragia…" />
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Antecedentes de Endoscopia
      </p>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">EDA / Colonoscopia previas (fecha y hallazgos)</label>
        <textarea className="soap-input soap-textarea" style={{ minHeight: 56 }} value={val('endoscopiaPrevia')} onChange={e => up('endoscopiaPrevia', e.target.value)} placeholder="EDA 2023: gastritis antral, biopsia (+) H. pylori…" />
      </div>

      <div className="soap-section-divider" />

      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Notas adicionales de Gastroenterología</label>
        <textarea className="soap-input soap-textarea" style={{ minHeight: 60 }} value={val('notasAdicionales')} onChange={e => up('notasAdicionales', e.target.value)} placeholder="Observaciones clínicas adicionales…" />
      </div>

      <div className="soap-nav-row" style={{ justifyContent: "flex-start", marginTop: 8 }}>
        <button className="soap-btn-secondary" onClick={onPrev}>← Volver al Plan</button>
      </div>
    </div>
  );
}
