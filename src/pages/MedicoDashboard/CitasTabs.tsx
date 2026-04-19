import type { CitaMedico } from "../../services/medico.service";
import { formatearFechaLarga } from "../../utils/fecha.utils";

interface Props {
  citasHoy: CitaMedico[];
  todasLasCitas: CitaMedico[];
  vistaActual: "hoy" | "todas";
  onCambiarVista: (v: "hoy" | "todas") => void;
  onSeleccionarCita: (cita: CitaMedico) => void;
}

const CitasTabs = ({
  citasHoy,
  todasLasCitas,
  vistaActual,
  onCambiarVista,
  onSeleccionarCita,
}: Props) => {
  const citasAMostrar = vistaActual === "hoy" ? citasHoy : todasLasCitas;

  return (
    <div className="citas-container">
      <div className="tabs-header">
        <button
          onClick={() => onCambiarVista("hoy")}
          className={`tab-button ${vistaActual === "hoy" ? "active" : ""}`}
        >
          Citas de Hoy ({citasHoy.length})
        </button>
        <button
          onClick={() => onCambiarVista("todas")}
          className={`tab-button ${vistaActual === "todas" ? "active" : ""}`}
        >
          Todas las Citas ({todasLasCitas.length})
        </button>
      </div>

      <div className="citas-content">
        {citasAMostrar.length === 0 ? (
          <div className="empty-state">
            <p>No hay citas para mostrar</p>
          </div>
        ) : (
          <div className="citas-list">
            {citasAMostrar.map((cita) => (
              <div
                key={cita._id}
                className="cita-card"
                role="button"
                tabIndex={0}
                onClick={() => onSeleccionarCita(cita)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSeleccionarCita(cita);
                  }
                }}
              >
                <div className="cita-card-content">
                  <div className="cita-paciente-info">
                    <div className="paciente-avatar">{cita.pacienteId.nombres.charAt(0)}</div>
                    <div className="paciente-datos">
                      <h3>{cita.pacienteId.nombres} {cita.pacienteId.apellidos}</h3>
                      <p>DNI: {cita.pacienteId.dni}</p>
                      <p>Tel: {cita.pacienteId.telefono}</p>
                    </div>
                  </div>
                  <div className="cita-fecha-hora">
                    <p className="label">Fecha</p>
                    <p className="fecha">{formatearFechaLarga(cita.fecha)}</p>
                    <p className="hora">{cita.hora}</p>
                  </div>
                  <div>
                    {(() => {
                      const BADGE: Record<string, { clase: string; label: string }> = {
                        PENDIENTE:    { clase: "badge-info",         label: "Pendiente" },
                        REPROGRAMADA: { clase: "badge-reprogramada", label: "Reprogramada" },
                        ATENDIDA:     { clase: "badge-success",      label: "Atendida" },
                        CANCELADA:    { clase: "badge-danger",       label: "Cancelada" },
                        ASISTIO:      { clase: "badge-asistio",      label: "Asistió" },
                        VENCIDA:      { clase: "badge-vencida",      label: "Vencida" },
                      };
                      const b = BADGE[cita.estado] ?? { clase: "badge-info", label: cita.estado };
                      return <span className={`badge ${b.clase}`}>{b.label}</span>;
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CitasTabs;