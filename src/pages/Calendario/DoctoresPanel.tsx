import type { DoctorTransformado } from "../../services/doctor.service";

const DOCTOR_TODOS_ID = "ALL";

interface Props {
  doctores: DoctorTransformado[];
  doctorId: string;
  onSeleccionar: (id: string) => void;
}

const DoctoresPanel = ({ doctores, doctorId, onSeleccionar }: Props) => (
  <div className="doctores-panel">
    <h4>Doctores</h4>
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

      {doctores.map((doctor) => (
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

export default DoctoresPanel;