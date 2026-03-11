import type { MesOption } from "./reservaCitaReducer";

interface Props {
  mesesDisponibles: MesOption[];
  mesSeleccionado: MesOption | null;
  onSeleccionar: (mes: MesOption) => void;
}

const PasoMes = ({ mesesDisponibles, mesSeleccionado, onSeleccionar }: Props) => (
  <div className="form-step">
    <div className="step-header">
      <span className="step-number">3</span>
      <h3>Seleccionar Mes</h3>
    </div>
    <div className="selector-mes">
      {mesesDisponibles.map((mes) => (
        <button
          key={`${mes.anio}-${mes.numero}`}
          type="button"
          className={`mes-btn ${mesSeleccionado?.numero === mes.numero && mesSeleccionado?.anio === mes.anio ? "activo" : ""}`}
          onClick={() => onSeleccionar(mes)}
        >
          {mes.nombre}
        </button>
      ))}
    </div>
  </div>
);

export default PasoMes;