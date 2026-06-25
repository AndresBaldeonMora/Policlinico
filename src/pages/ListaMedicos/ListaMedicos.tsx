import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Upload,
  Eye,
  X,
  FileText,
  ExternalLink,
  Search,
  Stethoscope,
  Mail,
  Phone,
  Lock,
  Unlock,
  Calendar,
} from "lucide-react";
import "../ListaCitas/ListaCitas.css";
import {
  DoctorApiService,
  type DoctorTransformado as DoctorBase,
} from "../../services/doctor.service";
import { BloqueoService, type Bloqueo } from "../../services/bloqueo.service";
import { useAuth } from "../../hooks/userAuth";

const normalizeString = (str: string): string =>
  (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

interface NotificationState {
  message: string;
  type: "success" | "error" | "";
  visible: boolean;
}

type Doctor = DoctorBase & { cmp?: string; cvUrl?: string };

const ListaMedicos = () => {
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const highlightRef = useRef<HTMLTableRowElement>(null);
  const [doctores, setDoctores] = useState<Doctor[]>([]);
  const [busqueda, setBusqueda] = useState(searchParams.get("buscar") || "");
  const [cargando, setCargando] = useState(true);
  const [notification, setNotification] = useState<NotificationState>({
    message: "",
    type: "",
    visible: false,
  });
  const [doctorCV, setDoctorCV] = useState<Doctor | null>(null);
  const [cvLocalUrls, setCvLocalUrls] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);
  const { user } = useAuth();
  const esAdmin = user?.rol === "administrador";

  // ── Bloqueos ──────────────────────────────────────────
  const [doctorBloqueo, setDoctorBloqueo]     = useState<Doctor | null>(null);
  const [bloqueosDoctor, setBloqueosDoctor]   = useState<Bloqueo[]>([]);
  const [showBloqueoModal, setShowBloqueoModal] = useState(false);
  const [bloqueoLoading, setBloqueoLoading]   = useState(false);
  const [slotsDoctor, setSlotsDoctor]         = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading]       = useState(false);
  const [bloqueoForm, setBloqueoForm] = useState({
    fecha: "", tipoDia: "DIA_COMPLETO" as "DIA_COMPLETO" | "RANGO_HORAS",
    horaInicio: "", horaFin: "", motivo: "No asistió", descripcion: "",
  });

  const cargarBloqueosDoctor = async (doctorId: string) => {
    try {
      setBloqueosDoctor(await BloqueoService.listar({ doctorId }));
    } catch { setBloqueosDoctor([]); }
  };

  const abrirPanelBloqueos = (doctor: Doctor) => {
    setDoctorBloqueo(doctor);
    cargarBloqueosDoctor(doctor.id);
  };

  const cargarSlotsDoctor = async (doctorId: string, fecha: string) => {
    if (!fecha) { setSlotsDoctor([]); return; }
    setSlotsLoading(true);
    try {
      const slots = await DoctorApiService.obtenerHorariosDia(doctorId, fecha);
      setSlotsDoctor(slots);
    } catch { setSlotsDoctor([]); }
    finally { setSlotsLoading(false); }
  };

  const handleFechaBloqueo = (fecha: string) => {
    setBloqueoForm(f => ({ ...f, fecha, horaInicio: "", horaFin: "" }));
    if (doctorBloqueo) cargarSlotsDoctor(doctorBloqueo.id, fecha);
  };

  const handleCrearBloqueo = async () => {
    if (!doctorBloqueo || !bloqueoForm.fecha || !bloqueoForm.motivo) return;
    if (bloqueoForm.tipoDia === "RANGO_HORAS" && (!bloqueoForm.horaInicio || !bloqueoForm.horaFin)) return;
    setBloqueoLoading(true);
    try {
      await BloqueoService.crear({
        doctorId:    doctorBloqueo.id,
        fecha:       bloqueoForm.fecha,
        tipoDia:     bloqueoForm.tipoDia,
        horaInicio:  bloqueoForm.tipoDia === "RANGO_HORAS" ? bloqueoForm.horaInicio : undefined,
        horaFin:     bloqueoForm.tipoDia === "RANGO_HORAS" ? bloqueoForm.horaFin    : undefined,
        motivo:      bloqueoForm.motivo,
        descripcion: bloqueoForm.descripcion || undefined,
      });
      showNotification("Bloqueo creado correctamente.", "success");
      setShowBloqueoModal(false);
      setBloqueoForm({ fecha: "", tipoDia: "DIA_COMPLETO", horaInicio: "", horaFin: "", motivo: "No asistió", descripcion: "" });
      setSlotsDoctor([]);
      cargarBloqueosDoctor(doctorBloqueo.id);
    } catch (err: any) {
      showNotification(err?.response?.data?.message || "Error al crear bloqueo.", "error");
    } finally { setBloqueoLoading(false); }
  };

  const handleDesactivarBloqueo = async (bloqueoId: string) => {
    try {
      await BloqueoService.desactivar(bloqueoId);
      showNotification("Bloqueo desactivado.", "success");
      if (doctorBloqueo) cargarBloqueosDoctor(doctorBloqueo.id);
    } catch { showNotification("Error al desactivar bloqueo.", "error"); }
  };

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type, visible: true });
    setTimeout(
      () => setNotification((prev) => ({ ...prev, visible: false })),
      2500,
    );
  };

  const cargarDoctores = async () => {
    try {
      setCargando(true);
      setDoctores((await DoctorApiService.listar()) as Doctor[]);
    } catch {
      showNotification("Error al cargar la lista de medicos.", "error");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDoctores();
  }, []);

  useEffect(() => {
    if (highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [highlightId, doctores]);
  useEffect(() => {
    return () => {
      Object.values(cvLocalUrls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [cvLocalUrls]);

  const doctoresFiltrados = doctores.filter((d) => {
    const filtro = normalizeString(busqueda);
    return (
      normalizeString(`${d.nombres} ${d.apellidos}`).includes(filtro) ||
      normalizeString(d.especialidad ?? "").includes(filtro) ||
      normalizeString(d.cmp ?? "").includes(filtro)
    );
  });

  const getCvUrl = (doctor: Doctor): string | null =>
    cvLocalUrls[doctor.id] || doctor.cvUrl || null;

  const handleVerCV = (doctor: Doctor) => {
    if (!getCvUrl(doctor)) {
      showNotification("Este medico no tiene CV registrado.", "error");
      return;
    }
    setDoctorCV(doctor);
  };

  const handleUploadClick = (doctorId: string) => {
    setUploadTargetId(doctorId);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTargetId) return;
    if (file.type !== "application/pdf") {
      showNotification("Solo se permiten archivos PDF.", "error");
      e.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showNotification("El archivo no debe superar 10 MB.", "error");
      e.target.value = "";
      return;
    }
    if (cvLocalUrls[uploadTargetId])
      URL.revokeObjectURL(cvLocalUrls[uploadTargetId]);
    setCvLocalUrls((prev) => ({
      ...prev,
      [uploadTargetId]: URL.createObjectURL(file),
    }));
    showNotification("CV cargado correctamente.", "success");
    e.target.value = "";
    setUploadTargetId(null);
  };

  const cvUrlSeleccionado = doctorCV ? getCvUrl(doctorCV) : null;

  return (
    <div className="lista-page">
      {notification.visible && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <div className="lista-page-header">
        <div>
          <h1>Directorio Medico</h1>
          <p className="lista-page-subtitle">
            {doctores.length} medicos registrados
          </p>
        </div>
      </div>

      <div className="lista-search-bar">
        <Search size={18} className="lista-search-icon" />
        <input
          type="text"
          placeholder="Buscar por nombre, especialidad o CMP..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="lista-search-input"
        />
      </div>

      {cargando ? (
        <div className="lista-loading">
          <div className="lista-loading-spinner" />
          <p>Cargando medicos…</p>
        </div>
      ) : (
        <div className="lista-table-card">
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th style={{ width: 240 }}>Doctor</th>
                  <th style={{ width: 150 }}>Especialidad</th>
                  <th style={{ width: 100 }}>CMP</th>
                  <th style={{ width: 200 }}>Contacto</th>
                  {esAdmin && <th style={{ width: 100 }}>Bloqueos</th>}
                  <th style={{ width: 140 }}>CV</th>
                </tr>
              </thead>
              <tbody>
                {doctoresFiltrados.length > 0 ? (
                  doctoresFiltrados.map((d) => (
                    <tr
                      key={d.id}
                      ref={highlightId === d.id ? highlightRef : undefined}
                      className={highlightId === d.id ? "tr-highlight" : ""}
                    >
                      <td>
                        <div className="td-person">
                          <div className="td-avatar td-avatar--doc">
                            <Stethoscope size={14} />
                          </div>
                          <div className="td-person-info">
                            <span className="td-person-name">
                              Dr. {d.nombres} {d.apellidos}
                            </span>
                            {d.cmp && (
                              <span className="td-person-meta">
                                CMP: {d.cmp}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="td-specialty">
                          {d.especialidad || "-"}
                        </span>
                      </td>
                      <td>
                        <span className="td-mono">{d.cmp || "-"}</span>
                      </td>
                      <td>
                        <div className="td-contact-stack">
                          {d.correo && (
                            <span className="td-contact">
                              <Mail size={12} /> {d.correo}
                            </span>
                          )}
                          {d.telefono && (
                            <span className="td-contact">
                              <Phone size={12} /> {d.telefono}
                            </span>
                          )}
                          {!d.correo && !d.telefono && (
                            <span className="td-muted">-</span>
                          )}
                        </div>
                      </td>
                      {esAdmin && (
                        <td>
                          <button
                            type="button"
                            className="btn-action"
                            onClick={() => abrirPanelBloqueos(d)}
                            title="Bloquear horario"
                          >
                            <Calendar size={15} />
                          </button>
                        </td>
                      )}
                      <td>
                        <div className="td-cv-actions">
                          {getCvUrl(d) && (
                            <button
                              type="button"
                              className="btn-action"
                              onClick={() => handleVerCV(d)}
                              title="Ver CV"
                            >
                              <Eye size={15} />
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn-action btn-action--upload"
                            onClick={() => handleUploadClick(d.id)}
                            title={getCvUrl(d) ? "Cambiar CV" : "Subir CV"}
                            disabled={!esAdmin}
                            style={!esAdmin ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
                          >
                            <Upload size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="td-empty">
                      <Stethoscope size={32} className="td-empty-icon" />
                      <p>No se encontraron medicos.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal panel de bloqueos del doctor */}
      {doctorBloqueo && !showBloqueoModal && (
        <div
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setDoctorBloqueo(null); }}
        >
          <div className="modal-card-cv">
            <div className="modal-cv-header">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Lock size={20} />
                <h3>Bloqueos - Dr. {doctorBloqueo.nombres} {doctorBloqueo.apellidos}</h3>
              </div>
              <button type="button" className="modal-cv-close" onClick={() => setDoctorBloqueo(null)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: "1rem", maxHeight: "400px", overflowY: "auto" }}>
              {bloqueosDoctor.length === 0 ? (
                <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "2rem 0" }}>
                  No hay bloqueos activos para este doctor.
                </p>
              ) : (
                <table className="dashboard-table" style={{ fontSize: "0.85rem" }}>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Horario</th>
                      <th>Motivo</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bloqueosDoctor.map((b) => (
                      <tr key={b._id}>
                        <td>
                          {new Date(b.fecha).toLocaleDateString("es-PE", {
                            day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC",
                          })}
                        </td>
                        <td>
                          {b.tipoDia === "RANGO_HORAS" && b.horaInicio && b.horaFin
                            ? `${b.horaInicio} – ${b.horaFin}`
                            : "Día completo"}
                        </td>
                        <td>{b.motivo}{b.descripcion ? ` — ${b.descripcion}` : ""}</td>
                        <td>
                          <button
                            type="button"
                            className="btn-action"
                            onClick={() => handleDesactivarBloqueo(b._id)}
                            title="Desbloquear"
                          >
                            <Unlock size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setDoctorBloqueo(null)}>
                Cerrar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const hoy = new Date().toISOString().split("T")[0];
                  setBloqueoForm(f => ({ ...f, fecha: hoy }));
                  if (doctorBloqueo) cargarSlotsDoctor(doctorBloqueo.id, hoy);
                  setShowBloqueoModal(true);
                }}
              >
                <Lock size={15} /> Bloquear día
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal crear bloqueo */}
      {showBloqueoModal && doctorBloqueo && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowBloqueoModal(false); }}>
          <div className="modal-card-cv" style={{ maxWidth: "520px" }}>
            <div className="modal-cv-header">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Lock size={20} />
                <h3>Bloquear horario — Dr. {doctorBloqueo.nombres} {doctorBloqueo.apellidos}</h3>
              </div>
              <button type="button" className="modal-cv-close" onClick={() => setShowBloqueoModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1.1rem" }}>

              {/* Fecha */}
              <div>
                <label style={{ display: "block", marginBottom: "0.3rem", fontSize: "0.85rem", fontWeight: 600 }}>Fecha *</label>
                <input type="date" value={bloqueoForm.fecha}
                  onChange={(e) => handleFechaBloqueo(e.target.value)}
                  className="lista-search-input" style={{ width: "100%" }}
                />
              </div>

              {/* Horarios del médico ese día */}
              {bloqueoForm.fecha && (
                <div style={{ background: "var(--bg-muted)", borderRadius: "var(--radius-md)", padding: "1rem" }}>
                  <p style={{ margin: "0 0 0.6rem", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                    Horario asignado para esa fecha
                  </p>
                  {slotsLoading ? (
                    <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>Cargando horarios…</p>
                  ) : slotsDoctor.length === 0 ? (
                    <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>El médico no tiene horarios asignados para esta fecha.</p>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                      {slotsDoctor.map(h => (
                        <span key={h} style={{
                          padding: "0.2rem 0.6rem", borderRadius: "9999px", fontSize: "0.78rem",
                          background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)",
                        }}>{h}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tipo de bloqueo */}
              <div>
                <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.85rem", fontWeight: 600 }}>Tipo de bloqueo *</label>
                <div style={{ display: "flex", gap: "1.25rem" }}>
                  {(["DIA_COMPLETO", "RANGO_HORAS"] as const).map(t => (
                    <label key={t} style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", fontSize: "0.85rem" }}>
                      <input type="radio" name="tipoDia" value={t}
                        checked={bloqueoForm.tipoDia === t}
                        onChange={() => setBloqueoForm(f => ({ ...f, tipoDia: t, horaInicio: "", horaFin: "" }))}
                      />
                      {t === "DIA_COMPLETO" ? "Día completo" : "Rango de horas"}
                    </label>
                  ))}
                </div>
              </div>

              {/* Selectores hora inicio / fin */}
              {bloqueoForm.tipoDia === "RANGO_HORAS" && slotsDoctor.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.82rem", fontWeight: 600 }}>Hora inicio *</label>
                    <select value={bloqueoForm.horaInicio}
                      onChange={e => setBloqueoForm(f => ({ ...f, horaInicio: e.target.value, horaFin: "" }))}
                      className="lista-search-input" style={{ width: "100%" }}>
                      <option value="">Seleccionar</option>
                      {slotsDoctor.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.82rem", fontWeight: 600 }}>Hora fin *</label>
                    <select value={bloqueoForm.horaFin}
                      onChange={e => setBloqueoForm(f => ({ ...f, horaFin: e.target.value }))}
                      className="lista-search-input" style={{ width: "100%" }}
                      disabled={!bloqueoForm.horaInicio}>
                      <option value="">Seleccionar</option>
                      {slotsDoctor.filter(h => h > bloqueoForm.horaInicio).map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* Motivo */}
              <div>
                <label style={{ display: "block", marginBottom: "0.3rem", fontSize: "0.85rem", fontWeight: 600 }}>Motivo *</label>
                <select value={bloqueoForm.motivo}
                  onChange={(e) => setBloqueoForm(f => ({ ...f, motivo: e.target.value }))}
                  className="lista-search-input" style={{ width: "100%" }}>
                  <option value="No asistió">No asistió</option>
                  <option value="Permiso médico">Permiso médico</option>
                  <option value="Capacitación">Capacitación</option>
                  <option value="Almuerzo">Almuerzo</option>
                  <option value="Imprevisto">Imprevisto</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              {/* Descripción */}
              <div>
                <label style={{ display: "block", marginBottom: "0.3rem", fontSize: "0.85rem", fontWeight: 600 }}>Descripción (opcional)</label>
                <input type="text" value={bloqueoForm.descripcion}
                  onChange={(e) => setBloqueoForm(f => ({ ...f, descripcion: e.target.value }))}
                  placeholder="Detalle adicional..."
                  className="lista-search-input" style={{ width: "100%" }}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowBloqueoModal(false)}>Cancelar</button>
              <button type="button" className="btn btn-primary" onClick={handleCrearBloqueo}
                disabled={bloqueoLoading || !bloqueoForm.fecha || !bloqueoForm.motivo ||
                  (bloqueoForm.tipoDia === "RANGO_HORAS" && (!bloqueoForm.horaInicio || !bloqueoForm.horaFin))}>
                <Lock size={14} /> {bloqueoLoading ? "Guardando..." : "Confirmar bloqueo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {doctorCV && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDoctorCV(null);
          }}
        >
          <div className="modal-card-cv">
            <div className="modal-cv-header">
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <FileText size={20} />
                <h3>
                  CV de {doctorCV.nombres} {doctorCV.apellidos}
                </h3>
              </div>
              <button
                type="button"
                className="modal-cv-close"
                onClick={() => setDoctorCV(null)}
              >
                <X size={16} />
              </button>
            </div>
            {cvUrlSeleccionado ? (
              <iframe
                src={cvUrlSeleccionado}
                title="CV Medico"
                className="modal-cv-iframe"
                style={{ minHeight: "500px" }}
              />
            ) : (
              <p className="sin-resultados">
                No se encontro un archivo de CV para este medico.
              </p>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDoctorCV(null)}
              >
                Cerrar
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleUploadClick(doctorCV.id)}
                disabled={!esAdmin}
                style={!esAdmin ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
              >
                <Upload size={15} /> Cambiar CV
              </button>
              {cvUrlSeleccionado && (
                <a
                  href={cvUrlSeleccionado}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  <ExternalLink size={15} /> Abrir en nueva pestana
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListaMedicos;
