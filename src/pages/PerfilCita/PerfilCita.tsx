// ============================================================
// PerfilCita.tsx  (refactored)
//
// Changes from original:
//  1. 9 useState calls → useReducer for fetch + clinical data
//     (tabActiva / tabDemo stay as useState — they are pure,
//      independent UI state with no cross-slice interactions)
//  2. Confirmed all .map() keys are already stable IDs —
//     linter warning was a false positive; added comments to
//     make intent explicit
//  3. Fixed a11y: replaced `div role="button"` with `<button>`
//     in the citas widget
// ============================================================

import { useEffect, useState, useCallback, useMemo, useReducer } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./PerfilCita.css";
import { CitaApiService } from "../../services/cita.service";
import { perfilCitaReducer, initialState } from "./PerfilCitaReducer";

// ============================================================================
// TYPES (UI-only — not shared with reducer)
// ============================================================================

type TabPrincipal = "dashboard" | "historial" | "documentos";
type TabDemografico = "quien" | "contacto";

// ============================================================================
// CONSTANTS
// ============================================================================

const TABS_PRINCIPALES: { id: TabPrincipal; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "historial", label: "Histórico de Visitas", icon: "📋" },
  { id: "documentos", label: "Documentos", icon: "📄" },
];

const TABS_DEMOGRAFICOS: { id: TabDemografico; label: string }[] = [
  { id: "quien", label: "Quién" },
  { id: "contacto", label: "Contacto" },
];

// ============================================================================
// UTILS
// ============================================================================

const formatearFechaCorta = (fechaISO?: string) => {
  if (!fechaISO) return "—";
  const fecha = new Date(fechaISO);
  if (isNaN(fecha.getTime())) return "—";
  return new Intl.DateTimeFormat("es-PE").format(fecha);
};

const calcularEdad = (fechaNacimiento?: string) => {
  if (!fechaNacimiento) return null;
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  if (
    hoy.getMonth() < nac.getMonth() ||
    (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())
  ) {
    edad--;
  }
  return edad;
};

// ============================================================================
// MAIN
// ============================================================================

