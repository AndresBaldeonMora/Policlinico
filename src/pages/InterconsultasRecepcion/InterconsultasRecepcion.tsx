import { useEffect, useState, useRef } from "react";
import Swal from "sweetalert2";
import {
  ClipboardList, Clock, Stethoscope,
  ChevronLeft, ChevronRight, X, CalendarPlus,
  CheckCircle2, RefreshCw, Search, User, CalendarDays,
} from "lucide-react";
import {
  InterconsultaApiService,
  type Interconsulta,
  type AgendarRecepcionPayload,
} from "../../services/interconsulta.service";
import { DoctorApiService, type DoctorTransformado } from "../../services/doctor.service";
import { toastExito, toastError } from "../../utils/toast";
import { formatearTimestamp } from "../../utils/fecha.utils";
import "./InterconsultasRecepcion.css";
import "../ListaCitas/ReprogramarModal.css";
import "../Laboratorio/Laboratorio.css";

// ─── Helpers ───────────────────────────────────────────────────────────────────

const DIAS_SEMANA = ["L", "M", "M", "J", "V", "S", "D"];
const MESES_NOMBRE = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};

const fechaToISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

const isoADMY = (iso: string): string => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const sumarDias = (iso: string, dias: number): string => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + dias);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};

const formatTS = (iso?: string) => (iso ? formatearTimestamp(iso) : "—");

// ─── Mini-calendario ────────────────────────────────────────────────────────────

