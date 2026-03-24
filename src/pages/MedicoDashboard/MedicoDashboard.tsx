import { useEffect, useReducer, useCallback } from "react";
import { MedicoApiService } from "../../services/medico.service";
import type { MedicoPerfil } from "../../services/medico.service";
import { useAuth } from "../../hooks/userAuth";
import Calendario from "../Calendario/Calendario";
import "./MedicoDashboard.css";

interface State {
  loading: boolean;
  perfil: MedicoPerfil | null;
}

type Action =
  | { type: "CARGA_INICIO" }
  | { type: "CARGA_EXITO"; perfil: MedicoPerfil }
  | { type: "CARGA_ERROR" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "CARGA_INICIO": return { ...state, loading: true };
    case "CARGA_EXITO":  return { loading: false, perfil: action.perfil };
    case "CARGA_ERROR":  return { ...state, loading: false };
    default:             return state;
  }
}

const MedicoDashboard = () => {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(reducer, { loading: true, perfil: null });
  const { loading, perfil } = state;

  const cargarPerfil = useCallback(async () => {
    dispatch({ type: "CARGA_INICIO" });
    try {
      const perfilData = await MedicoApiService.obtenerMiPerfil();
      dispatch({ type: "CARGA_EXITO", perfil: perfilData });
    } catch {
      dispatch({ type: "CARGA_ERROR" });
    }
  }, []);

  useEffect(() => { cargarPerfil(); }, [cargarPerfil]);

  if (loading) {
    return (
      <div className="md-loading">
        <div className="md-spinner" />
      </div>
    );
  }

  return (
    <div className="md-container">
      {/* ── Perfil ── */}
      {perfil && (
        <div className="md-perfil">
          <div className="md-perfil-avatar">
            {perfil.nombres.charAt(0)}{perfil.apellidos.charAt(0)}
          </div>
          <div className="md-perfil-info">
            <h2>Dr. {perfil.nombres} {perfil.apellidos}</h2>
            <span className="md-especialidad">{perfil.especialidadId.nombre}</span>
          </div>
          <div className="md-perfil-datos">
            {perfil.cmp && (
              <div className="md-dato">
                <span className="md-dato-label">CMP</span>
                <span className="md-dato-value">{perfil.cmp}</span>
              </div>
            )}
            <div className="md-dato">
              <span className="md-dato-label">Correo</span>
              <span className="md-dato-value">{perfil.correo}</span>
            </div>
            <div className="md-dato">
              <span className="md-dato-label">Teléfono</span>
              <span className="md-dato-value">{perfil.telefono}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Calendario ── */}
      <div className="md-calendario">
        <Calendario medicoFijo={user?.medicoId} />
      </div>
    </div>
  );
};

export default MedicoDashboard;