import * as React from "react";
import type { EspecialidadData } from "../../types";

interface Props {
  data: EspecialidadData;
  setData: React.Dispatch<React.SetStateAction<EspecialidadData>>;
  onPrev: () => void;
}

export default function SectionMedicinaFisica({ data, setData, onPrev }: Props) {
  const up = (k: string, v: string) => setData(prev => ({ ...prev, [k]: v }));
  const val = (k: string) => data[k] ?? '';

  return (
    <div className="soap-content-inner">

      {/* ANTECEDENTES */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Antecedentes de Lesión / Discapacidad
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">Tipo de lesión / condición</label>
          <input className="soap-input" value={val('tipoLesion')} onChange={e => up('tipoLesion', e.target.value)} placeholder="ACV, fractura, TEC, artropatía…" />
        </div>
        <div>
          <label className="soap-section-label">Causa</label>
          <select className="soap-input" value={val('causaLesion')} onChange={e => up('causaLesion', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Traumática</option>
            <option>Congénita</option>
            <option>Degenerativa</option>
            <option>Vascular (ACV)</option>
            <option>Neurológica</option>
            <option>Oncológica</option>
            <option>Otra</option>
          </select>
        </div>
        <div>
          <label className="soap-section-label">Fecha de inicio / evento</label>
          <input className="soap-input" type="date" value={val('fechaInicioLesion')} onChange={e => up('fechaInicioLesion', e.target.value)} />
        </div>
        <div>
          <label className="soap-section-label">Dispositivos de asistencia actuales</label>
          <input className="soap-input" value={val('dispositivosAsistencia')} onChange={e => up('dispositivosAsistencia', e.target.value)} placeholder="Bastón, muletas, silla de ruedas, órtesis…" />
        </div>
      </div>

      <div className="soap-section-divider" />

      {/* EVALUACIÓN FUNCIONAL */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Evaluación Funcional
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">Índice de Barthel (0–100)</label>
          <input className="soap-input" type="number" min="0" max="100" value={val('barthel')} onChange={e => up('barthel', e.target.value)} placeholder="Ej: 75" />
          <p className="soap-field-hint">0=dependencia total · 100=independencia total</p>
        </div>
        <div>
          <label className="soap-section-label">Lawton-Brody AIVD (0–8)</label>
          <input className="soap-input" type="number" min="0" max="8" value={val('lawtonBrody')} onChange={e => up('lawtonBrody', e.target.value)} placeholder="Ej: 5" />
          <p className="soap-field-hint">0=dependencia total · 8=independencia total</p>
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">AVD limitadas (describir)</label>
        <textarea className="soap-input soap-textarea" style={{ minHeight: 56 }} value={val('avdLimitadas')} onChange={e => up('avdLimitadas', e.target.value)} placeholder="Vestirse, higiene, alimentación, transferencias, continencia…" />
      </div>

      <div className="soap-section-divider" />

      {/* FUERZA MUSCULAR */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Fuerza Muscular — Escala de Lovett (0–5)
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">EESS Derecha</label>
          <input className="soap-input" value={val('fuerzaEESD')} onChange={e => up('fuerzaEESD', e.target.value)} placeholder="Ej: 4/5" />
        </div>
        <div>
          <label className="soap-section-label">EESS Izquierda</label>
          <input className="soap-input" value={val('fuerzaEESI')} onChange={e => up('fuerzaEESI', e.target.value)} placeholder="Ej: 5/5" />
        </div>
        <div>
          <label className="soap-section-label">EEII Derecha</label>
          <input className="soap-input" value={val('fuerzaEEID')} onChange={e => up('fuerzaEEID', e.target.value)} placeholder="Ej: 3/5" />
        </div>
        <div>
          <label className="soap-section-label">EEII Izquierda</label>
          <input className="soap-input" value={val('fuerzaEEII')} onChange={e => up('fuerzaEEII', e.target.value)} placeholder="Ej: 3/5" />
        </div>
      </div>

      <div className="soap-section-divider" />

      {/* TONO Y ROM */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Tono Muscular y ROM
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">Tono muscular</label>
          <select className="soap-input" value={val('tonoMuscular')} onChange={e => up('tonoMuscular', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Normal</option>
            <option>Hipotonía</option>
            <option>Espasticidad leve (Ashworth 1)</option>
            <option>Espasticidad moderada (Ashworth 2)</option>
            <option>Espasticidad severa (Ashworth 3–4)</option>
            <option>Rigidez</option>
          </select>
        </div>
        <div>
          <label className="soap-section-label">Contracturas / Limitaciones articulares</label>
          <input className="soap-input" value={val('contracturas')} onChange={e => up('contracturas', e.target.value)} placeholder="Articulación y grados de limitación…" />
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">ROM principal afectado</label>
        <textarea className="soap-input soap-textarea" style={{ minHeight: 56 }} value={val('romAfectado')} onChange={e => up('romAfectado', e.target.value)} placeholder="Hombro Der.: flexión 0–90° (limitado), rotación interna 0–45°…" />
      </div>

      <div className="soap-section-divider" />

      {/* EQUILIBRIO Y MARCHA */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Equilibrio y Marcha
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">Prueba de Romberg</label>
          <select className="soap-input" value={val('romberg')} onChange={e => up('romberg', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Negativo</option>
            <option>Positivo (inestabilidad con ojos cerrados)</option>
            <option>No evaluado</option>
          </select>
        </div>
        <div>
          <label className="soap-section-label">Puntuación Tinetti (0–28)</label>
          <input className="soap-input" type="number" min="0" max="28" value={val('tinetti')} onChange={e => up('tinetti', e.target.value)} placeholder="Ej: 20" />
          <p className="soap-field-hint">&lt;19 = alto riesgo de caída</p>
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Descripción de la marcha</label>
        <input className="soap-input" value={val('descripcionMarcha')} onChange={e => up('descripcionMarcha', e.target.value)} placeholder="Normal / espástica / atáxica / parkinsoniana / con ayuda…" />
      </div>

      <div className="soap-section-divider" />

      {/* DOLOR */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Evaluación del Dolor
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">Intensidad del dolor (EVA 0–10)</label>
          <input className="soap-input" type="number" min="0" max="10" value={val('doloreEva')} onChange={e => up('doloreEva', e.target.value)} placeholder="0–10" />
        </div>
        <div>
          <label className="soap-section-label">Localización del dolor</label>
          <input className="soap-input" value={val('dolorLocalizacion')} onChange={e => up('dolorLocalizacion', e.target.value)} placeholder="Ej: Hombro derecho, región lumbar…" />
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Factores que mejoran / empeoran</label>
        <input className="soap-input" value={val('dolorFactores')} onChange={e => up('dolorFactores', e.target.value)} placeholder="Reposo alivia / movimiento empeora / calor mejora…" />
      </div>

      <div className="soap-section-divider" />

      {/* PLAN DE REHABILITACIÓN */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Plan de Rehabilitación
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">Modalidades terapéuticas indicadas</label>
          <textarea className="soap-input soap-textarea" style={{ minHeight: 56 }} value={val('modalidadesTerapeuticas')} onChange={e => up('modalidadesTerapeuticas', e.target.value)} placeholder="Fisioterapia, terapia ocupacional, fonoaudiología, electroterapia…" />
        </div>
        <div>
          <label className="soap-section-label">Objetivos funcionales</label>
          <textarea className="soap-input soap-textarea" style={{ minHeight: 56 }} value={val('objetivosFuncionales')} onChange={e => up('objetivosFuncionales', e.target.value)} placeholder="Recuperar marcha independiente, aumentar ROM hombro a 180°…" />
        </div>
      </div>

      <div className="soap-section-divider" />

      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Notas adicionales de Medicina Física y Rehabilitación</label>
        <textarea className="soap-input soap-textarea" style={{ minHeight: 60 }} value={val('notasAdicionales')} onChange={e => up('notasAdicionales', e.target.value)} placeholder="Observaciones clínicas adicionales…" />
      </div>

      <div className="soap-nav-row" style={{ justifyContent: "flex-start", marginTop: 8 }}>
        <button className="soap-btn-secondary" onClick={onPrev}>← Volver al Plan</button>
      </div>
    </div>
  );
}
