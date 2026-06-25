import { useEffect, useState, useCallback, useRef } from "react";
import { CitaApiService } from "../../services/cita.service";
import type { CitaTransformada, AuditoriaCita } from "../../services/cita.service";
import { X, MapPin } from "lucide-react";
import Swal from "sweetalert2";
import { toastExito, toastError } from "../../utils/toast";
import { fmtEstado, horasHastaCitaISO } from "../../utils/fecha.utils";
import "../../pages/MedicoDashboard/CitaModal.css";
import "./CitaQuickModal.css";

const CONSULTORIO_POR_ESPECIALIDAD: Record<string, number> = {
  "Medicina General":          1,
  "Pediatría":                 2,
  "Odontología":               3,
  "Reumatología":              4,
  "Ginecología y Obstetricia": 5,
  "Cardiología":               6,
  "Endocrinología":            7,
  "Neumología":                8,
  "Gastroenterología":         9,
  "Psiquiatría":               10,
};

interface Props {
  citaId: string;
  onCerrar: () => void;
  onCitaActualizada: () => void;
  onIrADetalle?: (citaId: string) => void;
  onReprogramar?: (cita: CitaTransformada) => void;
  modo?: "recepcionista" | "medico";
}

const CitaQuickModal = ({ citaId, onCerrar, onCitaActualizada, onReprogramar }: Props) => {
  const [cita, setCita]       = useState<CitaTransformada | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [tabActiva, setTabActiva]             = useState<"datos" | "historial">("datos");
  const [auditoria, setAuditoria]             = useState<AuditoriaCita[]>([]);
  const [cargandoAuditoria, setCargandoAuditoria] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setCita(await CitaApiService.obtenerPorId(citaId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar la cita");
    } finally {
      setLoading(false);
    }
  }, [citaId]);

  const cargarAuditoria = useCallback(async () => {
    setCargandoAuditoria(true);
    try {
      setAuditoria(await CitaApiService.obtenerAuditoria(citaId));
    } catch { /* ignore */ } finally {
      setCargandoAuditoria(false);
    }
  }, [citaId]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  useEffect(() => {
    if (tabActiva === "historial") cargarAuditoria();
  }, [tabActiva, cargarAuditoria]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onCerrar(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onCerrar]);

  useEffect(() => { cardRef.current?.focus(); }, [loading]);

  const handleEliminar = async () => {
    const result = await Swal.fire({
      title: "Eliminar cita",
      text: "¿Estás seguro? Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed || !cita) return;
    try {
      await CitaApiService.eliminar(cita._id);
      onCitaActualizada();
      onCerrar();
      toastExito("Cita eliminada");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Error al eliminar");
    }
  };

  if (loading || !cita) {
    return (
      <div className="cita-modal-overlay" onClick={onCerrar}>
        <div className="cita-modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
          {error ? (
            <div className="cita-modal-loading">
              <p className="cita-modal-error-text">{error}</p>
              <div className="cita-modal-error-actions">
                <button className="cita-modal-btn cita-modal-btn--primary" onClick={cargarDatos}>Reintentar</button>
                <button className="cita-modal-btn cita-modal-btn--cancel" onClick={onCerrar}>Cerrar</button>
              </div>
            </div>
          ) : (
            <div className="cita-modal-loading">
              <div className="spinner-small" />
              <p>Cargando detalle…</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const paciente = cita.pacienteId && typeof cita.pacienteId === "object" ? cita.pacienteId : null;
  const doctor   = cita.doctorId   && typeof cita.doctorId   === "object" ? cita.doctorId   : null;
  const especialidad = doctor?.especialidadId && typeof doctor.especialidadId === "object"
    ? doctor.especialidadId.nombre
    : "—";
  const consultorio = CONSULTORIO_POR_ESPECIALIDAD[especialidad] ?? "—";

  const fechaDisplay = cita.fecha
    ? new Date(cita.fecha).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" })
    : "—";

  const fueraDePlazo = cita.fecha && cita.hora
    ? horasHastaCitaISO(cita.fecha, cita.hora) < 24
    : true;
  const puedeReprogramar = onReprogramar
    && (cita.estado === "PENDIENTE" || cita.estado === "REPROGRAMADA")
    && !fueraDePlazo;

  return (
    <div className="cita-modal-overlay" onClick={onCerrar} role="presentation">
      <div
        className="cita-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cqm-title"
        ref={cardRef}
        tabIndex={-1}
      >
        <div className="cita-modal-header">
          <h3 id="cqm-title">Detalle de la Cita</h3>
          <button className="cita-modal-close" onClick={onCerrar} aria-label="Cerrar modal">
            <X size={18} />
          </button>
        </div>

        <div className="cita-modal-tabs">
          <button
            className={`cita-modal-tab ${tabActiva === "datos" ? "cita-modal-tab--activo" : ""}`}
            onClick={() => setTabActiva("datos")}
          >
            Datos de la cita
          </button>
          <button
            className={`cita-modal-tab ${tabActiva === "historial" ? "cita-modal-tab--activo" : ""}`}
            onClick={() => setTabActiva("historial")}
          >
            Historial de cambios
          </button>
        </div>

        <div className="cita-modal-body">
          {tabActiva === "datos" ? (
            <div className="cita-modal-datos-container">
              <div className="cita-modal-datos-col-left">
                <div className="cita-modal-field-row">
                  <label className="cita-modal-field-label">Sucursal</label>
                  <div className="cita-modal-field-value">
                    <MapPin size={16} style={{ marginRight: "0.5rem" }} />San Jose
                  </div>
                </div>

                <div className="cita-modal-field-row">
                  <label className="cita-modal-field-label">Paciente</label>
                  <div className="cita-modal-field-value">
                    {paciente ? `${paciente.nombres} ${paciente.apellidos}` : "—"}
                  </div>
                </div>

                <div className="cita-modal-field-row">
                  <label className="cita-modal-field-label">Doctor</label>
                  <div className="cita-modal-field-value">
                    {doctor ? `${doctor.nombres} ${doctor.apellidos}` : "—"}
                  </div>
                </div>

                <div className="cita-modal-field-row">
                  <label className="cita-modal-field-label">Especialidad</label>
                  <div className="cita-modal-field-value">{especialidad}</div>
                </div>

                <div className="cita-modal-field-row">
                  <label className="cita-modal-field-label">Estado</label>
                  <div className="cita-modal-field-value">{fmtEstado(cita.estado)}</div>
                </div>
              </div>

              <div className="cita-modal-divider" />

              <div className="cita-modal-datos-col-right">
                <div className="cita-modal-field-row">
                  <label className="cita-modal-field-label">Fecha</label>
                  <div className="cita-modal-field-value">{fechaDisplay}</div>
                </div>

                <div className="cita-modal-field-row">
                  <label className="cita-modal-field-label">Hora inicio</label>
                  <div className="cita-modal-field-value">{cita.hora || "—"}</div>
                </div>

                <div className="cita-modal-field-row">
                  <label className="cita-modal-field-label">Consultorio</label>
                  <div className="cita-modal-field-value">
                    {consultorio}
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="cita-modal-historial">
              {cargandoAuditoria ? (
                <div style={{ textAlign: "center", padding: "2rem" }}>
                  <div className="spinner-small" style={{ margin: "0 auto 1rem" }} />
                  <p>Cargando historial…</p>
                </div>
              ) : auditoria.length === 0 ? (
                <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>No hay cambios registrados</p>
              ) : (
                <>
                  <p className="cita-modal-historial-header">
                    Esta cita fue creada por {auditoria[0]?.usuarioNombre || "Sistema"} el{" "}
                    {new Date(auditoria[0]?.timestamp || Date.now()).toLocaleDateString("es-PE")} a las{" "}
                    {new Date(auditoria[0]?.timestamp || Date.now()).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <table className="cita-modal-table">
                    <thead>
                      <tr>
                        <th>Fecha y hora</th>
                        <th>Propiedad que cambió</th>
                        <th>Antes</th>
                        <th>Actual</th>
                        <th>Modificado por</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditoria.map((log, idx) => (
                        <tr key={log._id || idx}>
                          <td>{new Date(log.timestamp).toLocaleString("es-PE")}</td>
                          <td>{log.accion.replace(/_/g, " ")}</td>
                          <td>{log.estadoAnterior || "—"}</td>
                          <td>{log.estadoNuevo || "—"}</td>
                          <td>{log.usuarioNombre || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          )}
        </div>

        <div className="cita-modal-footer" style={{ justifyContent: "space-between" }}>
          <button
            className="cita-modal-btn cita-modal-btn--danger"
            onClick={handleEliminar}
          >
            Eliminar cita
          </button>
          <div style={{ display: "flex", gap: "0.625rem" }}>
            <button className="cita-modal-btn cita-modal-btn--secondary" onClick={onCerrar}>
              Cancelar
            </button>
            {onReprogramar && (
              <button
                className="cita-modal-btn cita-modal-btn--primary"
                disabled={!puedeReprogramar}
                title={
                  fueraDePlazo
                    ? "No se puede reprogramar dentro de las 24h previas a la cita"
                    : !puedeReprogramar
                    ? "Solo se pueden reprogramar citas pendientes o reprogramadas"
                    : undefined
                }
                onClick={() => { onCerrar(); onReprogramar!(cita); }}
              >
                Reprogramar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitaQuickModal;
