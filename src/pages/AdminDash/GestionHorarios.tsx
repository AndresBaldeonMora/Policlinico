import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar, ChevronLeft, ChevronRight, Clock, Lock, Unlock,
  Trash2, AlertCircle, CheckCircle2, X, CalendarOff,
  Info, Loader2, RefreshCw, Search, Filter, Zap, Save,
} from "lucide-react";
import { DoctorApiService, type DoctorTransformado } from "../../services/doctor.service";
import { HorarioService, type SlotDia } from "../../services/horario.service";
import { BloqueoService, type Bloqueo } from "../../services/bloqueo.service";
import { toastExito, toastError } from "../../utils/toast";
import "./GestionHorarios.css";

// ─── Constantes ───────────────────────────────────────────────────────────────
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIAS_SEMANA_CORTO = ["Lu","Ma","Mi","Ju","Vi","Sá","Do"];
const MOTIVOS_BLOQUEO = ["Permiso médico","Capacitación","Almuerzo","Imprevisto","No asistió","Otro"] as const;

// 08:00 – 22:00 cada 30 min → 28 slots
function generarSlots(): string[] {
  const slots: string[] = [];
  for (let h = 8; h < 22; h++) {
    slots.push(`${String(h).padStart(2,"0")}:00`);
    slots.push(`${String(h).padStart(2,"0")}:30`);
  }
  return slots; // 08:00 … 21:30
}
const TODOS_SLOTS = generarSlots();
const SLOTS_MANANA = TODOS_SLOTS.slice(0, 14);   // 08:00–14:30
const SLOTS_TARDE  = TODOS_SLOTS.slice(14);        // 15:00–21:30

type TabActiva = "horario" | "bloqueos";

function isoFecha(anio: number, mes: number, dia: number): string {
  return `${anio}-${String(mes).padStart(2,"0")}-${String(dia).padStart(2,"0")}`;
}
function fechaUTC(iso: string): string { return `${iso}T00:00:00.000Z`; }
function diasEnMes(anio: number, mes: number): number { return new Date(anio, mes, 0).getDate(); }
function diaSemana(anio: number, mes: number, dia: number): number {
  const d = new Date(Date.UTC(anio, mes - 1, dia)).getDay();
  return d === 0 ? 6 : d - 1; // 0=Lu…6=Do
}
function diasHabilesDeMes(anio: number, mes: number): string[] {
  const total = diasEnMes(anio, mes);
  const dias: string[] = [];
  for (let d = 1; d <= total; d++) {
    if (diaSemana(anio, mes, d) < 6) // excluir domingos (6)
      dias.push(isoFecha(anio, mes, d));
  }
  return dias;
}

