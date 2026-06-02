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

          // Filtrar solo horas pasadas del día de hoy; las reservadas se muestran bloqueadas
          const horasVisibles = dia.horarios.filter((h) => {
            if (esDiaHoy && horaAMinutos(h.hora) <= minutosAhora) return false;
            return true;
          });

          if (horasVisibles.length === 0) return (
            <div key={dia.fechaISO} className="dia-grupo">
              <p className="no-horarios-msg">
                No hay horarios disponibles para este día. Selecciona otro.
              </p>
            </div>
          );

          return (
            <div key={dia.fechaISO} className="dia-grupo">
              <div className="horarios-horizontal">
                {horasVisibles.map((h) => {
                  const reservado = !h.disponible;
                  if (reservado) {
                    return (
                      <div
                        key={h.hora}
                        className="horario-radio reservado"
                        title="Horario ya reservado"
                      >
                        <span>{h.hora} hs</span>
                        <span className="horario-reservado-badge">Reservado</span>
                      </div>
                    );
                  }
                  return (
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
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PasoHora;