import type { PacienteTransformado } from "../../services/paciente.service";

const DNI_LENGTH = 8;
const esDNIValido = (dni: string) => /^\d{8}$/.test(dni);

interface Props {
  searchDNI: string;
  pacienteEncontrado: PacienteTransformado | null;
  pacienteSeleccionado: PacienteTransformado | null;
  reniecLoading: boolean;
  onBuscar: (dni: string) => void;
  onSeleccionar: (paciente: PacienteTransformado) => void;
  onNuevoPaciente: () => void;
}

const PasoPaciente = ({
  searchDNI, pacienteEncontrado, pacienteSeleccionado,
  reniecLoading, onBuscar, onSeleccionar, onNuevoPaciente,
}: Props) => (
  <div className="form-step">
    <div className="step-header">
      <span className="step-number">6</span>
      <h3>Buscar Paciente</h3>
    </div>

    <div className="form-group">
      <label htmlFor="dni">DNI del Paciente</label>
      <div className="search-input-wrapper">
        <input
          type="text"
          id="dni"
          value={searchDNI}
          onChange={(e) => onBuscar(e.target.value)}
          maxLength={DNI_LENGTH}
          placeholder="Ingrese los 8 dígitos..."
          disabled={reniecLoading}
        />
        {reniecLoading && <div className="search-icon-spinner">⌛</div>}
      </div>

      {pacienteEncontrado && !pacienteSeleccionado && (
        <div
          className="paciente-result-card"
          onClick={() => onSeleccionar(pacienteEncontrado)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSeleccionar(pacienteEncontrado); }
          }}
        >
          <div className="paciente-avatar-placeholder">{pacienteEncontrado.nombres.charAt(0)}</div>
          <div className="paciente-info">
            <span className="paciente-nombre">{pacienteEncontrado.nombres} {pacienteEncontrado.apellidos}</span>
            <div className="paciente-meta">
              <span>DNI: {pacienteEncontrado.dni}</span>
              {pacienteEncontrado.id === "temp_reniec"
                ? <span className="badge-reniec">Reniec</span>
                : <span className="badge-bd">Registrado</span>}
            </div>
          </div>
          <div style={{ marginLeft: "auto", color: "#16a34a", fontSize: "1.2rem" }}>👉</div>
        </div>
      )}

      {esDNIValido(searchDNI) && !reniecLoading && !pacienteEncontrado && !pacienteSeleccionado && (
        <div className="not-found-container">
          <p className="not-found-text">No encontramos resultados para este DNI.</p>
          <button type="button" onClick={onNuevoPaciente} className="btn-nuevo-paciente">
            ➕ Registrar Nuevo Paciente
          </button>
        </div>
      )}
    </div>

    <div className="form-group" style={{ marginTop: "1.5rem" }}>
      <label htmlFor="paciente-seleccionado">Paciente Seleccionado</label>
      <input
        type="text"
        id="paciente-seleccionado"
        disabled
        placeholder="Busque un DNI arriba..."
        value={pacienteSeleccionado ? `${pacienteSeleccionado.nombres} ${pacienteSeleccionado.apellidos}` : ""}
        className="input-disabled"
        style={{ borderColor: pacienteSeleccionado ? "#86efac" : "" }}
      />
    </div>
  </div>
);

export default PasoPaciente;