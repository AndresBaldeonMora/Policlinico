// src/pages/Calendario/VistaDia.tsx
import { Fragment } from "react";
import type { CitaTransformada } from "../../services/cita.service";
import type { DoctorTransformado } from "../../services/doctor.service";
import { getDoctorIdString } from "../../services/cita.service";
import { toISODateLocal, fechaISO } from "../../utils/fecha.utils";

interface Props {
  fecha: Date;
  horas: string[];
  citas: CitaTransformada[];
  doctores: DoctorTransformado[];
  doctorId: string;
  onVerCita: (e: React.MouseEvent | React.KeyboardEvent, citaId: string) => void;
}

const ESTADO_COLOR: Record<string, string> = {
  PENDIENTE:    "agenda-cita--pendiente",
  ASISTIO:      "agenda-cita--asistio",
  ATENDIDA:     "agenda-cita--atendida",
  CANCELADA:    "agenda-cita--cancelada",
  REPROGRAMADA: "agenda-cita--reprogramada",
};

const VistaDia = ({ fecha, horas, citas, doctores, doctorId, onVerCita }: Props) => {
  const doctoresMostrados = doctorId === "ALL"
    ? doctores
    : doctores.filter((d) => d.id === doctorId);

  const getCita = (dId: string, hora: string) =>
    citas.find((c) => {
      const fc = new Date(c.fecha);
      return (
        fc.getUTCFullYear() === fecha.getFullYear() &&
        fc.getUTCMonth()    === fecha.getMonth()    &&
        fc.getUTCDate()     === fecha.getDate()     &&
        c.hora              === hora                &&
        getDoctorIdString(c.doctorId) === dId
      );
    });

  return (
    <div className="multi-dia-wrapper">
      <div
        className="multi-dia-grid"
        style={{ gridTemplateColumns: `80px repeat(${doctoresMostrados.length}, 1fr)` }}
      >
        <div className="multi-hora-cell" />
        {doctoresMostrados.map((doc) => (
          <div key={doc.id} className="multi-doctor-header">
            <span className="multi-doctor-nombre">{doc.apellidos}, {doc.nombres}</span>
            {doc.especialidad && (
              <span className="multi-doctor-esp">{doc.especialidad}</span>
            )}
          </div>
        ))}

        {horas.map((hora) => (
          <Fragment key={hora}>
            <div className="multi-hora-label">{hora}</div>
            {doctoresMostrados.map((doc) => {
              const cita = getCita(doc.id, hora);
              return (
                <div key={`${doc.id}-${hora}`} className="multi-celda">
                  {cita?.pacienteId && (
                    <div
                      className={`agenda-cita clickable ${ESTADO_COLOR[cita.estado] ?? ""}`}
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
                      <span className="agenda-cita-nombre">
                        {cita.pacienteId.nombres} {cita.pacienteId.apellidos}
                      </span>
                      <span className="agenda-cita-estado">{cita.estado}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
};

export default VistaDia;