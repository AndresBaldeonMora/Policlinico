import type { CitaTransformada } from "../../services/cita.service";

interface Props {
  fecha: Date;
  horas: string[];
  citas: CitaTransformada[];
  doctorId: string;
  onReservar: (fechaISO: string, doctorId?: string) => void;
  onVerCita: (e: React.MouseEvent | React.KeyboardEvent, citaId: string) => void;
}

const VistaDia = ({ fecha, horas, citas, onVerCita }: Props) => {
  const obtenerCitaPorHora = (hora: string) =>
    citas.find((c) => {
      const fc = new Date(c.fecha);
      return (
        fc.getFullYear() === fecha.getFullYear() &&
        fc.getMonth() === fecha.getMonth() &&
        fc.getDate() === fecha.getDate() &&
        c.hora === hora
      );
    });

  return (
    <div className="agenda-dia">
      {horas.map((hora) => {
        const cita = obtenerCitaPorHora(hora);

        return (
          <div key={hora} className="agenda-linea">
            <div className="agenda-hora">{hora}</div>

            <div className="agenda-celda">
              {cita?.pacienteId && (
                <div
                  className="agenda-cita clickable"
                  onClick={(e) => onVerCita(e, cita._id)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Ver cita de ${cita.pacienteId.nombres} ${cita.pacienteId.apellidos}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onVerCita(e, cita._id);
                    }
                  }}
                >
                  {cita.pacienteId.nombres} {cita.pacienteId.apellidos}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default VistaDia;