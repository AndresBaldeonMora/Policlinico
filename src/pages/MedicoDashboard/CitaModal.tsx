import { useEffect, useState, useCallback } from "react";
import { MedicoApiService } from "../../services/medico.service";
import type { CitaMedico } from "../../services/medico.service";
import { X } from "lucide-react";
import "./CitaModal.css";

interface Props {
  citaId: string;
  onCerrar: () => void;
  onCitaActualizada: () => void;
}

const ESTADO_BADGE: Record<string, { clase: string; label: string }> = {
  PENDIENTE:    { clase: "cita-modal-badge--info",    label: "Pendiente" },
  ATENDIDA:     { clase: "cita-modal-badge--success", label: "Atendida" },
  CANCELADA:    { clase: "cita-modal-badge--danger",  label: "Cancelada" },
  REPROGRAMADA: { clase: "cita-modal-badge--warning", label: "Reprogramada" },
};

const formatearFecha = (fecha: string) =>
  new Date(fecha).toLocaleDateString("es-PE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

const calcularEdad = (fechaNacimiento?: string): string => {
  if (!fechaNacimiento) return "—";
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
  return `${edad} anios`;
};

const CitaModal = ({ citaId, onCerrar, onCitaActualizada }: Props) => {
  const [cita, setCita] = useState<CitaMedico | null>(null);
  const [historial, setHistorial] = useState<CitaMedico[]>([]);
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(true);
  const [guardandoNotas, setGuardandoNotas] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const detalle = await MedicoApiService.obtenerDetalleCita(citaId);
      setCita(detalle);
      setNotas(detalle.notas ?? "");

      const todasCitas = await MedicoApiService.obtenerMisCitas();
      const historialPaciente = todasCitas
        .filter((c) => c.pacienteId._id === detalle.pacienteId._id && c._id !== citaId)
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
        .slice(0, 5);
      setHistorial(historialPaciente);
    } catch (error) {
      console.error("Error al cargar detalle:", error);
    } finally {
      setLoading(false);
    }
  }, [citaId]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  const guardarNotas = async () => {
    if (!cita) return;
    setGuardandoNotas(true);
    try {
      await MedicoApiService.guardarNotas(cita._id, notas, cita.estado);
      onCitaActualizada();
    } catch (error) {
      console.error("Error al guardar notas:", error);
    } finally {
      setGuardandoNotas(false);
    }
  };

  const marcarAtendida = async () => {
    if (!cita) return;
    setCambiandoEstado(true);
    try {
      await MedicoApiService.actualizarEstadoCita(cita._id, "ATENDIDA");
      const detalle = await MedicoApiService.obtenerDetalleCita(citaId);
      setCita(detalle);
      onCitaActualizada();
    } catch (error) {
      console.error("Error al cambiar estado:", error);
    } finally {
      setCambiandoEstado(false);
    }
  };

  if (loading || !cita) {
    return (
      <div className="cita-modal-overlay" onClick={onCerrar}>
        <div className="cita-modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="cita-modal-loading">
            <div className="spinner-small" />
            <p>Cargando detalle...</p>
          </div>
        </div>
      </div>
    );
  }

  const paciente = cita.pacienteId;
  const badgeConfig = ESTADO_BADGE[cita.estado] ?? ESTADO_BADGE.PENDIENTE;

  return (
    <div className="cita-modal-overlay" onClick={onCerrar}>
      <div className="cita-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="cita-modal-header">
          <h3>Detalle de la Cita</h3>
          <button className="cita-modal-close" onClick={onCerrar}>
            <X size={18} />
          </button>
        </div>

        <div className="cita-modal-body">
          <div className="cita-modal-section">
            <h4>Datos de la cita</h4>
            <div className="cita-modal-grid">
              <div className="cita-modal-field">
                <span className="cita-modal-label">Fecha</span>
                <span className="cita-modal-value">{formatearFecha(cita.fecha)}</span>
              </div>
              <div className="cita-modal-field">
                <span className="cita-modal-label">Hora</span>
                <span className="cita-modal-value">{cita.hora}</span>
              </div>
              <div className="cita-modal-field">
                <span className="cita-modal-label">Estado</span>
                <span className={`cita-modal-badge ${badgeConfig.clase}`}>{badgeConfig.label}</span>
              </div>
            </div>
          </div>

          <div className="cita-modal-section">
            <h4>Datos del paciente</h4>
            <div className="cita-modal-grid">
              <div className="cita-modal-field">
                <span className="cita-modal-label">Nombre completo</span>
                <span className="cita-modal-value">{paciente.nombres} {paciente.apellidos}</span>
              </div>
              <div className="cita-modal-field">
                <span className="cita-modal-label">DNI</span>
                <span className="cita-modal-value">{paciente.dni}</span>
              </div>
              <div className="cita-modal-field">
                <span className="cita-modal-label">Edad</span>
                <span className="cita-modal-value">{calcularEdad(paciente.fechaNacimiento)}</span>
              </div>
              {paciente.telefono && (
                <div className="cita-modal-field">
                  <span className="cita-modal-label">Telefono</span>
                  <span className="cita-modal-value">{paciente.telefono}</span>
                </div>
              )}
              {paciente.correo && (
                <div className="cita-modal-field">
                  <span className="cita-modal-label">Correo</span>
                  <span className="cita-modal-value">{paciente.correo}</span>
                </div>
              )}
            </div>
          </div>

          <div className="cita-modal-section">
            <h4>Notas clinicas</h4>
            <textarea
              className="cita-modal-textarea"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Escriba las notas clinicas de la consulta..."
              rows={4}
            />
            <button
              className="cita-modal-btn cita-modal-btn--secondary"
              onClick={guardarNotas}
              disabled={guardandoNotas}
            >
              {guardandoNotas ? "Guardando..." : "Guardar notas"}
            </button>
          </div>

          {historial.length > 0 && (
            <div className="cita-modal-section">
              <h4>Historial de visitas</h4>
              <div className="cita-modal-historial">
                <table className="cita-modal-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historial.map((h) => {
                      const hBadge = ESTADO_BADGE[h.estado] ?? ESTADO_BADGE.PENDIENTE;
                      return (
                        <tr key={h._id}>
                          <td>{formatearFecha(h.fecha)}</td>
                          <td>
                            <span className={`cita-modal-badge ${hBadge.clase}`}>{hBadge.label}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="cita-modal-footer">
          {cita.estado === "PENDIENTE" && (
            <button
              className="cita-modal-btn cita-modal-btn--primary"
              onClick={marcarAtendida}
              disabled={cambiandoEstado}
            >
              {cambiandoEstado ? "Actualizando..." : "Marcar como Atendida"}
            </button>
          )}
          <button className="cita-modal-btn cita-modal-btn--cancel" onClick={onCerrar}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CitaModal;
