import { useState } from "react";
import { X } from "lucide-react";
import type { CitaMedico } from "../../services/medico.service";

interface Props {
  cita: CitaMedico;
  onClose: () => void;
}

const ESPECIALIDADES = ["Cardiología", "Neumología", "Nefrología", "Neurología", "Oncología", "Traumatología", "Ginecología", "Endocrinología", "Psiquiatría", "Reumatología", "Otro"];
const DOCS_OPCIONES  = ["Resumen de historia clínica", "Resultados de laboratorio", "Resultados de imágenes", "Medicamentos actuales (lista)", "EKG / trazados"];

export default function ModalReferencia({ cita, onClose }: Props) {
  const [form, setForm] = useState({
    establecimiento: "", especialidad: "", medicoDestino: "", urgencia: "no-urgente",
    diagnostico: "", sintomasResumen: "", tratamientoActual: "", examenesRealizados: "",
    motivoReferencia: "", docsAdjuntos: [] as string[],
  });

  const pac = cita.pacienteId;
  const nombre = `${pac.nombres} ${pac.apellidos}`;
  const upF = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));
  const toggleDoc = (d: string) =>
    setForm(p => ({ ...p, docsAdjuntos: p.docsAdjuntos.includes(d) ? p.docsAdjuntos.filter(x => x !== d) : [...p.docsAdjuntos, d] }));

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 720 }}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Documento de Referencia</div>
            <div className="modal-subtitle">NTS N°018-MINSA — Derivación a otro establecimiento de salud</div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          <div className="modal-pac-band">
            <span className="modal-pac-name">{nombre}</span>
            <span className="modal-pac-meta">DNI: {pac.dni}</span>
          </div>

          {/* Datos de referencia */}
          <div style={{ marginBottom: 20 }}>
            <div className="modal-section-title">Datos de la Referencia</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label className="soap-section-label">Establecimiento de destino <span className="soap-required">*</span></label>
                <input className="soap-input" placeholder="Ej: Hospital Regional del Cusco"
                  value={form.establecimiento} onChange={e => upF("establecimiento", e.target.value)} />
              </div>
              <div>
                <label className="soap-section-label">Servicio / Especialidad <span className="soap-required">*</span></label>
                <select className="soap-select" value={form.especialidad} onChange={e => upF("especialidad", e.target.value)}>
                  <option value="">— Seleccionar —</option>
                  {ESPECIALIDADES.map(e => <option key={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className="soap-section-label">Médico que recibirá (opcional)</label>
                <input className="soap-input" placeholder="Ej: Dr. Marco Paredes, Cardiólogo"
                  value={form.medicoDestino} onChange={e => upF("medicoDestino", e.target.value)} />
              </div>
              <div>
                <label className="soap-section-label">Urgencia <span className="soap-required">*</span></label>
                <div style={{ display: "flex", gap: 20, marginTop: 6 }}>
                  {[{ val: "urgente", label: "Urgente", sub: "Derivación inmediata" }, { val: "no-urgente", label: "No urgente", sub: "Dentro de 7 días" }].map(u => (
                    <label key={u.val} style={{ display: "flex", alignItems: "flex-start", gap: 6, cursor: "pointer" }}>
                      <input type="radio" checked={form.urgencia === u.val} onChange={() => upF("urgencia", u.val)}
                        style={{ accentColor: "var(--primary)", marginTop: 2 }} />
                      <span>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{u.label}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{u.sub}</div>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Información clínica */}
          <div style={{ marginBottom: 20 }}>
            <div className="modal-section-title">Información Clínica</div>
            <div style={{ marginBottom: 12 }}>
              <label className="soap-section-label">Diagnóstico actual (CIE-10)</label>
              <input className="soap-input" placeholder="Ej: Insuficiencia cardíaca congestiva (I50.0)"
                value={form.diagnostico} onChange={e => upF("diagnostico", e.target.value)} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label className="soap-section-label">Resumen de síntomas y hallazgos principales</label>
              <textarea className="soap-input soap-textarea" style={{ minHeight: 70 }}
                placeholder="Motivo de consulta, evolución, hallazgos relevantes al examen físico..."
                value={form.sintomasResumen} onChange={e => upF("sintomasResumen", e.target.value)} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label className="soap-section-label">Tratamiento recibido</label>
                <textarea className="soap-input soap-textarea" style={{ minHeight: 70 }}
                  placeholder="Medicamentos actuales y dosis..."
                  value={form.tratamientoActual} onChange={e => upF("tratamientoActual", e.target.value)} />
              </div>
              <div>
                <label className="soap-section-label">Exámenes realizados</label>
                <textarea className="soap-input soap-textarea" style={{ minHeight: 70 }}
                  placeholder="Resultados relevantes de laboratorio e imágenes..."
                  value={form.examenesRealizados} onChange={e => upF("examenesRealizados", e.target.value)} />
              </div>
            </div>
            <div>
              <label className="soap-section-label">Motivo específico de referencia <span className="soap-required">*</span></label>
              <textarea className="soap-input soap-textarea" style={{ minHeight: 80 }}
                placeholder="¿Por qué no puede ser manejado en este nivel? Ej: Patología fuera del nivel de complejidad del establecimiento..."
                value={form.motivoReferencia} onChange={e => upF("motivoReferencia", e.target.value)} />
            </div>
          </div>

          {/* Documentos adjuntos */}
          <div>
            <div className="modal-section-title">Documentación Adjunta</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {DOCS_OPCIONES.map(d => (
                <label key={d} className={`soap-check-item ${form.docsAdjuntos.includes(d) ? "checked" : ""}`}>
                  <input type="checkbox" checked={form.docsAdjuntos.includes(d)} onChange={() => toggleDoc(d)}
                    style={{ accentColor: "var(--primary)", flexShrink: 0 }} />
                  <span style={{ fontSize: 13 }}>{d}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="soap-btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="soap-btn-next" onClick={onClose}>Guardar e Imprimir</button>
        </div>
      </div>
    </div>
  );
}
