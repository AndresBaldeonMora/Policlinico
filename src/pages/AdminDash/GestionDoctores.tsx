import { useEffect, useReducer, useState } from "react";
import { Search, Plus, Pencil, Trash2, Stethoscope, X, AlertCircle, Check, CalendarOff, User, Mail, Phone, Hash, DoorOpen, Clock3, FileText } from "lucide-react";
import { DoctorApiService, type DoctorTransformado } from "../../services/doctor.service";
import { EspecialidadApiService, type Especialidad } from "../../services/especialidad.service";
import { BloqueoService, type Bloqueo } from "../../services/bloqueo.service";
import "./GestionarDoctores.css";

// ─── Tipos ───────────────────────────────────────────────
interface NotificationState {
  message: string;
  type: "success" | "error" | "";
  visible: boolean;
}

interface FormFields {
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string;
  especialidadId: string;
  cmp: string;
  descripcion: string;
  consultorio: string;
  turno: string;
}

interface ModalState {
  abierto: boolean;
  doctor: DoctorTransformado | null;
  campos: FormFields;
  loading: boolean;
  error: string;
}

type ModalAction =
  | { type: "ABRIR_NUEVO" }
  | { type: "ABRIR_EDITAR"; doctor: DoctorTransformado }
  | { type: "CERRAR" }
  | { type: "SET_CAMPO"; field: keyof FormFields; value: string }
  | { type: "SET_LOADING"; value: boolean }
  | { type: "SET_ERROR"; message: string };

const camposVacios: FormFields = {
  nombres: "", apellidos: "", correo: "", telefono: "", especialidadId: "", cmp: "",
  descripcion: "", consultorio: "", turno: "AMBOS",
};

function modalReducer(state: ModalState, action: ModalAction): ModalState {
  switch (action.type) {
    case "ABRIR_NUEVO":
      return { abierto: true, doctor: null, campos: camposVacios, loading: false, error: "" };
    case "ABRIR_EDITAR":
      return {
        abierto: true,
        doctor: action.doctor,
        campos: {
          nombres: action.doctor.nombres,
          apellidos: action.doctor.apellidos,
          correo: action.doctor.correo,
          telefono: action.doctor.telefono,
          especialidadId: action.doctor.especialidadId,
          cmp: action.doctor.cmp ?? "",
          descripcion: action.doctor.descripcion ?? "",
          consultorio: action.doctor.consultorio ? String(action.doctor.consultorio) : "",
          turno: action.doctor.turno ?? "AMBOS",
        },
        loading: false,
        error: "",
      };
    case "CERRAR":
      return { ...state, abierto: false, error: "" };
    case "SET_CAMPO":
      return { ...state, campos: { ...state.campos, [action.field]: action.value }, error: "" };
    case "SET_LOADING":
      return { ...state, loading: action.value };
    case "SET_ERROR":
      return { ...state, error: action.message, loading: false };
    default:
      return state;
  }
}

