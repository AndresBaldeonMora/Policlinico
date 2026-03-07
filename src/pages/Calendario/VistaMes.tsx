import type { CitaTransformada } from "../../services/cita.service";

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;
const DOCTOR_TODOS_ID = "ALL";

const toISODateLocal = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const esFechaValida = (d: Date) => !isNaN(d.getTime());

interface Props {
  diasDelMes: Date[];
  citas: CitaTransformada[];
  doctorId: string;
  onReservar: (fechaISO: string, doctorId?: string) => void;
  onVerCita: (e: React.MouseEvent | React.KeyboardEvent, citaId: string) => void;
}

const VistaMes = ({ diasDelMes, citas, doctorId, onReservar, onVerCita }: Props) => {
  const obtenerCitasPorFecha = (d: Date) =>
    citas.filter((c) => {
      const fc = new Date(c.fecha);
      return (
        fc.getFullYear() === d.getFullYear() &&
        fc.getMonth() === d.getMonth() &&
        fc.getDate() === d.getDate()
      );
    });

  return (
    <div className="calendario-grid">
      {DIAS_SEMANA.map((dia) => (
        <div key={dia} className="calendario-col-header">{dia}</div>
      ))}

      {diasDelMes.map((dia) => {
        if (!esFechaValida(dia)) {
          // Empty padding cells: keyed by their ISO-like timestamp string.
          // Invalid Date objects have a stable NaN time but differ by reference;
          // toISODateLocal would produce "NaN-NaN-NaN" for all of them, so we
          // use the numeric position encoded in the Date object itself instead —
          // casting to number gives NaN for invalid dates, so we fall back to
          // the string representation of the Date which is unique per object.
          return <div key={String(dia)} className="calendario-celda" />;
        }

        const fechaISO = toISODateLocal(dia);
        const citasDelDia = obtenerCitasPorFecha(dia);
        const doctorParam = doctorId !== DOCTOR_TODOS_ID ? doctorId : undefined;

        return (
          <div
            key={fechaISO}
            className="calendario-celda clickable"
            onClick={() => onReservar(fechaISO, doctorParam)}
            role="button"
            tabIndex={0}
            aria-label={`Agregar cita para ${fechaISO}`}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onReservar(fechaISO, doctorParam);
              }
            }}
          >
            <span className="dia-numero">{dia.getDate()}</span>
            {citasDelDia.map((cita) => (
              <div
                key={cita._id}
                className="cita-chip clickable"
                onClick={(e) => onVerCita(e, cita._id)}
                role="button"
                tabIndex={0}
                aria-label={`Ver cita de ${cita.pacienteId?.nombres || "Sin paciente"} a las ${cita.hora}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onVerCita(e, cita._id);
                  }
                }}
              >
                {cita.hora} {cita.pacienteId?.nombres ?? "Sin paciente"}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

export default VistaMes;