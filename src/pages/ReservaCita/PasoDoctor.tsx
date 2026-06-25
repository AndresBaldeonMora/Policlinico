import type { DoctorTransformado as Doctor } from "../../services/doctor.service";
import type { Especialidad } from "../../services/especialidad.service";

interface Props {
  doctoresDisponibles: Doctor[];
  doctorSeleccionado: Doctor | null;
  especialidadSeleccionada: Especialidad | null;
  onSeleccionar: (doctor: Doctor) => void;
}

const getPrecio = (especialidad: string | null | undefined) =>
  especialidad?.toLowerCase().includes("psiquiat") ? 90 : 40;

const PasoDoctor = ({ doctoresDisponibles, doctorSeleccionado, especialidadSeleccionada, onSeleccionar }: Props) => (
  <div className="form-step">
    <div className="step-header">
      <span className="step-number">2</span>
      <h3>Médico Asignado</h3>
    </div>

    {doctoresDisponibles.length === 0 ? (
      <div className="empty-state">
        <p>No hay médicos disponibles para la especialidad <b>{especialidadSeleccionada?.nombre}</b>.</p>
      </div>
    ) : (
      <div className="doctor-lista-seleccion">
        {doctoresDisponibles.map((doctor) => (
          <div
            key={doctor.id}
            className={`doctor-asignado-selectable ${doctorSeleccionado?.id === doctor.id ? "seleccionado" : ""}`}
            onClick={() => onSeleccionar(doctor)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSeleccionar(doctor); }
            }}
          >
            <div className="doctor-avatar">{doctor.nombres.charAt(0)}{doctor.apellidos.charAt(0)}</div>
            <div className="doctor-info-text">
              <h4>{doctor.nombres} {doctor.apellidos}</h4>
              <p>{doctor.especialidad}</p>
            </div>
            {doctorSeleccionado?.id === doctor.id && (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="10" cy="10" r="10" fill="#0f766e" />
                <path d="M5.5 10l3 3 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
);

export default PasoDoctor;