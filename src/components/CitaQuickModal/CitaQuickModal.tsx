import { useEffect, useState, useCallback, useRef } from "react";
import { CitaApiService } from "../../services/cita.service";
import type { CitaTransformada, EstadoCita } from "../../services/cita.service";
import { X, ExternalLink } from "lucide-react";
import Swal from "sweetalert2";
import { formatearFechaLarga } from "../../utils/fecha.utils";
import "../../pages/MedicoDashboard/CitaModal.css";


interface Props {
  citaId: string;
  onCerrar: () => void;
  onCitaActualizada: () => void;
  onIrADetalle: (citaId: string) => void;
  modo?: "recepcionista" | "medico";
}


const ESTADO_BADGE: Record<string, { clase: string; label: string }> = {
  PENDIENTE:    { clase: "cita-modal-badge--info",    label: "Pendiente" },
  ASISTIO:      { clase: "cita-modal-badge--warning", label: "Asistió" },
  ATENDIDA:     { clase: "cita-modal-badge--success", label: "Atendida" },
  CANCELADA:    { clase: "cita-modal-badge--danger",  label: "Cancelada" },
  REPROGRAMADA: { clase: "cita-modal-badge--reprogramada", label: "Reprogramada" },
  VENCIDA:      { clase: "cita-modal-badge--danger",      label: "Vencida" },
};


const calcularEdad = (fechaNacimiento?: string): string => {
  if (!fechaNacimiento) return "—";
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
  return `${edad} años`;
};


