import { useReducer, useEffect } from "react";
import { MedicoApiService } from "../../services/medico.service";
import type { CitaMedico, MedicoPerfil } from "../../services/medico.service";
import MedicoHeader from "./MedicoHeader";
import EstadisticasGrid from "./EstadisticasGrid";
import CitasTabs from "./CitasTabs";
import CitaModal from "./CitaModal";
import "./MedicoDashboard.css";

// ─── Estado ───────────────────────────────────────────────
interface DashboardState {
  loading: boolean;
  perfil: MedicoPerfil | null;
  citasHoy: CitaMedico[];
  todasLasCitas: CitaMedico[];
  vistaActual: "hoy" | "todas";
  citaSeleccionada: CitaMedico | null;
}

// ─── Acciones ─────────────────────────────────────────────
type DashboardAction =
  | { type: "CARGA_INICIO" }
  | { type: "CARGA_EXITO"; perfil: MedicoPerfil; citasHoy: CitaMedico[]; todasLasCitas: CitaMedico[] }
  | { type: "CARGA_ERROR" }
  | { type: "CAMBIAR_VISTA"; vista: "hoy" | "todas" }
  | { type: "SELECCIONAR_CITA"; cita: CitaMedico | null };

// ─── Reducer ──────────────────────────────────────────────
function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case "CARGA_INICIO":
      return { ...state, loading: true };
    case "CARGA_EXITO":
      return {
        ...state,
        loading: false,
        perfil: action.perfil,
        citasHoy: action.citasHoy,
        todasLasCitas: action.todasLasCitas,
      };
    case "CARGA_ERROR":
      return { ...state, loading: false };
    case "CAMBIAR_VISTA":
      return { ...state, vistaActual: action.vista };
    case "SELECCIONAR_CITA":
      return { ...state, citaSeleccionada: action.cita };
    default:
      return state;
  }
}

const initialState: DashboardState = {
  loading: true,
  perfil: null,
  citasHoy: [],
  todasLasCitas: [],
  vistaActual: "hoy",
  citaSeleccionada: null,
};

// ─── Componente ───────────────────────────────────────────
const MedicoDashboard = () => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  const { loading, perfil, citasHoy, todasLasCitas, vistaActual, citaSeleccionada } = state;

  const cargarDatos = async () => {
    dispatch({ type: "CARGA_INICIO" });
    try {
      const [perfilData, citasHoyData, todasCitas] = await Promise.all([
        MedicoApiService.obtenerMiPerfil(),
        MedicoApiService.obtenerCitasHoy(),
        MedicoApiService.obtenerMisCitas(),
      ]);
      dispatch({ type: "CARGA_EXITO", perfil: perfilData, citasHoy: citasHoyData, todasLasCitas: todasCitas });
    } catch (error) {
      console.error("Error al cargar datos:", error);
      dispatch({ type: "CARGA_ERROR" });
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const cambiarEstado = async (
    citaId: string,
    nuevoEstado: "PENDIENTE" | "ATENDIDA" | "CANCELADA"
  ) => {
    try {
      await MedicoApiService.actualizarEstadoCita(citaId, nuevoEstado);
      await cargarDatos();
      dispatch({ type: "SELECCIONAR_CITA", cita: null });
    } catch (error) {
      console.error("Error al cambiar estado:", error);
    }
  };

  // ── Derived state (sin useMemo — triviales) ────────────
  const estadisticas = {
    citasHoy: citasHoy.length,
    pendientes: citasHoy.filter((c) => c.estado === "PENDIENTE").length,
    atendidas: todasLasCitas.filter((c) => c.estado === "ATENDIDA").length,
    canceladas: todasLasCitas.filter((c) => c.estado === "CANCELADA").length,
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="spinner" />
          <p className="loading-text">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="medico-dashboard">
      {perfil && <MedicoHeader perfil={perfil} />}

      <EstadisticasGrid estadisticas={estadisticas} />

      <CitasTabs
        citasHoy={citasHoy}
        todasLasCitas={todasLasCitas}
        vistaActual={vistaActual}
        onCambiarVista={(vista) => dispatch({ type: "CAMBIAR_VISTA", vista })}
        onSeleccionarCita={(cita) => dispatch({ type: "SELECCIONAR_CITA", cita })}
      />

      {citaSeleccionada && (
        <CitaModal
          cita={citaSeleccionada}
          onCerrar={() => dispatch({ type: "SELECCIONAR_CITA", cita: null })}
          onCambiarEstado={cambiarEstado}
        />
      )}
    </div>
  );
};

export default MedicoDashboard;