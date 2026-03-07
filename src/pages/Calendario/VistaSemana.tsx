import type { CitaTransformada } from "../../services/cita.service";

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;
const DOCTOR_TODOS_ID = "ALL";
const DIAS_POR_SEMANA = 7;

const toISODateLocal = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

interface Props {
  inicioSemana: Date;
  horas: string[];
  citas: CitaTransformada[];
  doctorId: string;
  onReservar: (fechaISO: string, doctorId?: string) => void;
  onVerCita: (e: React.MouseEvent | React.KeyboardEvent, citaId: string) => void;
}

const VistaSemana = ({ inicioSemana, horas, citas, doctorId, onReservar, onVerCita }: Props) => {
  const obtenerCitaPorHora = (d: Date, hora: string) =>
    citas.find((c) => {
      const fc = new Date(c.fecha);
      return (
        fc.getFullYear() === d.getFullYear() &&
        fc.getMonth() === d.getMonth() &&
        fc.getDate() === d.getDate() &&
        c.hora === hora
      );
    });

  // Precalcular los días de la semana una sola vez
  const diasSemana = Array.from({ length: DIAS_POR_SEMANA }, (_, i) => {
    const dia = new Date(inicioSemana);
    dia.setDate(inicioSemana.getDate() + i);
    return dia;
  });

  return (
    <div className="agenda-semana">
      <div className="agenda-header">
        <div className="agenda-hora-header">Hora</div>
        {diasSemana.map((dia, i) => (
          // ✅ Key estable: nombre del día + fecha — nunca se reordena
          <div key={`${DIAS_SEMANA[i]}-${toISODateLocal(dia)}`} className="agenda-dia-header">
            {DIAS_SEMANA[i]} {dia.getDate()}
          </div>
        ))}
      </div>

      {horas.map((hora) => (
        <div key={hora} className="agenda-row">
          <div className="agenda-hora">{hora}</div>

          {diasSemana.map((dia, i) => {
            const cita = obtenerCitaPorHora(dia, hora);
            const fechaISO = toISODateLocal(dia);
            const doctorParam = doctorId !== DOCTOR_TODOS_ID ? doctorId : undefined;

            return (
              // ✅ Key estable: hora + fecha — combinación única
              <div
                key={`${hora}-${fechaISO}`}
                className="agenda-celda clickable"
                onClick={() => onReservar(fechaISO, doctorParam)}
                role="button"
                tabIndex={0}
                aria-label={`Agregar cita ${DIAS_SEMANA[i]} ${dia.getDate()} a las ${hora}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onReservar(fechaISO, doctorParam);
                  }
                }}
              >
                {cita?.pacienteId && (
                  <div
                    className="agenda-cita clickable"
                    onClick={(e) => onVerCita(e, cita._id)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Ver cita de ${cita.pacienteId.nombres}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onVerCita(e, cita._id);
                      }
                    }}
                  >
                    {cita.pacienteId.nombres}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default VistaSemana;