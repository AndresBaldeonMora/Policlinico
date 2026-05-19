import * as React from "react";
import type { EspecialidadData } from "../../types";

interface Props {
  data: EspecialidadData;
  setData: React.Dispatch<React.SetStateAction<EspecialidadData>>;
  onPrev: () => void;
}

export default function SectionOdontologia({ data, setData, onPrev }: Props) {
  const up = (k: string, v: string) => setData(prev => ({ ...prev, [k]: v }));
  const val = (k: string) => data[k] ?? '';

  return (
    <div className="soap-content-inner">

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Antecedentes Dentales
      </p>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="odontologia-antDentales" className="soap-section-label">Antecedentes bucales relevantes</label>
        <input id="odontologia-antDentales" className="soap-input" value={val('antDentales')} onChange={e => up('antDentales', e.target.value)} placeholder="Caries, enfermedad periodontal, traumatismo dental, bruxismo, implantes, prótesis…" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label htmlFor="odontologia-protesisDental" className="soap-section-label">Prótesis dental actual</label>
          <select id="odontologia-protesisDental" className="soap-input" value={val('protesisDental')} onChange={e => up('protesisDental', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>No tiene</option>
            <option>Prótesis parcial removible</option>
            <option>Prótesis total removible</option>
            <option>Prótesis fija (puente)</option>
            <option>Implante dental</option>
          </select>
        </div>
        <div>
          <label htmlFor="odontologia-higieneBucal" className="soap-section-label">Higiene bucal</label>
          <select id="odontologia-higieneBucal" className="soap-input" value={val('higieneBucal')} onChange={e => up('higieneBucal', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Buena (cepilla 2–3 veces/día + seda)</option>
            <option>Regular (cepilla 1–2 veces/día)</option>
            <option>Deficiente (cepilla ocasionalmente)</option>
          </select>
        </div>
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Evaluación Extraoral
      </p>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="odontologia-evaluacionExtraoral" className="soap-section-label">Cara y músculos masticadores</label>
        <input id="odontologia-evaluacionExtraoral" className="soap-input" value={val('evaluacionExtraoral')} onChange={e => up('evaluacionExtraoral', e.target.value)} placeholder="Simetría, maseter, temporal, ATM (click, crepitación, apertura mm)…" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label htmlFor="odontologia-aperturaBucal" className="soap-section-label">Apertura bucal (mm)</label>
          <input id="odontologia-aperturaBucal" className="soap-input" type="number" value={val('aperturaBucal')} onChange={e => up('aperturaBucal', e.target.value)} placeholder="Normal: 35–55 mm" />
        </div>
        <div>
          <label htmlFor="odontologia-ruidosAtm" className="soap-section-label">Ruidos ATM</label>
          <select id="odontologia-ruidosAtm" className="soap-input" value={val('ruidosAtm')} onChange={e => up('ruidosAtm', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Ausentes</option>
            <option>Click (apertura)</option>
            <option>Click (cierre)</option>
            <option>Crepitación</option>
          </select>
        </div>
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Evaluación Intraoral
      </p>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="odontologia-estadoMucosas" className="soap-section-label">Estado de mucosas (labios, encías, lengua, paladar)</label>
        <textarea id="odontologia-estadoMucosas" className="soap-input soap-textarea" style={{ minHeight: 56 }} value={val('estadoMucosas')} onChange={e => up('estadoMucosas', e.target.value)} placeholder="Color, lesiones, inflamación gingival, sangrado, úlceras, leucoplasias…" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
        <div>
          <label htmlFor="odontologia-piezasPresentes" className="soap-section-label">Piezas presentes</label>
          <input id="odontologia-piezasPresentes" className="soap-input" type="number" min="0" max="32" value={val('piezasPresentes')} onChange={e => up('piezasPresentes', e.target.value)} />
        </div>
        <div>
          <label htmlFor="odontologia-piezasCariadas" className="soap-section-label">Piezas cariadas (C)</label>
          <input id="odontologia-piezasCariadas" className="soap-input" type="number" min="0" value={val('piezasCariadas')} onChange={e => up('piezasCariadas', e.target.value)} />
        </div>
        <div>
          <label htmlFor="odontologia-piezasAusentes" className="soap-section-label">Piezas ausentes (A)</label>
          <input id="odontologia-piezasAusentes" className="soap-input" type="number" min="0" value={val('piezasAusentes')} onChange={e => up('piezasAusentes', e.target.value)} />
        </div>
        <div>
          <label htmlFor="odontologia-piezasObturadas" className="soap-section-label">Piezas obturadas (O)</label>
          <input id="odontologia-piezasObturadas" className="soap-input" type="number" min="0" value={val('piezasObturadas')} onChange={e => up('piezasObturadas', e.target.value)} />
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="odontologia-indiceCaod" className="soap-section-label">Índice CAOD (calculado)</label>
        <input id="odontologia-indiceCaod" className="soap-input" value={val('indiceCaod')} onChange={e => up('indiceCaod', e.target.value)} placeholder="C+A+O = total (ej: 2+3+4 = 9)" />
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Evaluación Periodontal
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label htmlFor="odontologia-sangradoSondaje" className="soap-section-label">Sangrado al sondaje</label>
          <select id="odontologia-sangradoSondaje" className="soap-input" value={val('sangradoSondaje')} onChange={e => up('sangradoSondaje', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Ausente</option>
            <option>Localizado</option>
            <option>Generalizado</option>
          </select>
        </div>
        <div>
          <label htmlFor="odontologia-bolsasPeriodontales" className="soap-section-label">Profundidad de bolsas (máx. mm)</label>
          <input id="odontologia-bolsasPeriodontales" className="soap-input" value={val('bolsasPeriodontales')} onChange={e => up('bolsasPeriodontales', e.target.value)} placeholder="Ej: 4 mm sector posterior" />
        </div>
        <div>
          <label htmlFor="odontologia-movilidadDental" className="soap-section-label">Movilidad dental</label>
          <select id="odontologia-movilidadDental" className="soap-input" value={val('movilidadDental')} onChange={e => up('movilidadDental', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Sin movilidad</option>
            <option>Grado I - leve (&lt;1 mm horizontal)</option>
            <option>Grado II - moderada (1–2 mm horizontal)</option>
            <option>Grado III - severa (&gt;2 mm o vertical)</option>
          </select>
        </div>
        <div>
          <label htmlFor="odontologia-recesionGingival" className="soap-section-label">Recesión gingival</label>
          <input id="odontologia-recesionGingival" className="soap-input" value={val('recesionGingival')} onChange={e => up('recesionGingival', e.target.value)} placeholder="Ej: Clase I Miller en dientes 13, 23" />
        </div>
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Oclusión
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label htmlFor="odontologia-claseAngle" className="soap-section-label">Clase de Angle</label>
          <select id="odontologia-claseAngle" className="soap-input" value={val('claseAngle')} onChange={e => up('claseAngle', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Clase I (normoclusión)</option>
            <option>Clase II División 1</option>
            <option>Clase II División 2</option>
            <option>Clase III</option>
          </select>
        </div>
        <div>
          <label htmlFor="odontologia-overjet" className="soap-section-label">Overjet (mm)</label>
          <input id="odontologia-overjet" className="soap-input" value={val('overjet')} onChange={e => up('overjet', e.target.value)} placeholder="Normal: 2–4 mm" />
        </div>
        <div>
          <label htmlFor="odontologia-overbite" className="soap-section-label">Overbite (mm)</label>
          <input id="odontologia-overbite" className="soap-input" value={val('overbite')} onChange={e => up('overbite', e.target.value)} placeholder="Normal: 2–4 mm" />
        </div>
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Plan de Tratamiento Odontológico
      </p>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="odontologia-planTratamientoOdonto" className="soap-section-label">Tratamientos indicados</label>
        <textarea id="odontologia-planTratamientoOdonto" className="soap-input soap-textarea" style={{ minHeight: 60 }} value={val('planTratamientoOdonto')} onChange={e => up('planTratamientoOdonto', e.target.value)} placeholder="Detartraje, fluorización, obturaciones, endodoncia, exodoncia, prótesis, ortodoncia…" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="odontologia-educacionHigiene" className="soap-section-label">Educación en higiene indicada</label>
        <input id="odontologia-educacionHigiene" className="soap-input" value={val('educacionHigiene')} onChange={e => up('educacionHigiene', e.target.value)} placeholder="Técnica de cepillado, seda dental, enjuague, dieta…" />
      </div>

      <div className="soap-section-divider" />

      <div style={{ marginBottom: 14 }}>
        <label htmlFor="odontologia-notasAdicionales" className="soap-section-label">Notas adicionales de Odontología</label>
        <textarea id="odontologia-notasAdicionales" className="soap-input soap-textarea" style={{ minHeight: 60 }} value={val('notasAdicionales')} onChange={e => up('notasAdicionales', e.target.value)} placeholder="Observaciones, radiografías solicitadas, consentimiento…" />
      </div>

      <div className="soap-nav-row" style={{ justifyContent: "flex-start", marginTop: 8 }}>
        <button className="soap-btn-secondary" onClick={onPrev}>← Volver al Plan</button>
      </div>
    </div>
  );
}
