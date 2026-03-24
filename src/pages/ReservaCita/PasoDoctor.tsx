import type { DoctorTransformado as Doctor } from "../../services/doctor.service";
import type { Especialidad } from "../../services/especialidad.service";

interface Props {
  doctoresDisponibles: Doctor[];
  doctorSeleccionado: Doctor | null;
  especialidadSeleccionada: Especialidad | null;
  onSeleccionar: (doctor: Doctor) => void;
}

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
            {doctorSeleccionado?.id === doctor.id && <span className="doctor-check-mark">Sel.</span>}
          </div>
        ))}
      </div>
    )}
  </div>
);

export default PasoDoctor;