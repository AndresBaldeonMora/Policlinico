interface Props {
  diasDelMes: number[];
  diaSeleccionado: number | null;
  onSeleccionar: (dia: number) => void;
}

const PasoDia = ({ diasDelMes, diaSeleccionado, onSeleccionar }: Props) => (
  <div className="form-step">
    <div className="step-header">
      <span className="step-number">4</span>
      <h3>Seleccionar Día</h3>
    </div>
    <div className="selector-dia">
      {diasDelMes.map((d) => (
        <button
          key={d}
          type="button"
          className={`dia-btn ${diaSeleccionado === d ? "activo" : ""}`}
          onClick={() => onSeleccionar(d)}
        >
          {d}
        </button>
      ))}
    </div>
  </div>
);

export default PasoDia;