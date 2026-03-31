// src/pages/ListaPacientes/PacienteModal.tsx
import { useEffect, useReducer, useMemo, useRef } from "react";
import { PacienteApiService, type PacienteTransformado } from "../../services/paciente.service";
import api from "../../services/api";
import "./PacienteModal.css";

interface Props {
  paciente?: PacienteTransformado | null;
  onGuardado: (p: PacienteTransformado) => void;
  onCancelar: () => void;
}

interface ReniecData {
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
}

interface FormState {
  dni: string; nombres: string; apellidos: string;
  fechaNacimiento: string; sexo: string; estadoCivil: string;
  telefono: string; correo: string; direccion: string; distrito: string;
  apoderadoNombre: string; apoderadoParentesco: string; apoderadoTelefono: string;
  loading: boolean; loadingReniec: boolean;
  error: string; errorReniec: string; seccionActiva: number;
}

type Action =
  | { type: "SET_FIELD"; field: string; value: string }
  | { type: "SET_SECCION"; value: number }
  | { type: "SET_LOADING"; value: boolean }
  | { type: "SET_LOADING_RENIEC"; value: boolean }
  | { type: "SET_ERROR"; message: string }
  | { type: "SET_ERROR_RENIEC"; message: string }
  | { type: "CLEAR_ERROR" }
  | { type: "RENIEC_OK"; nombres: string; apellidos: string };

function reducer(state: FormState, action: Action): FormState {
  switch (action.type) {
    case "SET_FIELD":          return { ...state, [action.field]: action.value };
    case "SET_SECCION":        return { ...state, seccionActiva: action.value };
    case "SET_LOADING":        return { ...state, loading: action.value };
    case "SET_LOADING_RENIEC": return { ...state, loadingReniec: action.value };
    case "SET_ERROR":          return { ...state, error: action.message, loading: false };
    case "SET_ERROR_RENIEC":   return { ...state, errorReniec: action.message, loadingReniec: false };
    case "CLEAR_ERROR":        return { ...state, error: "", errorReniec: "" };
    case "RENIEC_OK":          return { ...state, nombres: action.nombres, apellidos: action.apellidos, loadingReniec: false, errorReniec: "" };
    default:                   return state;
  }
}

// Convierte "1946-12-05T00:00:00.000Z" → "1946-12-05" para input type="date"
function toInputDate(fechaStr?: string): string {
  if (!fechaStr) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) return fechaStr; // ya está en formato correcto
  const fecha = new Date(fechaStr);
  if (isNaN(fecha.getTime())) return "";
  const y = fecha.getUTCFullYear();
  const m = String(fecha.getUTCMonth() + 1).padStart(2, "0");
  const d = String(fecha.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildInitial(p?: PacienteTransformado | null): FormState {
  return {
    dni: p?.dni ?? "", nombres: p?.nombres ?? "", apellidos: p?.apellidos ?? "",
    fechaNacimiento: toInputDate(p?.fechaNacimiento),  // formato corregido
    sexo: p?.sexo ?? "", estadoCivil: p?.estadoCivil ?? "",
    telefono: p?.telefono ?? "", correo: p?.correo ?? "",
    direccion: p?.direccion ?? "", distrito: p?.distrito ?? "",
    apoderadoNombre: p?.apoderadoNombre ?? "", apoderadoParentesco: p?.apoderadoParentesco ?? "",
    apoderadoTelefono: p?.apoderadoTelefono ?? "",
    loading: false, loadingReniec: false, error: "", errorReniec: "", seccionActiva: 0,
  };
}

function validarFecha(fechaStr: string): string | null {
  if (!fechaStr) return null;
  const fecha = new Date(fechaStr);
  if (isNaN(fecha.getTime())) return "Fecha inválida.";
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  if (fecha > hoy) return "La fecha no puede ser futura.";
  if (fecha.getFullYear() < 1900) return "Ingresa un año válido (desde 1900).";
  let edad = hoy.getFullYear() - fecha.getFullYear();
  const m = hoy.getMonth() - fecha.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < fecha.getDate())) edad--;
  if (edad > 120) return "La edad no puede superar 120 años.";
  return null;
}

