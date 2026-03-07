import type { CitaMedico } from "../../services/medico.service";

type Estado = "PENDIENTE" | "ATENDIDA" | "CANCELADA";

interface Props {
  cita: CitaMedico;
  onCerrar: () => void;
  onCambiarEstado: (citaId: string, estado: Estado) => void;
}

const formatearFecha = (fecha: string) =>
  new Date(fecha).toLocaleDateString("es-PE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

const BOTONES_ESTADO = [
  { estado: "PENDIENTE" as Estado, label: "⏳ Pendiente", className: "pendiente" },
  { estado: "ATENDIDA"  as Estado, label: "✅ Atendida",  className: "atendida"  },
  { estado: "CANCELADA" as Estado, label: "❌ Cancelar",  className: "cancelada" },
] as const;

const CitaModal = ({ cita, onCerrar, onCambiarEstado }: Props) => (
  <div className="modal-overlay">
    <div className="modal-content">
      <div className="modal-header">
        <h2>Detalle de la Cita</h2>
        <button onClick={onCerrar} className="modal-close">×</button>
      </div>

      <div className="modal-body">
        <div className="info-section">
          <h3>Información del Paciente</h3>
          <div className="info-grid">
            <div className="info-item">
              <p className="label">Nombre Completo</p>
              <p className="value">{cita.pacienteId.nombres} {cita.pacienteId.apellidos}</p>
            </div>
            <div className="info-item">
              <p className="label">DNI</p>
              <p className="value">{cita.pacienteId.dni}</p>
            </div>
            <div className="info-item">
              <p className="label">Teléfono</p>
              <p className="value">{cita.pacienteId.telefono}</p>
            </div>
            {cita.pacienteId.correo && (
              <div className="info-item">
                <p className="label">Correo</p>
                <p className="value">{cita.pacienteId.correo}</p>
              </div>
            )}
          </div>
        </div>

        <div className="info-section">
          <h3>Información de la Cita</h3>
          <div className="info-grid">
            <div className="info-item">
              <p className="label">Fecha</p>
              <p className="value">{formatearFecha(cita.fecha)}</p>
            </div>
            <div className="info-item">
              <p className="label">Hora</p>
              <p className="value">{cita.hora}</p>
            </div>
            <div className="info-item">
              <p className="label">Estado Actual</p>
              <span className={`estado-badge ${cita.estado.toLowerCase()}`}>
                {cita.estado}
              </span>
            </div>
          </div>
        </div>

        <div className="acciones-section">
          <h3>Cambiar Estado</h3>
          <div className="acciones-botones">
            {BOTONES_ESTADO.map(({ estado, label, className }) => (
              <button
                key={estado}
                onClick={() => onCambiarEstado(cita._id, estado)}
                disabled={cita.estado === estado}
                className={`btn-estado ${className}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default CitaModal;