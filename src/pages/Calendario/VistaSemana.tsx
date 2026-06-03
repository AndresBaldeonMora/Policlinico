// src/pages/Calendario/VistaSemana.tsx
import type { CitaTransformada } from "../../services/cita.service";
import type { DoctorTransformado } from "../../services/doctor.service";
import { getDoctorIdString } from "../../services/cita.service";
import { toISODateLocal, fechaISO } from "../../utils/fecha.utils";


const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"] as const;

const ESTADO_COLOR: Record<string, string> = {
  PENDIENTE:    "agenda-cita--pendiente",
  ASISTIO:      "agenda-cita--asistio",
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
  onVerCita: (e: React.MouseEvent | React.KeyboardEvent, citaId: string) => void;
}

const VistaSemana = ({ inicioSemana, horas, citas, doctores, doctorId, onVerCita }: Props) => {
  const doctoresMostrados = doctorId === "ALL"
    ? doctores
    : doctores.filter((d) => d.id === doctorId);

  const diasSemana = Array.from({ length: 6 }, (_, i) => {
    const dia = new Date(inicioSemana);
    dia.setDate(inicioSemana.getDate() + i);
    return dia;
  });

  const getCita = (dId: string, dia: Date, hora: string) => {
    const diaISO = toISODateLocal(dia);
    return citas.find((c) =>
      fechaISO(c.fecha) === diaISO &&
      c.hora === hora &&
      getDoctorIdString(c.doctorId) === dId
    );
  };

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
            style={{ gridTemplateColumns: `80px repeat(6, 1fr)` }}
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
                <div key={dia.toISOString()} className={`agenda-dia-header ${esHoy ? "agenda-dia-header--hoy" : ""}`}>
                  {DIAS_SEMANA[i]} {dia.getDate()}
                </div>
              );
            })}

            {/* Filas horas */}
            {horas.map((hora) => (
              <>
                <div key={`hora-${hora}`} className="multi-hora-label">{hora}</div>
                {diasSemana.map((dia) => {
                  const cita = getCita(doc.id, dia, hora);
                  return (
                    <div
                      key={`${doc.id}-${dia.toISOString()}-${hora}`}
                      className="multi-celda"
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
                          <span className="agenda-cita-nombre">{cita.pacienteId.nombres} {cita.pacienteId.apellidos}</span>
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