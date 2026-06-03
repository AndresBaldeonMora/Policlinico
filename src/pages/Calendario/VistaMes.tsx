// src/pages/Calendario/VistaMes.tsx
import { Lock } from "lucide-react";
import type { CitaTransformada } from "../../services/cita.service";
import type { DoctorTransformado } from "../../services/doctor.service";
import type { Bloqueo } from "../../services/bloqueo.service";
import { getDoctorIdString } from "../../services/cita.service";
import { toISODateLocal, fechaISO } from "../../utils/fecha.utils";

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;

const esFechaValida = (d: Date) => !isNaN(d.getTime());

const ESTADO_COLOR: Record<string, string> = {
  PENDIENTE:    "cita-chip--pendiente",
  ASISTIO:      "cita-chip--asistio", 
  ATENDIDA:     "cita-chip--atendida",
  CANCELADA:    "cita-chip--cancelada",
  REPROGRAMADA: "cita-chip--reprogramada",
};

interface Props {
  diasDelMes: Date[];
  citas: CitaTransformada[];
  doctores: DoctorTransformado[];
  doctorId: string;
  bloqueos?: Bloqueo[];
  onVerCita: (e: React.MouseEvent | React.KeyboardEvent, citaId: string) => void;
}

const EMPTY_BLOQUEOS: Bloqueo[] = [];

const VistaMes = ({ diasDelMes, citas, doctores, doctorId, bloqueos = EMPTY_BLOQUEOS, onVerCita}: Props) => {
  const doctoresMostrados = doctorId === "ALL"
    ? doctores
    : doctores.filter((d) => d.id === doctorId);

  const getCitasPorFechaYDoctor = (dia: Date, dId: string) => {
    const diaISO = toISODateLocal(dia);
    return citas.filter((c) =>
      fechaISO(c.fecha) === diaISO &&
      getDoctorIdString(c.doctorId) === dId
    );
  };

  const isDiaBloqueado = (dia: Date, dId: string) => {
    const diaISO = toISODateLocal(dia);
    return bloqueos.some((b) => {
      const doctorIdBloqueo = typeof b.doctorId === "object" ? b.doctorId._id : b.doctorId;
      return fechaISO(b.fecha) === diaISO && doctorIdBloqueo === dId;
    });
  };

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
                return <div key={`vacio-${idx}`} className="calendario-celda calendario-celda--vacia" aria-hidden="true" />;
              }

              const fechaISO = toISODateLocal(dia);
              const citasDelDia = getCitasPorFechaYDoctor(dia, doc.id);
              const bloqueado = isDiaBloqueado(dia, doc.id);
              const hoy = new Date();
              const esHoy =
                dia.getFullYear() === hoy.getFullYear() &&
                dia.getMonth()    === hoy.getMonth()    &&
                dia.getDate()     === hoy.getDate();

              return (
                <div
                  key={`${doc.id}-${fechaISO}`}
                  className={`calendario-celda ${esHoy ? "calendario-celda--hoy" : ""} ${bloqueado ? "calendario-celda--bloqueado" : ""}`}
                  title={bloqueado ? "Día bloqueado" : undefined}
                >
                  <span className={`dia-numero ${esHoy ? "dia-numero--hoy" : ""}`}>
                    {dia.getDate()}
                    {bloqueado && <Lock size={10} style={{ marginLeft: 4, verticalAlign: "middle", opacity: 0.7 }} />}
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
                      {cita.pacienteId ? `${cita.pacienteId.nombres} ${cita.pacienteId.apellidos}` : "Sin paciente"}
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