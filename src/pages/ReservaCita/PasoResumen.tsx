import { CheckCircle2, XCircle, Info } from "lucide-react";
import type { PacienteTransformado } from "../../services/paciente.service";
import type { DoctorTransformado as Doctor } from "../../services/doctor.service";
import type { Especialidad } from "../../services/especialidad.service";

interface Props {
  pacienteSeleccionado: PacienteTransformado | null;
  doctorSeleccionado: Doctor | null;
  especialidadSeleccionada: Especialidad | null;
  fechaSeleccionada: string;
  horaSeleccionada: string;
  esPaciente?: boolean;
}

const calcularHorasRestantes = (fechaISO: string, hora: string): number => {
  try {
    const [y, m, d] = fechaISO.split("-").map(Number);
    const [h, min] = (hora || "00:00").split(":").map(Number);
    return (new Date(y, m - 1, d, h, min).getTime() - Date.now()) / (1000 * 60 * 60);
  } catch { return 0; }
};

const PasoResumen = ({ pacienteSeleccionado, doctorSeleccionado, especialidadSeleccionada, fechaSeleccionada, horaSeleccionada, esPaciente }: Props) => {
  const horasRestantes = fechaSeleccionada && horaSeleccionada
    ? calcularHorasRestantes(fechaSeleccionada, horaSeleccionada)
    : null;

  const aptaParaReprogramar = horasRestantes !== null && horasRestantes > 24;

  return (
    <div className="form-step step-resumen">
      <div className="step-header">
        <span className="step-number">{esPaciente ? 6 : 7}</span>
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

      {/* Aviso de reprogramación — solo visible para pacientes */}
      {esPaciente && horasRestantes !== null && (
        <div className={`resumen-reprog-notice ${aptaParaReprogramar ? "resumen-reprog-notice--ok" : "resumen-reprog-notice--no"}`}>
          <div className="resumen-reprog-notice__icon">
            {aptaParaReprogramar
              ? <CheckCircle2 size={18} />
              : <XCircle size={18} />}
          </div>
          <div className="resumen-reprog-notice__body">
            <span className="resumen-reprog-notice__title">
              {aptaParaReprogramar ? "Apta para reprogramar" : "No apta para reprogramar"}
            </span>
            <span className="resumen-reprog-notice__desc">
              {aptaParaReprogramar
                ? "Podrás reprogramar esta cita desde tu historial, siempre que lo hagas con más de 24 horas de anticipación y solo una vez."
                : `La cita está programada en menos de 24 horas (${horaSeleccionada} hs). Una vez confirmada no podrá ser reprogramada.`}
            </span>
          </div>
        </div>
      )}

      {/* Recordatorio de política — para recepcionistas */}
      {!esPaciente && (
        <div className="resumen-reprog-notice resumen-reprog-notice--info">
          <div className="resumen-reprog-notice__icon"><Info size={18} /></div>
          <div className="resumen-reprog-notice__body">
            <span className="resumen-reprog-notice__title">Política de reprogramación</span>
            <span className="resumen-reprog-notice__desc">
              El paciente solo podrá reprogramar con más de 24 horas de anticipación y una única vez.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PasoResumen;
