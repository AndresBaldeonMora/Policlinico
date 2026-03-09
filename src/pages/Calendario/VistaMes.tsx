// src/pages/Calendario/VistaMes.tsx
import type { CitaTransformada } from "../../services/cita.service";
import type { DoctorTransformado } from "../../services/doctor.service";
import { getDoctorIdString } from "../../services/cita.service";

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;

const toISODateLocal = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const esFechaValida = (d: Date) => !isNaN(d.getTime());

const ESTADO_COLOR: Record<string, string> = {
  PENDIENTE:    "cita-chip--pendiente",
  ATENDIDA:     "cita-chip--atendida",
  CANCELADA:    "cita-chip--cancelada",
  REPROGRAMADA: "cita-chip--reprogramada",
};

interface Props {
  diasDelMes: Date[];
  citas: CitaTransformada[];
  doctores: DoctorTransformado[];
  doctorId: string;
  onReservar: (fechaISO: string, doctorId?: string) => void;
  onVerCita: (e: React.MouseEvent | React.KeyboardEvent, citaId: string) => void;
}

const VistaMes = ({ diasDelMes, citas, doctores, doctorId, onVerCita, onReservar }: Props) => {
  const doctoresMostrados = doctorId === "ALL"
    ? doctores
    : doctores.filter((d) => d.id === doctorId);

  const getCitasPorFechaYDoctor = (dia: Date, dId: string) =>
    citas.filter((c) => {
      const fc = new Date(c.fecha);
      return (
        fc.getUTCFullYear() === dia.getFullYear() &&
        fc.getUTCMonth()    === dia.getMonth()    &&
        fc.getUTCDate()     === dia.getDate()     &&
        getDoctorIdString(c.doctorId) === dId
      );
    });

  return (
    <div className="multi-mes-wrapper">
      {doctoresMostrados.map((doc) => (
        <div key={doc.id} className="multi-mes-bloque">
          <div className="multi-semana-doctor-header">
            <span className="multi-doctor-nombre">{doc.apellidos}, {doc.nombres}</span>
            {doc.especialidad && <span className="multi-doctor-esp">{doc.especialidad}</span>}
          </div>

          <div className="calendario-grid">
            {DIAS_SEMANA.map((dia) => (
              <div key={dia} className="calendario-col-header">{dia}</div>
            ))}

            {diasDelMes.map((dia, idx) => {
              if (!esFechaValida(dia)) {
                return <div key={`empty-${idx}`} className="calendario-celda calendario-celda--vacia" />;
              }

              const fechaISO = toISODateLocal(dia);
              const citasDelDia = getCitasPorFechaYDoctor(dia, doc.id);
              const hoy = new Date();
              const esHoy =
                dia.getFullYear() === hoy.getFullYear() &&
                dia.getMonth()    === hoy.getMonth()    &&
                dia.getDate()     === hoy.getDate();

              return (
                <div
                  key={`${doc.id}-${fechaISO}`}
                  className={`calendario-celda ${esHoy ? "calendario-celda--hoy" : ""}`}
                  onClick={() => onReservar(fechaISO, doc.id)}
                >
                  <span className={`dia-numero ${esHoy ? "dia-numero--hoy" : ""}`}>
                    {dia.getDate()}
                  </span>
                  {citasDelDia.map((cita) => (
                    <div
                      key={cita._id}
                      className={`cita-chip clickable ${ESTADO_COLOR[cita.estado] ?? ""}`}
                      onClick={(e) => { e.stopPropagation(); onVerCita(e, cita._id); }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          onVerCita(e, cita._id);
                        }
                      }}
                    >
                      {cita.hora} · {cita.pacienteId?.nombres ?? "Sin paciente"}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default VistaMes;