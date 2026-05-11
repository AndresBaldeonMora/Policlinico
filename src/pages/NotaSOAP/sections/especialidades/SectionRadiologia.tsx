import * as React from "react";
import type { EspecialidadData } from "../../types";

interface Props {
  data: EspecialidadData;
  setData: React.Dispatch<React.SetStateAction<EspecialidadData>>;
  onPrev: () => void;
}

export default function SectionRadiologia({ data, setData, onPrev }: Props) {
  const up = (k: string, v: string) => setData(prev => ({ ...prev, [k]: v }));
  const val = (k: string) => data[k] ?? '';

  return (
    <div className="soap-content-inner">

      {/* INDICACIÓN */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Indicación del Estudio
      </p>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Órgano / región a evaluar</label>
        <input className="soap-input" value={val('organoEvaluar')} onChange={e => up('organoEvaluar', e.target.value)} placeholder="Ej: Tórax, abdomen, columna lumbar, cadera izquierda…" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Diagnóstico clínico sospechado / indicación</label>
        <input className="soap-input" value={val('indicacion')} onChange={e => up('indicacion', e.target.value)} placeholder="Ej: Descartar neumonía, control de fractura, estudio de masa abdominal…" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Antecedentes relevantes de la región</label>
        <input className="soap-input" value={val('antecedentesRegion')} onChange={e => up('antecedentesRegion', e.target.value)} placeholder="Cirugía previa, trauma, patología conocida…" />
      </div>

      <div className="soap-section-divider" />

      {/* TÉCNICA */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Técnica Utilizada
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">Tipo de estudio</label>
          <select className="soap-input" value={val('tipoEstudio')} onChange={e => up('tipoEstudio', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Radiografía simple</option>
            <option>Tomografía (TC)</option>
            <option>Resonancia magnética (RM)</option>
            <option>Ecografía</option>
            <option>PET-CT</option>
            <option>Fluoroscopía</option>
            <option>Mamografía</option>
            <option>Densitometría ósea</option>
          </select>
        </div>
        <div>
          <label className="soap-section-label">Proyecciones (si Rx)</label>
          <input className="soap-input" value={val('proyecciones')} onChange={e => up('proyecciones', e.target.value)} placeholder="Ej: PA y lateral / AP y perfil" />
        </div>
        <div>
          <label className="soap-section-label">Uso de contraste</label>
          <select className="soap-input" value={val('contraste')} onChange={e => up('contraste', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Sin contraste</option>
            <option>Con contraste IV</option>
            <option>Con contraste oral</option>
            <option>Con contraste IV y oral</option>
          </select>
        </div>
        <div>
          <label className="soap-section-label">Comparación con estudios previos</label>
          <select className="soap-input" value={val('comparacionPrevios')} onChange={e => up('comparacionPrevios', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Sin estudios previos disponibles</option>
            <option>Sin cambios significativos respecto a previo</option>
            <option>Con cambios respecto a previo (ver hallazgos)</option>
            <option>Primer estudio</option>
          </select>
        </div>
      </div>

      <div className="soap-section-divider" />

      {/* HALLAZGOS */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Hallazgos por Región / Órgano
      </p>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Hallazgos principales</label>
        <textarea className="soap-input soap-textarea" style={{ minHeight: 100 }} value={val('hallazgosPrincipales')} onChange={e => up('hallazgosPrincipales', e.target.value)} placeholder="Describir hallazgos por estructura: localización, tamaño, densidad/intensidad, características, relación con estructuras adyacentes…" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Hallazgos incidentales</label>
        <input className="soap-input" value={val('hallazgosIncidentales')} onChange={e => up('hallazgosIncidentales', e.target.value)} placeholder="Hallazgos no relacionados con indicación principal…" />
      </div>

      <div className="soap-section-divider" />

      {/* IMPRESIÓN */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Impresión Diagnóstica Radiológica
      </p>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Diagnóstico(s) radiológico(s)</label>
        <textarea className="soap-input soap-textarea" style={{ minHeight: 60 }} value={val('impresionRadiologica')} onChange={e => up('impresionRadiologica', e.target.value)} placeholder="1. Condensación pulmonar basal derecha compatible con neumonía…" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Recomendaciones / estudios complementarios</label>
        <input className="soap-input" value={val('recomendaciones')} onChange={e => up('recomendaciones', e.target.value)} placeholder="Correlacionar con clínica, TC de control en 3 meses, biopsia…" />
      </div>

      <div className="soap-section-divider" />

      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Notas adicionales de Radiología</label>
        <textarea className="soap-input soap-textarea" style={{ minHeight: 60 }} value={val('notasAdicionales')} onChange={e => up('notasAdicionales', e.target.value)} placeholder="Limitaciones técnicas, calidad del estudio, artefactos…" />
      </div>

      <div className="soap-nav-row" style={{ justifyContent: "flex-start", marginTop: 8 }}>
        <button className="soap-btn-secondary" onClick={onPrev}>← Volver al Plan</button>
      </div>
    </div>
  );
}