const PerfilCita = () => {
  const { citaId } = useParams<{ citaId: string }>();
  const navigate = useNavigate();

  // ── Reducer: fetch lifecycle + clinical data ──────────────
  const [state, dispatch] = useReducer(perfilCitaReducer, initialState);
  const {
    cita,
    cargando,
    error,
    alergias,
    problemasMedicos,
    medicamentos,
    citasPaciente,
  } = state;

  // ── useState: pure UI toggles (no shared state, no side effects) ──
  const [tabActiva, setTabActiva] = useState<TabPrincipal>("dashboard");
  const [tabDemo, setTabDemo] = useState<TabDemografico>("quien");

  // ============================================================================

  const cargarCita = useCallback(async () => {
    if (!citaId) {
      dispatch({ type: "FETCH_ERROR", payload: "ID de cita no proporcionado" });
      return;
    }

    dispatch({ type: "FETCH_START" });

    try {
      const data = await CitaApiService.obtenerPorId(citaId);
      dispatch({ type: "FETCH_SUCCESS", payload: data });
    } catch {
      dispatch({ type: "FETCH_ERROR", payload: "No se pudo cargar la cita" });
    }
  }, [citaId]);

  useEffect(() => {
    cargarCita();
  }, [cargarCita]);

  // ============================================================================

  const paciente = useMemo(() => cita?.pacienteId, [cita]);
  const edad = useMemo(
    () => calcularEdad(paciente?.fechaNacimiento),
    [paciente?.fechaNacimiento]
  );

  // ── Loading / error guards ────────────────────────────────

  if (cargando) {
    return (
      <div className="perfil-loading">
        <div className="spinner" />
        <p>Cargando información del paciente...</p>
      </div>
    );
  }

  if (error || !cita || !paciente) {
    return (
      <div className="perfil-error">
        <h2>No se pudo cargar la información</h2>
        <p>{error}</p>
        <button
          className="btn btn-secondary"
          onClick={() => navigate("/calendario")}
        >
          Volver al Calendario
        </button>
      </div>
    );
  }

  // ============================================================================

  return (
    <div className="perfil-clinico">
      {/* HEADER */}
      <div className="perfil-header-global">
        <div className="paciente-contexto">
          <div className="avatar-grande">
            {paciente.nombres.charAt(0)}
            {paciente.apellidos.charAt(0)}
          </div>

          <div className="paciente-info-principal">
            <h1>
              {paciente.nombres} {paciente.apellidos}
            </h1>
            <div className="datos-basicos">
              <span>DNI: {paciente.dni}</span>
              <span>F.Nac: {formatearFechaCorta(paciente.fechaNacimiento)}</span>
              {edad !== null && <span>{edad} años</span>}
            </div>
          </div>
        </div>

        <div className="encounter-selector">
          <label htmlFor="cita-actual">Cita actual</label>
          <select id="cita-actual" disabled>
            <option>
              {formatearFechaCorta(cita.fecha)} - {cita.hora}
            </option>
          </select>

          <button
            className="btn btn-primary btn-nueva-cita"
            onClick={() => navigate(`/reservar-cita?pacienteId=${paciente._id}`)}
          >
            + Nueva Cita
          </button>
        </div>
      </div>

      {/* TABS — key={t.id} is stable (string literal union, never reordered) */}
      <div className="tabs-principales">
        {TABS_PRINCIPALES.map((t) => (
          <button
            key={t.id}
            className={`tab ${tabActiva === t.id ? "activa" : ""}`}
            onClick={() => setTabActiva(t.id)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* DASHBOARD */}
      {tabActiva === "dashboard" && (
        <div className="dashboard-layout">
          <div className="columna-principal">
            <div className="card-clinica">
              <div className="card-header">
                <h3>🚨 Alergias</h3>
              </div>
              <div className="card-body">
                {alergias.length === 0 ? "Nada grabado" : "—"}
              </div>
            </div>

            <div className="card-clinica">
              <div className="card-header">
                <h3>🏥 Problemas Médicos</h3>
              </div>
              <div className="card-body">
                {problemasMedicos.length === 0 ? "Nada grabado" : "—"}
              </div>
            </div>

            <div className="card-clinica">
              <div className="card-header">
                <h3>💊 Medicamentos</h3>
              </div>
              <div className="card-body">
                {medicamentos.length === 0 ? "Nada grabado" : "—"}
              </div>
            </div>

            <div className="card-clinica">
              <div className="card-header">
                <h3>📊 Datos Demográficos</h3>
              </div>

              {/* key={t.id} is stable (string literal union) */}
              <div className="tabs-demograficos">
                {TABS_DEMOGRAFICOS.map((t) => (
                  <button
                    key={t.id}
                    className={`tab-demo ${tabDemo === t.id ? "activa" : ""}`}
                    onClick={() => setTabDemo(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="card-body">
                {tabDemo === "quien" && (
                  <>
                    <strong>Nombre:</strong> {paciente.nombres}{" "}
                    {paciente.apellidos}
                    <br />
                    <strong>DNI:</strong> {paciente.dni}
                  </>
                )}
                {tabDemo === "contacto" && (
                  <>
                    <strong>Teléfono:</strong> {paciente.telefono || "—"}
                    <br />
                    <strong>Correo:</strong> {paciente.correo || "—"}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="columna-lateral">
            <div className="widget">
              <div className="widget-header">
                <h4>📅 Citas</h4>
              </div>
              <div className="widget-body">
                {citasPaciente.length === 0 ? (
                  "Sin citas"
                ) : (
                  /* key={c._id} is a stable MongoDB ObjectId — never an index */
                  citasPaciente.map((c) => (
                    <button
                      key={c._id}
                      className="cita-widget-item"
                      onClick={() => navigate(`/citas/${c._id}`)}
                    >
                      {formatearFechaCorta(c.fecha)} - {c.hora}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {tabActiva === "historial" && (
        <div className="card-clinica">No hay visitas anteriores</div>
      )}

      {tabActiva === "documentos" && (
        <div className="card-clinica">No hay documentos cargados</div>
      )}
    </div>
  );
};

export default PerfilCita;