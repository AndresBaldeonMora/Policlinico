import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./PerfilCita.css";
import {
  CitaApiService,
  type CitaTransformada,
} from "../../services/cita.service";

// ============================================================================
// TYPES
// ============================================================================

type TabPrincipal = "dashboard" | "historial" | "documentos";
type TabDemografico = "quien" | "contacto";

interface Alergia {
  id: string;
  sustancia: string;
  reaccion: string;
  severidad: "leve" | "moderada" | "severa";
}

interface ProblemaMedico {
  id: string;
  descripcion: string;
  estado: "activo" | "resuelto";
  fechaInicio: string;
}

interface Medicamento {
  id: string;
  nombre: string;
  dosis: string;
  frecuencia: string;
  activo: boolean;
}

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

  const [cita, setCita] = useState<CitaTransformada | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tabActiva, setTabActiva] = useState<TabPrincipal>("dashboard");
  const [tabDemo, setTabDemo] = useState<TabDemografico>("quien");

  // Mock (luego API)
  const [alergias] = useState<Alergia[]>([]);
  const [problemasMedicos] = useState<ProblemaMedico[]>([]);
  const [medicamentos] = useState<Medicamento[]>([]);
  const [citasPaciente] = useState<CitaTransformada[]>([]);

  // ============================================================================

  const cargarCita = useCallback(async () => {
    if (!citaId) {
      setError("ID de cita no proporcionado");
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      const data = await CitaApiService.obtenerPorId(citaId);
      setCita(data);
    } catch {
      setError("No se pudo cargar la cita");
    } finally {
      setCargando(false);
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
              <span>
                F.Nac: {formatearFechaCorta(paciente.fechaNacimiento)}
              </span>
              {edad !== null && <span>{edad} años</span>}
            </div>
          </div>
        </div>

        <div className="encounter-selector">
          <label>Cita actual</label>
          <select disabled>
            <option>
              {formatearFechaCorta(cita.fecha)} - {cita.hora}
            </option>
          </select>

          <button
            className="btn btn-primary btn-nueva-cita"
            onClick={() =>
              navigate(`/reservar-cita?pacienteId=${paciente._id}`)
            }
          >
            + Nueva Cita
          </button>
        </div>
      </div>

      {/* TABS */}
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
                {citasPaciente.length === 0
                  ? "Sin citas"
                  : citasPaciente.map((c) => (
                      <div
                        key={c._id}
                        onClick={() => navigate(`/citas/${c._id}`)}
                      >
                        {formatearFechaCorta(c.fecha)} - {c.hora}
                      </div>
                    ))}
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
