import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./PerfilCita.css";
import {
  CitaApiService,
  type CitaTransformada,
} from "../../services/cita.service";

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

interface NotificationState {
  message: string;
  type: "success" | "error";
  visible: boolean;
}

const NOTIFICATION_DURATION = 3000;

const ESTADOS_CITA = {
  PENDIENTE: "Pendiente",
  ATENDIDA: "Atendida",
  CANCELADA: "Cancelada",
  REPROGRAMADA: "Reprogramada",
} as const;

// ============================================================================
// UTILS
// ============================================================================

const formatearFecha = (fechaISO: string): string => {
  const fecha = new Date(fechaISO);
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(fecha);
};

// ============================================================================
// NOTIFICATION
// ============================================================================

const Notification = ({ message, type, visible }: NotificationState) => {
  if (!visible) return null;
  return (
    <div className={`notification ${type}`} role="alert">
      {type === "success" ? "✅ " : "❌ "}
      {message}
    </div>
  );
};

// ============================================================================
// COMPONENT
// ============================================================================

const PerfilCita = () => {
  const { citaId } = useParams<{ citaId: string }>();
  const navigate = useNavigate();

  const [cita, setCita] = useState<CitaTransformada | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationState>({
    message: "",
    type: "success",
    visible: false,
  });

  const showNotification = useCallback(
    (message: string, type: "success" | "error") => {
      setNotification({ message, type, visible: true });
      setTimeout(
        () => setNotification((n) => ({ ...n, visible: false })),
        NOTIFICATION_DURATION
      );
    },
    []
  );

  const cargarCita = useCallback(async () => {
    try {
      if (!citaId) throw new Error("ID inválido");
      const data = await CitaApiService.obtenerPorId(citaId);
      setCita(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al cargar cita";
      setError(msg);
      showNotification(msg, "error");
    } finally {
      setCargando(false);
    }
  }, [citaId, showNotification]);

  useEffect(() => {
    cargarCita();
  }, [cargarCita]);

  const paciente = useMemo(() => cita?.pacienteId, [cita]);
  const doctor = useMemo(() => cita?.doctorId, [cita]);

  if (cargando) {
    return <p className="perfil-cita-loading">Cargando cita...</p>;
  }

  if (!cita || error) {
    return (
      <div className="perfil-cita-error">
        <p>No se pudo cargar la cita.</p>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="perfil-cita">
      <Notification {...notification} />

      {/* HEADER */}
      <div className="perfil-cita-header">
        <div>
          <h1>
            {paciente?.nombres} {paciente?.apellidos}
          </h1>
          <span>DNI: {paciente?.dni}</span>
        </div>

        <div className="header-datos">
          <span>📅 {formatearFecha(cita.fecha)}</span>
          <span>⏰ {cita.hora} hs</span>
          <span>
            👨‍⚕️ Dr. {doctor?.nombres} {doctor?.apellidos}
          </span>
          <span className={`badge estado-${cita.estado.toLowerCase()}`}>
            {ESTADOS_CITA[cita.estado]}
          </span>
        </div>
      </div>

      {/* GRID */}
      <div className="perfil-cita-grid">
        <div className="card">
          <h3>Detalle de la Cita</h3>
          <p>Estado: {ESTADOS_CITA[cita.estado]}</p>
          <p>Fecha: {formatearFecha(cita.fecha)}</p>
          <p>Hora: {cita.hora} hs</p>
        </div>

        <div className="card">
          <h3>Paciente</h3>
          <p>DNI: {paciente?.dni}</p>
          <p>Teléfono: {paciente?.telefono || "—"}</p>
        </div>
      </div>

      <div className="perfil-cita-actions">
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          Volver
        </button>
      </div>
    </div>
  );
};

export default PerfilCita;
