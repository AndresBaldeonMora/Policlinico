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

      {diasDelMes.map((dia, index) => {
        if (!esFechaValida(dia)) {
          // ✅ Key estable para celdas vacías: posición fija en el grid, nunca se reordena
          return <div key={`empty-${index}`} className="calendario-celda" />;
        }

        const fechaISO = toISODateLocal(dia);
        const citasDelDia = obtenerCitasPorFecha(dia);
        const doctorParam = doctorId !== DOCTOR_TODOS_ID ? doctorId : undefined;

        return (
          <div
            key={fechaISO}  // ✅ Key estable: fecha única por celda
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
                key={cita._id}  // ✅ Ya era correcto
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