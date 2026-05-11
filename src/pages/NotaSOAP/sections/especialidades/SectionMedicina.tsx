import * as React from "react";
import type { EspecialidadData } from "../../types";

interface Props {
  data: EspecialidadData;
  setData: React.Dispatch<React.SetStateAction<EspecialidadData>>;
  onPrev: () => void;
}

export default function SectionMedicina({ data, setData, onPrev }: Props) {
  const up = (k: string, v: string) => setData(prev => ({ ...prev, [k]: v }));
  const val = (k: string) => data[k] ?? '';

  return (
    <div className="soap-content-inner">

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Evaluación Integral por Sistemas (Primer Contacto)
      </p>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Sistema cardiovascular</label>
        <input className="soap-input" value={val('sistemaCardiovascular')} onChange={e => up('sistemaCardiovascular', e.target.value)} placeholder="Palpitaciones, disnea, edemas, dolor torácico…" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Sistema respiratorio</label>
        <input className="soap-input" value={val('sistemaRespiratorio')} onChange={e => up('sistemaRespiratorio', e.target.value)} placeholder="Tos, disnea, expectoración, sibilancias…" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Sistema gastrointestinal</label>
        <input className="soap-input" value={val('sistemaGI')} onChange={e => up('sistemaGI', e.target.value)} placeholder="Náuseas, diarrea, dolor abdominal, vómitos…" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Sistema urinario</label>
        <input className="soap-input" value={val('sistemaUrinario')} onChange={e => up('sistemaUrinario', e.target.value)} placeholder="Disuria, poliuria, hematuria, urgencia…" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Sistema neurológico</label>
        <input className="soap-input" value={val('sistemaNeurologico')} onChange={e => up('sistemaNeurologico', e.target.value)} placeholder="Mareos, cefalea, debilidad, parestesias…" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Sistema musculoesquelético</label>
        <input className="soap-input" value={val('sistemaMSE')} onChange={e => up('sistemaMSE', e.target.value)} placeholder="Dolor articular, rigidez, limitación de movimiento…" />
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Banderas Rojas (Red Flags)
      </p>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Banderas rojas identificadas</label>
        <textarea className="soap-input soap-textarea" style={{ minHeight: 60 }} value={val('banderasRojas')} onChange={e => up('banderasRojas', e.target.value)} placeholder="Pérdida de peso inexplicada, sangrado sin causa aparente, fiebre persistente, masa palpable, síntomas neurológicos focales, disnea de reposo…" />
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Plan de Manejo en Primer Nivel
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">Derivación a especialidad</label>
          <input className="soap-input" value={val('derivacion')} onChange={e => up('derivacion', e.target.value)} placeholder="Ej: Cardiología — HTA no controlada / Ninguna" />
        </div>
        <div>
          <label className="soap-section-label">Seguimiento en APS</label>
          <input className="soap-input" value={val('seguimientoAps')} onChange={e => up('seguimientoAps', e.target.value)} placeholder="Ej: Control en 2 semanas" />
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Educación en salud brindada</label>
        <textarea className="soap-input soap-textarea" style={{ minHeight: 56 }} value={val('educacionSalud')} onChange={e => up('educacionSalud', e.target.value)} placeholder="Dieta saludable, actividad física, tabaco, signos de alarma para regresar antes…" />
      </div>

      <div className="soap-section-divider" />

      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Notas adicionales de Medicina General</label>
        <textarea className="soap-input soap-textarea" style={{ minHeight: 60 }} value={val('notasAdicionales')} onChange={e => up('notasAdicionales', e.target.value)} placeholder="Observaciones clínicas adicionales…" />
      </div>

      <div className="soap-nav-row" style={{ justifyContent: "flex-start", marginTop: 8 }}>
        <button className="soap-btn-secondary" onClick={onPrev}>← Volver al Plan</button>
      </div>
    </div>
  );
}