function MiniCalendario({ valor, onChange }: { valor: string; onChange: (iso: string) => void }) {
  const init = new Date(valor);
  const [mes, setMes]   = useState(init.getMonth());
  const [año, setAño]   = useState(init.getFullYear());

  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const primerDia = new Date(año, mes, 1);
  const offset    = (primerDia.getDay() + 6) % 7;
  const diasEnMes = new Date(año, mes+1, 0).getDate();

  const navegar = (d: number) => {
    const nuevo = mes + d;
    if (nuevo < 0)  { setMes(11); setAño(año-1); }
    else if (nuevo > 11) { setMes(0); setAño(año+1); }
    else setMes(nuevo);
  };

  const celdas = [...Array(offset).fill(null), ...Array.from({length: diasEnMes}, (_,i) => i+1)];

  return (
    <div className="irec-cal">
      <div className="irec-cal-head">
        <button type="button" onClick={() => navegar(-1)}><ChevronLeft size={14}/></button>
        <span>{MESES_NOMBRE[mes]} {año}</span>
        <button type="button" onClick={() => navegar(1)}><ChevronRight size={14}/></button>
      </div>
      <div className="irec-cal-dias">
        {DIAS_SEMANA.map((d,i) => <span key={i}>{d}</span>)}
      </div>
      <div className="irec-cal-grid">
        {celdas.map((dia, idx) => {
          if (!dia) return <span key={idx}/>;
          const d      = new Date(año, mes, dia);
          const iso    = fechaToISO(d);
          const esDom  = d.getDay() === 0;
          const off    = d < hoy || esDom;
          return (
            <button
              key={idx} type="button" disabled={off}
              title={esDom ? "Domingo — sin atención" : undefined}
              className={
                "irec-cal-celda" +
                (iso === valor ? " --sel" : "") +
                (iso === hoyISO() && iso !== valor ? " --hoy" : "") +
                (off ? " --off" : "")
              }
              onClick={() => !off && onChange(iso)}
            >{dia}</button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Modal de agendamiento ────────────────────────────────────────────────────

interface ModalAgendarProps {
  interconsulta: Interconsulta;
  onClose: () => void;
  onAgendada: () => void;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

const formatearFechaResumen = (iso: string): string => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const f = new Date(y, m - 1, d);
  const dia = new Intl.DateTimeFormat("es-PE", { weekday: "long" }).format(f);
  return `${dia.charAt(0).toUpperCase() + dia.slice(1)} ${pad2(d)}/${pad2(m)}/${y}`;
};

function ModalAgendar({ interconsulta: ic, onClose, onAgendada }: ModalAgendarProps) {
  const [doctores, setDoctores]       = useState<DoctorTransformado[]>([]);
  const [doctorId, setDoctorId]       = useState("");
  const [fecha, setFecha]             = useState(hoyISO());
  const [horarios, setHorarios]       = useState<{hora:string; disponible:boolean}[]>([]);
  const [hora, setHora]               = useState("");
  const [cargandoDoc, setCargandoDoc] = useState(true);
  const [cargandoHor, setCargandoHor] = useState(false);
  const [guardando, setGuardando]     = useState(false);
  const [paso, setPaso]               = useState<1|2>(1);

  const noHaySlots     = !cargandoHor && !!doctorId && (horarios.length === 0 || horarios.every(h => !h.disponible));
  const puedeConfirmar = !!doctorId && !!hora;
  const doctorSelec      = doctores.find(d => d.id === doctorId);

  useEffect(() => {
    DoctorApiService.listar()
      .then(lista => {
        const filtrados = lista.filter(
          d => d.especialidad.toLowerCase() === ic.especialidadSolicitada.toLowerCase()
        );
        setDoctores(filtrados);
        if (filtrados.length === 1) setDoctorId(filtrados[0].id);
      })
      .finally(() => setCargandoDoc(false));
  }, [ic.especialidadSolicitada]);

  useEffect(() => {
    if (!doctorId || !fecha) return;
    setCargandoHor(true);
    setHora("");
    DoctorApiService.obtenerHorariosDisponibles(doctorId, fecha)
      .then(setHorarios)
      .finally(() => setCargandoHor(false));
  }, [doctorId, fecha]);

  const handleConfirmar = async () => {
    setGuardando(true);
    try {
      const payload: AgendarRecepcionPayload = { doctorId, fecha, hora };
      await InterconsultaApiService.agendarDesdeRecepcion(ic._id, payload);
      toastExito("Cita agendada correctamente");
      onAgendada();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "No se pudo agendar la cita";
      setPaso(1);
      Swal.fire({ icon: "error", title: "Error al agendar", text: msg, confirmButtonColor: "var(--primary)" });
    } finally {
      setGuardando(false);
    }
  };

  const pac  = ic.pacienteId;

  const disponibles = horarios.filter(h => h.disponible);

  return (
    <div className="rep-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="rep-card" onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <header className="rep-header">
          <div className="rep-header__top">
            <div>
              <h3 className="rep-header__titulo">Agendar cita de interconsulta</h3>
              <p className="rep-header__sub">
                {pac.nombres} {pac.apellidos} · DNI {pac.dni}
              </p>
            </div>
            <button type="button" className="rep-header__close" onClick={onClose}><X size={18}/></button>
          </div>
          {/* Stepper */}
          <div className="rep-stepper">
            <div className={`rep-step ${paso === 1 ? "rep-step--activo" : "rep-step--completado"}`}>
              <span className="rep-step__circle">1</span>
              <span className="rep-step__label">Médico y horario</span>
            </div>
            <span className="rep-step__separator"/>
            <div className={`rep-step ${paso === 2 ? "rep-step--activo" : ""}`}>
              <span className="rep-step__circle">2</span>
              <span className="rep-step__label">Confirmar</span>
            </div>
          </div>
        </header>

        {/* ── Body ── */}
        <div className="rep-body">
          {paso === 1 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Contexto clínico */}
              <div className="irec-modal-context">
                <div className="irec-modal-context-row">
                  <span className="irec-modal-context-label">Especialidad</span>
                  <strong>{ic.especialidadSolicitada}</strong>
                </div>
                {ic.diagnosticoPresuntivo && (
                  <div className="irec-modal-context-row">
                    <span className="irec-modal-context-label">Diagnóstico</span>
                    <span>{ic.diagnosticoPresuntivo}</span>
                  </div>
                )}
                <div className="irec-modal-context-row">
                  <span className="irec-modal-context-label">Motivo</span>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{ic.motivoConsulta}</span>
                </div>
              </div>

              {/* Selector de médico */}
              <div>
                <label className="irec-label" style={{ marginBottom: "0.4rem", display: "block" }}>
                  Médico especialista
                </label>
                {cargandoDoc ? (
                  <p className="irec-muted">Cargando médicos de {ic.especialidadSolicitada}…</p>
                ) : doctores.length === 0 ? (
                  <p className="irec-muted">No hay médicos registrados para {ic.especialidadSolicitada}.</p>
                ) : (
                  <select className="soap-select" value={doctorId} onChange={e => { setDoctorId(e.target.value); setHora(""); }}>
                    <option value="">— Seleccionar médico —</option>
                    {doctores.map(d => (
                      <option key={d.id} value={d.id}>
                        Dr. {d.nombres} {d.apellidos}{d.cmp ? ` (CMP ${d.cmp})` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Calendario + Horarios en 2 columnas */}
              <div className="rep-paso1">
                <MiniCalendario
                  valor={fecha}
                  onChange={f => { setFecha(f); setHora(""); }}
                />

                {/* Panel de horarios */}
                <div className="rep-slots" style={{ minHeight: 220 }}>
                  {!doctorId ? (
                    <div className="rep-slots rep-slots--placeholder" style={{ border: "none", padding: 0 }}>
                      <CalendarDays size={28}/>
                      <p>Selecciona un médico para ver los horarios.</p>
                    </div>
                  ) : cargandoHor ? (
                    <div className="rep-slots rep-slots--placeholder" style={{ border: "none", padding: 0 }}>
                      <div className="spinner-small"/>
                      <p>Consultando agenda…</p>
                    </div>
                  ) : noHaySlots ? (
                    <div className="rep-slots--placeholder" style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:"0.5rem", textAlign:"center" }}>
                      <CalendarDays size={24} style={{ color: "var(--text-muted)" }}/>
                      <p style={{ margin: 0, fontSize: "0.84rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                        Sin horarios disponibles.<br/>Elige otra fecha.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="rep-slots__header">
                        <Clock size={14}/>
                        <span>{disponibles.length} {disponibles.length === 1 ? "horario libre" : "horarios libres"} — {isoADMY(fecha)}</span>
                      </div>
                      <div className="rep-slots__grid">
                        {disponibles.map(h => (
                          <button
                            key={h.hora} type="button"
                            className={`rep-slot${hora === h.hora ? " rep-slot--sel" : ""}`}
                            onClick={() => setHora(h.hora)}
                          >{h.hora}</button>
                        ))}
                      </div>

                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* ── Paso 2: Confirmación ── */
            <div className="rep-confirm">
              <h4 className="rep-confirm__titulo">Revisa los datos antes de confirmar</h4>
              <div className="rep-confirm__grid">
                <div className="rep-confirm__item">
                  <span className="rep-confirm__label">Paciente</span>
                  <strong>{pac.nombres} {pac.apellidos}</strong>
                  <span className="rep-confirm__sub">DNI {pac.dni}</span>
                </div>
                <div className="rep-confirm__item">
                  <span className="rep-confirm__label">Especialidad solicitada</span>
                  <strong>{ic.especialidadSolicitada}</strong>
                </div>
                <div className="rep-confirm__item">
                  <span className="rep-confirm__label">Médico asignado</span>
                  <strong>Dr. {doctorSelec?.nombres} {doctorSelec?.apellidos}</strong>
                  {doctorSelec?.cmp && <span className="rep-confirm__sub">CMP {doctorSelec.cmp}</span>}
                </div>
                <div className="rep-confirm__item rep-confirm__item--despues">
                  <span className="rep-confirm__label">Fecha y hora de cita</span>
                  <strong>{formatearFechaResumen(fecha)}</strong>
                  <span className="rep-confirm__sub">{hora} hs</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <footer className="rep-footer">
          {paso === 1 ? (
            <>
              <button type="button" className="rep-btn rep-btn--secondary" onClick={onClose}>Cancelar</button>
              <button
                type="button"
                className="rep-btn rep-btn--primary"
                onClick={() => setPaso(2)}
                disabled={!puedeConfirmar}
              >
                Siguiente
              </button>
            </>
          ) : (
            <>
              <button type="button" className="rep-btn rep-btn--secondary" onClick={() => setPaso(1)} disabled={guardando}>
                Volver
              </button>
              <button type="button" className="rep-btn rep-btn--primary" onClick={handleConfirmar} disabled={guardando}>
                {guardando ? "Agendando…" : "Confirmar cita"}
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}

// ─── Fila de interconsulta ────────────────────────────────────────────────────

interface FilaInterconsultaProps {
  ic: Interconsulta;
  onAgendar: () => void;
  onCancelar: () => void;
}

function FilaInterconsulta({ ic, onAgendar, onCancelar }: FilaInterconsultaProps) {
  const pac  = ic.pacienteId;
  const iniciales = ((pac.nombres?.[0] ?? "") + (pac.apellidos?.[0] ?? "")).toUpperCase();

  return (
    <div className="irec-orden">
      <div className="irec-orden-row">

        {/* Paciente */}
        <div className="irec-orden-col irec-orden-paciente">
          <div className="irec-avatar">{iniciales}</div>
          <div>
            <div className="irec-nombre">{pac.nombres} {pac.apellidos}</div>
            <div className="irec-dni">DNI {pac.dni}</div>
          </div>
        </div>

        {/* Especialidad */}
        <div className="irec-orden-col">
          <div className="irec-esp">
            <Stethoscope size={13}/>
            <span>{ic.especialidadSolicitada}</span>
          </div>
        </div>

        {/* Solicitante */}
        <div className="irec-orden-col">
          <div className="irec-text-sm">{ic.solicitanteNombre}</div>
          {ic.solicitanteEspecialidad && (
            <div className="irec-text-muted">{ic.solicitanteEspecialidad}</div>
          )}
        </div>

        {/* Diagnóstico */}
        <div className="irec-orden-col">
          <div className="irec-text-sm irec-clamp">
            {ic.diagnosticoPresuntivo || <span className="irec-text-muted">—</span>}
          </div>
        </div>

        {/* Fecha */}
        <div className="irec-orden-col">
          <div className="irec-fecha">
            <Clock size={12}/>
            {formatTS(ic.createdAt)}
          </div>
        </div>

        {/* Acciones */}
        <div className="irec-orden-col irec-orden-actions">
          <button
            className="lab-btn lab-btn--primary lab-btn--sm"
            onClick={onAgendar}
            title="Agendar cita para esta interconsulta"
          >
            <CalendarPlus size={13}/> Agendar
          </button>
          <button
            className="lab-btn lab-btn--danger lab-btn--sm"
            onClick={onCancelar}
            title="Cancelar esta interconsulta"
          >
            <X size={13}/> Cancelar
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function InterconsultasRecepcion() {
  const [lista, setLista]               = useState<Interconsulta[]>([]);
  const [loading, setLoading]           = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [seleccionada, setSeleccionada] = useState<Interconsulta | null>(null);
  const [fechaFiltro, setFechaFiltro]   = useState<string>(""); // "" = sin filtro de fecha
  const fechaInputRef = useRef<HTMLInputElement>(null);
  const [busqueda, setBusqueda]         = useState("");

  const cargar = async (conSpinner = false) => {
    if (conSpinner) setActualizando(true);
    else setLoading(true);
    try {
      const data = await InterconsultaApiService.listarPendientesRecepcion();
      setLista(data);
    } catch {
      toastError("No se pudo cargar las interconsultas");
    } finally {
      setLoading(false);
      setActualizando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const handleCancelar = async (ic: Interconsulta) => {
    const { value, isConfirmed } = await Swal.fire({
      title: "Cancelar interconsulta",
      text: "Indica el motivo de cancelación (opcional):",
      input: "text",
      inputPlaceholder: "Sin disponibilidad, paciente no puede asistir…",
      showCancelButton: true,
      confirmButtonText: "Cancelar interconsulta",
      cancelButtonText: "Volver",
      confirmButtonColor: "#dc2626",
    });
    if (!isConfirmed) return;
    try {
      await InterconsultaApiService.cancelar(ic._id, value || undefined);
      toastExito("Interconsulta cancelada");
      cargar();
    } catch {
      toastError("No se pudo cancelar");
    }
  };

  // Filtrar
  const listaFiltrada = lista.filter(ic => {
    if (fechaFiltro) {
      const fechaIC = (ic.createdAt ?? "").slice(0, 10);
      if (fechaIC !== fechaFiltro) return false;
    }
    if (busqueda.trim()) {
      const q   = busqueda.toLowerCase();
      const pac = ic.pacienteId;
      const coincide =
        `${pac.nombres} ${pac.apellidos}`.toLowerCase().includes(q) ||
        pac.dni.includes(q) ||
        ic.especialidadSolicitada.toLowerCase().includes(q) ||
        (ic.solicitanteNombre ?? "").toLowerCase().includes(q);
      if (!coincide) return false;
    }
    return true;
  });

  const ordenadas = listaFiltrada;

  return (
    <div className="irec-page">

      {/* ── Header ── */}
      <div className="irec-header">
        <div className="irec-header-title">
          <ClipboardList size={28} className="irec-header-icon"/>
          <div>
            <h1>Interconsultas pendientes</h1>
            <p>Interconsultas generadas por médicos que requieren agendamiento de cita</p>
          </div>
        </div>
        <button
          className="lab-btn lab-btn--cancel lab-btn--sm"
          onClick={() => cargar(true)}
          disabled={actualizando || loading}
          title="Actualizar lista"
        >
          <RefreshCw size={14} style={{ marginRight: 5, animation: actualizando ? "spin 1s linear infinite" : undefined }}/>
          {actualizando ? "Actualizando…" : "Actualizar"}
        </button>
      </div>

      {/* ── Filtros ── */}
      <div className="irec-filtros-avanzados">
        {/* Navegador de fecha */}
        <div className="lab-filtro-campo">
          <label className="lab-filtro-label">Fecha de solicitud</label>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button
              className="lab-cal-nav-btn"
              onClick={() => setFechaFiltro(f => f ? sumarDias(f, -1) : sumarDias(hoyISO(), -1))}
              title="Día anterior"
            >
              <ChevronLeft size={15}/>
            </button>
            <div
              style={{ position: "relative", display: "inline-flex", cursor: "pointer" }}
              onClick={() => fechaInputRef.current?.showPicker()}
            >
              <span style={{
                padding: "0.38rem 0.75rem",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: "0.88rem",
                fontWeight: 600,
                color: fechaFiltro ? "var(--text-primary)" : "var(--text-muted)",
                background: "var(--bg-body)",
                minWidth: 112,
                textAlign: "center",
                pointerEvents: "none",
                userSelect: "none",
                display: "inline-block",
              }}>
                {fechaFiltro ? isoADMY(fechaFiltro) : "Todos los días"}
              </span>
              <input
                ref={fechaInputRef}
                type="date"
                value={fechaFiltro}
                onChange={e => setFechaFiltro(e.target.value)}
                style={{ position: "absolute", inset: 0, opacity: 0, pointerEvents: "none", width: "100%", height: "100%" }}
              />
            </div>
            <button
              className="lab-cal-nav-btn"
              onClick={() => setFechaFiltro(f => f ? sumarDias(f, 1) : sumarDias(hoyISO(), 1))}
              title="Día siguiente"
            >
              <ChevronRight size={15}/>
            </button>
            {fechaFiltro && (
              <button
                className="lab-btn-limpiar"
                onClick={() => setFechaFiltro("")}
                title="Ver todos los días"
              >
                <X size={12}/> Todos
              </button>
            )}
          </div>
        </div>

        {/* Buscador */}
        <div className="lab-filtro-campo" style={{ flex: 1, minWidth: 240 }}>
          <label className="lab-filtro-label">Buscar</label>
          <div style={{ position: "relative", width: "100%" }}>
            <Search size={14} style={{
              position: "absolute", left: "0.65rem", top: "50%",
              transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none",
            }}/>
            <input
              className="lab-filtro-input"
              placeholder="Paciente, DNI, especialidad, solicitante…"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{ paddingLeft: "2.2rem" }}
            />
          </div>
        </div>

        {busqueda && (
          <button className="lab-btn-limpiar" onClick={() => setBusqueda("")} style={{ alignSelf: "flex-end" }}>
            <X size={13}/> Limpiar
          </button>
        )}

        <span className="lab-resultados-info" style={{ alignSelf: "flex-end", paddingBottom: "0.1rem" }}>
          {ordenadas.length} {ordenadas.length === 1 ? "resultado" : "resultados"}
        </span>
      </div>

      {/* ── Contenido ── */}
      {loading ? (
        <div className="lab-loading">
          <RefreshCw size={24} style={{ animation: "spin 1s linear infinite" }}/>
          <span>Cargando interconsultas…</span>
        </div>
      ) : lista.length === 0 ? (
        <div className="lab-empty">
          <CheckCircle2 size={36} strokeWidth={1.5}/>
          <span>Sin interconsultas pendientes. Todas han sido atendidas.</span>
        </div>
      ) : ordenadas.length === 0 ? (
        <div className="lab-empty">
          <User size={36} strokeWidth={1.5}/>
          <span>No se encontraron interconsultas con ese criterio.</span>
        </div>
      ) : (
        <div className="irec-lista">
          {/* Cabecera */}
          <div className="irec-lista-header">
            <span>Paciente</span>
            <span>Especialidad solicitada</span>
            <span>Solicitante</span>
            <span>Diagnóstico presuntivo</span>
            <span>Fecha solicitud</span>
            <span>Acciones</span>
          </div>

          {ordenadas.map(ic => (
            <FilaInterconsulta
              key={ic._id}
              ic={ic}
              onAgendar={() => setSeleccionada(ic)}
              onCancelar={() => handleCancelar(ic)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {seleccionada && (
        <ModalAgendar
          interconsulta={seleccionada}
          onClose={() => setSeleccionada(null)}
          onAgendada={() => { setSeleccionada(null); cargar(); }}
        />
      )}
    </div>
  );
}