// ─── Componente principal ─────────────────────────────────
const GestionarDoctores = () => {
  const [doctores, setDoctores] = useState<DoctorTransformado[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationState>({ message: "", type: "", visible: false });
  const [errorDependencias, setErrorDependencias] = useState<any[] | null>(null);

  // ── Bloqueos ──────────────────────────────────────────────
  const [doctorBloqueo, setDoctorBloqueo] = useState<DoctorTransformado | null>(null);
  const [bloqueoFecha, setBloqueoFecha] = useState("");
  const [bloqueoNota, setBloqueoNota] = useState("");
  const [slotsDelDia, setSlotsDelDia] = useState<string[]>([]);
  const [bloqueosPorDia, setBloqueosPorDia] = useState<Bloqueo[]>([]);
  const [cargandoSlots, setCargandoSlots] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [bloqueoLoading, setBloqueoLoading] = useState(false);
  const [modal, dispatch] = useReducer(modalReducer, {
    abierto: false, doctor: null, campos: camposVacios, loading: false, error: "",
  });

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type, visible: true });
    setTimeout(() => setNotification((prev) => ({ ...prev, visible: false })), 3000);
  };

  const abrirBloqueos = (doctor: DoctorTransformado) => {
    setDoctorBloqueo(doctor);
    setBloqueoFecha("");
    setBloqueoNota("");
    setSlotsDelDia([]);
    setBloqueosPorDia([]);
  };

  const cargarSlotsYBloqueos = async (doctor: DoctorTransformado, fecha: string) => {
    if (!fecha) return;
    setCargandoSlots(true);
    try {
      const [slots, bloqueos] = await Promise.all([
        DoctorApiService.obtenerHorariosDia(doctor.id, fecha),
        BloqueoService.listar({ doctorId: doctor.id }),
      ]);
      setSlotsDelDia(slots);
      setBloqueosPorDia(bloqueos.filter(b => {
        const bf = new Date(b.fecha).toISOString().split("T")[0];
        return bf === fecha;
      }));
    } catch {
      setSlotsDelDia([]);
      setBloqueosPorDia([]);
    } finally { setCargandoSlots(false); }
  };

  const calcHoraFin = (hora: string, slots: string[]): string => {
    const idx = slots.indexOf(hora);
    if (idx >= 0 && idx < slots.length - 1) return slots[idx + 1];
    const [h, m] = hora.split(":").map(Number);
    const total = h * 60 + m + 30;
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  };

  const toggleSlot = async (hora: string) => {
    if (!doctorBloqueo || !bloqueoFecha || toggling) return;
    setToggling(hora);

    const bloqueoExistente = bloqueosPorDia.find(b =>
      b.tipoDia === "RANGO_HORAS" && b.horaInicio === hora
    );

    try {
      if (bloqueoExistente) {
        await BloqueoService.desactivar(bloqueoExistente._id);
      } else {
        await BloqueoService.crear({
          doctorId: doctorBloqueo.id,
          fecha: bloqueoFecha,
          motivo: "Bloqueado por administrador",
          descripcion: bloqueoNota || undefined,
          tipoDia: "RANGO_HORAS",
          horaInicio: hora,
          horaFin: calcHoraFin(hora, slotsDelDia),
        });
      }
      await cargarSlotsYBloqueos(doctorBloqueo, bloqueoFecha);
    } catch (err: any) {
      showNotification(err?.response?.data?.message || "Error al cambiar bloqueo.", "error");
    } finally { setToggling(null); }
  };

  const bloquearDiaCompleto = async () => {
    if (!doctorBloqueo || !bloqueoFecha || bloqueoLoading) return;
    const yaCompleto = bloqueosPorDia.some(b => b.tipoDia === "DIA_COMPLETO");
    setBloqueoLoading(true);
    try {
      if (yaCompleto) {
        const bc = bloqueosPorDia.find(b => b.tipoDia === "DIA_COMPLETO")!;
        await BloqueoService.desactivar(bc._id);
      } else {
        await BloqueoService.crear({
          doctorId: doctorBloqueo.id,
          fecha: bloqueoFecha,
          motivo: "Día bloqueado",
          descripcion: bloqueoNota || undefined,
          tipoDia: "DIA_COMPLETO",
        });
      }
      await cargarSlotsYBloqueos(doctorBloqueo, bloqueoFecha);
    } catch (err: any) {
      showNotification(err?.response?.data?.message || "Error.", "error");
    } finally { setBloqueoLoading(false); }
  };

  const cargar = async () => {
    try {
      setCargando(true);
      const [docs, esps] = await Promise.all([
        DoctorApiService.listar(),
        EspecialidadApiService.listar(),
      ]);
      setDoctores(docs);
      setEspecialidades(esps);
    } catch {
      showNotification("Error al cargar los datos.", "error");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const filtrados = doctores.filter((d) => {
    const q = busqueda.toLowerCase();
    return (
      `${d.nombres} ${d.apellidos}`.toLowerCase().includes(q) ||
      d.especialidad.toLowerCase().includes(q) ||
      (d.correo || "").toLowerCase().includes(q)
    );
  });

  // ── Validar ──
  const validar = (): string | null => {
    const { nombres, apellidos, correo, telefono, especialidadId } = modal.campos;
    if (!nombres.trim())       return "El nombre es obligatorio.";
    if (!apellidos.trim())     return "Los apellidos son obligatorios.";
    if (!correo.trim())        return "El correo es obligatorio.";
    if (!telefono.trim())      return "El teléfono es obligatorio.";
    if (!especialidadId)       return "Selecciona una especialidad.";
    return null;
  };

  // ── Guardar ──
  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validar();
    if (err) { dispatch({ type: "SET_ERROR", message: err }); return; }
    dispatch({ type: "SET_LOADING", value: true });
    try {
      const { nombres, apellidos, correo, telefono, especialidadId, cmp, descripcion, consultorio, turno } = modal.campos;
      const payload = {
        nombres: nombres.trim(), apellidos: apellidos.trim(),
        correo: correo.trim(), telefono: telefono.trim(),
        especialidadId, cmp: cmp.trim() || undefined,
        descripcion: descripcion.trim() || undefined,
        consultorio: consultorio ? Number(consultorio) : undefined,
        turno: turno || undefined,
      };

      if (modal.doctor) {
        const actualizado = await DoctorApiService.actualizar(modal.doctor.id, payload);
        setDoctores((prev) => prev.map((d) => (d.id === actualizado.id ? actualizado : d)));
        showNotification("Doctor actualizado correctamente.", "success");
      } else {
        const nuevo = await DoctorApiService.crear(payload as Required<typeof payload>);
        setDoctores((prev) => [nuevo, ...prev]);
        showNotification("Doctor registrado correctamente.", "success");
      }
      dispatch({ type: "CERRAR" });
    } catch (err) {
      dispatch({ type: "SET_ERROR", message: err instanceof Error ? err.message : "Error al guardar." });
    }
  };

  // ── Eliminar ──
  const handleEliminarConfirmado = async (id: string) => {
    setConfirmDelete(null);
    setEliminandoId(id);
    try {
      await DoctorApiService.eliminar(id);
      setDoctores((prev) => prev.filter((d) => d.id !== id));
      showNotification("Doctor eliminado.", "success");
    } catch (error: any)  {
      if (error.response?.status === 409 && error.response?.data?.dependencias) {
        setErrorDependencias(error.response.data.dependencias);
      } else {
        showNotification(error.response?.data?.message || "Error al eliminar el doctor.", "error");
      }
    } finally {
      setEliminandoId(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    dispatch({ type: "SET_CAMPO", field: e.target.name as keyof FormFields, value: e.target.value });
  };

  return (
    <div className="lista-page">
      {notification.visible && (
        <div className={`notification ${notification.type}`}>{notification.message}</div>
      )}

      {/* Header */}
      <div className="lista-page-header">
        <div>
          <h1>Doctores</h1>
          <p className="lista-page-subtitle">{doctores.length} doctores registrados</p>
        </div>
        <button className="btn-page-action" onClick={() => dispatch({ type: "ABRIR_NUEVO" })}>
          <Plus size={16} /> Nuevo Doctor
        </button>
      </div>

      {/* Buscador */}
      <div className="lista-search-bar">
        <Search size={18} className="lista-search-icon" />
        <input
          type="text"
          placeholder="Buscar por nombre, especialidad o correo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="lista-search-input"
        />
        {!cargando && busqueda && (
          <span className="lista-search-count">{filtrados.length} de {doctores.length}</span>
        )}
      </div>

      {/* Tabla */}
      {cargando ? (
        <div className="lista-loading">
          <div className="lista-loading-spinner" />
          <p>Cargando doctores…</p>
        </div>
      ) : (
        <div className="lista-table-card">
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Especialidad</th>
                  <th>Teléfono</th>
                  <th>Correo</th>
                  <th style={{ width: 80, textAlign: "center" }}>CMP</th>
                  <th style={{ width: 100, textAlign: "center" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.length > 0 ? (
                  filtrados.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <div className="td-person">
                          <div className="td-avatar">{d.nombres.charAt(0)}</div>
                          <div className="td-person-info">
                            <span className="td-person-name">{d.nombres} {d.apellidos}</span>
                            <span className="td-person-meta">{d.correo}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="gd-esp-badge">{d.especialidad}</span>
                      </td>
                      <td>{d.telefono || <span className="td-muted">--</span>}</td>
                      <td className="td-truncate">{d.correo || <span className="td-muted">--</span>}</td>
                      <td className="td-center">
                        {d.cmp
                          ? <span className="td-mono">{d.cmp}</span>
                          : <span className="td-muted">--</span>
                        }
                      </td>
                      <td className="td-center">
                        <div className="ge-actions">
                          <button
                            className="btn-action"
                            onClick={() => dispatch({ type: "ABRIR_EDITAR", doctor: d })}
                            title="Editar doctor"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className="btn-action btn-action--danger"
                            onClick={() => setConfirmDelete(d.id)}
                            disabled={eliminandoId === d.id}
                            title="Eliminar doctor"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="td-empty">
                      <Stethoscope size={32} className="td-empty-icon" />
                      <p>{busqueda ? "No se encontraron doctores." : "No hay doctores registrados."}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal crear / editar doctor */}
      {modal.abierto && (
        <div className="pm-overlay" onClick={(e) => { if (e.target === e.currentTarget) dispatch({ type: "CERRAR" }); }}>
          <div className="gd-modal">

            {/* Header */}
            <div className="gd-modal-header">
              <div className="gd-modal-header-left">
                <div className="gd-modal-avatar">
                  {modal.campos.nombres ? modal.campos.nombres.charAt(0).toUpperCase() : <Stethoscope size={18}/>}
                </div>
                <div>
                  <h2 className="gd-modal-titulo">{modal.doctor ? "Editar doctor" : "Registrar nuevo doctor"}</h2>
                  <p className="gd-modal-sub">
                    {modal.doctor
                      ? `Editando: ${modal.doctor.nombres} ${modal.doctor.apellidos}`
                      : "Completa los datos del profesional médico"}
                  </p>
                </div>
              </div>
              <button className="pm-close" onClick={() => dispatch({ type: "CERRAR" })} disabled={modal.loading}><X size={16}/></button>
            </div>

            {modal.error && (
              <div className="pm-error"><AlertCircle size={14}/> {modal.error}</div>
            )}

            <form onSubmit={handleGuardar} className="gd-modal-body">

              {/* ── Sección 1: Datos personales ── */}
              <div className="gd-form-section">
                <p className="gd-section-titulo"><User size={13}/> Datos personales</p>
                <div className="pm-row">
                  <div className="pm-field">
                    <label className="pm-label">Nombres <span className="pm-req">*</span></label>
                    <input className="pm-input" name="nombres" value={modal.campos.nombres}
                      onChange={handleChange} placeholder="Juan" disabled={modal.loading} autoFocus/>
                  </div>
                  <div className="pm-field">
                    <label className="pm-label">Apellidos <span className="pm-req">*</span></label>
                    <input className="pm-input" name="apellidos" value={modal.campos.apellidos}
                      onChange={handleChange} placeholder="Pérez García" disabled={modal.loading}/>
                  </div>
                </div>
              </div>

              {/* ── Sección 2: Contacto ── */}
              <div className="gd-form-section">
                <p className="gd-section-titulo"><Mail size={13}/> Contacto</p>
                <div className="pm-row">
                  <div className="pm-field">
                    <label className="pm-label">Correo institucional <span className="pm-req">*</span></label>
                    <input className="pm-input" type="email" name="correo" value={modal.campos.correo}
                      onChange={handleChange} placeholder="doctor@sanjose.com" disabled={modal.loading}/>
                  </div>
                  <div className="pm-field">
                    <label className="pm-label">Teléfono <span className="pm-req">*</span></label>
                    <input className="pm-input" name="telefono" value={modal.campos.telefono}
                      onChange={handleChange} placeholder="987654321" maxLength={9} disabled={modal.loading}/>
                  </div>
                </div>
              </div>

              {/* ── Sección 3: Datos profesionales ── */}
              <div className="gd-form-section">
                <p className="gd-section-titulo"><Stethoscope size={13}/> Datos profesionales</p>
                <div className="pm-row">
                  <div className="pm-field" style={{ flex: 2 }}>
                    <label className="pm-label">Especialidad <span className="pm-req">*</span></label>
                    <select className="pm-select" name="especialidadId" value={modal.campos.especialidadId}
                      onChange={handleChange} disabled={modal.loading}>
                      <option value="">Seleccionar especialidad</option>
                      {especialidades.map((esp) => (
                        <option key={esp.id} value={esp.id}>{esp.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div className="pm-field">
                    <label className="pm-label">CMP <span className="pm-label-optional">(opcional)</span></label>
                    <div className="gd-input-icon-wrap">
                      <Hash size={13} className="gd-input-icon"/>
                      <input className="pm-input gd-input-with-icon" name="cmp" value={modal.campos.cmp}
                        onChange={handleChange} placeholder="12345" maxLength={8} disabled={modal.loading}/>
                    </div>
                  </div>
                </div>

                <div className="pm-row">
                  <div className="pm-field">
                    <label className="pm-label">Consultorio <span className="pm-label-optional">(opcional)</span></label>
                    <div className="gd-input-icon-wrap">
                      <DoorOpen size={13} className="gd-input-icon"/>
                      <input className="pm-input gd-input-with-icon" type="number" name="consultorio"
                        value={modal.campos.consultorio} onChange={handleChange}
                        placeholder="Ej: 3" min={1} max={999} disabled={modal.loading}/>
                    </div>
                  </div>
                  <div className="pm-field">
                    <label className="pm-label">Turno de atención</label>
                    <div className="gd-turno-btns">
                      {[
                        { val: "MANANA",  label: "Mañana" },
                        { val: "TARDE",   label: "Tarde" },
                        { val: "AMBOS",   label: "Ambos" },
                      ].map(t => (
                        <button key={t.val} type="button"
                          className={`gd-turno-btn ${modal.campos.turno === t.val ? "gd-turno-btn--on" : ""}`}
                          onClick={() => dispatch({ type: "SET_CAMPO", field: "turno", value: t.val })}
                          disabled={modal.loading}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Sección 4: Perfil / Bio ── */}
              <div className="gd-form-section">
                <p className="gd-section-titulo"><FileText size={13}/> Perfil profesional <span className="pm-label-optional" style={{ fontWeight: 400, textTransform: "none" }}>(opcional)</span></p>
                <div className="pm-field">
                  <textarea className="pm-input gd-textarea" name="descripcion" rows={3}
                    value={modal.campos.descripcion} onChange={(e) => dispatch({ type: "SET_CAMPO", field: "descripcion", value: e.target.value })}
                    placeholder="Breve descripción del médico: experiencia, subespecialidades, enfoque clínico…"
                    disabled={modal.loading}/>
                  <span className="gd-char-count">{modal.campos.descripcion.length}/500</span>
                </div>
              </div>

              {/* Footer */}
              <div className="gd-modal-footer">
                <button type="button" className="pm-btn pm-btn--ghost" onClick={() => dispatch({ type: "CERRAR" })} disabled={modal.loading}>
                  Cancelar
                </button>
                <button type="submit" className="pm-btn pm-btn--primary" disabled={modal.loading || !modal.campos.nombres || !modal.campos.especialidadId}>
                  {modal.loading
                    ? <><span className="pm-spinner-sm"/> Guardando…</>
                    : <><Check size={14}/> {modal.doctor ? "Guardar cambios" : "Registrar doctor"}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de bloqueos de horario */}
      {doctorBloqueo && (() => {
        const diaBloqueadoCompleto = bloqueosPorDia.some(b => b.tipoDia === "DIA_COMPLETO");
        return (
          <div className="pm-overlay" onClick={(e) => { if (e.target === e.currentTarget) setDoctorBloqueo(null); }}>
            <div className="pm-modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
              <div className="pm-header">
                <div className="pm-header-info">
                  <div className="pm-header-icon" style={{ background: "rgba(245,158,11,0.12)", color: "#d97706" }}><CalendarOff size={16} /></div>
                  <div>
                    <h2>Bloquear horario — Dr. {doctorBloqueo.nombres} {doctorBloqueo.apellidos}</h2>
                    <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0 }}>{doctorBloqueo.especialidad}</p>
                  </div>
                </div>
                <button className="pm-close" onClick={() => setDoctorBloqueo(null)}><X size={16} /></button>
              </div>

              <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Selector de fecha */}
                <div className="pm-field">
                  <label className="pm-label">Fecha <span className="pm-req">*</span></label>
                  <input
                    type="date"
                    className="pm-input"
                    value={bloqueoFecha}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={e => {
                      const f = e.target.value;
                      setBloqueoFecha(f);
                      cargarSlotsYBloqueos(doctorBloqueo, f);
                    }}
                  />
                </div>

                {/* Grid de slots */}
                {bloqueoFecha && (
                  <div>
                    {cargandoSlots ? (
                      <div style={{ textAlign: "center", padding: "1.5rem 0", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                        <span className="pm-spinner-sm" style={{ display: "inline-block", marginRight: "0.5rem" }} />
                        Cargando horario…
                      </div>
                    ) : slotsDelDia.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "1.5rem 0", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                        Este doctor no tiene horario registrado para esa fecha.
                      </div>
                    ) : (
                      <>
                        {diaBloqueadoCompleto && (
                          <div style={{ marginBottom: "0.75rem", padding: "0.5rem 0.875rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "var(--radius-md)", fontSize: "0.82rem", color: "#dc2626", fontWeight: 600 }}>
                            Día completo bloqueado
                          </div>
                        )}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                          {slotsDelDia.map(hora => {
                            const bloqueado = diaBloqueadoCompleto || bloqueosPorDia.some(b =>
                              b.tipoDia === "RANGO_HORAS" && b.horaInicio === hora
                            );
                            const cargando = toggling === hora;
                            return (
                              <button
                                key={hora}
                                type="button"
                                disabled={!!toggling || bloqueoLoading}
                                onClick={() => toggleSlot(hora)}
                                style={{
                                  padding: "0.4rem 0.85rem",
                                  borderRadius: "var(--radius-md)",
                                  border: bloqueado ? "1.5px solid #ef4444" : "1.5px solid var(--border)",
                                  background: bloqueado ? "rgba(239,68,68,0.1)" : "var(--bg-card)",
                                  color: bloqueado ? "#dc2626" : "var(--text-primary)",
                                  fontWeight: 600,
                                  fontSize: "0.82rem",
                                  cursor: diaBloqueadoCompleto ? "default" : "pointer",
                                  opacity: (!!toggling && toggling !== hora) ? 0.5 : 1,
                                  transition: "all 0.15s",
                                  minWidth: 62,
                                }}
                              >
                                {cargando ? "…" : hora}
                              </button>
                            );
                          })}
                        </div>
                        <p style={{ margin: "0.5rem 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          Toca una hora para bloquear / desbloquear
                        </p>
                      </>
                    )}
                  </div>
                )}

                {/* Nota opcional */}
                {bloqueoFecha && slotsDelDia.length > 0 && (
                  <div className="pm-field">
                    <label className="pm-label">Nota <span className="pm-label-optional">(opcional)</span></label>
                    <input
                      className="pm-input"
                      placeholder="Ej: reunión, permiso médico…"
                      value={bloqueoNota}
                      onChange={e => setBloqueoNota(e.target.value)}
                    />
                  </div>
                )}

                {/* Bloquear / desbloquear día completo */}
                {bloqueoFecha && slotsDelDia.length > 0 && (
                  <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
                    <button
                      className="pm-btn pm-btn--primary"
                      onClick={bloquearDiaCompleto}
                      disabled={bloqueoLoading || !!toggling}
                      style={{ background: diaBloqueadoCompleto ? "#6b7280" : "#d97706" }}
                    >
                      {bloqueoLoading
                        ? <><span className="pm-spinner-sm" /> Guardando…</>
                        : <><CalendarOff size={14} /> {diaBloqueadoCompleto ? "Desbloquear día completo" : "Bloquear día completo"}</>}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/*Modal confirmar eliminación */}
      {confirmDelete && (
        <div className="pm-overlay" onClick={() => setConfirmDelete(null)}>
          <div
            className="pm-modal"
            style={{ maxWidth: 380 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pm-header">
              <div className="pm-header-info">
                <div className="pm-header-icon"><Trash2 size={16} /></div>
                <div><h2>¿Eliminar doctor?</h2></div>
              </div>
              <button className="pm-close" aria-label="Cerrar" onClick={() => setConfirmDelete(null)}><X size={16} /></button>
            </div>
            <p style={{ padding: "0 1.25rem 1rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
              Esta acción no se puede deshacer.
            </p>
            <div className="pm-footer">
              <div />
              <div className="pm-footer-actions">
                <button
                  className="pm-btn pm-btn--ghost"
                  onClick={() => setConfirmDelete(null)}
                >
                  <X size={14} /> Cancelar
                </button>
                <button
                  className="pm-btn pm-btn--danger"
                  onClick={() => handleEliminarConfirmado(confirmDelete)}
                >
                  <Trash2 size={14} /> Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de dependencias (error 409) */}
      {errorDependencias && (
        <div className="pm-overlay" onClick={() => setErrorDependencias(null)}>
          <div
            className="pm-modal"
            style={{ maxWidth: 480 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pm-header">
              <div className="pm-header-info">
                <div className="pm-header-icon" style={{ backgroundColor: "var(--danger-light)", color: "var(--danger)" }}>
                  <AlertCircle size={16} />
                </div>
                <div><h2>No se puede eliminar el doctor</h2></div>
              </div>
              <button className="pm-close" aria-label="Cerrar" onClick={() => setErrorDependencias(null)}>
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: "0 1.25rem 1rem" }}>
              <p style={{ marginBottom: "0.75rem", color: "var(--text-secondary)" }}>
                El doctor tiene las siguientes dependencias activas:
              </p>
              <ul style={{ paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {errorDependencias.map((dep, idx) => (
                  <li key={idx} style={{ fontSize: "0.875rem" }}>
                    <span style={{ color: "var(--danger)" }}>•</span> {dep.mensaje}
                  </li>
                ))}
              </ul>
            </div>
            <div className="pm-footer">
              <div />
              <div className="pm-footer-actions">
                <button
                  className="pm-btn pm-btn--primary"
                  onClick={() => setErrorDependencias(null)}
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionarDoctores;