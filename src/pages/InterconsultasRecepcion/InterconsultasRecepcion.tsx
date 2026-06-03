import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  ClipboardList, Calendar, Clock, User, Stethoscope,
  AlertCircle, ChevronLeft, ChevronRight, X, CalendarPlus,
  CheckCircle2, Hourglass, RefreshCw,
} from "lucide-react";
import {
  InterconsultaApiService,
  type Interconsulta,
  type AgendarRecepcionPayload,
} from "../../services/interconsulta.service";
import { DoctorApiService, type DoctorTransformado } from "../../services/doctor.service";
import { toastExito, toastError } from "../../utils/toast";
import { formatearFechaCorta, formatearTimestamp } from "../../utils/fecha.utils";
import "./InterconsultasRecepcion.css";
import "./InterconsultasRecepcion.css";

// ─── Helpers ───────────────────────────────────────────────────────────────────

const PRIORIDAD_META: Record<string, { label: string; cls: string }> = {
  urgente:    { label: "Urgente",    cls: "danger" },
  preferente: { label: "Preferente", cls: "warning" },
  electiva:   { label: "Electiva",   cls: "info" },
};

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

const formatFecha = (iso?: string) => (iso ? formatearFechaCorta(iso) : "—");
const formatTS    = (iso?: string) => (iso ? formatearTimestamp(iso) : "—");

