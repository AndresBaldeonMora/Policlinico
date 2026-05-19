import * as React from "react";
import type { EspecialidadData } from "../../types";

interface Props {
  data: EspecialidadData;
  setData: React.Dispatch<React.SetStateAction<EspecialidadData>>;
  onPrev: () => void;
}

export default function SectionOftalmologia({ data, setData, onPrev }: Props) {
  const up = (k: string, v: string) => setData(prev => ({ ...prev, [k]: v }));
  const val = (k: string) => data[k] ?? '';

  return (
    <div className="soap-content-inner">

      {/* ANTECEDENTES OFTALMOLÓGICOS */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Antecedentes Oftalmológicos
      </p>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="oftalmologia-patologiaOcularPrevia" className="soap-section-label">Patología ocular previa</label>
        <input id="oftalmologia-patologiaOcularPrevia" className="soap-input" value={val('patologiaOcularPrevia')} onChange={e => up('patologiaOcularPrevia', e.target.value)} placeholder="Cataratas, glaucoma, miopía, astigmatismo, cirugías oculares…" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label htmlFor="oftalmologia-usoLentes" className="soap-section-label">Uso de lentes</label>
          <select id="oftalmologia-usoLentes" className="soap-input" value={val('usoLentes')} onChange={e => up('usoLentes', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>No usa lentes</option>
            <option>Lentes ópticos</option>
            <option>Lentes de contacto</option>
            <option>Bifocales / progresivos</option>
          </select>
        </div>
        <div>
          <label htmlFor="oftalmologia-enfermedadesSistemicas" className="soap-section-label">Enfermedades sistémicas oculares (DM, HTA)</label>
          <input id="oftalmologia-enfermedadesSistemicas" className="soap-input" value={val('enfermedadesSistemicas')} onChange={e => up('enfermedadesSistemicas', e.target.value)} placeholder="DM2, HTA, tiroides…" />
        </div>
      </div>

      <div className="soap-section-divider" />

      {/* SÍNTOMAS */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Síntomas Oftalmológicos
      </p>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="oftalmologia-sintomasActuales" className="soap-section-label">Síntomas actuales</label>
        <textarea id="oftalmologia-sintomasActuales" className="soap-input soap-textarea" style={{ minHeight: 60 }} value={val('sintomasActuales')} onChange={e => up('sintomasActuales', e.target.value)} placeholder="Borrosidad, dolor, ojo rojo, secreción, floaters, fotopsia, fotofobia, diplopía, pérdida de campo visual…" />
      </div>

      <div className="soap-section-divider" />

      {/* AGUDEZA VISUAL */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Agudeza Visual
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label htmlFor="oftalmologia-avODSinCorreccion" className="soap-section-label">AV OD sin corrección</label>
          <input id="oftalmologia-avODSinCorreccion" className="soap-input" value={val('avODSinCorreccion')} onChange={e => up('avODSinCorreccion', e.target.value)} placeholder="Ej: 20/40" />
        </div>
        <div>
          <label htmlFor="oftalmologia-avOISinCorreccion" className="soap-section-label">AV OI sin corrección</label>
          <input id="oftalmologia-avOISinCorreccion" className="soap-input" value={val('avOISinCorreccion')} onChange={e => up('avOISinCorreccion', e.target.value)} placeholder="Ej: 20/60" />
        </div>
        <div>
          <label htmlFor="oftalmologia-avODConCorreccion" className="soap-section-label">AV OD con corrección</label>
          <input id="oftalmologia-avODConCorreccion" className="soap-input" value={val('avODConCorreccion')} onChange={e => up('avODConCorreccion', e.target.value)} placeholder="Ej: 20/20" />
        </div>
        <div>
          <label htmlFor="oftalmologia-avOIConCorreccion" className="soap-section-label">AV OI con corrección</label>
          <input id="oftalmologia-avOIConCorreccion" className="soap-input" value={val('avOIConCorreccion')} onChange={e => up('avOIConCorreccion', e.target.value)} placeholder="Ej: 20/25" />
        </div>
        <div>
          <label htmlFor="oftalmologia-visionCercaOD" className="soap-section-label">Visión de cerca OD</label>
          <input id="oftalmologia-visionCercaOD" className="soap-input" value={val('visionCercaOD')} onChange={e => up('visionCercaOD', e.target.value)} placeholder="Ej: J1" />
        </div>
        <div>
          <label htmlFor="oftalmologia-visionCercaOI" className="soap-section-label">Visión de cerca OI</label>
          <input id="oftalmologia-visionCercaOI" className="soap-input" value={val('visionCercaOI')} onChange={e => up('visionCercaOI', e.target.value)} placeholder="Ej: J2" />
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="oftalmologia-ishihara" className="soap-section-label">Test de Ishihara (visión de colores)</label>
        <select id="oftalmologia-ishihara" className="soap-input" value={val('ishihara')} onChange={e => up('ishihara', e.target.value)}>
          <option value="">Seleccionar</option>
          <option>Normal</option>
          <option>Deficiencia rojo-verde</option>
          <option>Deficiencia azul-amarillo</option>
          <option>No realizado</option>
        </select>
      </div>

      <div className="soap-section-divider" />

      {/* PRESIÓN INTRAOCULAR */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Presión Intraocular (PIO)
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label htmlFor="oftalmologia-pioOD" className="soap-section-label">PIO OD (mmHg)</label>
          <input id="oftalmologia-pioOD" className="soap-input" value={val('pioOD')} onChange={e => up('pioOD', e.target.value)} placeholder="Ej: 14" />
        </div>
        <div>
          <label htmlFor="oftalmologia-pioOI" className="soap-section-label">PIO OI (mmHg)</label>
          <input id="oftalmologia-pioOI" className="soap-input" value={val('pioOI')} onChange={e => up('pioOI', e.target.value)} placeholder="Ej: 15" />
        </div>
        <div>
          <label htmlFor="oftalmologia-metodoPio" className="soap-section-label">Método de medición</label>
          <select id="oftalmologia-metodoPio" className="soap-input" value={val('metodoPio')} onChange={e => up('metodoPio', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Tonometría de aplanación (Goldmann)</option>
            <option>Tonometría de no-contacto</option>
            <option>Tonopen</option>
          </select>
        </div>
      </div>

      <div className="soap-section-divider" />

      {/* SEGMENTO ANTERIOR */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Segmento Anterior
      </p>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="oftalmologia-segmentoAnterior" className="soap-section-label">Hallazgos (párpados, conjuntiva, córnea, cristalino)</label>
        <textarea id="oftalmologia-segmentoAnterior" className="soap-input soap-textarea" style={{ minHeight: 60 }} value={val('segmentoAnterior')} onChange={e => up('segmentoAnterior', e.target.value)} placeholder="Ptosis, inyección conjuntival, úlcera corneal, opacidad de cristalino, cámara anterior…" />
      </div>

      <div className="soap-section-divider" />

      {/* FUNDOSCOPIA */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Fundoscopia (Segmento Posterior)
      </p>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="oftalmologia-fundoscopiaOD" className="soap-section-label">Hallazgos OD</label>
        <textarea id="oftalmologia-fundoscopiaOD" className="soap-input soap-textarea" style={{ minHeight: 56 }} value={val('fundoscopiaOD')} onChange={e => up('fundoscopiaOD', e.target.value)} placeholder="Papila, relación excavación/papila, retina, mácula, vasos…" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="oftalmologia-fundoscopiaOI" className="soap-section-label">Hallazgos OI</label>
        <textarea id="oftalmologia-fundoscopiaOI" className="soap-input soap-textarea" style={{ minHeight: 56 }} value={val('fundoscopiaOI')} onChange={e => up('fundoscopiaOI', e.target.value)} placeholder="Papila, relación excavación/papila, retina, mácula, vasos…" />
      </div>

      <div className="soap-section-divider" />

      {/* MOTILIDAD */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Motilidad Ocular
      </p>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="oftalmologia-motilidadOcular" className="soap-section-label">Evaluación de motilidad</label>
        <input id="oftalmologia-motilidadOcular" className="soap-input" value={val('motilidadOcular')} onChange={e => up('motilidadOcular', e.target.value)} placeholder="Completa / restricción en… / estrabismo / nistagmo…" />
      </div>

      <div className="soap-section-divider" />

      <div style={{ marginBottom: 14 }}>
        <label htmlFor="oftalmologia-notasAdicionales" className="soap-section-label">Notas adicionales de Oftalmología</label>
        <textarea id="oftalmologia-notasAdicionales" className="soap-input soap-textarea" style={{ minHeight: 60 }} value={val('notasAdicionales')} onChange={e => up('notasAdicionales', e.target.value)} placeholder="Observaciones clínicas adicionales, campos visuales, OCT…" />
      </div>

      <div className="soap-nav-row" style={{ justifyContent: "flex-start", marginTop: 8 }}>
        <button className="soap-btn-secondary" onClick={onPrev}>← Volver al Plan</button>
      </div>
    </div>
  );
}
