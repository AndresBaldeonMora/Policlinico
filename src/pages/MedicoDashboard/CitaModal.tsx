import { useEffect, useState, useCallback } from "react";
import { MedicoApiService } from "../../services/medico.service";
import type { CitaMedico, MedicoPerfil } from "../../services/medico.service";
import { X, FlaskConical } from "lucide-react";
import { ExamenService, OrdenExamen, TIPO_EXAMEN_LABEL } from "../../services/examen.service";
import OrdenExamenModal from "./OrdenExamenModal";
import { formatearFechaLarga, formatearFechaDMY } from "../../utils/fecha.utils";
import "./CitaModal.css";

interface Props {
  citaId: string;
  perfil: MedicoPerfil;
  onCerrar: () => void;
  onCitaActualizada: () => void;
}

const ESTADO_BADGE: Record<string, { clase: string; label: string }> = {
  PENDIENTE:    { clase: "cita-modal-badge--info",    label: "Pendiente" },
  ATENDIDA:     { clase: "cita-modal-badge--success", label: "Atendida" },
  CANCELADA:    { clase: "cita-modal-badge--danger",  label: "Cancelada" },
  REPROGRAMADA: { clase: "cita-modal-badge--warning", label: "Reprogramada" },
  VENCIDA:      { clase: "cita-modal-badge--danger",  label: "Vencida" },
};

const calcularEdad = (fechaNacimiento?: string): string => {
  if (!fechaNacimiento) return "—";
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
  return `${edad} años`;
};

const CitaModal = ({ citaId, perfil, onCerrar, onCitaActualizada }: Props) => {
  const [cita, setCita] = useState<CitaMedico | null>(null);
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(true);
  const [guardandoNotas, setGuardandoNotas] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [ordenes, setOrdenes] = useState<OrdenExamen[]>([]);
  const [mostrarOrdenModal, setMostrarOrdenModal] = useState(false);

  const cargarOrdenes = useCallback(async () => {
    try {
      const data = await ExamenService.listarOrdenesPorCita(citaId);
      setOrdenes(data);
    } catch (error) {
      console.error("Error al cargar órdenes:", error);
    }
  }, [citaId]);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const detalle = await MedicoApiService.obtenerDetalleCita(citaId);
      setCita(detalle);
      setNotas(detalle.notas ?? "");

      await cargarOrdenes();
    } catch (error) {
      console.error("Error al cargar detalle:", error);
    } finally {
      setLoading(false);
    }
  }, [citaId, cargarOrdenes]);

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
                <span className="cita-modal-value">{formatearFechaLarga(cita.fecha)}</span>
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

          {perfil.especialidadId.tieneLaboratorioImagen && (
            <div className="cita-modal-section">
              <div className="cita-modal-section-header">
                <h4>Exámenes de Laboratorio / Imagen</h4>
                {cita.estado === "PENDIENTE" && (
                  <button
                    className="cita-modal-btn-lab"
                    onClick={() => setMostrarOrdenModal(true)}
                  >
                    <FlaskConical size={15} />
                    Solicitar Exámenes
                  </button>
                )}
              </div>
              {ordenes.length === 0 ? (
                <p className="cita-modal-empty-lab">No hay órdenes de examen para esta cita.</p>
              ) : (
                <div className="cita-modal-ordenes">
                  {ordenes.map((orden) => (
                    <div key={orden._id} className="cita-modal-orden-item">
                      <div className="cita-modal-orden-top">
                        <span className="cita-modal-orden-fecha">
                          {formatearFechaDMY(orden.fecha)}
                        </span>
                        <span className={`cita-modal-badge cita-modal-orden-estado--${orden.estado.toLowerCase()}`}>
                          {orden.estado === "PENDIENTE" && "Pendiente"}
                          {orden.estado === "EN_PROCESO" && "En proceso"}
                          {orden.estado === "COMPLETADO" && "Completado"}
                          {orden.estado === "CANCELADA" && "Cancelada"}
                        </span>
                      </div>
                      <ul className="cita-modal-orden-examenes">
                        {orden.items.map((item, i) => {
                          const ex = typeof item.examenId === "object" ? item.examenId : null;
                          return (
                            <li key={i} className="cita-modal-orden-examen">
                              <span className="cita-modal-orden-examen-nombre">
                                {ex ? ex.nombre : "—"}
                              </span>
                              {ex && (
                                <span className="cita-modal-orden-tipo">
                                  {TIPO_EXAMEN_LABEL[ex.tipo] || ex.tipo}
                                </span>
                              )}
                              {item.valorResultado && (
                                <span className="cita-modal-orden-resultado">
                                  {item.valorResultado} {item.unidadResultado}
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
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

      {mostrarOrdenModal && (
        <OrdenExamenModal
          citaId={citaId}
          pacienteId={cita.pacienteId._id}
          doctorId={perfil._id}
          especialidadId={perfil.especialidadId._id}
          onCerrar={() => setMostrarOrdenModal(false)}
          onOrdenCreada={cargarOrdenes}
        />
      )}
    </div>
  );
};

export default CitaModal;
