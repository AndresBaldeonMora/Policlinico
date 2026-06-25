import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { X } from "lucide-react";
import type { CitaMedico } from "../../services/medico.service";
import { InterconsultaApiService, type PrioridadInterconsulta } from "../../services/interconsulta.service";
import { DoctorApiService, type DoctorTransformado } from "../../services/doctor.service";
import { EspecialidadApiService } from "../../services/especialidad.service";
import { toastExito } from "../../utils/toast";

interface Props {
  cita: CitaMedico;
  onClose: () => void;
  onGuardada?: () => void;
}

interface Especialidad { _id: string; nombre: string; }

export default function ModalInterconsulta({ cita, onClose, onGuardada }: Props) {
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [doctoresFiltrados, setDoctoresFiltrados] = useState<DoctorTransformado[]>([]);
  const [form, setForm] = useState({
    especialidad: "",
    destinatarioId: "",
    medicoSolicitado: "",
    prioridad: "electiva" as PrioridadInterconsulta,
    diagnosticoPresuntivo: "",
    motivoConsulta: "",
  });
  const [guardando, setGuardando] = useState(false);

  const pac = cita.pacienteId;
  const nombre = `${pac.nombres} ${pac.apellidos}`;
  const upF = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

  useEffect(() => {
    EspecialidadApiService.listar().then(setEspecialidades).catch(() => {});
  }, []);

  // Al cambiar especialidad, cargar doctores de esa especialidad
  useEffect(() => {
    if (!form.especialidad) {
      setDoctoresFiltrados([]);
      setForm(p => ({ ...p, destinatarioId: "", medicoSolicitado: "" }));
      return;
    }
    const esp = especialidades.find(e => e.nombre === form.especialidad);
    if (!esp) return;
    DoctorApiService.obtenerPorEspecialidad(esp._id)
      .then(docs => {
        setDoctoresFiltrados(docs);
        setForm(p => ({ ...p, destinatarioId: "", medicoSolicitado: "" }));
      })
      .catch(() => setDoctoresFiltrados([]));
  }, [form.especialidad, especialidades]);

  const handleMedicoChange = (doctorId: string) => {
    const doc = doctoresFiltrados.find(d => d.id === doctorId);
    setForm(p => ({
      ...p,
      destinatarioId: doctorId,
      medicoSolicitado: doc ? `${doc.nombres} ${doc.apellidos}` : "",
    }));
  };

  const handleGuardar = async () => {
    if (!form.especialidad.trim() || !form.diagnosticoPresuntivo.trim() || !form.motivoConsulta.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Campos obligatorios",
        text: "Indica la especialidad, el diagnóstico presuntivo y el motivo de la interconsulta.",
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
        destinatarioId: form.destinatarioId || undefined,
        prioridad: form.prioridad,
        diagnosticoPresuntivo: form.diagnosticoPresuntivo,
        motivoConsulta: form.motivoConsulta,
      });
      toastExito("Interconsulta enviada a recepción");
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
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: 580 }}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Solicitud de Interconsulta</div>
            <div className="modal-subtitle">Será gestionada por recepción para agendar la cita</div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          <div className="modal-pac-band">
            <span className="modal-pac-name">{nombre}</span>
            <span className="modal-pac-meta">DNI: {pac.dni}</span>
          </div>

          {/* Especialidad + Prioridad */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label className="soap-section-label">Especialidad <span className="soap-required">*</span></label>
              <select className="soap-select" value={form.especialidad} onChange={e => upF("especialidad", e.target.value)}>
                <option value="">— Seleccionar —</option>
                {especialidades.map(e => <option key={e._id} value={e.nombre}>{e.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="soap-section-label">Prioridad <span className="soap-required">*</span></label>
              <select className="soap-select" value={form.prioridad} onChange={e => upF("prioridad", e.target.value as PrioridadInterconsulta)}>
                <option value="electiva">Electiva</option>
                <option value="preferente">Preferente (≤ 3 días)</option>
                <option value="urgente">Urgente (≤ 48 h)</option>
              </select>
            </div>
          </div>

          {/* Médico (filtrado por especialidad) */}
          <div style={{ marginBottom: 12 }}>
            <label className="soap-section-label">Médico de destino (opcional)</label>
            <select
              className="soap-select"
              value={form.destinatarioId}
              onChange={e => handleMedicoChange(e.target.value)}
              disabled={!form.especialidad || doctoresFiltrados.length === 0}
            >
              <option value="">— Sin preferencia —</option>
              {doctoresFiltrados.map(d => (
                <option key={d.id} value={d.id}>
                  Dr. {d.nombres} {d.apellidos}
                </option>
              ))}
            </select>
            {form.especialidad && doctoresFiltrados.length === 0 && (
              <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                No hay médicos registrados para esta especialidad.
              </p>
            )}
          </div>

          {/* Diagnóstico presuntivo */}
          <div style={{ marginBottom: 12 }}>
            <label className="soap-section-label">Diagnóstico presuntivo <span className="soap-required">*</span></label>
            <input
              className="soap-input"
              placeholder="Ej. Insuficiencia renal crónica estadio 3"
              value={form.diagnosticoPresuntivo}
              onChange={e => upF("diagnosticoPresuntivo", e.target.value)}
            />
          </div>

          {/* Motivo */}
          <div>
            <label className="soap-section-label">Motivo de la interconsulta <span className="soap-required">*</span></label>
            <textarea
              className="soap-input soap-textarea"
              style={{ minHeight: 80 }}
              placeholder="Describe el motivo clínico de la derivación"
              value={form.motivoConsulta}
              onChange={e => upF("motivoConsulta", e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="soap-btn-secondary" onClick={onClose} disabled={guardando}>Cancelar</button>
          <button className="soap-btn-next" onClick={handleGuardar} disabled={guardando}>
            {guardando ? "Guardando…" : "Enviar a Recepción"}
          </button>
        </div>
      </div>
    </div>
  );
}
