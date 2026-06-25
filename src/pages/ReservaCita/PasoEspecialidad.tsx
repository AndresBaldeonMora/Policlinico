import { useRef, useEffect } from "react";
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
}

const PasoEspecialidad = ({
  searchEspecialidad, especialidades,
  showSuggestions, loading, onSearchChange, onToggleSuggestions,
  onSeleccionar
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onToggleSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onToggleSuggestions]);

  // Filtrar - si no hay texto muestra todas
  const sugerencias = (searchEspecialidad
    ? especialidades.filter((e) =>
        e.nombre.toLowerCase().includes(searchEspecialidad.toLowerCase())
      )
    : especialidades
  ).slice().sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  const getPrecio = (nombre: string) =>
    nombre.toLowerCase().includes("psiquiat") ? 90 : 40;

  return (
    <div className="form-step">
      <div className="step-header">
        <span className="step-number">1</span>
        <h3>Especialidad Médica</h3>
      </div>

      <div className="form-group">
        <label htmlFor="especialidad">Especialidad</label>
        <div className="autocomplete-container" ref={containerRef}>

          {/* Input + ícono flecha */}
          <div className="combobox-wrapper">
            <input
              type="text"
              id="especialidad"
              value={searchEspecialidad}
              onChange={(e) => { onSearchChange(e.target.value); onToggleSuggestions(true); }}
              onFocus={() => onToggleSuggestions(true)}
              placeholder="Seleccione o escriba una especialidad..."
              disabled={loading}
              className="input-search combobox-input"
            />
            <button
              type="button"
              className="combobox-arrow"
              tabIndex={-1}
              onClick={() => onToggleSuggestions(!showSuggestions)}
              aria-label="Mostrar opciones"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                style={{ transform: showSuggestions ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
              >
                <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* Dropdown */}
          {showSuggestions && (
            <div className="suggestions-list">
              {sugerencias.length === 0 ? (
                <div className="no-results">Sin resultados</div>
              ) : (
                sugerencias.map((esp) => (
                  <div
                    key={esp.id}
                    className="suggestion-item"
                    role="button"
                    tabIndex={0}
                    onClick={() => { onSeleccionar(esp); onToggleSuggestions(false); }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSeleccionar(esp);
                        onToggleSuggestions(false);
                      }
                    }}
                    style={{ display: "flex", alignItems: "center", width: "100%" }}
                  >
                    <span style={{ flex: 1 }}>{esp.nombre}</span>
                    <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--primary)", flexShrink: 0 }}>
                      S/. {getPrecio(esp.nombre)}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PasoEspecialidad;