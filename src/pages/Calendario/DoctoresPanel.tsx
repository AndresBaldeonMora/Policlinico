import { useMemo } from "react";
import type { DoctorTransformado } from "../../services/doctor.service";

const DOCTOR_TODOS_ID = "ALL";

interface Props {
  doctores: DoctorTransformado[];
  doctorId: string;
  especialidadFiltro: string;
  onSeleccionar: (id: string) => void;
  onEspecialidadFiltro: (esp: string) => void;
}

const DoctoresPanel = ({ doctores, doctorId, especialidadFiltro, onSeleccionar, onEspecialidadFiltro }: Props) => {
  const especialidades = useMemo(() => {
    const set = new Set(doctores.map((d) => d.especialidad));
    return Array.from(set).sort();
  }, [doctores]);

  const doctoresFiltrados = useMemo(() =>
    especialidadFiltro === "ALL"
      ? doctores
      : doctores.filter((d) => d.especialidad === especialidadFiltro),
    [doctores, especialidadFiltro]
  );

  return (
    <div className="doctores-panel">
      <h4 className="doctores-panel__titulo">Doctores</h4>

      <select
        className="doctores-panel__filtro"
        value={especialidadFiltro}
        onChange={(e) => { onEspecialidadFiltro(e.target.value); onSeleccionar(DOCTOR_TODOS_ID); }}
        aria-label="Filtrar por especialidad"
      >
        <option value="ALL">Todas las especialidades</option>
        {especialidades.map((esp) => (
          <option key={esp} value={esp}>{esp}</option>
        ))}
      </select>

      <div className="doctores-lista">
        <div
          className={`doctor-item ${doctorId === DOCTOR_TODOS_ID ? "activo" : ""}`}
          onClick={() => onSeleccionar(DOCTOR_TODOS_ID)}
          role="button"
          tabIndex={0}
          aria-label="Ver todos los doctores"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSeleccionar(DOCTOR_TODOS_ID);
            }
          }}
        >
          Todos los doctores
        </div>

        {doctoresFiltrados.map((doctor) => (
          <div
            key={doctor.id}
            className={`doctor-item ${doctorId === doctor.id ? "activo" : ""}`}
            onClick={() => onSeleccionar(doctor.id)}
            role="button"
            tabIndex={0}
            aria-label={`Ver calendario de ${doctor.apellidos}, ${doctor.nombres}`}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSeleccionar(doctor.id);
              }
            }}
          >
            {doctor.apellidos}, {doctor.nombres}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DoctoresPanel;
