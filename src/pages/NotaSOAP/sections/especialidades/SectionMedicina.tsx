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
        <label htmlFor="medicina-sistemaCardiovascular" className="soap-section-label">Sistema cardiovascular</label>
        <input id="medicina-sistemaCardiovascular" className="soap-input" value={val('sistemaCardiovascular')} onChange={e => up('sistemaCardiovascular', e.target.value)} placeholder="" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="medicina-sistemaRespiratorio" className="soap-section-label">Sistema respiratorio</label>
        <input id="medicina-sistemaRespiratorio" className="soap-input" value={val('sistemaRespiratorio')} onChange={e => up('sistemaRespiratorio', e.target.value)} placeholder="" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="medicina-sistemaGI" className="soap-section-label">Sistema gastrointestinal</label>
        <input id="medicina-sistemaGI" className="soap-input" value={val('sistemaGI')} onChange={e => up('sistemaGI', e.target.value)} placeholder="" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="medicina-sistemaUrinario" className="soap-section-label">Sistema urinario</label>
        <input id="medicina-sistemaUrinario" className="soap-input" value={val('sistemaUrinario')} onChange={e => up('sistemaUrinario', e.target.value)} placeholder="" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="medicina-sistemaNeurologico" className="soap-section-label">Sistema neurológico</label>
        <input id="medicina-sistemaNeurologico" className="soap-input" value={val('sistemaNeurologico')} onChange={e => up('sistemaNeurologico', e.target.value)} placeholder="" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="medicina-sistemaMSE" className="soap-section-label">Sistema musculoesquelético</label>
        <input id="medicina-sistemaMSE" className="soap-input" value={val('sistemaMSE')} onChange={e => up('sistemaMSE', e.target.value)} placeholder="" />
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Banderas Rojas (Red Flags)
      </p>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="medicina-banderasRojas" className="soap-section-label">Banderas rojas identificadas</label>
        <textarea id="medicina-banderasRojas" className="soap-input soap-textarea" style={{ minHeight: 60 }} value={val('banderasRojas')} onChange={e => up('banderasRojas', e.target.value)} placeholder="" />
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Plan de Manejo en Primer Nivel
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label htmlFor="medicina-derivacion" className="soap-section-label">Derivación a especialidad</label>
          <input id="medicina-derivacion" className="soap-input" value={val('derivacion')} onChange={e => up('derivacion', e.target.value)} placeholder="" />
        </div>
        <div>
          <label htmlFor="medicina-seguimientoAps" className="soap-section-label">Seguimiento en APS</label>
          <input id="medicina-seguimientoAps" className="soap-input" value={val('seguimientoAps')} onChange={e => up('seguimientoAps', e.target.value)} placeholder="" />
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="medicina-educacionSalud" className="soap-section-label">Educación en salud brindada</label>
        <textarea id="medicina-educacionSalud" className="soap-input soap-textarea" style={{ minHeight: 56 }} value={val('educacionSalud')} onChange={e => up('educacionSalud', e.target.value)} placeholder="" />
      </div>

      <div className="soap-section-divider" />

      <div style={{ marginBottom: 14 }}>
        <label htmlFor="medicina-notasAdicionales" className="soap-section-label">Notas adicionales de Medicina General</label>
        <textarea id="medicina-notasAdicionales" className="soap-input soap-textarea" style={{ minHeight: 60 }} value={val('notasAdicionales')} onChange={e => up('notasAdicionales', e.target.value)} placeholder="" />
      </div>

      <div className="soap-nav-row" style={{ justifyContent: "flex-start", marginTop: 8 }}>
        <button className="soap-btn-secondary" onClick={onPrev}>← Volver al Plan</button>
      </div>
    </div>
  );
}
