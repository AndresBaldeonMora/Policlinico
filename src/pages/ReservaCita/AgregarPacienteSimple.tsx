// src/pages/ReservaCita/AgregarPacienteSimple.tsx
import { useEffect, useReducer } from "react";
import { PacienteApiService } from "../../services/paciente.service";
import api from "../../services/api";
import "./AgregarPacienteSimple.css";

interface Props {
  dniInicial: string;
  onPacienteCreado: (dni: string) => void;
  onCancelar: () => void;
}

interface ReniecData {
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
}

interface FormState {
  nombres: string;
  apellidos: string;
  telefono: string;
  loading: boolean;
  loadingReniec: boolean;
  error: string;
  errorReniec: string;
}

type Action =
  | { type: "SET_FIELD"; field: keyof Pick<FormState, "nombres" | "apellidos" | "telefono">; value: string }
  | { type: "SET_ERROR"; message: string }
  | { type: "SET_ERROR_RENIEC"; message: string }
  | { type: "SET_LOADING"; value: boolean }
  | { type: "SET_LOADING_RENIEC"; value: boolean }
  | { type: "RENIEC_OK"; nombres: string; apellidos: string }
  | { type: "CLEAR_ERROR" };

function reducer(state: FormState, action: Action): FormState {
  switch (action.type) {
    case "SET_FIELD":         return { ...state, [action.field]: action.value };
    case "SET_ERROR":         return { ...state, error: action.message, loading: false };
    case "SET_ERROR_RENIEC":  return { ...state, errorReniec: action.message, loadingReniec: false };
    case "SET_LOADING":       return { ...state, loading: action.value };
    case "SET_LOADING_RENIEC":return { ...state, loadingReniec: action.value };
    case "RENIEC_OK":         return { ...state, nombres: action.nombres, apellidos: action.apellidos, loadingReniec: false, errorReniec: "" };
    case "CLEAR_ERROR":       return { ...state, error: "" };
    default:                  return state;
  }
}

const INITIAL: FormState = {
  nombres: "", apellidos: "", telefono: "",
  loading: false, loadingReniec: false,
  error: "", errorReniec: "",
};

const AgregarPacienteSimple = ({ dniInicial, onPacienteCreado, onCancelar }: Props) => {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  // Consulta RENIEC al montar
  useEffect(() => {
    if (dniInicial.length !== 8) return;
    let cancelled = false;

    const buscar = async () => {
      dispatch({ type: "SET_LOADING_RENIEC", value: true });
      try {
        const res = await api.get<{ success: boolean; data?: ReniecData }>(`/reniec/${dniInicial}`);
        if (cancelled) return;
        if (res.data.success && res.data.data) {
          const d = res.data.data;
          dispatch({
            type: "RENIEC_OK",
            nombres: d.nombres ?? "",
            apellidos: `${d.apellidoPaterno ?? ""} ${d.apellidoMaterno ?? ""}`.trim(),
          });
        } else {
          dispatch({ type: "SET_ERROR_RENIEC", message: "No encontrado en RENIEC — ingresa los datos." });
        }
      } catch {
        if (!cancelled) dispatch({ type: "SET_ERROR_RENIEC", message: "No se pudo consultar RENIEC." });
      }
    };

    buscar();
    return () => { cancelled = true; };
  }, [dniInicial]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "telefono" && (!/^\d*$/.test(value) || value.length > 15)) return;
    dispatch({ type: "SET_FIELD", field: name as "nombres" | "apellidos" | "telefono", value });
    dispatch({ type: "CLEAR_ERROR" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.nombres.trim())   return dispatch({ type: "SET_ERROR", message: "Los nombres son obligatorios." });
    if (!state.apellidos.trim()) return dispatch({ type: "SET_ERROR", message: "Los apellidos son obligatorios." });
    if (state.telefono.trim().length < 7) return dispatch({ type: "SET_ERROR", message: "Ingresa un teléfono válido." });

    dispatch({ type: "SET_LOADING", value: true });
    try {
      await PacienteApiService.crear({
        dni: dniInicial,
        nombres: state.nombres.trim(),
        apellidos: state.apellidos.trim(),
        telefono: state.telefono.trim(),
        correo: "",
        direccion: "",
        fechaNacimiento: "",
      });
      onPacienteCreado(dniInicial);
    } catch (err) {
      dispatch({ type: "SET_ERROR", message: err instanceof Error ? err.message : "Error al registrar." });
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
        {/* Header */}
        <div className="modal-header-simple">
          <h3>Nuevo Paciente</h3>
          <button className="close-btn-simple" onClick={onCancelar} disabled={state.loading}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="form-simple">
          {/* DNI (solo lectura) */}
          <div className="form-group-simple">
            <label>DNI</label>
            <input type="text" value={dniInicial} disabled className="input-disabled-modal" />
            {state.loadingReniec && (
              <small className="aps-reniec-loading">Consultando RENIEC...</small>
            )}
            {state.errorReniec && (
              <small className="aps-reniec-warn">{state.errorReniec}</small>
            )}
            {!state.loadingReniec && !state.errorReniec && state.nombres && (
              <small className="aps-reniec-ok">Datos obtenidos de RENIEC</small>
            )}
          </div>

          {state.error && (
            <div className="error-message-simple">{state.error}</div>
          )}

          {/* Nombres + Apellidos */}
          <div className="form-row-simple">
            <div className="form-group-simple">
              <label>Nombres <span style={{ color: "#ef4444" }}>*</span></label>
              <input name="nombres" value={state.nombres} onChange={handleChange} disabled={state.loading} placeholder="Juan Carlos" />
            </div>
            <div className="form-group-simple">
              <label>Apellidos <span style={{ color: "#ef4444" }}>*</span></label>
              <input name="apellidos" value={state.apellidos} onChange={handleChange} disabled={state.loading} placeholder="Pérez García" />
            </div>
          </div>

          {/* Teléfono */}
          <div className="form-group-simple">
            <label>Celular <span style={{ color: "#ef4444" }}>*</span></label>
            <input name="telefono" value={state.telefono} onChange={handleChange} disabled={state.loading} placeholder="987654321" />
          </div>

          <p className="aps-nota">
            Solo datos esenciales para la cita. Puedes completar el perfil completo desde la seccion Pacientes.
          </p>

          <div className="buttons-simple">
            <button type="button" className="btn-cancelar-simple" onClick={onCancelar} disabled={state.loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-guardar-simple" disabled={state.loading}>
              {state.loading ? "Guardando..." : "Guardar y continuar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AgregarPacienteSimple;