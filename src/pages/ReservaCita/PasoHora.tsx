import type { HorarioPorDia } from "./reservaCitaReducer";

interface Props {
  horariosPorDia: HorarioPorDia[];
  horaSeleccionada: string;
  onSeleccionar: (hora: string, fechaISO: string) => void;
}

const PasoHora = ({ horariosPorDia, horaSeleccionada, onSeleccionar }: Props) => (
  <div className="form-step">
    <div className="step-header">
      <span className="step-number">5</span>
      <h3>Seleccionar Hora</h3>
    </div>
    <div className="horarios-contenedor">
      {horariosPorDia.map((dia) => (
        <div key={dia.fechaISO} className="dia-grupo">
          <div className="horarios-horizontal">
            {dia.horarios.filter((h) => h.disponible).map((h) => (
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
      ))}
    </div>
  </div>
);

export default PasoHora;