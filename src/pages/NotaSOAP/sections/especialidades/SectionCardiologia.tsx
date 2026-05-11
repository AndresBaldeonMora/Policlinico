import * as React from "react";
import type { EspecialidadData } from "../../types";

interface Props {
  data: EspecialidadData;
  setData: React.Dispatch<React.SetStateAction<EspecialidadData>>;
  onPrev: () => void;
}

export default function SectionCardiologia({ data, setData, onPrev }: Props) {
  const up = (k: string, v: string) => setData(prev => ({ ...prev, [k]: v }));
  const val = (k: string) => data[k] ?? '';

  return (
    <div className="soap-content-inner">

      {/* ANTECEDENTES CARDIOLÓGICOS */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Antecedentes Cardiológicos
      </p>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Enfermedades cardiovasculares previas</label>
        <input className="soap-input" value={val('antCardiologicos')} onChange={e => up('antCardiologicos', e.target.value)} placeholder="Infarto, angina, arritmia, IC, cirugía cardíaca, marcapasos…" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Antecedentes familiares de ECV precoz</label>
        <input className="soap-input" value={val('antFamCardiologicos')} onChange={e => up('antFamCardiologicos', e.target.value)} placeholder="Infarto <55 años (hombre) / <65 años (mujer) en familiar directo" />
      </div>

      <div className="soap-section-divider" />

      {/* FR CARDIOVASCULAR */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Factores de Riesgo Cardiovascular
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">HTA (años de evolución)</label>
          <input className="soap-input" value={val('htaAños')} onChange={e => up('htaAños', e.target.value)} placeholder="Ej: 5 años" />
        </div>
        <div>
          <label className="soap-section-label">DM (tipo y años)</label>
          <input className="soap-input" value={val('dmTipo')} onChange={e => up('dmTipo', e.target.value)} placeholder="Ej: DM2 — 3 años" />
        </div>
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
          <label className="soap-section-label">Paquetes/año</label>
          <input className="soap-input" value={val('paquetesAno')} onChange={e => up('paquetesAno', e.target.value)} placeholder="Ej: 15" />
        </div>
        <div>
          <label className="soap-section-label">Dislipidemia (valores)</label>
          <input className="soap-input" value={val('dislipidemia')} onChange={e => up('dislipidemia', e.target.value)} placeholder="Ej: LDL 160 / HDL 38 / TG 250" />
        </div>
        <div>
          <label className="soap-section-label">Perímetro abdominal (cm)</label>
          <input className="soap-input" value={val('perimetroAbdominal')} onChange={e => up('perimetroAbdominal', e.target.value)} placeholder="Ej: 98" />
        </div>
      </div>

      <div className="soap-section-divider" />

      {/* SÍNTOMAS CARDIOLÓGICOS */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Síntomas Cardiológicos
      </p>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Dolor torácico (carácter, localización, irradiación, factores)</label>
        <textarea className="soap-input soap-textarea" style={{ minHeight: 60 }} value={val('dolorToracico')} onChange={e => up('dolorToracico', e.target.value)} placeholder="Opresivo retroesternal, irradiación al brazo izq., con el esfuerzo, dura 10 min…" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">Disnea</label>
          <select className="soap-input" value={val('disnea')} onChange={e => up('disnea', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Ausente</option>
            <option>De esfuerzo moderado</option>
            <option>De pequeños esfuerzos</option>
            <option>De reposo</option>
            <option>Ortopnea</option>
            <option>Disnea paroxística nocturna</option>
          </select>
        </div>
        <div>
          <label className="soap-section-label">Clasificación NYHA</label>
          <select className="soap-input" value={val('nyha')} onChange={e => up('nyha', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Clase I - Sin limitación</option>
            <option>Clase II - Ligera limitación</option>
            <option>Clase III - Marcada limitación</option>
            <option>Clase IV - Síntomas en reposo</option>
          </select>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">Palpitaciones</label>
          <input className="soap-input" value={val('palpitaciones')} onChange={e => up('palpitaciones', e.target.value)} placeholder="Frecuencia, regularidad, duración…" />
        </div>
        <div>
          <label className="soap-section-label">Síncope / Presíncope</label>
          <input className="soap-input" value={val('sincope')} onChange={e => up('sincope', e.target.value)} placeholder="Sí/No — contexto, frecuencia…" />
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Edema de miembros inferiores</label>
        <input className="soap-input" value={val('edemaMI')} onChange={e => up('edemaMI', e.target.value)} placeholder="Grado, localización, horario…" />
      </div>

      <div className="soap-section-divider" />

      {/* EXAMEN CARDIOVASCULAR */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Examen Cardiovascular
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">PA brazo derecho / brazo izquierdo</label>
          <input className="soap-input" value={val('paBilateral')} onChange={e => up('paBilateral', e.target.value)} placeholder="Ej: 140/90 / 138/88" />
        </div>
        <div>
          <label className="soap-section-label">Auscultación cardíaca</label>
          <input className="soap-input" value={val('auscultacionCardiaca')} onChange={e => up('auscultacionCardiaca', e.target.value)} placeholder="Soplos, clicks, R3/R4, roces…" />
        </div>
        <div>
          <label className="soap-section-label">Pulsos periféricos</label>
          <input className="soap-input" value={val('pulsosPeriferico')} onChange={e => up('pulsosPeriferico', e.target.value)} placeholder="Simétricos / asimétricos / disminuidos" />
        </div>
        <div>
          <label className="soap-section-label">Presión venosa yugular</label>
          <input className="soap-input" value={val('pvj')} onChange={e => up('pvj', e.target.value)} placeholder="Normal / Elevada" />
        </div>
      </div>

      <div className="soap-section-divider" />

      {/* EXÁMENES COMPLEMENTARIOS */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Resultados de Exámenes Cardiológicos
      </p>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">ECG (hallazgos principales)</label>
        <textarea className="soap-input soap-textarea" style={{ minHeight: 56 }} value={val('ecgHallazgos')} onChange={e => up('ecgHallazgos', e.target.value)} placeholder="Ritmo sinusal / FA / Bloqueo / Elevación ST / Hipertrofia VI…" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">Fracción de eyección (FEVI %)</label>
          <input className="soap-input" value={val('fevi')} onChange={e => up('fevi', e.target.value)} placeholder="Ej: 55%" />
        </div>
        <div>
          <label className="soap-section-label">Troponinas</label>
          <input className="soap-input" value={val('troponinas')} onChange={e => up('troponinas', e.target.value)} placeholder="Valor / Negativo / No solicitado" />
        </div>
        <div>
          <label className="soap-section-label">BNP / NT-proBNP</label>
          <input className="soap-input" value={val('bnp')} onChange={e => up('bnp', e.target.value)} placeholder="Valor / No solicitado" />
        </div>
      </div>

      <div className="soap-section-divider" />

      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Notas adicionales de Cardiología</label>
        <textarea className="soap-input soap-textarea" style={{ minHeight: 60 }} value={val('notasAdicionales')} onChange={e => up('notasAdicionales', e.target.value)} placeholder="Observaciones clínicas adicionales…" />
      </div>

      <div className="soap-nav-row" style={{ justifyContent: "flex-start", marginTop: 8 }}>
        <button className="soap-btn-secondary" onClick={onPrev}>← Volver al Plan</button>
      </div>
    </div>
  );
}
