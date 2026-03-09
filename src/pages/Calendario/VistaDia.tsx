// src/pages/Calendario/VistaDia.tsx
import type { CitaTransformada } from "../../services/cita.service";
import type { DoctorTransformado } from "../../services/doctor.service";
import { getDoctorIdString } from "../../services/cita.service";


interface Props {
  fecha: Date;
  horas: string[];
  citas: CitaTransformada[];
  doctores: DoctorTransformado[];
  doctorId: string;
  onReservar: (fechaISO: string, doctorId?: string) => void;
  onVerCita: (e: React.MouseEvent | React.KeyboardEvent, citaId: string) => void;
}

const toISODateLocal = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const ESTADO_COLOR: Record<string, string> = {
  PENDIENTE:    "agenda-cita--pendiente",
  ATENDIDA:     "agenda-cita--atendida",
  CANCELADA:    "agenda-cita--cancelada",
  REPROGRAMADA: "agenda-cita--reprogramada",
};

const VistaDia = ({ fecha, horas, citas, doctores, doctorId, onVerCita, onReservar }: Props) => {
  // Si hay un doctor seleccionado, solo mostrar ese; sino todos
  const doctoresMostrados = doctorId === "ALL"
    ? doctores
    : doctores.filter((d) => d.id === doctorId);

  const fechaISO = toISODateLocal(fecha);

  const getCita = (dId: string, hora: string) =>
    citas.find((c) => {
      const fc = new Date(c.fecha);
      return (
        fc.getFullYear() === fecha.getFullYear() &&
        fc.getMonth()    === fecha.getMonth()    &&
        fc.getDate()     === fecha.getDate()     &&
        c.hora           === hora                &&
        getDoctorIdString(c.doctorId) === dId
      );
    });

  return (
    <div className="multi-dia-wrapper">
      {/* Header de médicos */}
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

        {/* Filas de horas */}
        {horas.map((hora) => (
          <>
            <div key={`hora-${hora}`} className="multi-hora-label">{hora}</div>
            {doctoresMostrados.map((doc) => {
              const cita = getCita(doc.id, hora);
              return (
                <div
                  key={`${doc.id}-${hora}`}
                  className="multi-celda"
                  onClick={() => !cita && onReservar(fechaISO, doc.id)}
                >
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
          </>
        ))}
      </div>
    </div>
  );
};

export default VistaDia;