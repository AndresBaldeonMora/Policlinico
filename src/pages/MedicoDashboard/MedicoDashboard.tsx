import { useState, useEffect } from "react";
import { MedicoApiService } from "../../services/medico.service";
import type { CitaMedico, MedicoPerfil } from "../../services/medico.service";
import "./MedicoDashboard.css";

const MedicoDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState<MedicoPerfil | null>(null);
  const [citasHoy, setCitasHoy] = useState<CitaMedico[]>([]);
  const [todasLasCitas, setTodasLasCitas] = useState<CitaMedico[]>([]);
  const [vistaActual, setVistaActual] = useState<"hoy" | "todas">("hoy");
  const [citaSeleccionada, setCitaSeleccionada] = useState<CitaMedico | null>(
    null
  );

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [perfilData, citasHoyData, todasCitas] = await Promise.all([
        MedicoApiService.obtenerMiPerfil(),
        MedicoApiService.obtenerCitasHoy(),
        MedicoApiService.obtenerMisCitas(),
      ]);

      setPerfil(perfilData);
      setCitasHoy(citasHoyData);
      setTodasLasCitas(todasCitas);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstado = async (
    citaId: string,
    nuevoEstado: "PENDIENTE" | "ATENDIDA" | "CANCELADA"
  ) => {
    try {
      await MedicoApiService.actualizarEstadoCita(citaId, nuevoEstado);
      await cargarDatos();
      setCitaSeleccionada(null);
    } catch (error) {
      console.error("Error al cambiar estado:", error);
    }
  };

  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString("es-PE", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const estadisticas = {
    citasHoy: citasHoy.length,
    pendientes: citasHoy.filter((c) => c.estado === "PENDIENTE").length,
    atendidas: todasLasCitas.filter((c) => c.estado === "ATENDIDA").length,
    canceladas: todasLasCitas.filter((c) => c.estado === "CANCELADA").length,
  };

  const citasAMostrar = vistaActual === "hoy" ? citasHoy : todasLasCitas;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="spinner"></div>
          <p className="loading-text">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="medico-dashboard">
      {/* Header */}
      <div className="medico-header">
        <div className="medico-header-content">
          <div className="medico-header-left">
            <div className="medico-avatar">👨‍⚕️</div>
            <div className="medico-info">
              <h1>
                Dr. {perfil?.nombres} {perfil?.apellidos}
              </h1>
              <p className="especialidad">{perfil?.especialidadId.nombre}</p>
              {perfil?.cmp && <p className="cmp">CMP: {perfil.cmp}</p>}
            </div>
          </div>
          <div className="medico-header-right">
            <p className="label">Correo</p>
            <p className="value">{perfil?.correo}</p>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <p className="stat-label">Citas Hoy</p>
              <p className="stat-value blue">{estadisticas.citasHoy}</p>
            </div>
            <div className="stat-icon">📅</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <p className="stat-label">Pendientes</p>
              <p className="stat-value yellow">{estadisticas.pendientes}</p>
            </div>
            <div className="stat-icon">⏳</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <p className="stat-label">Atendidas</p>
              <p className="stat-value green">{estadisticas.atendidas}</p>
            </div>
            <div className="stat-icon">✅</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-info">
              <p className="stat-label">Canceladas</p>
              <p className="stat-value red">{estadisticas.canceladas}</p>
            </div>
            <div className="stat-icon">❌</div>
          </div>
        </div>
      </div>

      {/* Tabs y Lista de Citas */}
      <div className="citas-container">
        <div className="tabs-header">
          <button
            onClick={() => setVistaActual("hoy")}
            className={`tab-button ${vistaActual === "hoy" ? "active" : ""}`}
          >
            Citas de Hoy ({citasHoy.length})
          </button>
          <button
            onClick={() => setVistaActual("todas")}
            className={`tab-button ${vistaActual === "todas" ? "active" : ""}`}
          >
            Todas las Citas ({todasLasCitas.length})
          </button>
        </div>

        <div className="citas-content">
          {citasAMostrar.length === 0 ? (
            <div className="empty-state">
              <p>No hay citas para mostrar</p>
            </div>
          ) : (
            <div className="citas-list">
              {citasAMostrar.map((cita) => (
                <div
                  key={cita._id}
                  className="cita-card"
                  onClick={() => setCitaSeleccionada(cita)}
                >
                  <div className="cita-card-content">
                    <div className="cita-paciente-info">
                      <div className="paciente-avatar">👤</div>
                      <div className="paciente-datos">
                        <h3>
                          {cita.pacienteId.nombres} {cita.pacienteId.apellidos}
                        </h3>
                        <p>DNI: {cita.pacienteId.dni}</p>
                        <p>📞 {cita.pacienteId.telefono}</p>
                      </div>
                    </div>

                    <div className="cita-fecha-hora">
                      <p className="label">Fecha</p>
                      <p className="fecha">{formatearFecha(cita.fecha)}</p>
                      <p className="hora">{cita.hora}</p>
                    </div>

                    <div>
                      <span
                        className={`estado-badge ${cita.estado.toLowerCase()}`}
                      >
                        {cita.estado}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {citaSeleccionada && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Detalle de la Cita</h2>
              <button
                onClick={() => setCitaSeleccionada(null)}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="info-section">
                <h3>Información del Paciente</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <p className="label">Nombre Completo</p>
                    <p className="value">
                      {citaSeleccionada.pacienteId.nombres}{" "}
                      {citaSeleccionada.pacienteId.apellidos}
                    </p>
                  </div>
                  <div className="info-item">
                    <p className="label">DNI</p>
                    <p className="value">{citaSeleccionada.pacienteId.dni}</p>
                  </div>
                  <div className="info-item">
                    <p className="label">Teléfono</p>
                    <p className="value">
                      {citaSeleccionada.pacienteId.telefono}
                    </p>
                  </div>
                  {citaSeleccionada.pacienteId.correo && (
                    <div className="info-item">
                      <p className="label">Correo</p>
                      <p className="value">
                        {citaSeleccionada.pacienteId.correo}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="info-section">
                <h3>Información de la Cita</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <p className="label">Fecha</p>
                    <p className="value">
                      {formatearFecha(citaSeleccionada.fecha)}
                    </p>
                  </div>
                  <div className="info-item">
                    <p className="label">Hora</p>
                    <p className="value">{citaSeleccionada.hora}</p>
                  </div>
                  <div className="info-item">
                    <p className="label">Estado Actual</p>
                    <span
                      className={`estado-badge ${citaSeleccionada.estado.toLowerCase()}`}
                    >
                      {citaSeleccionada.estado}
                    </span>
                  </div>
                </div>
              </div>

              <div className="acciones-section">
                <h3>Cambiar Estado</h3>
                <div className="acciones-botones">
                  <button
                    onClick={() =>
                      cambiarEstado(citaSeleccionada._id, "PENDIENTE")
                    }
                    disabled={citaSeleccionada.estado === "PENDIENTE"}
                    className="btn-estado pendiente"
                  >
                    ⏳ Pendiente
                  </button>
                  <button
                    onClick={() =>
                      cambiarEstado(citaSeleccionada._id, "ATENDIDA")
                    }
                    disabled={citaSeleccionada.estado === "ATENDIDA"}
                    className="btn-estado atendida"
                  >
                    ✅ Atendida
                  </button>
                  <button
                    onClick={() =>
                      cambiarEstado(citaSeleccionada._id, "CANCELADA")
                    }
                    disabled={citaSeleccionada.estado === "CANCELADA"}
                    className="btn-estado cancelada"
                  >
                    ❌ Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicoDashboard;
