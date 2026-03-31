// src/pages/ReservaCita/PasoHora.tsx
import type { HorarioPorDia } from "./reservaCitaReducer";
import { esHoy, horaAMinutos } from "../../utils/fecha.utils";

interface Props {
  horariosPorDia: HorarioPorDia[];
  horaSeleccionada: string;
  onSeleccionar: (hora: string, fechaISO: string) => void;
}

const PasoHora = ({ horariosPorDia, horaSeleccionada, onSeleccionar }: Props) => {
  const ahora = new Date();
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();

  return (
    <div className="form-step">
      <div className="step-header">
        <span className="step-number">5</span>
        <h3>Seleccionar Hora</h3>
      </div>
      <div className="horarios-contenedor">
        {horariosPorDia.map((dia) => {
          const esDiaHoy = esHoy(dia.fechaISO);

          const horasFiltradas = dia.horarios.filter((h) => {
            if (!h.disponible) return false;
            if (esDiaHoy && horaAMinutos(h.hora) <= minutosAhora) return false;
            return true;
          });

          if (horasFiltradas.length === 0) return (
            <div key={dia.fechaISO} className="dia-grupo">
              <p className="no-horarios-msg">
                No hay horarios disponibles para hoy. Selecciona otro día.
              </p>
            </div>
          );

          return (
            <div key={dia.fechaISO} className="dia-grupo">
              <div className="horarios-horizontal">
                {horasFiltradas.map((h) => (
                  <label
                    key={h.hora}
                    className={`horario-radio ${h.hora === horaSeleccionada ? "seleccionado" : ""}`}
                  >
                    <input
                      type="radio"
                      name="horario"
                      value={h.hora}
                      checked={h.hora === horaSeleccionada}
                      onChange={() => onSeleccionar(h.hora, dia.fechaISO)}
                    />
                    <span>{h.hora} hs</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PasoHora;