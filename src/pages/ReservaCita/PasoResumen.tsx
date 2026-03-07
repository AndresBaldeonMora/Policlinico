import type { PacienteTransformado } from "../../services/paciente.service";
import type { DoctorTransformado as Doctor } from "../../services/doctor.service";
import type { Especialidad } from "../../services/especialidad.service";

interface Props {
  pacienteSeleccionado: PacienteTransformado | null;
  doctorSeleccionado: Doctor | null;
  especialidadSeleccionada: Especialidad | null;
  fechaSeleccionada: string;
  horaSeleccionada: string;
}

const PasoResumen = ({ pacienteSeleccionado, doctorSeleccionado, especialidadSeleccionada, fechaSeleccionada, horaSeleccionada }: Props) => (
  <div className="form-step step-resumen">
    <div className="step-header">
      <span className="step-number">7</span>
      <h3>Resumen de la Cita</h3>
    </div>
    <div className="resumen-grid">
      <div className="resumen-item">
        <span>Paciente</span>
        <strong>{pacienteSeleccionado ? `${pacienteSeleccionado.nombres} ${pacienteSeleccionado.apellidos}` : ""}</strong>
        <span>DNI: {pacienteSeleccionado?.dni}</span>
      </div>
      <div className="resumen-item">
        <span>Médico</span>
        <strong>{doctorSeleccionado ? `${doctorSeleccionado.nombres} ${doctorSeleccionado.apellidos}` : ""}</strong>
        <span>Especialidad: {especialidadSeleccionada?.nombre}</span>
      </div>
      <div className="resumen-item">
        <span>Fecha y Hora</span>
        <strong>{fechaSeleccionada}</strong>
        <span>{horaSeleccionada} hs</span>
      </div>
    </div>
  </div>
);

export default PasoResumen;