// src/pages/ReservaCita/AgregarPacienteSimple.tsx
import { useEffect, useReducer } from "react";
import { PacienteApiService } from "../../services/paciente.service";
import api from "../../services/api";
import "./AgregarPacienteSimple.css";

interface AgregarPacienteSimpleProps {
  dniInicial: string;
  onPacienteCreado: (dni: string) => void;
  onCancelar: () => void;
}

interface ReniecResponse {
  success: boolean;
  data?: {
    dni: string;
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
  };
}

// ─── Estado ───────────────────────────────────────────────
interface FormState {
  dni: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  correo: string;
  fechaNacimiento: string;
  direccion: string;
  loading: boolean;
  loadingReniec: boolean;
  error: string;
  errorReniec: string;
}

// ─── Acciones ─────────────────────────────────────────────
type FormAction =
  | { type: "SET_FIELD"; field: keyof Omit<FormState, "loading" | "loadingReniec" | "error" | "errorReniec">; value: string }
  | { type: "SET_ERROR"; message: string }
  | { type: "SET_ERROR_RENIEC"; message: string }
  | { type: "SET_LOADING"; value: boolean }
  | { type: "SET_LOADING_RENIEC"; value: boolean }
  | { type: "RENIEC_SUCCESS"; nombres: string; apellidos: string }
  | { type: "CLEAR_ERROR" };

// ─── Reducer ──────────────────────────────────────────────
function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "SET_ERROR":
      return { ...state, error: action.message };
    case "SET_ERROR_RENIEC":
      return { ...state, errorReniec: action.message, loadingReniec: false };
    case "SET_LOADING":
      return { ...state, loading: action.value };
    case "SET_LOADING_RENIEC":
      return { ...state, loadingReniec: action.value };
    case "RENIEC_SUCCESS":
      return {
        ...state,
        nombres: action.nombres,
        apellidos: action.apellidos,
        loadingReniec: false,
        errorReniec: "",
      };
    case "CLEAR_ERROR":
      return { ...state, error: "" };
    default:
      return state;
  }
}

// ─── Estado inicial ───────────────────────────────────────
function buildInitialState(dniInicial: string): FormState {
  return {
    dni: dniInicial,
    nombres: "",
    apellidos: "",
    telefono: "",
    correo: "",
    fechaNacimiento: "",
    direccion: "",
    loading: false,
    loadingReniec: false,
    error: "",
    errorReniec: "",
  };
}

// ─── Helpers de validación (fuera del componente) ─────────
const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validarEdad = (fechaStr: string): boolean => {
  const fecha = new Date(fechaStr);
  if (Number.isNaN(fecha.getTime())) return false;

  const hoy = new Date();
  if (fecha > hoy) return false;

  let edad = hoy.getFullYear() - fecha.getFullYear();
  const m = hoy.getMonth() - fecha.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < fecha.getDate())) edad--;

  return edad >= 0 && edad <= 110;
};

