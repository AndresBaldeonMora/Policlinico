import type { Especialidad } from "../../services/especialidad.service";

interface Props {
  searchEspecialidad: string;
  especialidades: Especialidad[];
  especialidadSeleccionada: Especialidad | null;
  showSuggestions: boolean;
  loading: boolean;
  onSearchChange: (value: string) => void;
  onToggleSuggestions: (visible: boolean) => void;
  onSeleccionar: (esp: Especialidad) => void;
  onDeseleccionar: () => void;
}

const PasoEspecialidad = ({
  searchEspecialidad, especialidades, especialidadSeleccionada,
  showSuggestions, loading, onSearchChange, onToggleSuggestions,
  onSeleccionar, onDeseleccionar,
}: Props) => {
  const sugerencias = especialidades.filter((e) =>
    e.nombre.toLowerCase().includes(searchEspecialidad.toLowerCase())
  );

  return (
    <div className="form-step">
      <div className="step-header">
        <span className="step-number">1</span>
        <h3>Especialidad Médica</h3>
      </div>

      <div className="form-group">
        <label htmlFor="especialidad">Buscar Especialidad</label>
        <div className="autocomplete-container">
          <input
            type="text"
            id="especialidad"
            value={searchEspecialidad}
            onChange={(e) => { onSearchChange(e.target.value); onToggleSuggestions(true); }}
            onFocus={() => onToggleSuggestions(true)}
            placeholder="Escriba para buscar..."
            disabled={loading}
            className="input-search"
          />

          {showSuggestions && searchEspecialidad && sugerencias.length > 0 && (
            <div className="suggestions-list">
              {sugerencias.map((esp) => (
                <div
                  key={esp.id}
                  className="suggestion-item"
                  role="button"
                  tabIndex={0}
                  onClick={() => onSeleccionar(esp)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSeleccionar(esp); }
                  }}
                >
                  {esp.nombre}
                </div>
              ))}
            </div>
          )}
        </div>

        {especialidadSeleccionada && (
          <div className="selected-tag">
            <span>{especialidadSeleccionada.nombre}</span>
            <button type="button" onClick={onDeseleccionar} className="tag-close" aria-label="Deseleccionar especialidad">×</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PasoEspecialidad;