// ─── Componente ───────────────────────────────────────────────────────────────
export default function GestionHorarios() {
  const [doctores, setDoctores] = useState<DoctorTransformado[]>([]);
  const [doctorSelec, setDoctorSelec] = useState<DoctorTransformado | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEsp, setFiltroEsp] = useState("Todas");
  const [tab, setTab] = useState<TabActiva>("horario");

  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes]   = useState(hoy.getMonth() + 1);

  // ── Horario mensual ──
  const [slotsMes, setSlotsMes] = useState<Record<string, SlotDia>>({});
  const [cargandoSlots, setCargandoSlots] = useState(false);
  const [horasSelec, setHorasSelec] = useState<Set<string>>(new Set());
  const [aplicando, setAplicando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  // ── Bloqueos ──
  const [bloqueosMes, setBloqueosMes] = useState<Bloqueo[]>([]);
  const [cargandoBloqueos, setCargandoBloqueos] = useState(false);
  const [diaBloqueo, setDiaBloqueo] = useState<string | null>(null);
  const [slotsDelDia, setSlotsDelDia] = useState<string[]>([]);
  const [bloqueosDia, setBloqueosDia] = useState<Bloqueo[]>([]);
  const [motivoSelec, setMotivoSelec] = useState<string>(MOTIVOS_BLOQUEO[0]);
  const [descBloqueo, setDescBloqueo] = useState("");
  const [guardandoBloqueo, setGuardandoBloqueo] = useState(false);
  const [slotsBloqueandose, setSlotsBloqueandose] = useState<Set<string>>(new Set());

  useEffect(() => { DoctorApiService.listar().then(setDoctores).catch(() => {}); }, []);

  const cargarSlots = useCallback(async () => {
    if (!doctorSelec) return;
    setCargandoSlots(true);
    try {
      const data = await HorarioService.slotsPorMes(doctorSelec.id, mes, anio);
      setSlotsMes(data);
      // Inferir horario actual: las horas que aparecen en la mayoría de días
      const conteo: Record<string, number> = {};
      for (const dia of Object.values(data)) {
        for (const h of dia.horas) conteo[h] = (conteo[h] ?? 0) + 1;
      }
      const totalDias = Object.keys(data).length;
      if (totalDias > 0) {
        const frecuentes = Object.entries(conteo)
          .filter(([, n]) => n >= Math.ceil(totalDias * 0.5))
          .map(([h]) => h);
        setHorasSelec(new Set(frecuentes));
      } else {
        setHorasSelec(new Set());
      }
    } catch { /* sin horarios previos — plantilla vacía */ }
    finally { setCargandoSlots(false); }
  }, [doctorSelec, mes, anio]);

  const cargarBloqueos = useCallback(async () => {
    if (!doctorSelec) return;
    setCargandoBloqueos(true);
    try {
      const data = await BloqueoService.listar({ doctorId: doctorSelec.id, mes, anio });
      setBloqueosMes(data);
    } catch { toastError("Error al cargar bloqueos"); }
    finally { setCargandoBloqueos(false); }
  }, [doctorSelec, mes, anio]);

  useEffect(() => { cargarSlots(); }, [cargarSlots]);
  useEffect(() => { if (tab === "bloqueos") cargarBloqueos(); }, [cargarBloqueos, tab]);

  function navMes(dir: 1 | -1) {
    setDiaBloqueo(null); setConfirmando(false);
    if (dir === 1) { if (mes === 12) { setMes(1); setAnio(a => a+1); } else setMes(m => m+1); }
    else           { if (mes === 1)  { setMes(12); setAnio(a => a-1); } else setMes(m => m-1); }
  }

  const hoyISO = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,"0")}-${String(hoy.getDate()).padStart(2,"0")}`;

  // ── Estadísticas del mes ──
  const statsMes = useMemo(() => {
    const dias = Object.keys(slotsMes).length;
    const total = Object.values(slotsMes).reduce((a, b) => a + b.total, 0);
    const reservados = Object.values(slotsMes).reduce((a, b) => a + b.reservados, 0);
    return { dias, total, reservados };
  }, [slotsMes]);

  const diasHabiles = useMemo(() => diasHabilesDeMes(anio, mes), [anio, mes]);

  // ══════════════════════════════════════════════════════════════════════════════
  // APLICAR HORARIO AL MES
  // ══════════════════════════════════════════════════════════════════════════════
  async function aplicarMes() {
    if (!doctorSelec || horasSelec.size === 0) return;
    setAplicando(true);
    try {
      let creados = 0;
      const horas = [...horasSelec].sort();
      for (const iso of diasHabiles) {
        const r = await HorarioService.crearBulk(doctorSelec.id, fechaUTC(iso), horas);
        creados += r.creados;
      }
      toastExito(`Horario aplicado: ${creados} slot(s) nuevos en ${diasHabiles.length} días hábiles`);
      setConfirmando(false);
      await cargarSlots();
    } catch (e: any) {
      toastError(e?.response?.data?.message ?? "Error al aplicar horario");
    } finally { setAplicando(false); }
  }

  async function _limpiarMes_unused() {
    if (!doctorSelec) return;
    setAplicando(true);
    try {
      let eliminados = 0;
      for (const iso of diasHabiles) {
        const r = await HorarioService.eliminarBulk(doctorSelec.id, fechaUTC(iso));
        eliminados += r.eliminados;
      }
      toastExito(`${eliminados} slot(s) libres eliminados del mes`);
      setConfirmando(false);
      await cargarSlots();
    } catch { toastError("Error al limpiar mes"); }
    finally { setAplicando(false); }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // TAB BLOQUEOS
  // ══════════════════════════════════════════════════════════════════════════════
  const offset = useMemo(() => diaSemana(anio, mes, 1), [anio, mes]);
  const totalDias = useMemo(() => diasEnMes(anio, mes), [anio, mes]);
  const diasConBloqueo = useMemo(() => {
    const s = new Set<string>();
    for (const b of bloqueosMes) s.add(b.fecha.slice(0,10));
    return s;
  }, [bloqueosMes]);

  async function abrirDiaBloqueo(iso: string) {
    if (!doctorSelec) return;
    setDiaBloqueo(iso);
    setMotivoSelec(MOTIVOS_BLOQUEO[0]);
    setDescBloqueo("");

    // Slots reales del doctor ese día
    const horasDia = slotsMes[iso]?.horas ?? [];
    // Si es hoy, filtrar los que ya pasaron
    const ahoraMin = hoy.getHours() * 60 + hoy.getMinutes();
    const filtradas = horasDia.filter(h => {
      if (iso !== hoyISO) return true;
      const [hh, mm] = h.split(":").map(Number);
      return hh * 60 + mm > ahoraMin;
    });
    setSlotsDelDia([...filtradas].sort());

    try {
      const bloqueos = await BloqueoService.listar({ doctorId: doctorSelec.id });
      setBloqueosDia(bloqueos.filter(b => b.fecha.slice(0,10) === iso));
    } catch { toastError("Error al cargar bloqueos del día"); }
  }

  function slotEstaBloqueado(hora: string): Bloqueo | null {
    for (const b of bloqueosDia) {
      if (b.tipoDia === "DIA_COMPLETO") return b;
      if (b.tipoDia === "RANGO_HORAS" && b.horaInicio && b.horaFin)
        if (hora >= b.horaInicio && hora < b.horaFin) return b;
    }
    return null;
  }

  const diaBloqueadoCompleto = useMemo(() =>
    bloqueosDia.find(b => b.tipoDia === "DIA_COMPLETO") ?? null, [bloqueosDia]);

  async function toggleBloqueoSlot(hora: string) {
    if (!doctorSelec || !diaBloqueo) return;
    const bloq = slotEstaBloqueado(hora);
    if (bloq) {
      setSlotsBloqueandose(p => new Set([...p, hora]));
      try {
        await BloqueoService.desactivar(bloq._id);
        setBloqueosDia(prev => prev.filter(b => b._id !== bloq._id));
        toastExito("Slot desbloqueado");
      } catch { toastError("Error al desbloquear"); }
      finally { setSlotsBloqueandose(p => { const n=new Set(p); n.delete(hora); return n; }); }
    } else {
      setSlotsBloqueandose(p => new Set([...p, hora]));
      try {
        const nuevo = await BloqueoService.crear({
          doctorId: doctorSelec.id, fecha: diaBloqueo,
          tipoDia: "RANGO_HORAS", horaInicio: hora, horaFin: sumarMedia(hora),
          motivo: motivoSelec, descripcion: descBloqueo || undefined,
        });
        setBloqueosDia(prev => [...prev, nuevo]);
        toastExito(`Slot ${hora} bloqueado`);
      } catch (e: any) { toastError(e?.response?.data?.message ?? "Error al bloquear"); }
      finally { setSlotsBloqueandose(p => { const n=new Set(p); n.delete(hora); return n; }); }
    }
  }

  async function toggleDiaCompleto() {
    if (!doctorSelec || !diaBloqueo) return;
    setGuardandoBloqueo(true);
    try {
      if (diaBloqueadoCompleto) {
        await BloqueoService.desactivar(diaBloqueadoCompleto._id);
        setBloqueosDia(prev => prev.filter(b => b._id !== diaBloqueadoCompleto._id));
        toastExito("Día desbloqueado");
      } else {
        const nuevo = await BloqueoService.crear({
          doctorId: doctorSelec.id, fecha: diaBloqueo, tipoDia: "DIA_COMPLETO",
          motivo: motivoSelec, descripcion: descBloqueo || undefined,
        });
        setBloqueosDia(prev => [...prev, nuevo]);
        toastExito("Día completo bloqueado");
      }
      await cargarBloqueos();
    } catch (e: any) { toastError(e?.response?.data?.message ?? "Error"); }
    finally { setGuardandoBloqueo(false); }
  }

  function sumarMedia(hora: string): string {
    const [h, m] = hora.split(":").map(Number);
    const total = h * 60 + m + 30;
    return `${String(Math.floor(total/60)).padStart(2,"0")}:${String(total%60).padStart(2,"0")}`;
  }

  // ── Filtros doctores ──
  const especialidades = useMemo(() => {
    const set = new Set(doctores.map(d => d.especialidad));
    return ["Todas", ...Array.from(set).sort()];
  }, [doctores]);

  const doctoresFiltrados = useMemo(() => {
    const q = busqueda.toLowerCase();
    return doctores.filter(d => {
      const nombre = `${d.nombres} ${d.apellidos}`.toLowerCase();
      return (!q || nombre.includes(q)) && (filtroEsp === "Todas" || d.especialidad === filtroEsp);
    });
  }, [doctores, busqueda, filtroEsp]);

  // ─────────────────────────────────────────────────────────────────────────────
  if (!doctores.length) return (
    <div className="gh-loading"><Loader2 className="gh-spin" size={28}/><p>Cargando médicos…</p></div>
  );

  return (
    <div className="gh-root">
      <div className="gh-page-header">
        <div>
          <h1 className="gh-page-title"><Calendar size={22}/> Gestión de Horarios</h1>
          <p className="gh-page-sub">Administra turnos y bloqueos de los médicos mes a mes</p>
        </div>
      </div>

      {/* ── Selector de médico ── */}
      <div className="gh-selector-section">
        <div className="gh-selector-header">
          <p className="gh-selector-titulo">
            Seleccionar médico
            <span className="gh-selector-count">{doctoresFiltrados.length} de {doctores.length}</span>
          </p>
          <div className="gh-selector-controles">
            <div className="gh-search-wrap">
              <Search size={13} className="gh-search-icon"/>
              <input className="gh-search-input" placeholder="Buscar médico…"
                value={busqueda} onChange={e => setBusqueda(e.target.value)}/>
              {busqueda && <button className="gh-search-clear" onClick={() => setBusqueda("")}><X size={11}/></button>}
            </div>
            <div className="gh-filter-wrap">
              <Filter size={13} className="gh-filter-icon"/>
              <select className="gh-filter-select" value={filtroEsp} onChange={e => setFiltroEsp(e.target.value)}>
                {especialidades.map(e => <option key={e}>{e}</option>)}
              </select>
            </div>
          </div>
        </div>
        {doctoresFiltrados.length === 0
          ? <p className="gh-selector-empty">No se encontraron médicos.</p>
          : <div className="gh-doctores-grid">
              {doctoresFiltrados.map(d => (
                <button key={d.id}
                  className={`gh-doctor-card ${doctorSelec?.id === d.id ? "gh-doctor-card--active" : ""}`}
                  onClick={() => { setDoctorSelec(d); setDiaBloqueo(null); setConfirmando(false); }}
                >
                  <div className="gh-doctor-avatar">{(d.nombres[0] ?? "M").toUpperCase()}</div>
                  <div className="gh-doctor-info">
                    <p className="gh-doctor-nombre">{d.nombres} {d.apellidos}</p>
                    <p className="gh-doctor-esp">{d.especialidad}</p>
                  </div>
                  {doctorSelec?.id === d.id && <CheckCircle2 size={14} className="gh-doctor-check"/>}
                </button>
              ))}
            </div>
        }
      </div>

      {/* ── Panel principal ── */}
      {doctorSelec ? (
        <div className="gh-panel">
          {/* Tabs */}
          <div className="gh-tabs">
            <button className={`gh-tab ${tab === "horario" ? "gh-tab--active" : ""}`}
              onClick={() => { setTab("horario"); setDiaBloqueo(null); }}>
              <Clock size={15}/> Horario mensual
            </button>
            <button className={`gh-tab ${tab === "bloqueos" ? "gh-tab--active" : ""}`}
              onClick={() => { setTab("bloqueos"); setConfirmando(false); setMes(hoy.getMonth() + 1); setAnio(hoy.getFullYear()); setDiaBloqueo(null); }}>
              <Lock size={15}/> Bloqueos
            </button>
          </div>

          {/* ══ TAB HORARIO ══ */}
          {tab === "horario" && (
            <div className="gh-horario-layout">

              {/* ── Columna izquierda: selector de mes ── */}
              <div className="gh-horario-sidebar">
                <div className="gh-mes-selector">
                  <div className="gh-mes-selector-hdr">
                    <button className="gh-mes-anio-btn" onClick={() => setAnio(a => a - 1)}><ChevronLeft size={14}/></button>
                    <span className="gh-mes-anio">{anio}</span>
                    <button className="gh-mes-anio-btn" onClick={() => setAnio(a => a + 1)}><ChevronRight size={14}/></button>
                  </div>
                  <div className="gh-mes-grid">
                    {MESES.map((nombre, i) => {
                      const m = i + 1;
                      const esActual = m === mes;
                      const esPasado = anio < hoy.getFullYear() || (anio === hoy.getFullYear() && m < hoy.getMonth() + 1);
                      return (
                        <button
                          key={m}
                          className={`gh-mes-chip ${esActual ? "gh-mes-chip--activo" : ""} ${esPasado ? "gh-mes-chip--pasado" : ""}`}
                          onClick={() => setMes(m)}
                        >
                          {nombre.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                  {(cargandoSlots || cargandoBloqueos) && (
                    <div className="gh-mes-cargando"><Loader2 size={13} className="gh-spin"/> Cargando…</div>
                  )}
                  {statsMes.reservados > 0 && (
                    <div className="gh-reservados-aviso" style={{ marginTop: "0.75rem" }}>
                      <AlertCircle size={12}/>
                      <span>{statsMes.reservados} cita(s) reservadas este mes</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Columna derecha: selector de horario ── */}
              <div className="gh-horario-main">
                <div className="gh-horario-main-hdr">
                  <div>
                    <p className="gh-horario-main-titulo">Horario de atención</p>
                    <p className="gh-horario-main-sub">
                      Selecciona las horas que el médico atenderá en <strong>{MESES[mes-1]} {anio}</strong>.
                      El horario se aplicará a los <strong>{diasHabiles.length} días hábiles</strong> del mes.
                    </p>
                  </div>
                  <div className="gh-horario-selec-count">
                    <Clock size={14}/>
                    <span>{Math.round(horasSelec.size * 0.5 * 6)} h / semana</span>
                  </div>
                </div>

                {/* Presets */}
                <div className="gh-presets">
                  <span className="gh-presets-lbl"><Zap size={11}/> Presets</span>
                  <button className="gh-preset-btn" onClick={() => setHorasSelec(new Set(SLOTS_MANANA))}>Mañana</button>
                  <button className="gh-preset-btn" onClick={() => setHorasSelec(new Set(SLOTS_TARDE))}>Tarde-noche</button>
                  <button className="gh-preset-btn gh-preset-btn--clear" onClick={() => setHorasSelec(new Set())}>Limpiar</button>
                </div>

                {/* Grid mañana */}
                <div className="gh-turno-bloque">
                  <p className="gh-turno-titulo">
                    <span className="gh-turno-tag gh-turno-tag--manana">Mañana</span>
                    08:00 – 14:30
                  </p>
                  <div className="gh-slots-grid">
                    {SLOTS_MANANA.map(hora => (
                      <button key={hora}
                        className={`gh-slot ${horasSelec.has(hora) ? "gh-slot--activo" : ""}`}
                        onClick={() => setHorasSelec(prev => {
                          const n = new Set(prev);
                          n.has(hora) ? n.delete(hora) : n.add(hora);
                          return n;
                        })}>
                        {hora}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid tarde-noche */}
                <div className="gh-turno-bloque">
                  <p className="gh-turno-titulo">
                    <span className="gh-turno-tag gh-turno-tag--tarde">Tarde · Noche</span>
                    15:00 – 21:30
                  </p>
                  <div className="gh-slots-grid">
                    {SLOTS_TARDE.map(hora => (
                      <button key={hora}
                        className={`gh-slot ${horasSelec.has(hora) ? "gh-slot--activo" : ""}`}
                        onClick={() => setHorasSelec(prev => {
                          const n = new Set(prev);
                          n.has(hora) ? n.delete(hora) : n.add(hora);
                          return n;
                        })}>
                        {hora}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="gh-nota-info">
                  <Info size={12}/>
                  <span>Los slots ya reservados no serán eliminados aunque cambies el horario. Sólo se añaden los nuevos.</span>
                </div>

                {/* Botón aplicar */}
                {!confirmando ? (
                  <button className="gh-btn gh-btn--primary gh-btn--apply"
                    disabled={horasSelec.size === 0 || aplicando}
                    onClick={() => setConfirmando(true)}>
                    <Save size={14}/> Aplicar horario al mes
                  </button>
                ) : (
                  <div className="gh-confirm-box">
                    <AlertCircle size={14} className="gh-confirm-icon"/>
                    <div className="gh-confirm-text">
                      <strong>¿Confirmar?</strong>
                      <span>Se agregarán <strong>{horasSelec.size} slots</strong> en los <strong>{diasHabiles.length} días hábiles</strong> de {MESES[mes-1]}.</span>
                    </div>
                    <div className="gh-confirm-btns">
                      <button className="gh-btn gh-btn--ghost" onClick={() => setConfirmando(false)} disabled={aplicando}>Cancelar</button>
                      <button className="gh-btn gh-btn--primary" onClick={aplicarMes} disabled={aplicando}>
                        {aplicando ? <><Loader2 size={13} className="gh-spin"/> Aplicando…</> : <><CheckCircle2 size={13}/> Confirmar</>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ TAB BLOQUEOS ══ */}
          {tab === "bloqueos" && (
            <div className="gh-content">
              {/* Nav mes bloqueos */}
              <div className="gh-mes-nav">
                <button className="gh-mes-btn" onClick={() => navMes(-1)}><ChevronLeft size={16}/></button>
                <div className="gh-mes-titulo">
                  {MESES[mes-1]} {anio}
                  {cargandoBloqueos && <Loader2 size={13} className="gh-spin gh-spin--inline"/>}
                </div>
                <button className="gh-mes-btn" onClick={() => navMes(1)}><ChevronRight size={16}/></button>
              </div>
              {/* Calendario */}
              <div className="gh-cal-wrap">
                <div className="gh-cal">
                  {DIAS_SEMANA_CORTO.map(d => <div key={d} className="gh-cal-hdr">{d}</div>)}
                  {Array.from({ length: offset }).map((_,i) => <div key={`e${i}`}/>)}
                  {Array.from({ length: totalDias }, (_, i) => {
                    const dia = i + 1;
                    const iso = isoFecha(anio, mes, dia);
                    const esDomingo = diaSemana(anio, mes, dia) === 6;
                    const esPasado  = iso < hoyISO;
                    const esHoy     = iso === hoyISO;
                    const tieneBloq = diasConBloqueo.has(iso);
                    const activo    = diaBloqueo === iso;
                    return (
                      <button key={iso}
                        className={`gh-dia ${esDomingo ? "gh-dia--domingo" : ""} ${esPasado ? "gh-dia--pasado" : ""} ${esHoy ? "gh-dia--hoy" : ""} ${tieneBloq ? "gh-dia--bloqueado" : ""} ${activo ? "gh-dia--activo" : ""}`}
                        onClick={() => !esDomingo && !esPasado && abrirDiaBloqueo(iso)}>
                        <span className="gh-dia-num">{dia}</span>
                        {tieneBloq && <Lock size={8} className="gh-dia-lock"/>}
                      </button>
                    );
                  })}
                </div>
                <div className="gh-leyenda">
                  <span className="gh-ley-item gh-ley--bloq">Con bloqueo</span>
                  <span className="gh-ley-item gh-ley--libre">Libre</span>
                </div>
                {bloqueosMes.length > 0 && (
                  <div className="gh-bloq-resumen-lateral">
                    <p className="gh-slots-lbl">Bloqueos del mes</p>
                    {bloqueosMes.slice(0,6).map(b => (
                      <div key={b._id} className="gh-bloq-chip">
                        <Lock size={9}/>
                        <span>{b.fecha.slice(8,10)}/{b.fecha.slice(5,7)} · {b.tipoDia === "DIA_COMPLETO" ? "Día completo" : `${b.horaInicio}–${b.horaFin}`}</span>
                        <span className="gh-bloq-chip-motivo">{b.motivo}</span>
                      </div>
                    ))}
                    {bloqueosMes.length > 6 && <p className="gh-bloq-mas">+{bloqueosMes.length - 6} más</p>}
                  </div>
                )}
              </div>

              {/* Panel bloqueo día */}
              <div className="gh-detalle">
                {!diaBloqueo ? (
                  <div className="gh-detalle-empty">
                    <CalendarOff size={32} className="gh-detalle-empty-icon"/>
                    <p>Selecciona un día para gestionar sus bloqueos</p>
                    <div className="gh-resumen-mes">
                      <div className="gh-resumen-stat gh-resumen-stat--warn">
                        <span>{bloqueosMes.length}</span><small>Bloqueos activos</small>
                      </div>
                      <div className="gh-resumen-stat">
                        <span>{bloqueosMes.filter(b => b.tipoDia === "DIA_COMPLETO").length}</span><small>Días completos</small>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="gh-dia-editor">
                    <div className="gh-dia-editor-hdr">
                      <div>
                        <p className="gh-dia-editor-fecha">{diaBloqueo.split("-").reverse().join("/")}</p>
                        <p className="gh-dia-editor-sub">{bloqueosDia.length === 0 ? "Sin bloqueos" : `${bloqueosDia.length} bloqueo(s) activos`}</p>
                      </div>
                      <button className="gh-icon-btn" onClick={() => setDiaBloqueo(null)}><X size={15}/></button>
                    </div>

                    <div className="gh-bloqueo-form">
                      <div className="gh-field">
                        <label className="gh-label">Motivo</label>
                        <select className="gh-select" value={motivoSelec} onChange={e => setMotivoSelec(e.target.value)}>
                          {MOTIVOS_BLOQUEO.map(m => <option key={m}>{m}</option>)}
                        </select>
                      </div>
                      <div className="gh-field">
                        <label className="gh-label">Descripción <span className="gh-label-opt">(opcional)</span></label>
                        <input className="gh-input" placeholder="Nota adicional…" value={descBloqueo} onChange={e => setDescBloqueo(e.target.value)}/>
                      </div>
                    </div>

                    {diaBloqueadoCompleto ? (
                      <div className="gh-dia-completo-banner">
                        <AlertCircle size={14}/>
                        <span>Día completo bloqueado · <em>{diaBloqueadoCompleto.motivo}</em></span>
                        <button className="gh-btn-desbloquear" onClick={toggleDiaCompleto} disabled={guardandoBloqueo}>
                          <Unlock size={12}/> Desbloquear
                        </button>
                      </div>
                    ) : (
                      <button className="gh-btn gh-btn--bloq-dia" onClick={toggleDiaCompleto} disabled={guardandoBloqueo}>
                        {guardandoBloqueo ? <Loader2 size={13} className="gh-spin"/> : <CalendarOff size={14}/>}
                        Bloquear día completo
                      </button>
                    )}

                    {!diaBloqueadoCompleto && slotsDelDia.length === 0 && (
                      <div className="gh-nota-info" style={{ color: "#6b7280", background: "#f9fafb" }}>
                        <Info size={12}/>
                        <span>
                          {!slotsMes[diaBloqueo]?.horas?.length
                            ? "Este día no tiene horario registrado para este médico."
                            : "Todos los slots de hoy ya pasaron."}
                        </span>
                      </div>
                    )}
                    {!diaBloqueadoCompleto && slotsDelDia.length > 0 && (
                      <>
                        <p className="gh-slots-lbl" style={{ marginTop: "0.75rem" }}>Slots del día — click para bloquear/desbloquear</p>
                        <div className="gh-slots-grid gh-slots-grid--bloqueo">
                          {slotsDelDia.map(hora => {
                            const bloq = slotEstaBloqueado(hora);
                            const cargando = slotsBloqueandose.has(hora);
                            return (
                              <button key={hora}
                                className={`gh-slot-bloq ${bloq ? "gh-slot-bloq--bloqueado" : ""}`}
                                onClick={() => !cargando && toggleBloqueoSlot(hora)}
                                title={bloq ? `Bloqueado · ${bloq.motivo}` : "Disponible"}>
                                {cargando ? <Loader2 size={10} className="gh-spin"/> : bloq ? <Lock size={10}/> : null}
                                <span>{hora}</span>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}

                    {bloqueosDia.length > 0 && (
                      <div className="gh-bloqdia-lista">
                        <p className="gh-slots-lbl">Bloqueos activos</p>
                        {bloqueosDia.map(b => (
                          <div key={b._id} className="gh-bloqdia-row">
                            <Lock size={11} className="gh-bloqdia-icon"/>
                            <div className="gh-bloqdia-info">
                              <span className="gh-bloqdia-tipo">{b.tipoDia === "DIA_COMPLETO" ? "Día completo" : `${b.horaInicio} – ${b.horaFin}`}</span>
                              <span className="gh-bloqdia-motivo">{b.motivo}</span>
                              {b.descripcion && <span className="gh-bloqdia-desc">"{b.descripcion}"</span>}
                            </div>
                            <button className="gh-icon-btn gh-icon-btn--danger" onClick={async () => {
                              await BloqueoService.desactivar(b._id);
                              setBloqueosDia(prev => prev.filter(x => x._id !== b._id));
                              await cargarBloqueos();
                              toastExito("Bloqueo eliminado");
                            }}><Trash2 size={12}/></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="gh-sin-doctor">
          <Calendar size={40} className="gh-detalle-empty-icon"/>
          <p>Selecciona un médico para gestionar su horario</p>
        </div>
      )}
    </div>
  );
}