// ─── Mini-calendario (igual al de InterconsultaDetalle) ────────────────────────

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
          const d   = new Date(año, mes, dia);
          const iso = fechaToISO(d);
          const off = d < hoy;
          return (
            <button
              key={idx} type="button" disabled={off}
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

function ModalAgendar({ interconsulta: ic, onClose, onAgendada }: ModalAgendarProps) {
  const [doctores, setDoctores]     = useState<DoctorTransformado[]>([]);
  const [doctorId, setDoctorId]     = useState("");
  const [fecha, setFecha]           = useState(hoyISO());
  const [horarios, setHorarios]     = useState<{hora:string; disponible:boolean}[]>([]);
  const [hora, setHora]             = useState("");
  const [cargandoDoc, setCargandoDoc] = useState(true);
  const [cargandoHor, setCargandoHor] = useState(false);
  const [guardando, setGuardando]   = useState(false);

  // Cargar médicos de la especialidad solicitada
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

  // Cargar horarios disponibles al elegir doctor/fecha
  useEffect(() => {
    if (!doctorId || !fecha) return;
    setCargandoHor(true);
    setHora("");
    DoctorApiService.obtenerHorariosDisponibles(doctorId, fecha)
      .then(setHorarios)
      .finally(() => setCargandoHor(false));
  }, [doctorId, fecha]);

  const handleConfirmar = async () => {
    if (!doctorId || !fecha || !hora) return;
    setGuardando(true);
    try {
      const payload: AgendarRecepcionPayload = { doctorId, fecha, hora };
      await InterconsultaApiService.agendarDesdeRecepcion(ic._id, payload);
      toastExito("Cita agendada correctamente");
      onAgendada();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "No se pudo agendar la cita";
      Swal.fire({ icon: "error", title: "Error al agendar", text: msg, confirmButtonColor: "var(--primary)" });
    } finally {
      setGuardando(false);
    }
  };

  const pac = ic.pacienteId;
  const prio = PRIORIDAD_META[ic.prioridad] ?? PRIORIDAD_META.electiva;

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box irec-modal">
        <div className="modal-header">
          <div>
            <div className="modal-title">Agendar cita de interconsulta</div>
            <div className="modal-subtitle">
              {pac.nombres} {pac.apellidos} · DNI {pac.dni}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18}/></button>
        </div>

        <div className="modal-body">
          {/* Contexto de la interconsulta */}
          <div className="irec-modal-context">
            <div className="irec-modal-context-row">
              <span className="irec-modal-context-label">Especialidad</span>
              <strong>{ic.especialidadSolicitada}</strong>
            </div>
            <div className="irec-modal-context-row">
              <span className="irec-modal-context-label">Prioridad</span>
              <span className={`irec-badge irec-badge--${prio.cls}`}>{prio.label}</span>
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

          {/* Paso 1: Doctor */}
          <div className="irec-form-section">
            <label className="irec-label">
              <span className="irec-step-num">1</span> Médico especialista
            </label>
            {cargandoDoc ? (
              <p className="irec-muted">Cargando médicos de {ic.especialidadSolicitada}…</p>
            ) : doctores.length === 0 ? (
              <p className="irec-muted">No hay médicos registrados para {ic.especialidadSolicitada}.</p>
            ) : (
              <select
                className="soap-select"
                value={doctorId}
                onChange={e => setDoctorId(e.target.value)}
              >
                <option value="">— Seleccionar médico —</option>
                {doctores.map(d => (
                  <option key={d.id} value={d.id}>
                    Dr. {d.nombres} {d.apellidos}{d.cmp ? ` (CMP ${d.cmp})` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Paso 2: Fecha */}
          <div className="irec-form-section">
            <label className="irec-label">
              <span className="irec-step-num">2</span> Fecha de la cita
            </label>
            <MiniCalendario valor={fecha} onChange={f => { setFecha(f); setHora(""); }} />
          </div>

          {/* Paso 3: Hora */}
          <div className="irec-form-section">
            <label className="irec-label">
              <span className="irec-step-num">3</span> Hora disponible
              {!cargandoHor && horarios.length > 0 && (
                <span className="irec-label-aside">
                  {horarios.filter(h => h.disponible).length} libres
                </span>
              )}
            </label>
            {!doctorId ? (
              <p className="irec-muted">Selecciona un médico primero.</p>
            ) : cargandoHor ? (
              <p className="irec-muted">Consultando agenda…</p>
            ) : horarios.length === 0 ? (
              <p className="irec-muted">Sin horarios disponibles para esta fecha.</p>
            ) : (
              <div className="irec-horarios">
                {horarios.map(h => (
                  <button
                    key={h.hora} type="button"
                    disabled={!h.disponible}
                    className={"irec-slot" + (hora === h.hora ? " --sel" : "") + (!h.disponible ? " --off" : "")}
                    onClick={() => h.disponible && setHora(h.hora)}
                  >{h.hora}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="soap-btn-secondary" onClick={onClose} disabled={guardando}>Cancelar</button>
          <button
            className="soap-btn-next"
            onClick={handleConfirmar}
            disabled={guardando || !doctorId || !hora}
          >
            <CalendarPlus size={15}/>
            {guardando ? "Agendando…" : `Confirmar — ${hora || "sin hora"}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function InterconsultasRecepcion() {
  const [lista, setLista]           = useState<Interconsulta[]>([]);
  const [loading, setLoading]       = useState(true);
  const [seleccionada, setSeleccionada] = useState<Interconsulta | null>(null);

  const cargar = () => {
    setLoading(true);
    InterconsultaApiService.listarPendientesRecepcion()
      .then(setLista)
      .catch(() => toastError("No se pudo cargar las interconsultas"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const handleCancelar = async (ic: Interconsulta) => {
    const { value, isConfirmed } = await Swal.fire({
      title: "Cancelar interconsulta",
      text: "Indica el motivo de cancelación (opcional):",
      input: "text",
      inputPlaceholder: "Ej. Paciente no puede asistir, sin disponibilidad…",
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

  const urgentes    = lista.filter(i => i.prioridad === "urgente");
  const preferentes = lista.filter(i => i.prioridad === "preferente");
  const electivas   = lista.filter(i => i.prioridad === "electiva");
  const ordenadas   = [...urgentes, ...preferentes, ...electivas];

  return (
    <div className="irec-page">
      <div className="irec-header">
        <div>
          <h1 className="irec-title">
            <ClipboardList size={22}/> Interconsultas pendientes
          </h1>
          <p className="irec-subtitle">
            Interconsultas generadas por médicos que requieren agendamiento de cita
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={cargar}>
          <RefreshCw size={14}/> Actualizar
        </button>
      </div>

      {/* Métricas rápidas */}
      {!loading && lista.length > 0 && (
        <div className="irec-stats">
          {urgentes.length > 0 && (
            <div className="irec-stat irec-stat--danger">
              <AlertCircle size={16}/>
              <span><strong>{urgentes.length}</strong> urgente{urgentes.length > 1 ? "s" : ""}</span>
            </div>
          )}
          {preferentes.length > 0 && (
            <div className="irec-stat irec-stat--warning">
              <Hourglass size={16}/>
              <span><strong>{preferentes.length}</strong> preferente{preferentes.length > 1 ? "s" : ""}</span>
            </div>
          )}
          {electivas.length > 0 && (
            <div className="irec-stat irec-stat--info">
              <Calendar size={16}/>
              <span><strong>{electivas.length}</strong> electiva{electivas.length > 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
      )}

      {/* Contenido */}
      {loading ? (
        <div className="irec-loading">
          <div className="irec-spinner"/>
          <p>Cargando interconsultas pendientes…</p>
        </div>
      ) : lista.length === 0 ? (
        <div className="irec-empty">
          <CheckCircle2 size={40} strokeWidth={1.5}/>
          <h3>Sin interconsultas pendientes</h3>
          <p>Todas las interconsultas han sido atendidas.</p>
        </div>
      ) : (
        <div className="irec-table-wrap">
          <table className="irec-table">
            <thead>
              <tr>
                <th>Prioridad</th>
                <th>Paciente</th>
                <th>Especialidad solicitada</th>
                <th>Solicitante</th>
                <th>Diagnóstico presuntivo</th>
                <th>Motivo</th>
                <th>Fecha solicitud</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ordenadas.map(ic => {
                const pac  = ic.pacienteId;
                const prio = PRIORIDAD_META[ic.prioridad] ?? PRIORIDAD_META.electiva;
                return (
                  <tr key={ic._id} className={`irec-row irec-row--${prio.cls}`}>
                    <td>
                      <span className={`irec-badge irec-badge--${prio.cls}`}>
                        {prio.label}
                      </span>
                    </td>
                    <td>
                      <div className="irec-pac">
                        <User size={13}/>
                        <div>
                          <div className="irec-pac-nombre">{pac.nombres} {pac.apellidos}</div>
                          <div className="irec-pac-dni">DNI {pac.dni}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="irec-esp">
                        <Stethoscope size={13}/>
                        {ic.especialidadSolicitada}
                      </div>
                    </td>
                    <td className="irec-solicitante">
                      {ic.solicitanteNombre}
                      {ic.solicitanteEspecialidad && (
                        <div className="irec-solicitante-esp">{ic.solicitanteEspecialidad}</div>
                      )}
                    </td>
                    <td className="irec-diagnostico">
                      {ic.diagnosticoPresuntivo || <span className="irec-muted-text">—</span>}
                    </td>
                    <td className="irec-motivo">
                      <div className="irec-motivo-text" title={ic.motivoConsulta}>
                        {ic.motivoConsulta}
                      </div>
                    </td>
                    <td>
                      <div className="irec-fecha">
                        <Clock size={12}/>
                        {formatTS(ic.createdAt)}
                      </div>
                    </td>
                    <td>
                      <div className="irec-acciones">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => setSeleccionada(ic)}
                          title="Agendar cita para esta interconsulta"
                        >
                          <CalendarPlus size={13}/> Agendar
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleCancelar(ic)}
                          title="Cancelar esta interconsulta"
                        >
                          <X size={13}/> Cancelar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de agendamiento */}
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