const CitaQuickModal = ({ citaId, onCerrar, onCitaActualizada, onIrADetalle }: Props) => {
  const [cita, setCita] = useState<CitaTransformada | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [estadoPendiente, setEstadoPendiente] = useState<EstadoCita | null>(null);
  const submittingRef = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);


  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const detalle = await CitaApiService.obtenerPorId(citaId);
      setCita(detalle);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al cargar la cita";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [citaId]);


  useEffect(() => { cargarDatos(); }, [cargarDatos]);


  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onCerrar]);


  useEffect(() => {
    cardRef.current?.focus();
  }, [loading]);


  const cambiarEstado = useCallback(async (nuevoEstado: EstadoCita) => {
    if (!cita || submittingRef.current) return;
    submittingRef.current = true;
    setEstadoPendiente(nuevoEstado);
    setError("");
    try {
      await CitaApiService.cambiarEstado(cita._id, nuevoEstado);
      const actualizada = await CitaApiService.obtenerPorId(citaId);
      setCita(actualizada);
      onCitaActualizada();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al cambiar estado";
      setError(message);
    } finally {
      setEstadoPendiente(null);
      submittingRef.current = false;
    }
  }, [cita, citaId, onCitaActualizada]);


  const handleCancelarCita = useCallback(async () => {
    const result = await Swal.fire({
      title: "¿Cancelar esta cita?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Sí, cancelar cita",
      cancelButtonText: "No, mantener",
    });
    if (!result.isConfirmed) return;
    cambiarEstado("CANCELADA");
  }, [cambiarEstado]);


  const isSubmitting = estadoPendiente !== null;


  if (loading || !cita) {
    return (
      <div className="cita-modal-overlay" onClick={onCerrar}>
        <div className="cita-modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
          {error ? (
            <div className="cita-modal-loading">
              <p className="cita-modal-error-text">{error}</p>
              <div className="cita-modal-error-actions">
                <button className="cita-modal-btn cita-modal-btn--primary" onClick={cargarDatos}>Reintentar</button>
                <button className="cita-modal-btn cita-modal-btn--cancel" onClick={onCerrar}>Cerrar</button>
              </div>
            </div>
          ) : (
            <div className="cita-modal-loading">
              <div className="spinner-small" />
              <p>Cargando detalle…</p>
            </div>
          )}
        </div>
      </div>
    );
  }


  const paciente = cita.pacienteId && typeof cita.pacienteId === "object" ? cita.pacienteId : null;
  const doctor = cita.doctorId && typeof cita.doctorId === "object" ? cita.doctorId : null;
  const badgeConfig = ESTADO_BADGE[cita.estado] ?? ESTADO_BADGE.PENDIENTE;
  const puedeMarcarAsistencia = cita.estado === "PENDIENTE" || cita.estado === "REPROGRAMADA";
  const puedeCancelar = ["PENDIENTE", "REPROGRAMADA"].includes(cita.estado);


  return (
    <div className="cita-modal-overlay" onClick={onCerrar} role="presentation">
      <div
        className="cita-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cqm-title"
        ref={cardRef}
        tabIndex={-1}
      >
        <div className="cita-modal-header">
          <h3 id="cqm-title">Detalle de la Cita</h3>
          <button className="cita-modal-close" onClick={onCerrar} aria-label="Cerrar modal">
            <X size={18} />
          </button>
        </div>


        <div className="cita-modal-body">
          {error && (
            <div className="cita-modal-error-msg">{error}</div>
          )}


          <div className="cita-modal-section">
            <h4>Datos de la cita</h4>
            <div className="cita-modal-grid">
              <div className="cita-modal-field">
                <span className="cita-modal-label">Fecha</span>
                <span className="cita-modal-value">{formatearFechaLarga(cita.fecha)}</span>
              </div>
              <div className="cita-modal-field">
                <span className="cita-modal-label">Hora</span>
                <span className="cita-modal-value">{cita.hora}</span>
              </div>
              <div className="cita-modal-field">
                <span className="cita-modal-label">Estado</span>
                <span className={`cita-modal-badge ${badgeConfig.clase}`}>{badgeConfig.label}</span>
              </div>
            </div>
          </div>


          {paciente && (
            <div className="cita-modal-section">
              <h4>Datos del paciente</h4>
              <div className="cita-modal-grid">
                <div className="cita-modal-field">
                  <span className="cita-modal-label">Nombre completo</span>
                  <span className="cita-modal-value">{paciente.nombres} {paciente.apellidos}</span>
                </div>
                <div className="cita-modal-field">
                  <span className="cita-modal-label">DNI</span>
                  <span className="cita-modal-value">{paciente.dni}</span>
                </div>
                <div className="cita-modal-field">
                  <span className="cita-modal-label">Edad</span>
                  <span className="cita-modal-value">{calcularEdad(paciente.fechaNacimiento)}</span>
                </div>
                {paciente.telefono && (
                  <div className="cita-modal-field">
                    <span className="cita-modal-label">Teléfono</span>
                    <span className="cita-modal-value">{paciente.telefono}</span>
                  </div>
                )}
              </div>
            </div>
          )}


          {doctor && (
            <div className="cita-modal-section">
              <h4>Doctor asignado</h4>
              <div className="cita-modal-grid">
                <div className="cita-modal-field">
                  <span className="cita-modal-label">Nombre</span>
                  <span className="cita-modal-value">{doctor.nombres} {doctor.apellidos}</span>
                </div>
                {doctor.especialidadId && typeof doctor.especialidadId === "object" && (
                  <div className="cita-modal-field">
                    <span className="cita-modal-label">Especialidad</span>
                    <span className="cita-modal-value">{doctor.especialidadId.nombre}</span>
                  </div>
                )}
              </div>
            </div>
          )}


        </div>


        <div className="cita-modal-footer">
          {puedeMarcarAsistencia && (
            <button
              className="cita-modal-btn cita-modal-btn--primary"
              onClick={() => cambiarEstado("ASISTIO")}
              disabled={isSubmitting}
            >
              {estadoPendiente === "ASISTIO" ? "Actualizando..." : "Marcar Asistencia"}
            </button>
          )}

          {puedeCancelar && (
            <button
              className="cita-modal-btn cita-modal-btn--danger"
              onClick={handleCancelarCita}
              disabled={isSubmitting}
            >
              {estadoPendiente === "CANCELADA" ? "Cancelando..." : "Cancelar Cita"}
            </button>
          )}

          <button
            className="cita-modal-btn cita-modal-btn--secondary"
            onClick={() => onIrADetalle(cita._id)}
            disabled={isSubmitting}
          >
            <ExternalLink size={14} /> Detalle Cita
          </button>

          <button
            className="cita-modal-btn cita-modal-btn--cancel"
            onClick={onCerrar}
            disabled={isSubmitting}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};


export default CitaQuickModal;