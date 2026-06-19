import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays, Ban, Clock, Trash2, Plus, Save, Stethoscope, AlertCircle, CalendarX2,
} from "lucide-react";
import { DoctorApiService, type DoctorTransformado } from "../../services/doctor.service";
import { BloqueoService, type Bloqueo } from "../../services/bloqueo.service";
import { HorarioMensualService, type HorarioMensual } from "../../services/horarioMensual.service";
import "./GestionHorarios.css";

// Motivos permitidos por el modelo BloqueoHorario.
const MOTIVOS = ["No asistió", "Permiso médico", "Capacitación", "Otro"];

// 0 = Domingo … 6 = Sábado (orden de presentación de Lun a Dom).
const DIAS: { v: number; l: string }[] = [
  { v: 1, l: "Lun" }, { v: 2, l: "Mar" }, { v: 3, l: "Mié" },
  { v: 4, l: "Jue" }, { v: 5, l: "Vie" }, { v: 6, l: "Sáb" }, { v: 0, l: "Dom" },
];

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const hoyISO = () => new Date().toISOString().slice(0, 10);

const fmtFecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });

const GestionHorarios = () => {
  const [doctores, setDoctores] = useState<DoctorTransformado[]>([]);
  const [doctorId, setDoctorId] = useState("");
  const [notif, setNotif] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // ── Bloqueos ──
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);
  const [bFecha, setBFecha] = useState("");
  const [bDiaCompleto, setBDiaCompleto] = useState(true);
  const [bHoraInicio, setBHoraInicio] = useState("");
  const [bHoraFin, setBHoraFin] = useState("");
  const [bMotivo, setBMotivo] = useState(MOTIVOS[0]);
  const [bDescripcion, setBDescripcion] = useState("");
  const [bLoading, setBLoading] = useState(false);

  // ── Horario mensual ──
  const [hmMes, setHmMes] = useState(() => new Date().getMonth() + 1);
  const [hmAnio, setHmAnio] = useState(() => new Date().getFullYear());
  const [hmDias, setHmDias] = useState<number[]>([]);
  const [hmInicio, setHmInicio] = useState("08:00");
  const [hmFin, setHmFin] = useState("13:00");
  const [hmGuardado, setHmGuardado] = useState<HorarioMensual | null>(null);
  const [hmLoading, setHmLoading] = useState(false);

  const showNotif = (msg: string, type: "success" | "error") => {
    setNotif({ msg, type });
    setTimeout(() => setNotif(null), 3500);
  };

  // Cargar doctores al montar
  useEffect(() => {
    DoctorApiService.listar()
      .then(setDoctores)
      .catch(() => showNotif("Error al cargar doctores.", "error"));
  }, []);

  // Bloqueos del doctor seleccionado
  const cargarBloqueos = useCallback(async () => {
    if (!doctorId) { setBloqueos([]); return; }
    try {
      setBloqueos(await BloqueoService.listar({ doctorId }));
    } catch {
      showNotif("Error al cargar los bloqueos.", "error");
    }
  }, [doctorId]);

  useEffect(() => { cargarBloqueos(); }, [cargarBloqueos]);

  // Horario mensual del doctor para el mes/año seleccionados
  const cargarHorarioMensual = useCallback(async () => {
    if (!doctorId) { setHmGuardado(null); return; }
    try {
      const h = await HorarioMensualService.obtener(doctorId, hmMes, hmAnio);
      setHmGuardado(h);
      if (h) {
        setHmDias(h.diasSemana);
        setHmInicio(h.horaInicio);
        setHmFin(h.horaFin);
      } else {
        setHmDias([]);
      }
    } catch {
      showNotif("Error al cargar el horario mensual.", "error");
    }
  }, [doctorId, hmMes, hmAnio]);

  useEffect(() => { cargarHorarioMensual(); }, [cargarHorarioMensual]);

  // ── Crear bloqueo ──
  const crearBloqueo = async () => {
    if (!doctorId) return showNotif("Selecciona un médico primero.", "error");
    if (!bFecha) return showNotif("Selecciona una fecha.", "error");
    if (!bDiaCompleto) {
      if (!bHoraInicio || !bHoraFin) return showNotif("Indica la hora de inicio y fin de la franja.", "error");
      if (bHoraInicio >= bHoraFin) return showNotif("La hora de inicio debe ser anterior a la de fin.", "error");
    }
    setBLoading(true);
    try {
      await BloqueoService.crear({
        doctorId,
        fecha: bFecha,
        esDiaCompleto: bDiaCompleto,
        horaInicio: bDiaCompleto ? undefined : bHoraInicio,
        horaFin: bDiaCompleto ? undefined : bHoraFin,
        motivo: bMotivo,
        descripcion: bDescripcion.trim() || undefined,
      });
      showNotif("Bloqueo creado.", "success");
      setBFecha(""); setBHoraInicio(""); setBHoraFin(""); setBDescripcion("");
      await cargarBloqueos();
    } catch (err) {
      showNotif(err instanceof Error ? err.message : "Error al crear el bloqueo.", "error");
    } finally {
      setBLoading(false);
    }
  };

  const eliminarBloqueo = async (id: string) => {
    try {
      await BloqueoService.desactivar(id);
      showNotif("Bloqueo eliminado.", "success");
      await cargarBloqueos();
    } catch (err) {
      showNotif(err instanceof Error ? err.message : "Error al eliminar.", "error");
    }
  };

  // ── Guardar horario mensual ──
  const toggleDia = (d: number) =>
    setHmDias((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));

  const guardarHorario = async () => {
    if (!doctorId) return showNotif("Selecciona un médico primero.", "error");
    if (hmDias.length === 0) return showNotif("Selecciona al menos un día de la semana.", "error");
    if (!hmInicio || !hmFin) return showNotif("Indica la hora de inicio y fin.", "error");
    if (hmInicio >= hmFin) return showNotif("La hora de inicio debe ser anterior a la de fin.", "error");
    setHmLoading(true);
    try {
      const h = await HorarioMensualService.guardar({
        medicoId: doctorId, mes: hmMes, anio: hmAnio, diasSemana: hmDias, horaInicio: hmInicio, horaFin: hmFin,
      });
      setHmGuardado(h);
      showNotif("Horario del mes guardado.", "success");
    } catch (err) {
      showNotif(err instanceof Error ? err.message : "Error al guardar el horario.", "error");
    } finally {
      setHmLoading(false);
    }
  };

  const anios = [hmAnio - 1, hmAnio, hmAnio + 1, hmAnio + 2].filter((a, i, arr) => arr.indexOf(a) === i);
  const nombreDoctor = doctores.find((d) => d.id === doctorId);

  return (
    <div className="lista-page">
      {notif && <div className={`notification ${notif.type}`}>{notif.msg}</div>}

      {/* Header */}
      <div className="lista-page-header">
        <div>
          <h1>Horarios de Médicos</h1>
          <p className="lista-page-subtitle">Bloqueos de agenda y horario mensual de atención</p>
        </div>
      </div>

      {/* Selector de médico (compartido) */}
      <div className="gh-doctor-bar">
        <Stethoscope size={18} className="gh-doctor-icon" />
        <select className="pm-select" value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
          <option value="">Selecciona un médico…</option>
          {doctores.map((d) => (
            <option key={d.id} value={d.id}>{d.nombres} {d.apellidos} — {d.especialidad}</option>
          ))}
        </select>
      </div>

      {!doctorId ? (
        <div className="gh-empty">
          <CalendarDays size={34} />
          <p>Selecciona un médico para gestionar sus bloqueos y horario mensual.</p>
        </div>
      ) : (
        <div className="gh-grid">
          {/* ───── Bloqueos ───── */}
          <section className="gh-card">
            <div className="gh-card-head">
              <Ban size={16} /> <h2>Bloqueo de horarios</h2>
            </div>

            <div className="gh-form">
              <div className="pm-field">
                <label className="pm-label">Fecha <span className="pm-req">*</span></label>
                <input type="date" className="pm-input" min={hoyISO()} value={bFecha}
                  onChange={(e) => setBFecha(e.target.value)} disabled={bLoading} />
              </div>

              <label className="gh-check">
                <input type="checkbox" checked={bDiaCompleto} onChange={(e) => setBDiaCompleto(e.target.checked)} disabled={bLoading} />
                <span>Bloquear día completo</span>
              </label>

              {!bDiaCompleto && (
                <div className="pm-row">
                  <div className="pm-field">
                    <label className="pm-label">Hora inicio <span className="pm-req">*</span></label>
                    <input type="time" className="pm-input" value={bHoraInicio} onChange={(e) => setBHoraInicio(e.target.value)} disabled={bLoading} />
                  </div>
                  <div className="pm-field">
                    <label className="pm-label">Hora fin <span className="pm-req">*</span></label>
                    <input type="time" className="pm-input" value={bHoraFin} onChange={(e) => setBHoraFin(e.target.value)} disabled={bLoading} />
                  </div>
                </div>
              )}

              <div className="pm-field">
                <label className="pm-label">Motivo <span className="pm-req">*</span></label>
                <select className="pm-select" value={bMotivo} onChange={(e) => setBMotivo(e.target.value)} disabled={bLoading}>
                  {MOTIVOS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div className="pm-field">
                <label className="pm-label">Descripción (opcional)</label>
                <input className="pm-input" value={bDescripcion} onChange={(e) => setBDescripcion(e.target.value)} placeholder="Detalle del bloqueo" disabled={bLoading} />
              </div>

              <button className="pm-btn pm-btn--primary gh-btn-full" onClick={crearBloqueo} disabled={bLoading}>
                {bLoading ? <><span className="pm-spinner-sm" /> Creando…</> : <><Plus size={14} /> Crear bloqueo</>}
              </button>
            </div>

            {/* Lista de bloqueos activos */}
            <div className="gh-list">
              <h3 className="gh-list-title">Bloqueos activos</h3>
              {bloqueos.length === 0 ? (
                <p className="gh-list-empty"><CalendarX2 size={16} /> Sin bloqueos activos.</p>
              ) : (
                <table className="modern-table gh-table">
                  <thead>
                    <tr><th>Fecha</th><th>Horario</th><th>Motivo</th><th style={{ width: 50 }} /></tr>
                  </thead>
                  <tbody>
                    {bloqueos.map((b) => (
                      <tr key={b._id}>
                        <td>{fmtFecha(b.fecha)}</td>
                        <td>
                          {b.esDiaCompleto === false && b.horaInicio
                            ? <span className="gh-tag gh-tag--franja"><Clock size={11} /> {b.horaInicio}–{b.horaFin}</span>
                            : <span className="gh-tag gh-tag--dia">Día completo</span>}
                        </td>
                        <td>{b.motivo}</td>
                        <td className="td-center">
                          <button className="btn-action btn-action--danger" title="Eliminar bloqueo" onClick={() => eliminarBloqueo(b._id)}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* ───── Horario mensual ───── */}
          <section className="gh-card">
            <div className="gh-card-head">
              <CalendarDays size={16} /> <h2>Horario mensual</h2>
            </div>

            <div className="gh-form">
              <div className="pm-row">
                <div className="pm-field">
                  <label className="pm-label">Mes <span className="pm-req">*</span></label>
                  <select className="pm-select" value={hmMes} onChange={(e) => setHmMes(Number(e.target.value))} disabled={hmLoading}>
                    {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div className="pm-field">
                  <label className="pm-label">Año <span className="pm-req">*</span></label>
                  <select className="pm-select" value={hmAnio} onChange={(e) => setHmAnio(Number(e.target.value))} disabled={hmLoading}>
                    {anios.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              <div className="pm-field">
                <label className="pm-label">Días de atención <span className="pm-req">*</span></label>
                <div className="gh-dias">
                  {DIAS.map((d) => (
                    <button
                      type="button"
                      key={d.v}
                      className={`gh-dia ${hmDias.includes(d.v) ? "gh-dia--on" : ""}`}
                      onClick={() => toggleDia(d.v)}
                      disabled={hmLoading}
                    >
                      {d.l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pm-row">
                <div className="pm-field">
                  <label className="pm-label">Hora inicio <span className="pm-req">*</span></label>
                  <input type="time" className="pm-input" value={hmInicio} onChange={(e) => setHmInicio(e.target.value)} disabled={hmLoading} />
                </div>
                <div className="pm-field">
                  <label className="pm-label">Hora fin <span className="pm-req">*</span></label>
                  <input type="time" className="pm-input" value={hmFin} onChange={(e) => setHmFin(e.target.value)} disabled={hmLoading} />
                </div>
              </div>

              <button className="pm-btn pm-btn--primary gh-btn-full" onClick={guardarHorario} disabled={hmLoading}>
                {hmLoading ? <><span className="pm-spinner-sm" /> Guardando…</> : <><Save size={14} /> Guardar horario del mes</>}
              </button>
            </div>

            {/* Resumen del horario guardado */}
            <div className="gh-list">
              <h3 className="gh-list-title">Horario guardado</h3>
              {hmGuardado ? (
                <div className="gh-summary">
                  <div className="gh-summary-row">
                    <span className="gh-summary-label">Periodo</span>
                    <span>{MESES[hmGuardado.mes - 1]} {hmGuardado.anio}</span>
                  </div>
                  <div className="gh-summary-row">
                    <span className="gh-summary-label">Días</span>
                    <span>{hmGuardado.diasSemana.slice().sort((a, b) => a - b).map((d) => DIAS.find((x) => x.v === d)?.l).join(", ")}</span>
                  </div>
                  <div className="gh-summary-row">
                    <span className="gh-summary-label">Horario</span>
                    <span><Clock size={12} /> {hmGuardado.horaInicio} – {hmGuardado.horaFin}</span>
                  </div>
                </div>
              ) : (
                <p className="gh-list-empty">
                  <AlertCircle size={16} /> {nombreDoctor ? "Sin horario definido para este mes." : ""}
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default GestionHorarios;
