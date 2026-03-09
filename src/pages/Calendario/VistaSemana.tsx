// src/pages/Calendario/VistaSemana.tsx
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

const ESTADO_COLOR: Record<string, string> = {
  PENDIENTE:    "agenda-cita--pendiente",
  ATENDIDA:     "agenda-cita--atendida",
  CANCELADA:    "agenda-cita--cancelada",
  REPROGRAMADA: "agenda-cita--reprogramada",
};

interface Props {
  inicioSemana: Date;
  horas: string[];
  citas: CitaTransformada[];
  doctores: DoctorTransformado[];
  doctorId: string;
  onReservar: (fechaISO: string, doctorId?: string) => void;
  onVerCita: (e: React.MouseEvent | React.KeyboardEvent, citaId: string) => void;
}

const VistaSemana = ({ inicioSemana, horas, citas, doctores, doctorId, onVerCita, onReservar }: Props) => {
  const doctoresMostrados = doctorId === "ALL"
    ? doctores
    : doctores.filter((d) => d.id === doctorId);

  const diasSemana = Array.from({ length: 7 }, (_, i) => {
    const dia = new Date(inicioSemana);
    dia.setDate(inicioSemana.getDate() + i);
    return dia;
  });

  const getCita = (dId: string, dia: Date, hora: string) =>
    citas.find((c) => {
      const fc = new Date(c.fecha);
      return (
        fc.getFullYear() === dia.getFullYear() &&
        fc.getMonth()    === dia.getMonth()    &&
        fc.getDate()     === dia.getDate()     &&
        c.hora           === hora              &&
        getDoctorIdString(c.doctorId) === dId
      );
    });

  return (
    <div className="multi-semana-wrapper">
      {doctoresMostrados.map((doc) => (
        <div key={doc.id} className="multi-semana-bloque">
          {/* Cabecera del médico */}
          <div className="multi-semana-doctor-header">
            <span className="multi-doctor-nombre">{doc.apellidos}, {doc.nombres}</span>
            {doc.especialidad && <span className="multi-doctor-esp">{doc.especialidad}</span>}
          </div>

          {/* Grilla semana */}
          <div
            className="multi-semana-grid"
            style={{ gridTemplateColumns: `80px repeat(7, 1fr)` }}
          >
            {/* Header días */}
            <div className="multi-hora-cell" />
            {diasSemana.map((dia, i) => {
              const hoy = new Date();
              const esHoy =
                dia.getFullYear() === hoy.getFullYear() &&
                dia.getMonth()    === hoy.getMonth()    &&
                dia.getDate()     === hoy.getDate();
              return (
                <div key={i} className={`agenda-dia-header ${esHoy ? "agenda-dia-header--hoy" : ""}`}>
                  {DIAS_SEMANA[i]} {dia.getDate()}
                </div>
              );
            })}

            {/* Filas horas */}
            {horas.map((hora) => (
              <>
                <div key={`hora-${hora}`} className="multi-hora-label">{hora}</div>
                {diasSemana.map((dia, i) => {
                  const cita = getCita(doc.id, dia, hora);
                  const fechaISO = toISODateLocal(dia);
                  return (
                    <div
                      key={`${doc.id}-${i}-${hora}`}
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
                          <span className="agenda-cita-nombre">{cita.pacienteId.nombres}</span>
                          <span className="agenda-cita-hora">{cita.hora}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default VistaSemana;