// ─── Componente ───────────────────────────────────────────
const AgregarPacienteSimple = ({
  dniInicial,
  onPacienteCreado,
  onCancelar,
}: AgregarPacienteSimpleProps) => {
  const [state, dispatch] = useReducer(formReducer, dniInicial, buildInitialState);

  // ── Autocomplete RENIEC ──────────────────────────────────
  useEffect(() => {
    if (!dniInicial || dniInicial.length !== 8) return;

    const buscarReniec = async () => {
      dispatch({ type: "SET_LOADING_RENIEC", value: true });

      try {
        const res = await api.get<ReniecResponse>(`/reniec/${dniInicial}`);

        if (res.data.success && res.data.data) {
          const d = res.data.data;
          dispatch({
            type: "RENIEC_SUCCESS",
            nombres: d.nombres ?? "",
            apellidos: `${d.apellidoPaterno ?? ""} ${d.apellidoMaterno ?? ""}`.trim(),
          });
        } else {
          dispatch({ type: "SET_ERROR_RENIEC", message: "No se encontraron datos en RENIEC." });
        }
      } catch {
        dispatch({ type: "SET_ERROR_RENIEC", message: "No se pudo consultar RENIEC." });
      }
    };

    buscarReniec();
  }, [dniInicial]);

  // ── Handle Change ────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === "telefono") {
      if (!/^\d*$/.test(value) || value.length > 15) return;
    }

    dispatch({
      type: "SET_FIELD",
      field: name as keyof Omit<FormState, "loading" | "loadingReniec" | "error" | "errorReniec">,
      value,
    });
    dispatch({ type: "CLEAR_ERROR" });
  };

  // ── Submit ───────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: "CLEAR_ERROR" });

    if (!state.nombres.trim()) return dispatch({ type: "SET_ERROR", message: "Los nombres son obligatorios." });
    if (!state.apellidos.trim()) return dispatch({ type: "SET_ERROR", message: "Los apellidos son obligatorios." });
    if (state.telefono.trim().length < 6) return dispatch({ type: "SET_ERROR", message: "Ingrese un teléfono válido." });
    if (!isValidEmail(state.correo.trim())) return dispatch({ type: "SET_ERROR", message: "Ingrese un correo válido." });
    if (!validarEdad(state.fechaNacimiento)) return dispatch({ type: "SET_ERROR", message: "Ingrese una fecha de nacimiento válida." });

    try {
      dispatch({ type: "SET_LOADING", value: true });

      await PacienteApiService.crear({
        dni: state.dni,
        nombres: state.nombres.trim(),
        apellidos: state.apellidos.trim(),
        telefono: state.telefono.trim(),
        correo: state.correo.trim(),
        direccion: state.direccion.trim(),
        fechaNacimiento: state.fechaNacimiento,
      });

      onPacienteCreado(state.dni);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al registrar paciente.";
      dispatch({ type: "SET_ERROR", message });
    } finally {
      dispatch({ type: "SET_LOADING", value: false });
    }
  };

  return (
    <div
      className="modal-overlay-simple"
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onCancelar(); }}
      onKeyDown={(e) => { if (e.key === "Escape") onCancelar(); }}
    >
      <div className="modal-content-simple">
        <div className="modal-header-simple">
          <h3>👤 Nuevo Paciente</h3>
          <button className="close-btn-simple" onClick={onCancelar} disabled={state.loading}>
            ✕
          </button>
        </div>

        {state.error && <div className="error-message-simple">⚠️ {state.error}</div>}
        {state.errorReniec && <div className="error-message-simple">🔎 {state.errorReniec}</div>}

        <form onSubmit={handleSubmit} className="form-simple">
          <div className="form-group-simple">
            <label htmlFor="form-dni">DNI</label>
            <input id="form-dni" type="text" value={state.dni} disabled className="input-disabled-modal" />
            {state.loadingReniec && <small>Consultando RENIEC...</small>}
          </div>

          <div className="form-row-simple">
            <div className="form-group-simple">
              <label htmlFor="form-nombres">Nombres *</label>
              <input id="form-nombres" name="nombres" value={state.nombres} onChange={handleChange} disabled={state.loading} placeholder="Juan Carlos" />
            </div>
            <div className="form-group-simple">
              <label htmlFor="form-apellidos">Apellidos *</label>
              <input id="form-apellidos" name="apellidos" value={state.apellidos} onChange={handleChange} disabled={state.loading} placeholder="Pérez García" />
            </div>
          </div>

          <div className="form-row-simple">
            <div className="form-group-simple">
              <label htmlFor="form-telefono">Teléfono *</label>
              <input id="form-telefono" name="telefono" value={state.telefono} onChange={handleChange} disabled={state.loading} placeholder="987654321" />
            </div>
            <div className="form-group-simple">
              <label htmlFor="form-correo">Correo *</label>
              <input id="form-correo" name="correo" value={state.correo} onChange={handleChange} disabled={state.loading} placeholder="correo@ejemplo.com" />
            </div>
          </div>

          <div className="form-group-simple">
            <label htmlFor="form-fechaNacimiento">Fecha de nacimiento *</label>
            <input id="form-fechaNacimiento" type="date" name="fechaNacimiento" value={state.fechaNacimiento} onChange={handleChange} disabled={state.loading} />
          </div>

          <div className="form-group-simple">
            <label htmlFor="form-direccion">Dirección</label>
            <textarea id="form-direccion" name="direccion" rows={2} value={state.direccion} onChange={handleChange} disabled={state.loading} />
          </div>

          <div className="buttons-simple">
            <button type="button" className="btn-cancelar-simple" onClick={onCancelar}>Cancelar</button>
            <button type="submit" className="btn-guardar-simple" disabled={state.loading}>
              {state.loading ? "Guardando..." : "✓ Guardar y usar en la cita"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AgregarPacienteSimple;