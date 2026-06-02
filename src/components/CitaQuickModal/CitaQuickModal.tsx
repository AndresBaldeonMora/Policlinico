import { useEffect, useState, useCallback, useRef } from "react";
import { CitaApiService } from "../../services/cita.service";
import type { CitaTransformada, EstadoCita, AuditoriaCita } from "../../services/cita.service";
import type { DoctorTransformado } from "../../services/doctor.service";
import { X, MapPin } from "lucide-react";
import Swal from "sweetalert2";
import { DoctorApiService } from "../../services/doctor.service";
import "../../pages/MedicoDashboard/CitaModal.css";
import "./CitaQuickModal.css";


interface Props {
  citaId: string;
  onCerrar: () => void;
  onCitaActualizada: () => void;
  onIrADetalle?: (citaId: string) => void;
  modo?: "recepcionista" | "medico";
}


const CitaQuickModal = ({ citaId, onCerrar, onCitaActualizada }: Props) => {
  const [cita, setCita] = useState<CitaTransformada | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [tabActiva, setTabActiva] = useState<"datos" | "historial">("datos");
  const [doctores, setDoctores] = useState<DoctorTransformado[]>([]);
  const [auditoria, setAuditoria] = useState<AuditoriaCita[]>([]);
  const [cargandoAuditoria, setCargandoAuditoria] = useState(false);

  const [editForm, setEditForm] = useState({
    doctorId: "",
    estadoLocal: "" as EstadoCita,
    fecha: "",
    hora: "",
    notasClinicas: "",
  });

  const [originalValues, setOriginalValues] = useState({
    doctorId: "",
    estado: "" as EstadoCita,
    fecha: "",
    hora: "",
    notasClinicas: "",
  });

  const submittingRef = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const detalle = await CitaApiService.obtenerPorId(citaId);
      setCita(detalle);

      const doctor = detalle.doctorId && typeof detalle.doctorId === "object" ? detalle.doctorId._id : (typeof detalle.doctorId === "string" ? detalle.doctorId : "");
      const fecha = typeof detalle.fecha === "string" ? detalle.fecha.split("T")[0] : "";

      setEditForm({
        doctorId: doctor,
        estadoLocal: detalle.estado,
        fecha,
        hora: detalle.hora || "",
        notasClinicas: detalle.notasClinicas || "",
      });

      setOriginalValues({
        doctorId: doctor,
        estado: detalle.estado,
        fecha,
        hora: detalle.hora || "",
        notasClinicas: detalle.notasClinicas || "",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al cargar la cita";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [citaId]);

  const cargarDoctores = useCallback(async () => {
    try {
      const lista = await DoctorApiService.listar();
      setDoctores(lista);
    } catch (err) {
      console.error("Error cargando doctores:", err);
    }
  }, []);

  const cargarAuditoria = useCallback(async () => {
    setCargandoAuditoria(true);
    try {
      const logs = await CitaApiService.obtenerAuditoria(citaId);
      setAuditoria(logs);
    } catch (err) {
      console.error("Error cargando auditoría:", err);
    } finally {
      setCargandoAuditoria(false);
    }
  }, [citaId]);

  useEffect(() => {
    cargarDatos();
    cargarDoctores();
  }, [cargarDatos, cargarDoctores]);

  useEffect(() => {
    if (tabActiva === "historial") {
      cargarAuditoria();
    }
  }, [tabActiva, cargarAuditoria]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onCerrar]);

  useEffect(() => {
    cardRef.current?.focus();
  }, [loading]);

  const handleGuardar = async () => {
    if (submittingRef.current || guardando) return;
    submittingRef.current = true;
    setGuardando(true);
    setError("");

    try {
      const promesas = [];

      // Cambiar estado
      if (editForm.estadoLocal !== originalValues.estado) {
        promesas.push(CitaApiService.cambiarEstado(citaId, editForm.estadoLocal));
      }

      // Reprogramar
      if (editForm.fecha !== originalValues.fecha || editForm.hora !== originalValues.hora) {
        promesas.push(CitaApiService.reprogramar(citaId, editForm.fecha, editForm.hora));
      }

      // Actualizar doctor y notas
      if (editForm.doctorId !== originalValues.doctorId || editForm.notasClinicas !== originalValues.notasClinicas) {
        const updateData: any = {};
        if (editForm.doctorId !== originalValues.doctorId) {
          updateData.doctorId = editForm.doctorId || undefined;
        }
        if (editForm.notasClinicas !== originalValues.notasClinicas) {
          updateData.notasClinicas = editForm.notasClinicas;
        }
        promesas.push(CitaApiService.actualizarCita(citaId, updateData));
      }

      if (promesas.length > 0) {
        await Promise.all(promesas);
        await cargarDatos();
        onCitaActualizada();
        Swal.fire({ icon: "success", title: "Cita actualizada", toast: true, position: "top-end", timer: 3000, showConfirmButton: false });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al guardar cambios";
      setError(message);
      Swal.fire({ icon: "error", title: "Error", text: message });
    } finally {
      submittingRef.current = false;
      setGuardando(false);
    }
  };

  const handleCancelar = async () => {
    const result = await Swal.fire({
      title: "¿Cancelar esta cita?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Sí, cancelar cita",
      cancelButtonText: "No, mantener",
    });

    if (!result.isConfirmed || !cita) return;

    try {
      await CitaApiService.cancelar(cita._id, "Cancelado por recepcionista");
      onCitaActualizada();
      onCerrar();
      Swal.fire({ icon: "success", title: "Cita cancelada", toast: true, position: "top-end", timer: 3000, showConfirmButton: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al cancelar";
      setError(message);
      Swal.fire({ icon: "error", title: "Error", text: message });
    }
  };

  const handleEliminar = async () => {
    const result = await Swal.fire({
      title: "Eliminar cita",
      text: "¿Estás seguro de que deseas eliminar permanentemente esta cita? Esta acción no se puede deshacer.",
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
      Swal.fire({ icon: "success", title: "Cita eliminada", toast: true, position: "top-end", timer: 3000, showConfirmButton: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al eliminar";
      setError(message);
      Swal.fire({ icon: "error", title: "Error", text: message });
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
  const doctor = cita.doctorId && typeof cita.doctorId === "object" ? cita.doctorId : null;

  const doctorSeleccionado = doctores.find(d => d.id === editForm.doctorId);
  const especialidadTexto = doctorSeleccionado?.especialidad || (doctor?.especialidadId && typeof doctor.especialidadId === "object" ? doctor.especialidadId.nombre : "Sin especialidad");

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

        {/* Tabs */}
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
          {error && <div className="cita-modal-error-msg">{error}</div>}

          {tabActiva === "datos" ? (
            <div className="cita-modal-datos-grid">
              <div className="cita-modal-datos-col">
                <div className="cita-modal-field">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <MapPin size={14} style={{ color: "var(--text-muted)" }} />
                    <span className="cita-modal-label">Sucursal</span>
                  </div>
                  <span className="cita-modal-value">Policlinico</span>
                </div>

                <div className="cita-modal-field">
                  <span className="cita-modal-label">Paciente</span>
                  <span className="cita-modal-value">{paciente ? `${paciente.nombres} ${paciente.apellidos}` : "—"}</span>
                  {paciente?.dni && <span className="cita-modal-sub">DNI: {paciente.dni}</span>}
                </div>

                <div className="cita-modal-field">
                  <span className="cita-modal-label">Doctor</span>
                  <select
                    className="cita-modal-input"
                    value={editForm.doctorId}
                    onChange={(e) => setEditForm({ ...editForm, doctorId: e.target.value })}
                    disabled={guardando}
                  >
                    <option value="">Sin asignar</option>
                    {doctores.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nombres} {d.apellidos}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="cita-modal-field">
                  <span className="cita-modal-label">Especialidad</span>
                  <span className="cita-modal-value">{especialidadTexto}</span>
                </div>

                <div className="cita-modal-field">
                  <span className="cita-modal-label">Estado</span>
                  <select
                    className="cita-modal-input"
                    value={editForm.estadoLocal}
                    onChange={(e) => setEditForm({ ...editForm, estadoLocal: e.target.value as EstadoCita })}
                    disabled={guardando}
                  >
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="ASISTIO">Asistió</option>
                    <option value="ATENDIDA">Atendida</option>
                    <option value="CANCELADA">Cancelada</option>
                    <option value="REPROGRAMADA">Reprogramada</option>
                  </select>
                </div>
              </div>

              <div className="cita-modal-datos-col">
                <div className="cita-modal-field">
                  <span className="cita-modal-label">Fecha</span>
                  <input
                    type="date"
                    className="cita-modal-input"
                    value={editForm.fecha}
                    onChange={(e) => setEditForm({ ...editForm, fecha: e.target.value })}
                    disabled={guardando}
                  />
                </div>

                <div className="cita-modal-field">
                  <span className="cita-modal-label">Hora inicio</span>
                  <input
                    type="time"
                    className="cita-modal-input"
                    value={editForm.hora}
                    onChange={(e) => setEditForm({ ...editForm, hora: e.target.value })}
                    disabled={guardando}
                  />
                </div>

                <div className="cita-modal-field" style={{ gridColumn: "1 / -1" }}>
                  <span className="cita-modal-label">Nota de la cita</span>
                  <textarea
                    className="cita-modal-input"
                    value={editForm.notasClinicas}
                    onChange={(e) => setEditForm({ ...editForm, notasClinicas: e.target.value })}
                    disabled={guardando}
                    rows={4}
                    placeholder="Escriba aquí..."
                  />
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
            disabled={guardando}
          >
            Eliminar cita
          </button>
          <div style={{ display: "flex", gap: "0.625rem" }}>
            {tabActiva === "datos" && (
              <>
                <button
                  className="cita-modal-btn cita-modal-btn--secondary"
                  onClick={handleCancelar}
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button
                  className="cita-modal-btn cita-modal-btn--primary"
                  onClick={handleGuardar}
                  disabled={guardando}
                >
                  {guardando ? "Guardando..." : "Guardar"}
                </button>
              </>
            )}
            {tabActiva === "historial" && (
              <button
                className="cita-modal-btn cita-modal-btn--cancel"
                onClick={onCerrar}
              >
                Cerrar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitaQuickModal;
