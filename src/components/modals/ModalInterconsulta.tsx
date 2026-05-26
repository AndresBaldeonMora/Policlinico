import { useState } from "react";
import Swal from "sweetalert2";
import { X } from "lucide-react";
import type { CitaMedico } from "../../services/medico.service";
import { InterconsultaApiService, type PrioridadInterconsulta } from "../../services/interconsulta.service";
import { toastExito } from "../../utils/toast";

interface Props {
  cita: CitaMedico;
  onClose: () => void;
  onGuardada?: () => void;
}

const ESPECIALIDADES_INT = ["Cardiología", "Neumología", "Nefrología", "Neurología", "Traumatología", "Ginecología", "Endocrinología", "Psiquiatría", "Dermatología", "Gastroenterología", "Oftalmología", "Otorrinolaringología", "Urología", "Otro"];

export default function ModalInterconsulta({ cita, onClose, onGuardada }: Props) {
  const [form, setForm] = useState({
    especialidad: "", medicoSolicitado: "", prioridad: "electiva",
    motivoConsulta: "", preguntaClinica: "", informacionRelevante: "",
  });
  const [guardando, setGuardando] = useState(false);

  const pac = cita.pacienteId;
  const nombre = `${pac.nombres} ${pac.apellidos}`;
  const upF = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

  const handleGuardar = async () => {
    if (!form.especialidad.trim() || !form.motivoConsulta.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Campos obligatorios",
        text: "Indica la especialidad solicitada y el motivo de la interconsulta.",
        confirmButtonColor: "var(--primary)",
      });
      return;
    }
    setGuardando(true);
    try {
      await InterconsultaApiService.crear({
        pacienteId: pac._id,
        citaId: cita._id,
        especialidadSolicitada: form.especialidad,
        medicoSolicitado: form.medicoSolicitado || undefined,
        prioridad: form.prioridad as PrioridadInterconsulta,
        motivoConsulta: form.motivoConsulta,
        preguntaClinica: form.preguntaClinica || undefined,
        informacionRelevante: form.informacionRelevante || undefined,
      });
      toastExito("Interconsulta enviada al especialista");
      onGuardada?.();
      onClose();
    } catch {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo registrar la interconsulta. Intenta de nuevo.",
        confirmButtonColor: "var(--primary)",
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Solicitud de Interconsulta</div>
            <div className="modal-subtitle">Consulta a especialista dentro del establecimiento</div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          <div className="modal-pac-band">
            <span className="modal-pac-name">{nombre}</span>
            <span className="modal-pac-meta">DNI: {pac.dni}</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label className="soap-section-label">Especialidad solicitada <span className="soap-required">*</span></label>
              <select className="soap-select" value={form.especialidad} onChange={e => upF("especialidad", e.target.value)}>
                <option value="">- Seleccionar -</option>
                {ESPECIALIDADES_INT.map(e => <option key={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className="soap-section-label">Médico solicitado (opcional)</label>
              <input className="soap-input" placeholder=""
                value={form.medicoSolicitado} onChange={e => upF("medicoSolicitado", e.target.value)} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="soap-section-label">Prioridad</label>
            <div style={{ display: "flex", gap: 20, marginTop: 4 }}>
              {[{ val: "urgente", label: "Urgente", sub: "Hoy / misma guardia" },
                { val: "preferente", label: "Preferente", sub: "24-48 horas" },
                { val: "electiva", label: "Electiva", sub: "Dentro de 7 días" }].map(p => (
                <label key={p.val} style={{ display: "flex", alignItems: "flex-start", gap: 6, cursor: "pointer" }}>
                  <input type="radio" checked={form.prioridad === p.val} onChange={() => upF("prioridad", p.val)}
                    style={{ accentColor: "var(--primary)", marginTop: 2 }} />
                  <span>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{p.label}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{p.sub}</div>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label className="soap-section-label">Motivo de la interconsulta <span className="soap-required">*</span></label>
            <textarea className="soap-input soap-textarea" style={{ minHeight: 70 }}
              placeholder=""
              value={form.motivoConsulta} onChange={e => upF("motivoConsulta", e.target.value)} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label className="soap-section-label">Pregunta clínica específica</label>
            <textarea className="soap-input soap-textarea" style={{ minHeight: 60 }}
              placeholder=""
              value={form.preguntaClinica} onChange={e => upF("preguntaClinica", e.target.value)} />
          </div>

          <div>
            <label className="soap-section-label">Información clínica relevante</label>
            <textarea className="soap-input soap-textarea" style={{ minHeight: 70 }}
              placeholder=""
              value={form.informacionRelevante} onChange={e => upF("informacionRelevante", e.target.value)} />
          </div>
        </div>

        <div className="modal-footer">
          <button className="soap-btn-secondary" onClick={onClose} disabled={guardando}>Cancelar</button>
          <button className="soap-btn-next" onClick={handleGuardar} disabled={guardando}>
            {guardando ? "Guardando…" : "Guardar Interconsulta"}
          </button>
        </div>
      </div>
    </div>
  );
}
