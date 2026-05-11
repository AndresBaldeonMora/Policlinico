interface Props {
  diasDelMes: number[];
  diaSeleccionado: number | null;
  diasBloqueados?: number[];
  doctorNombre?: string;
  onSeleccionar: (dia: number) => void;
}

const EMPTY_DIAS: number[] = [];

const PasoDia = ({ diasDelMes, diaSeleccionado, diasBloqueados = EMPTY_DIAS, doctorNombre, onSeleccionar }: Props) => (
  <div className="form-step">
    <div className="step-header">
      <span className="step-number">4</span>
      <h3>Seleccionar Día</h3>
    </div>
    <div className="selector-dia">
      {diasDelMes.map((d) => {
        const bloqueado = diasBloqueados.includes(d);
        return (
          <button
            key={d}
            type="button"
            className={`dia-btn ${diaSeleccionado === d ? "activo" : ""} ${bloqueado ? "dia-btn--bloqueado" : ""}`}
            onClick={() => !bloqueado && onSeleccionar(d)}
            disabled={bloqueado}
            title={bloqueado ? `${doctorNombre || "Doctor"} no disponible este día` : undefined}
          >
            {d}
          </button>
        );
      })}
    </div>
  </div>
);

export default PasoDia;