function calcularEdad(fechaStr: string): number | null {
  if (!fechaStr) return null;
  const fecha = new Date(fechaStr);
  if (isNaN(fecha.getTime())) return null;
  const hoy = new Date();
  let edad = hoy.getFullYear() - fecha.getFullYear();
  const m = hoy.getMonth() - fecha.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < fecha.getDate())) edad--;
  if (edad < 0 || edad > 120) return null;
  return edad;
}

const SECCIONES = ["Datos Personales", "Contacto", "Apoderado"];

const PacienteModal = ({ paciente, onGuardado, onCancelar }: Props) => {
  const esEdicion = !!paciente;
  const [state, dispatch] = useReducer(reducer, paciente, buildInitial);
  const reniecLlamado = useRef(false);

  const edad = useMemo(() => calcularEdad(state.fechaNacimiento), [state.fechaNacimiento]);
  const errorFecha = useMemo(() => validarFecha(state.fechaNacimiento), [state.fechaNacimiento]);
  const esMenor = edad !== null && edad < 18;

  useEffect(() => {
    if (esEdicion || state.dni.length !== 8 || reniecLlamado.current) return;
    reniecLlamado.current = true;
    const buscar = async () => {
      dispatch({ type: "SET_LOADING_RENIEC", value: true });
      try {
        const res = await api.get<{ success: boolean; data?: ReniecData }>(`/reniec/${state.dni}`);
        if (res.data.success && res.data.data) {
          const d = res.data.data;
          dispatch({ type: "RENIEC_OK", nombres: d.nombres ?? "", apellidos: `${d.apellidoPaterno ?? ""} ${d.apellidoMaterno ?? ""}`.trim() });
        } else {
          dispatch({ type: "SET_ERROR_RENIEC", message: "No encontrado en RENIEC — ingresa los datos manualmente." });
        }
      } catch {
        dispatch({ type: "SET_ERROR_RENIEC", message: "No se pudo consultar RENIEC." });
      }
    };
    buscar();
  }, [state.dni, esEdicion]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if ((name === "telefono" || name === "apoderadoTelefono") && (!/^\d*$/.test(value) || value.length > 15)) return;
    if (name === "dni" && (!/^\d*$/.test(value) || value.length > 8)) return;
    dispatch({ type: "SET_FIELD", field: name, value });
    dispatch({ type: "CLEAR_ERROR" });
  };

  const validar = (): string | null => {
    if (!esEdicion && state.dni.length !== 8) return "El DNI debe tener 8 dígitos.";
    if (!state.nombres.trim())   return "Los nombres son obligatorios.";
    if (!state.apellidos.trim()) return "Los apellidos son obligatorios.";
    if (!state.fechaNacimiento)  return "La fecha de nacimiento es obligatoria.";
    const errFecha = validarFecha(state.fechaNacimiento);
    if (errFecha)                return errFecha;
    if (!state.telefono.trim())  return "El teléfono es obligatorio.";
    if (esMenor && !state.apoderadoNombre.trim()) return "El menor necesita un apoderado.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validar();
    if (err) { dispatch({ type: "SET_ERROR", message: err }); return; }
    dispatch({ type: "SET_LOADING", value: true });
    try {
      const datos = {
        dni: state.dni, nombres: state.nombres.trim(), apellidos: state.apellidos.trim(),
        fechaNacimiento: state.fechaNacimiento, sexo: state.sexo, estadoCivil: state.estadoCivil,
        telefono: state.telefono.trim(), correo: state.correo.trim(),
        direccion: state.direccion.trim(), distrito: state.distrito.trim(),
        apoderadoNombre: esMenor ? state.apoderadoNombre.trim() : "",
        apoderadoParentesco: esMenor ? state.apoderadoParentesco : "",
        apoderadoTelefono: esMenor ? state.apoderadoTelefono.trim() : "",
      };
      const resultado = esEdicion
        ? await PacienteApiService.actualizar(paciente!._id, datos)
        : await PacienteApiService.crear(datos);
      onGuardado(resultado);
    } catch (err) {
      dispatch({ type: "SET_ERROR", message: err instanceof Error ? err.message : "Error al guardar." });
    }
  };

  return (
    <div className="pm-overlay" role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onCancelar(); }}
      onKeyDown={(e) => { if (e.key === "Escape") onCancelar(); }}>
      <div className="pm-modal">
        <div className="pm-header">
          <div className="pm-header-info">
            <div className="pm-header-icon">{esEdicion ? "Editar" : "Nuevo"}</div>
            <div>
              <h2>{esEdicion ? "Editar Paciente" : "Nuevo Paciente"}</h2>
              {esEdicion && <span className="pm-header-dni">DNI: {paciente!.dni}</span>}
            </div>
          </div>
          <button className="pm-close" onClick={onCancelar} disabled={state.loading}>&times;</button>
        </div>

        <div className="pm-tabs">
          {SECCIONES.map((s, i) => (
            <button key={s} type="button"
              className={`pm-tab ${state.seccionActiva === i ? "pm-tab--active" : ""} ${i === 2 && !esMenor ? "pm-tab--disabled" : ""}`}
              onClick={() => dispatch({ type: "SET_SECCION", value: i })}
              disabled={i === 2 && !esMenor}>
              <span className="pm-tab-num">{i + 1}</span>{s}
              {i === 2 && esMenor  && <span className="pm-tab-badge">Requerido</span>}
              {i === 2 && !esMenor && <span className="pm-tab-badge pm-tab-badge--gray">No aplica</span>}
            </button>
          ))}
        </div>

        {state.error && <div className="pm-error">{state.error}</div>}

        <form onSubmit={handleSubmit} className="pm-form">
          {state.seccionActiva === 0 && (
            <div className="pm-section">
              <div className="pm-field pm-field--full">
                <label className="pm-label">DNI <span className="pm-req">*</span></label>
                {esEdicion ? (
                  <input className="pm-input pm-input--disabled" value={state.dni} disabled />
                ) : (
                  <>
                    <input className="pm-input" name="dni" value={state.dni} onChange={handleChange}
                      placeholder="12345678" maxLength={8} disabled={state.loading} />
                    {state.loadingReniec && <span className="pm-reniec-status pm-reniec-status--loading"><span className="pm-spinner-sm" /> Consultando RENIEC...</span>}
                    {state.errorReniec  && <span className="pm-reniec-status pm-reniec-status--warn">{state.errorReniec}</span>}
                    {!state.loadingReniec && !state.errorReniec && state.nombres && <span className="pm-reniec-status pm-reniec-status--ok">Datos obtenidos de RENIEC</span>}
                  </>
                )}
              </div>
              <div className="pm-row">
                <div className="pm-field">
                  <label className="pm-label">Nombres <span className="pm-req">*</span></label>
                  <input className="pm-input" name="nombres" value={state.nombres} onChange={handleChange} placeholder="Juan Carlos" disabled={state.loading} />
                </div>
                <div className="pm-field">
                  <label className="pm-label">Apellidos <span className="pm-req">*</span></label>
                  <input className="pm-input" name="apellidos" value={state.apellidos} onChange={handleChange} placeholder="Pérez García" disabled={state.loading} />
                </div>
              </div>
              <div className="pm-row">
                <div className="pm-field">
                  <label className="pm-label">Fecha de Nacimiento <span className="pm-req">*</span></label>
                  <input
                    className={`pm-input ${errorFecha ? "pm-input--error" : ""}`}
                    type="date" name="fechaNacimiento" value={state.fechaNacimiento}
                    onChange={handleChange} disabled={state.loading}
                    max={new Date().toISOString().split("T")[0]}
                    min="1900-01-01"
                  />
                  {errorFecha
                    ? <span className="pm-field-error">{errorFecha}</span>
                    : edad !== null && <span className="pm-edad-tag">{edad} años {esMenor && "· Menor de edad"}</span>
                  }
                </div>
                <div className="pm-field">
                  <label className="pm-label">Sexo</label>
                  <select className="pm-select" name="sexo" value={state.sexo} onChange={handleChange} disabled={state.loading}>
                    <option value="">Sin especificar</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>
              </div>
              <div className="pm-field pm-field--half">
                <label className="pm-label">Estado Civil</label>
                <select className="pm-select" name="estadoCivil" value={state.estadoCivil} onChange={handleChange} disabled={state.loading}>
                  <option value="">Sin especificar</option>
                  <option value="SOLTERO">Soltero/a</option>
                  <option value="CASADO">Casado/a</option>
                  <option value="CONVIVIENTE">Conviviente</option>
                  <option value="DIVORCIADO">Divorciado/a</option>
                  <option value="VIUDO">Viudo/a</option>
                </select>
              </div>
            </div>
          )}

          {state.seccionActiva === 1 && (
            <div className="pm-section">
              <div className="pm-row">
                <div className="pm-field">
                  <label className="pm-label">Celular <span className="pm-req">*</span></label>
                  <input className="pm-input" name="telefono" value={state.telefono} onChange={handleChange} placeholder="987654321" disabled={state.loading} />
                </div>
                <div className="pm-field">
                  <label className="pm-label">Correo electrónico</label>
                  <input className="pm-input" type="email" name="correo" value={state.correo} onChange={handleChange} placeholder="correo@ejemplo.com" disabled={state.loading} />
                </div>
              </div>
              <div className="pm-row">
                <div className="pm-field">
                  <label className="pm-label">Dirección</label>
                  <input className="pm-input" name="direccion" value={state.direccion} onChange={handleChange} placeholder="Av. Los Jardines 123" disabled={state.loading} />
                </div>
                <div className="pm-field">
                  <label className="pm-label">Distrito</label>
                  <input className="pm-input" name="distrito" value={state.distrito} onChange={handleChange} placeholder="San Isidro" disabled={state.loading} />
                </div>
              </div>
            </div>
          )}

          {state.seccionActiva === 2 && (
            <div className="pm-section">
              {!esMenor ? (
                <div className="pm-no-aplica">
                  <span>-</span>
                  <p>Esta sección aplica solo para pacientes menores de 18 años.</p>
                  <small>Ingresa la fecha de nacimiento en "Datos Personales" para habilitarla.</small>
                </div>
              ) : (
                <>
                  <div className="pm-menor-aviso">Paciente menor de edad — se requiere datos del apoderado</div>
                  <div className="pm-row">
                    <div className="pm-field">
                      <label className="pm-label">Nombre del Apoderado <span className="pm-req">*</span></label>
                      <input className="pm-input" name="apoderadoNombre" value={state.apoderadoNombre} onChange={handleChange} placeholder="María García" disabled={state.loading} />
                    </div>
                    <div className="pm-field">
                      <label className="pm-label">Parentesco</label>
                      <select className="pm-select" name="apoderadoParentesco" value={state.apoderadoParentesco} onChange={handleChange} disabled={state.loading}>
                        <option value="">Sin especificar</option>
                        <option value="MADRE">Madre</option>
                        <option value="PADRE">Padre</option>
                        <option value="ABUELO">Abuelo/a</option>
                        <option value="TIO">Tío/a</option>
                        <option value="OTRO">Otro</option>
                      </select>
                    </div>
                  </div>
                  <div className="pm-field pm-field--half">
                    <label className="pm-label">Celular del Apoderado</label>
                    <input className="pm-input" name="apoderadoTelefono" value={state.apoderadoTelefono} onChange={handleChange} placeholder="987654321" disabled={state.loading} />
                  </div>
                </>
              )}
            </div>
          )}

          <div className="pm-footer">
            <div className="pm-footer-nav">
              {state.seccionActiva > 0 && (
                <button type="button" className="pm-btn pm-btn--secondary"
                  onClick={() => dispatch({ type: "SET_SECCION", value: state.seccionActiva - 1 })}>Anterior</button>
              )}
              {state.seccionActiva < SECCIONES.length - 1 && (
                <button type="button" className="pm-btn pm-btn--secondary"
                  onClick={() => dispatch({ type: "SET_SECCION", value: state.seccionActiva + 1 })}>Siguiente</button>
              )}
            </div>
            <div className="pm-footer-actions">
              <button type="button" className="pm-btn pm-btn--ghost" onClick={onCancelar} disabled={state.loading}>Cancelar</button>
              <button type="submit" className="pm-btn pm-btn--primary" disabled={state.loading || !!errorFecha}>
                {state.loading ? <><span className="pm-spinner-sm" /> Guardando...</> : esEdicion ? "Guardar cambios" : "Registrar paciente"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PacienteModal;