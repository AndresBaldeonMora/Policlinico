import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  FlaskConical,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
  AlertTriangle,
  Search,
  X,
  ShieldCheck,
  UserCheck,
  Upload,
  FileText,
  ExternalLink,
  RefreshCw,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Receipt,
} from "lucide-react";
import type { OrdenExamen, EstadoOrden } from "../../services/examen.service";
import { ExamenService, TIPO_EXAMEN_LABEL } from "../../services/examen.service";
import Swal from "sweetalert2";

import "./Laboratorio.css";
import "../ListaCitas/ListaCitas.css";

// ─── Helpers ─────────────────────────────────────────────────
const formatFecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });

// "YYYY-MM-DD" → "DD/MM/YYYY"
const isoADMY = (iso: string): string => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

// Today in local timezone as "YYYY-MM-DD"
const hoyISO = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// Navigate a "YYYY-MM-DD" string by ±N days
const sumarDias = (iso: string, dias: number): string => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + dias);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// "YYYY-MM-DD" → fecha larga en español (fecha local, sin desfase)
const formatFechaLocalLarga = (dateStr: string): string => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const calcularDiasRestantes = (fechaVencimiento?: string): number | null => {
  if (!fechaVencimiento) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const vence = new Date(fechaVencimiento);
  vence.setHours(0, 0, 0, 0);
  return Math.ceil((vence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
};

const IndicadorVigencia = ({ fechaVencimiento }: { fechaVencimiento?: string }) => {
  const dias = calcularDiasRestantes(fechaVencimiento);
  if (dias === null) return null;

  let clase = "lab-venc--ok";
  if (dias <= 0) clase = "lab-venc--expired";
  else if (dias <= 2) clase = "lab-venc--danger";

  const porcentaje = Math.max(0, Math.min(100, (dias / 7) * 100));

  return (
    <div className={`lab-venc ${clase}`} title={`${dias > 0 ? dias : 0} días restantes`}>
      <div className="lab-venc-bar">
        <div className="lab-venc-fill" style={{ width: `${porcentaje}%` }} />
      </div>
      <span className="lab-venc-text">
        {dias <= 0 ? "Venció" : `${dias}d`}
      </span>
    </div>
  );
};

// ─── Configuración de tabs ────────────────────────────────────
interface TabConfig {
  estado: EstadoOrden;
  label: string;
  icon: typeof Clock;
  badgeClass: string;
  color: string;
}

const TABS: TabConfig[] = [
  {
    estado: "PENDIENTE",
    label: "Por Autorizar",
    icon: Clock,
    badgeClass: "lab-badge--pending",
    color: "#d97706",
  },
  {
    estado: "EN_PROCESO",
    label: "En Vigencia",
    icon: CalendarClock,
    badgeClass: "lab-badge--process",
    color: "#2563eb",
  },
  {
    estado: "ASISTIDO",
    label: "En Análisis",
    icon: FlaskConical,
    badgeClass: "lab-badge--asistido",
    color: "#7c3aed",
  },
  {
    estado: "FINALIZADO",
    label: "Resultados Entregados",
    icon: CheckCircle,
    badgeClass: "lab-badge--done",
    color: "#059669",
  },
  {
    estado: "CANCELADA",
    label: "Canceladas",
    icon: AlertTriangle,
    badgeClass: "lab-badge--cancel",
    color: "#dc2626",
  },
];

// ─── Modal: Agendar Cita de Laboratorio (Generar Orden) ──────
const NOMBRES_MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];
const DIAS_SEMANA_SHORT = ["Lu","Ma","Mi","Ju","Vi","Sá","Do"];

interface ModalGenerarOrdenProps {
  orden: OrdenExamen;
  onCerrar: () => void;
  onGuardado: () => void;
}

const ModalGenerarOrden = ({ orden, onCerrar, onGuardado }: ModalGenerarOrdenProps) => {
  const hoy = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const tipoOrden   = orden.tipoOrden ?? "LABORATORIO";
  const esMixta     = tipoOrden === "MIXTA";
  const soloLab     = tipoOrden === "LABORATORIO";
  const soloImagen  = tipoOrden === "IMAGEN";

  // Paso 1 = LAB (para LABORATORIO o MIXTA) o IMAGEN (para solo IMAGEN)
  // Paso 2 = IMAGEN (solo para MIXTA, después de confirmar LAB)
  const [paso, setPaso] = useState<1 | 2>(1);
  const enPasoLab    = paso === 1 && !soloImagen;
  const enPasoImagen = soloImagen || (esMixta && paso === 2);

  // ── Estado LAB ──
  const [calAño, setCalAño]     = useState(() => hoy.getFullYear());
  const [calMes, setCalMes]     = useState(() => hoy.getMonth());
  const [fechaLabSel, setFechaLabSel] = useState<string | null>(null);
  const [disponibilidad, setDisponibilidad] = useState<Record<string, number>>({});
  const [capacidad, setCapacidad]   = useState(15);
  const [cargandoDisp, setCargandoDisp] = useState(true);

  // ── Estado IMAGEN ──
  const [imgFecha, setImgFecha] = useState("");
  const [imgHora, setImgHora]   = useState("08:00");
  const [salaEquipo, setSala]   = useState("");
  const [duracion, setDuracion] = useState(30);

  const [enviando, setEnviando] = useState(false);
  const [error, setError]       = useState("");

  // Cargar disponibilidad del mes visible
  useEffect(() => {
    setCargandoDisp(true);
    const desde = new Date(calAño, calMes, 1).toISOString().slice(0, 10);
    const hasta  = new Date(calAño, calMes + 1, 0).toISOString().slice(0, 10);
    ExamenService.obtenerDisponibilidadLab(desde, hasta)
      .then(({ data, capacidadDiaria }) => {
        const mapa: Record<string, number> = {};
        data.forEach((d) => { mapa[d.fecha] = d.ocupados; });
        setDisponibilidad((prev) => ({ ...prev, ...mapa }));
        setCapacidad(capacidadDiaria);
      })
      .catch(() => {})
      .finally(() => setCargandoDisp(false));
  }, [calAño, calMes]);

  // Grilla del mes (Monday-first)
  const diasDelMes = useMemo(() => {
    const primerDia = new Date(calAño, calMes, 1).getDay(); // 0=Dom
    const offset = primerDia === 0 ? 6 : primerDia - 1;
    const total = new Date(calAño, calMes + 1, 0).getDate();
    const arr: (number | null)[] = Array(offset).fill(null);
    for (let d = 1; d <= total; d++) arr.push(d);
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [calAño, calMes]);

  const getFechaKey = (dia: number) =>
    `${calAño}-${String(calMes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

  const esDomingo  = (dia: number) => new Date(calAño, calMes, dia).getDay() === 0;
  const esPasado   = (dia: number) => new Date(calAño, calMes, dia) < hoy;
  const getOcupados = (dia: number) => disponibilidad[getFechaKey(dia)] ?? 0;
  const estaLleno  = (dia: number) => getOcupados(dia) >= capacidad;
  const esBloqueado = (dia: number) => esPasado(dia) || esDomingo(dia) || estaLleno(dia);

  type EstadoDia = "pasado" | "cerrado" | "lleno" | "casi-lleno" | "disponible";
  const getEstadoDia = (dia: number): EstadoDia => {
    if (esPasado(dia)) return "pasado";
    if (esDomingo(dia)) return "cerrado";
    if (estaLleno(dia)) return "lleno";
    if (capacidad - getOcupados(dia) <= 5) return "casi-lleno";
    return "disponible";
  };

  // Navegación de meses
  const primerMesDisp = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const puedeRetroceder = new Date(calAño, calMes, 1) > primerMesDisp;

  const irMesAnterior = () => {
    if (!puedeRetroceder) return;
    setFechaLabSel(null);
    if (calMes === 0) { setCalMes(11); setCalAño((a) => a - 1); }
    else setCalMes((m) => m - 1);
  };

  const irMesSiguiente = () => {
    setFechaLabSel(null);
    if (calMes === 11) { setCalMes(0); setCalAño((a) => a + 1); }
    else setCalMes((m) => m + 1);
  };

  const handleSelDia = (dia: number) => {
    if (esBloqueado(dia)) return;
    const key = getFechaKey(dia);
    setFechaLabSel((prev) => (prev === key ? null : key));
    setError("");
  };

  // Avanzar al paso IMAGEN (solo para MIXTA)
  const handleSiguientePaso = () => {
    if (!fechaLabSel) {
      setError("Debe seleccionar una fecha para la toma de muestra.");
      return;
    }
    setError("");
    setPaso(2);
  };

  const handleConfirmar = async () => {
    if (enPasoImagen && !imgFecha) {
      setError("Debe seleccionar fecha y hora para el examen de imagenología.");
      return;
    }
    setEnviando(true);
    setError("");
    try {
      await ExamenService.autorizarOrden(orden._id, {
        fechaCitaLab:        !soloImagen ? (fechaLabSel ?? undefined) : undefined,
        citaImagenFecha:     enPasoImagen ? `${imgFecha} ${imgHora}` : undefined,
        salaEquipo:          salaEquipo || undefined,
        duracionEstimadaMin: enPasoImagen ? duracion : undefined,
      });
      onGuardado();
      onCerrar();
      Swal.fire({
        icon: "success",
        title: "Orden generada",
        html: `Orden <strong>${orden.codigoOrden ?? ""}</strong> en vigencia.
          ${!soloImagen && fechaLabSel ? `<br>Toma de muestras: <strong>${formatFechaLocalLarga(fechaLabSel)}</strong> · 7:00 a.m.` : ""}
          ${enPasoImagen && imgFecha ? `<br>Imagen: <strong>${imgFecha.split("-").reverse().join("/")} ${imgHora}</strong>${salaEquipo ? ` · ${salaEquipo}` : ""}` : ""}`,
        confirmButtonColor: "var(--primary)",
      });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "No se pudo generar la orden.");
    } finally {
      setEnviando(false);
    }
  };

  const paciente = orden.pacienteId;
  const nombrePaciente = `${paciente.nombres} ${paciente.apellidos}`;
  const infoSel = fechaLabSel
    ? { libres: capacidad - (disponibilidad[fechaLabSel] ?? 0) }
    : null;

  const tituloModal = enPasoImagen ? "Agendar Examen de Imagenología" : "Agendar Toma de Muestras";
  const subtituloModal = esMixta
    ? (paso === 1 ? "Paso 1 de 2 · Laboratorio" : "Paso 2 de 2 · Imagenología")
    : soloImagen ? "Imagenología" : "Laboratorio";

  return (
    <div className="lab-modal-overlay" onClick={onCerrar}>
      <div
        className="lab-modal-card"
        style={{ maxWidth: 520 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="lab-modal-header">
          <h3>{tituloModal}</h3>
          <p className="lab-modal-paciente">
            Orden <strong>{orden.codigoOrden}</strong> · {nombrePaciente}
            <span style={{ marginLeft: 8, fontSize: 11, color: "var(--text-muted)" }}>
              {subtituloModal}
            </span>
          </p>
        </div>

        {/* Body */}
        <div className="lab-modal-body" style={{ padding: "1.25rem 1.5rem" }}>
          {/* Nota horario LAB */}
          {enPasoLab && (
          <div className="lab-citalab-nota" style={{ marginBottom: "1.25rem" }}>
            <CalendarClock size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              <strong>Toma de muestras:</strong> Lunes a Sábado · 7:00 a.m. – 11:00 a.m.
              {" "}El paciente debe presentarse en ayuno de 8 a 12 horas previo a la toma.
            </span>
          </div>
          )}

          {/* Calendario LAB */}
          {enPasoLab && (
            <>
            <div className="lab-cal-container">
              {/* Navegación */}
              <div className="lab-cal-nav">
                <button
                  className="lab-cal-nav-btn"
                  onClick={irMesAnterior}
                  disabled={!puedeRetroceder}
                  aria-label="Mes anterior"
                  title="Mes anterior"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="lab-cal-mes-label">
                  {NOMBRES_MESES[calMes]} {calAño}
                  {cargandoDisp && (
                    <RefreshCw
                      size={12}
                      style={{ marginLeft: 6, animation: "spin 1s linear infinite", opacity: 0.5 }}
                    />
                  )}
                </span>
                <button
                  className="lab-cal-nav-btn"
                  onClick={irMesSiguiente}
                  aria-label="Mes siguiente"
                  title="Mes siguiente"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Grilla */}
              <div className="lab-cal-grid">
                {DIAS_SEMANA_SHORT.map((d) => (
                  <div key={d} className="lab-cal-dow">{d}</div>
                ))}
                {diasDelMes.map((dia, idx) => {
                  if (dia === null) return <div key={`vacio-${idx}`} aria-hidden="true" />;
                  const estado = getEstadoDia(dia);
                  const clave  = getFechaKey(dia);
                  const sel    = fechaSel === clave;
                  return (
                    <div
                      key={clave}
                      className={[
                        "lab-cal-dia",
                        `lab-cal-dia--${estado}`,
                        sel ? "lab-cal-dia--selected" : "",
                      ].join(" ")}
                      onClick={() => handleSelDia(dia)}
                      title={
                        estado === "cerrado"    ? "Laboratorio cerrado (domingo)" :
                        estado === "pasado"     ? "Fecha pasada" :
                        estado === "lleno"      ? `Sin cupos (${getOcupados(dia)}/${capacidad})` :
                        estado === "casi-lleno" ? `Solo ${capacidad - getOcupados(dia)} cupo(s) disponible(s)` :
                        `${capacidad - getOcupados(dia)} cupo(s) disponible(s)`
                      }
                    >
                      <span className="lab-cal-dia-num">{dia}</span>
                      {estado !== "pasado" && estado !== "cerrado" && (
                        <span className="lab-cal-dia-dot" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Leyenda */}
              <div className="lab-cal-leyenda">
                <span className="lab-cal-leyenda-item">
                  <span className="lab-cal-dot lab-cal-dot--disponible" /> Disponible
                </span>
                <span className="lab-cal-leyenda-item">
                  <span className="lab-cal-dot lab-cal-dot--casi-lleno" /> Pocos cupos
                </span>
                <span className="lab-cal-leyenda-item">
                  <span className="lab-cal-dot lab-cal-dot--lleno" /> Sin cupos
                </span>
              </div>
            </div>

            {/* Info de fecha seleccionada */}
            {fechaLabSel && infoSel && (
              <div className="lab-cal-seleccion">
                <div className="lab-cal-seleccion-fecha">
                  <CalendarClock size={14} />
                  <strong>{formatFechaLocalLarga(fechaLabSel)}</strong>
                  <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                    · 7:00 a.m.
                  </span>
                </div>
                <div className="lab-cal-seleccion-cupos">
                  {infoSel.libres} de {capacidad} cupos disponibles para ese día
                </div>
              </div>
            )}
            </>
          )}

          {/* Sección IMAGEN */}
          {enPasoImagen && (
            <div>
              <div className="lab-citalab-nota" style={{ marginBottom: "1.25rem" }}>
                <CalendarClock size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>
                  <strong>Examen de imagen:</strong> Selecciona el día y la hora de la cita.
                  {salaEquipo ? "" : " Sala/equipo opcional."}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <div>
                  <label className="soap-section-label" style={{ fontSize: 12 }}>Fecha <span style={{ color: "var(--danger)" }}>*</span></label>
                  <input
                    type="date"
                    className="soap-input"
                    min={new Date().toISOString().slice(0, 10)}
                    value={imgFecha}
                    onChange={e => setImgFecha(e.target.value)}
                  />
                </div>
                <div>
                  <label className="soap-section-label" style={{ fontSize: 12 }}>Hora <span style={{ color: "var(--danger)" }}>*</span></label>
                  <input
                    type="time"
                    className="soap-input"
                    value={imgHora}
                    onChange={e => setImgHora(e.target.value)}
                  />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label className="soap-section-label" style={{ fontSize: 12 }}>Sala / Equipo</label>
                  <input
                    type="text"
                    className="soap-input"
                    placeholder="Ej: Sala 1, Ecógrafo A…"
                    value={salaEquipo}
                    onChange={e => setSala(e.target.value)}
                  />
                </div>
                <div>
                  <label className="soap-section-label" style={{ fontSize: 12 }}>Duración (min)</label>
                  <input
                    type="number"
                    className="soap-input"
                    min={10}
                    max={120}
                    step={5}
                    value={duracion}
                    onChange={e => setDuracion(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          )}

          {error && (
            <p className="lab-modal-error" style={{ marginTop: "0.75rem" }}>
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="lab-modal-footer">
          <button
            className="lab-btn lab-btn--cancel"
            onClick={esMixta && paso === 2 ? () => setPaso(1) : onCerrar}
            disabled={enviando}
          >
            {esMixta && paso === 2 ? "Volver" : "Cancelar"}
          </button>
          {/* MIXTA paso 1: botón Siguiente */}
          {esMixta && paso === 1 ? (
            <button
              className="lab-btn lab-btn--primary"
              onClick={handleSiguientePaso}
              disabled={!fechaLabSel}
            >
              Siguiente →
            </button>
          ) : (
            <button
              className="lab-btn lab-btn--primary"
              onClick={handleConfirmar}
              disabled={enviando || (enPasoImagen && !imgFecha)}
            >
              {enviando ? (
                <>
                  <RefreshCw size={14} style={{ marginRight: 6, animation: "spin 1s linear infinite" }} />
                  Generando…
                </>
              ) : (
                <>
                  <ShieldCheck size={14} style={{ marginRight: 6 }} />
                  Generar Orden
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Modal: Cargar Resultados (PDF) ──────────────────────────
interface ModalResultadosProps {
  orden: OrdenExamen;
  onCerrar: () => void;
  onGuardado: () => void;
}

const ModalCargarResultados = ({ orden, onCerrar, onGuardado }: ModalResultadosProps) => {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const paciente = orden.pacienteId;
  const nombrePaciente = `${paciente.nombres} ${paciente.apellidos}`;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Solo se aceptan archivos en formato PDF.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("El archivo no debe superar los 10 MB.");
      return;
    }
    setError("");
    setArchivo(file);
  };

  const handleEnviar = async () => {
    if (!archivo) {
      setError("Debes seleccionar el archivo PDF con los resultados.");
      return;
    }
    setSubiendo(true);
    setError("");
    try {
      await ExamenService.finalizarOrden(orden._id, archivo);
      onGuardado();
      onCerrar();
      await Swal.fire({
        icon: "success",
        title: "Resultados entregados",
        text: `Los resultados han sido cargados y se ha enviado una notificación por correo electrónico a ${nombrePaciente}.`,
        confirmButtonColor: "var(--primary)",
      });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        "Ocurrió un error al cargar los resultados. Inténtelo nuevamente.";
      setError(msg);
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="lab-modal-overlay" onClick={onCerrar}>
      <div
        className="lab-modal-card"
        style={{ maxWidth: 520 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="lab-modal-header">
          <h3>Cargar Resultados de Análisis</h3>
          <p className="lab-modal-paciente">
            Orden <strong>{orden.codigoOrden}</strong> - {nombrePaciente}
          </p>
        </div>

        {/* Body */}
        <div className="lab-modal-body" style={{ padding: "1.25rem 1.5rem" }}>
          {/* Instrucciones */}
          <div className="lab-citalab-nota" style={{ marginBottom: "1.25rem" }}>
            <FileText size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              Adjunte el documento PDF con los resultados del análisis. Una vez cargado,
              el sistema enviará automáticamente una notificación al paciente con el
              informe adjunto.
            </span>
          </div>

          {/* Exámenes solicitados */}
          <div style={{ marginBottom: "1.25rem" }}>
            <p className="lab-citalab-section-title">Exámenes solicitados</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              {orden.items.map((item, idx) => {
                const ex =
                  typeof item.examenId === "object" ? item.examenId : null;
                const itemKey = (item as { _id?: string })._id ?? ex?._id ?? `cita-ex-${idx}`;
                return (
                  <div key={itemKey} className="lab-citalab-examenes">
                    <span className="lab-citalab-examenes-label">
                      {ex?.nombre ?? "—"}
                    </span>
                    {ex && (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                          background: "var(--bg-hover)",
                          padding: "0.1rem 0.4rem",
                          borderRadius: 4,
                        }}
                      >
                        {TIPO_EXAMEN_LABEL[ex.tipo] ?? ex.tipo}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Zona de carga del archivo */}
          <div
            className="lab-upload-zone"
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${archivo ? "var(--primary)" : "var(--border)"}`,
              borderRadius: "var(--radius-md)",
              padding: "1.5rem",
              textAlign: "center",
              cursor: "pointer",
              background: archivo ? "var(--primary-lighter)" : "var(--bg-body)",
              transition: "background-color 0.15s, border-color 0.15s",
            }}
          >
            <Upload
              size={28}
              style={{
                marginBottom: "0.5rem",
                color: archivo ? "var(--primary)" : "var(--text-muted)",
              }}
            />
            {archivo ? (
              <>
                <p style={{ margin: 0, fontWeight: 600, color: "var(--primary)" }}>
                  {archivo.name}
                </p>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  {(archivo.size / 1024).toFixed(1)} KB - Haga clic para cambiar
                </p>
              </>
            ) : (
              <>
                <p style={{ margin: 0, fontWeight: 500, color: "var(--text-secondary)" }}>
                  Haga clic para seleccionar el PDF de resultados
                </p>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Solo PDF · Máx. 10 MB
                </p>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              style={{ display: "none" }}
              onChange={handleFile}
            />
          </div>

          {error && (
            <p className="lab-modal-error" style={{ marginTop: "0.75rem" }}>
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="lab-modal-footer">
          <button className="lab-btn lab-btn--cancel" onClick={onCerrar} disabled={subiendo}>
            Cancelar
          </button>
          <button
            className="lab-btn lab-btn--primary"
            onClick={handleEnviar}
            disabled={!archivo || subiendo}
          >
            {subiendo ? (
              <>
                <RefreshCw size={14} style={{ marginRight: 6, animation: "spin 1s linear infinite" }} />
                Cargando resultados…
              </>
            ) : (
              <>
                <Upload size={14} style={{ marginRight: 6 }} />
                Cargar y notificar al paciente
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Modal: Pago / Nuevo Ingreso (previo al registro de asistencia) ──────────
type TipoComprobante = "BOLETA" | "FACTURA" | "OTRO" | "RECIBO";
type MedioPago = "EFECTIVO" | "TARJETA_DEBITO" | "TARJETA_CREDITO" | "TRANSFERENCIA" | "YAPE_PLIN";

interface LineaPago {
  nombre: string;
  cantidad: number;
  precioUnit: number;
  costoLab: number;
}

interface ModalPagoIngresoProps {
  orden: OrdenExamen;
  onCerrar: () => void;
  onConfirmado: () => void;
}

const MEDIOS_PAGO: { value: MedioPago; label: string }[] = [
  { value: "EFECTIVO",         label: "Efectivo" },
  { value: "TARJETA_DEBITO",   label: "Tarjeta de débito" },
  { value: "TARJETA_CREDITO",  label: "Tarjeta de crédito" },
  { value: "TRANSFERENCIA",    label: "Transferencia" },
  { value: "YAPE_PLIN",        label: "Yape / Plin" },
];

const ModalPagoIngreso = ({ orden, onCerrar, onConfirmado }: ModalPagoIngresoProps) => {
  const [lineas, setLineas] = useState<LineaPago[]>(() =>
    orden.items.map((item) => {
      const ex = typeof item.examenId === "object" ? item.examenId : null;
      return {
        nombre: ex?.nombre ?? "—",
        cantidad: 1,
        precioUnit: ex?.precio ?? 0,
        costoLab: 0,
      };
    })
  );
  const [comprobante, setComprobante] = useState<TipoComprobante>("BOLETA");
  const [medioPago, setMedioPago] = useState<MedioPago>("EFECTIVO");
  const [nota, setNota] = useState("");
  const [confirmando, setConfirmando] = useState(false);

  const paciente = orden.pacienteId;
  const doctor = orden.doctorId;

  const total = lineas.reduce(
    (sum, l) => sum + l.cantidad * l.precioUnit + l.costoLab,
    0
  );

  const updateLinea = (idx: number, campo: keyof LineaPago, valor: number) => {
    setLineas((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, [campo]: valor } : l))
    );
  };

  const removeLinea = (idx: number) => {
    setLineas((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleConfirmar = () => {
    setConfirmando(true);
    setTimeout(() => {
      setConfirmando(false);
      onConfirmado();
    }, 300);
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "0.78rem",
    color: "var(--text-muted)",
    marginBottom: "0.3rem",
    display: "block",
  };

  const campoReadonlyStyle: React.CSSProperties = {
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "0.5rem 0.75rem",
    fontSize: "0.88rem",
    background: "var(--bg-hover)",
    color: "var(--text-primary)",
    width: "100%",
    boxSizing: "border-box" as const,
  };

  const inputNumStyle: React.CSSProperties = {
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    padding: "0.3rem 0.4rem",
    fontSize: "0.83rem",
    width: "80px",
    textAlign: "right" as const,
    background: "var(--bg-body)",
  };

  return (
    <div className="lab-modal-overlay" onClick={onCerrar}>
      <div
        className="lab-modal-card"
        style={{ maxWidth: 720, position: "relative" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar */}
        <button
          onClick={onCerrar}
          style={{
            position: "absolute",
            top: 12,
            right: 14,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-muted)",
            padding: 4,
          }}
          title="Cerrar"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="lab-modal-header" style={{ paddingRight: "2rem" }}>
          <h3>Nuevo ingreso</h3>
        </div>

        {/* Body */}
        <div
          className="lab-modal-body"
          style={{ padding: "1.25rem 1.5rem" }}
        >
          {/* Paciente + Doctor */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            <div>
              <label style={labelStyle}>Paciente</label>
              <div style={campoReadonlyStyle}>
                {paciente.nombres} {paciente.apellidos}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Doctor relacionado a la venta</label>
              <div style={campoReadonlyStyle}>
                {doctor.nombres} {doctor.apellidos}
              </div>
            </div>
          </div>

          {/* Tabla de ítems */}
          <div style={{ overflowX: "auto", marginBottom: "1rem" }}>
            <table className="lab-tabla" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Ítem</th>
                  <th style={{ textAlign: "center", width: 70 }}>Cantidad</th>
                  <th style={{ textAlign: "right", width: 110 }}>Precio Unit.</th>
                  <th style={{ textAlign: "right", width: 110 }}>Subtotal</th>
                  <th style={{ width: 36 }} />
                </tr>
              </thead>
              <tbody>
                {lineas.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.82rem", padding: "0.75rem" }}>
                      Sin ítems
                    </td>
                  </tr>
                ) : (
                  lineas.map((linea, idx) => {
                    const subtotal = linea.cantidad * linea.precioUnit;
                    return (
                      <tr key={idx}>
                        <td style={{ fontSize: "0.88rem" }}>{linea.nombre}</td>
                        <td style={{ textAlign: "center" }}>
                          <input
                            type="number"
                            min={1}
                            value={linea.cantidad}
                            onChange={(e) => updateLinea(idx, "cantidad", Math.max(1, Number(e.target.value)))}
                            style={{ ...inputNumStyle, width: 60, textAlign: "center" }}
                          />
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={linea.precioUnit}
                            onChange={(e) => updateLinea(idx, "precioUnit", Math.max(0, Number(e.target.value)))}
                            style={inputNumStyle}
                          />
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 500, fontSize: "0.88rem" }}>
                          {subtotal.toFixed(2)}
                        </td>
                        <td>
                          <button
                            onClick={() => removeLinea(idx)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "#dc2626",
                              padding: "0.2rem",
                            }}
                            title="Eliminar ítem"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td
                    colSpan={3}
                    style={{
                      textAlign: "right",
                      fontWeight: 600,
                      fontSize: "0.88rem",
                      paddingTop: "0.5rem",
                      borderTop: "1px solid var(--border)",
                    }}
                  >
                    Total:
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                      color: "var(--primary)",
                      borderTop: "1px solid var(--border)",
                    }}
                  >
                    S/ {total.toFixed(2)}
                  </td>
                  <td style={{ borderTop: "1px solid var(--border)" }} />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Comprobante + Medio de pago */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1.25rem",
              marginBottom: "1rem",
              alignItems: "start",
            }}
          >
            {/* Comprobante */}
            <div>
              <label style={labelStyle}>Comprobante</label>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                {(["BOLETA", "FACTURA", "OTRO", "RECIBO"] as TipoComprobante[]).map((c) => (
                  <label
                    key={c}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      fontSize: "0.86rem",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="comprobante"
                      value={c}
                      checked={comprobante === c}
                      onChange={() => setComprobante(c)}
                      style={{ accentColor: "var(--primary)" }}
                    />
                    {c.charAt(0) + c.slice(1).toLowerCase()}
                  </label>
                ))}
              </div>
            </div>

            {/* Medio de pago */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={labelStyle}>Medio de pago</label>
              </div>
              <select
                className="lab-filtro-input"
                value={medioPago}
                onChange={(e) => setMedioPago(e.target.value as MedioPago)}
                style={{ width: "100%" }}
              >
                {MEDIOS_PAGO.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Nota administrativa */}
          <div>
            <label style={labelStyle}>Nota administrativa</label>
            <textarea
              className="lab-filtro-input"
              placeholder="Escribe aquí..."
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              rows={3}
              style={{ width: "100%", resize: "vertical", boxSizing: "border-box" }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="lab-modal-footer">
          <button className="lab-btn lab-btn--cancel" onClick={onCerrar} disabled={confirmando}>
            Cancelar
          </button>
          <button
            className="lab-btn lab-btn--primary"
            onClick={handleConfirmar}
            disabled={confirmando || lineas.length === 0}
          >
            {confirmando ? (
              <>
                <RefreshCw size={14} style={{ marginRight: 6, animation: "spin 1s linear infinite" }} />
                Procesando…
              </>
            ) : (
              <>
                <Receipt size={14} style={{ marginRight: 6 }} />
                Confirmar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Modal: Preguntas Protocolares + Registrar Asistencia ────
interface ModalAsistenciaProps {
  orden: OrdenExamen;
  onCerrar: () => void;
  onGuardado: () => void;
}

const ModalAsistencia = ({ orden, onCerrar, onGuardado }: ModalAsistenciaProps) => {
  // respuestas[itemIndex][preguntaId] = valor string
  const [respuestas, setRespuestas] = useState<Record<number, Record<string, string>>>({});
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const paciente = orden.pacienteId;
  const nombrePaciente = `${paciente.nombres} ${paciente.apellidos}`;

  // Items que tienen preguntas protocolares
  const itemsConPreguntas = orden.items
    .map((item, idx) => {
      const ex = typeof item.examenId === "object" ? item.examenId : null;
      return { item, ex, idx };
    })
    .filter(({ ex }) => ex && ex.preguntasProtocolares && ex.preguntasProtocolares.length > 0);

  const setRespuesta = (itemIdx: number, preguntaId: string, valor: string) => {
    setRespuestas((prev) => ({
      ...prev,
      [itemIdx]: { ...(prev[itemIdx] ?? {}), [preguntaId]: valor },
    }));
    setError("");
  };

  const validar = (): string | null => {
    for (const { ex, idx } of itemsConPreguntas) {
      if (!ex?.preguntasProtocolares) continue;
      for (const p of ex.preguntasProtocolares) {
        if (p.obligatoria && !respuestas[idx]?.[p.id]?.trim()) {
          return `Responda todas las preguntas obligatorias para "${ex.nombre}"`;
        }
      }
    }
    return null;
  };

  const handleConfirmar = async () => {
    const err = validar();
    if (err) { setError(err); return; }

    const respuestasPayload: { itemIndex: number; respuestas: { preguntaId: string; preguntaTexto: string; respuesta: string }[] }[] = itemsConPreguntas
      .flatMap(({ ex, idx }) => {
        const preguntasRespondidas = (ex?.preguntasProtocolares ?? [])
          .filter((p) => respuestas[idx]?.[p.id] !== undefined)
          .map((p) => ({
            preguntaId: p.id,
            preguntaTexto: p.texto,
            respuesta: respuestas[idx][p.id],
          }));
        return preguntasRespondidas.length > 0
          ? [{ itemIndex: idx, respuestas: preguntasRespondidas }]
          : [];
      });

    setEnviando(true);
    try {
      await ExamenService.registrarAsistencia(orden._id, respuestasPayload);
      onGuardado();
      onCerrar();
      Swal.fire({
        icon: "success",
        title: "Asistencia registrada",
        text: "El paciente ha sido registrado como presente. La orden pasa a análisis.",
        timer: 2500,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "No se pudo registrar la asistencia.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="lab-modal-overlay" onClick={onCerrar}>
      <div
        className="lab-modal-card"
        style={{ maxWidth: 600 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="lab-modal-header">
          <h3>Preguntas Protocolares - Registro de Asistencia</h3>
          <p className="lab-modal-paciente">
            Orden <strong>{orden.codigoOrden}</strong> - {nombrePaciente} · DNI {paciente.dni}
          </p>
        </div>

        {/* Body */}
        <div className="lab-modal-body" style={{ padding: "1.25rem 1.5rem", maxHeight: "65vh", overflowY: "auto" }}>
          {itemsConPreguntas.length === 0 ? (
            <div className="lab-citalab-nota">
              <UserCheck size={14} />
              <span>
                Ninguno de los exámenes de esta orden requiere preguntas protocolares.
                Confirme la asistencia del paciente.
              </span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {itemsConPreguntas.map(({ ex, idx }) => (
                <div key={ex?._id ?? `protocolar-${idx}`} className="lab-protocolar-seccion">
                  <div className="lab-protocolar-examen-header">
                    <FlaskConical size={14} />
                    <strong>{ex!.nombre}</strong>
                    <span className="lab-tipo-chip" style={{ fontSize: "0.72rem" }}>
                      {TIPO_EXAMEN_LABEL[ex!.tipo] ?? ex!.tipo}
                    </span>
                  </div>

                  {ex!.instrucciones && (
                    <div className="lab-protocolar-instrucciones">
                      <span>{ex!.instrucciones}</span>
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.75rem" }}>
                    {ex!.preguntasProtocolares!.map((p) => (
                      <div key={p.id} className="lab-protocolar-pregunta">
                        <label className="lab-protocolar-label">
                          {p.texto}
                          {p.obligatoria && <span className="lab-protocolar-req">*</span>}
                        </label>

                        {p.tipo === "BOOLEAN" && (
                          <div className="lab-protocolar-opciones">
                            {["Sí", "No"].map((op) => (
                              <button
                                key={op}
                                className={`lab-protocolar-opcion-btn ${
                                  respuestas[idx]?.[p.id] === op ? "selected" : ""
                                }`}
                                onClick={() => setRespuesta(idx, p.id, op)}
                              >
                                {op}
                              </button>
                            ))}
                          </div>
                        )}

                        {p.tipo === "TEXTO" && (
                          <input
                            className="lab-filtro-input"
                            placeholder="Respuesta..."
                            value={respuestas[idx]?.[p.id] ?? ""}
                            onChange={(e) => setRespuesta(idx, p.id, e.target.value)}
                          />
                        )}

                        {p.tipo === "SELECCION" && p.opciones && (
                          <select
                            className="lab-filtro-input"
                            value={respuestas[idx]?.[p.id] ?? ""}
                            onChange={(e) => setRespuesta(idx, p.id, e.target.value)}
                          >
                            <option value="">Seleccione…</option>
                            {p.opciones.map((op) => (
                              <option key={op} value={op}>{op}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <p className="lab-modal-error" style={{ marginTop: "0.75rem" }}>
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="lab-modal-footer">
          <button className="lab-btn lab-btn--cancel" onClick={onCerrar} disabled={enviando}>
            Cancelar
          </button>
          <button
            className="lab-btn lab-btn--primary"
            onClick={handleConfirmar}
            disabled={enviando}
          >
            {enviando ? (
              <>
                <RefreshCw size={14} style={{ marginRight: 6, animation: "spin 1s linear infinite" }} />
                Registrando…
              </>
            ) : (
              <>
                <UserCheck size={14} style={{ marginRight: 6 }} />
                Confirmar asistencia
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Fila de orden expandible ─────────────────────────────────
interface FilaOrdenProps {
  orden: OrdenExamen;
  tabActivo: EstadoOrden;
  onRefresh: () => void;
}

const FilaOrden = ({ orden, tabActivo, onRefresh }: FilaOrdenProps) => {
  const [abierta, setAbierta] = useState(false);
  const [cargando] = useState(false);
  const [modalResultados, setModalResultados] = useState(false);
  const [modalGenerarOrden, setModalGenerarOrden] = useState(false);
  const [modalPago, setModalPago] = useState(false);
  const [modalAsistencia, setModalAsistencia] = useState(false);

  const paciente = orden.pacienteId;
  const doctor = orden.doctorId;
  const especialidad = orden.especialidadId;
  const nombrePaciente = `${paciente.nombres} ${paciente.apellidos}`;
  const iniciales =
    (paciente.nombres[0] ?? "") + (paciente.apellidos[0] ?? "");

  // ── Acción: Generar Orden → primero abre modal de pago ──
  const handleGenerarOrden = (e: React.MouseEvent) => {
    e.stopPropagation();
    setModalPago(true);
  };

  const handlePagoConfirmado = () => {
    setModalPago(false);
    setModalGenerarOrden(true);
  };

  // ── Acción: Registrar asistencia → abre preguntas protocolares ──
  const handleRegistrarAsistencia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setModalAsistencia(true);
  };

  return (
    <>
      {/* Fila principal */}
      <div className={`lab-orden ${abierta ? "lab-orden--open" : ""}`}>
        <div
          className="lab-orden-row"
          style={{
            gridTemplateColumns: tabActivo === "EN_PROCESO"
              ? "2fr 2fr 1.5fr 1.2fr 1.5fr 2fr 24px"
              : "2fr 2fr 1.5fr 1.5fr 2fr 24px",
          }}
          onClick={() => setAbierta((v) => !v)}
        >
          {/* Paciente */}
          <div className="lab-orden-col lab-orden-paciente">
            <div className="lab-avatar">{iniciales.toUpperCase()}</div>
            <div>
              <span className="lab-nombre">{nombrePaciente}</span>
              <span className="lab-dni">DNI: {paciente.dni}</span>
            </div>
          </div>

          {/* Médico / Especialidad */}
          <div className="lab-orden-col">
            <span className="lab-text-sm">
              Dr. {doctor.nombres} {doctor.apellidos}
            </span>
            <span className="lab-text-muted">{especialidad.nombre}</span>
          </div>

          {/* Código + Fecha */}
          <div className="lab-orden-col">
            {orden.codigoOrden && (
              <span className="lab-codigo">{orden.codigoOrden}</span>
            )}
            <span className="lab-text-muted">{formatFecha(orden.fecha)}</span>
          </div>

          {/* Cita Lab (solo tab En Vigencia) */}
          {tabActivo === "EN_PROCESO" && (
            <div className="lab-orden-col lab-orden-col--center">
              {orden.fechaCitaLab ? (
                <>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--primary)" }}>
                    {formatFecha(orden.fechaCitaLab)}
                  </span>
                  <span style={{ fontSize: "0.73rem", color: "var(--text-muted)" }}>
                    7:00 a.m.
                  </span>
                </>
              ) : (
                <>
                  <IndicadorVigencia fechaVencimiento={orden.fechaVencimiento} />
                  {orden.fechaVencimiento && (
                    <span className="lab-text-muted" style={{ fontSize: "0.75rem" }}>
                      Vence {formatFecha(orden.fechaVencimiento)}
                    </span>
                  )}
                </>
              )}
            </div>
          )}

          {/* Exámenes (cantidad) */}
          <div className="lab-orden-col lab-orden-col--center">
            <span
              style={{
                background: "var(--primary-lighter)",
                color: "var(--primary)",
                padding: "0.15rem 0.55rem",
                borderRadius: 999,
                fontSize: "0.78rem",
                fontWeight: 700,
              }}
            >
              {orden.items.length}{" "}
              {orden.items.length === 1 ? "examen" : "exámenes"}
            </span>
          </div>

          {/* Acciones contextuales por tab */}
          <div
            className="lab-orden-col lab-orden-actions"
            onClick={(e) => e.stopPropagation()}
          >
            {tabActivo === "PENDIENTE" && (
              <button
                className="lab-btn lab-btn--primary lab-btn--sm"
                onClick={handleGenerarOrden}
                title="Seleccionar fecha y generar la orden de laboratorio"
              >
                <ShieldCheck size={13} style={{ marginRight: 4 }} />
                Generar Orden
              </button>
            )}

            {tabActivo === "EN_PROCESO" && (
              <button
                className="lab-btn lab-btn--primary lab-btn--sm"
                disabled={cargando}
                onClick={handleRegistrarAsistencia}
                title="Registrar que el paciente se presentó al laboratorio"
              >
                <UserCheck size={13} style={{ marginRight: 4 }} />
                Registrar asistencia
              </button>
            )}

            {tabActivo === "ASISTIDO" && (
              <button
                className="lab-btn lab-btn--primary lab-btn--sm"
                disabled={cargando}
                onClick={(e) => {
                  e.stopPropagation();
                  setModalResultados(true);
                }}
                title="Cargar PDF con resultados y notificar al paciente por correo"
              >
                <Upload size={13} style={{ marginRight: 4 }} />
                Cargar resultados
              </button>
            )}

            {tabActivo === "FINALIZADO" && orden.archivoResultadoUrl && (
              <a
                href={orden.archivoResultadoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="lab-btn lab-btn--sm"
                style={{
                  background: "var(--success-bg)",
                  color: "#059669",
                  display: "inline-flex",
                  alignItems: "center",
                  textDecoration: "none",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={13} style={{ marginRight: 4 }} />
                Ver resultados
              </a>
            )}
          </div>

          {/* Chevron */}
          <div className="lab-orden-col lab-orden-col--center">
            {abierta ? (
              <ChevronUp size={16} className="lab-chevron" />
            ) : (
              <ChevronDown size={16} className="lab-chevron" />
            )}
          </div>
        </div>

        {/* Detalle expandido */}
        {abierta && (
          <div className="lab-orden-detalle">
            {orden.observacionesGenerales && (
              <p className="lab-orden-obs">
                <strong>Indicaciones clínicas:</strong> {orden.observacionesGenerales}
              </p>
            )}

            {/* Fechas del ciclo de vida */}
            <div
              style={{
                display: "flex",
                gap: "1.5rem",
                flexWrap: "wrap",
                marginBottom: "0.75rem",
                fontSize: "0.8rem",
                color: "var(--text-muted)",
              }}
            >
              <span>Emitida: {formatFecha(orden.fecha)}</span>
              {orden.fechaAutorizacion && (
                <span>Autorizada: {formatFecha(orden.fechaAutorizacion)}</span>
              )}
              {orden.fechaCitaLab && (
                <span style={{ color: "var(--primary)", fontWeight: 600 }}>
                  Cita lab: {formatFecha(orden.fechaCitaLab)} · 7:00 a.m.
                </span>
              )}
              {orden.fechaAsistencia && (
                <span>Asistencia registrada: {formatFecha(orden.fechaAsistencia)}</span>
              )}
              {orden.fechaResultados && (
                <span>Resultados cargados: {formatFecha(orden.fechaResultados)}</span>
              )}
            </div>

            {/* Tabla de exámenes */}
            <table className="lab-tabla">
              <thead>
                <tr>
                  <th>Examen</th>
                  <th>Tipo</th>
                  <th>Instrucciones / Observaciones</th>
                  {(tabActivo === "FINALIZADO") && <th>Resultado</th>}
                </tr>
              </thead>
              <tbody>
                {orden.items.map((item, idx) => {
                  const ex =
                    typeof item.examenId === "object" ? item.examenId : null;
                  const trKey = (item as { _id?: string })._id ?? ex?._id ?? `lab-row-${idx}`;
                  return (
                    <tr key={trKey}>
                      <td style={{ fontWeight: 500 }}>
                        {ex?.nombre ?? "—"}
                      </td>
                      <td>
                        {ex && (
                          <span className="lab-tipo-chip">
                            {TIPO_EXAMEN_LABEL[ex.tipo] ?? ex.tipo}
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                        {ex?.instrucciones || item.observaciones || "—"}
                      </td>
                      {tabActivo === "FINALIZADO" && (
                        <td>
                          {item.valorResultado ? (
                            <span className="lab-resultado">
                              {item.valorResultado}
                              {item.unidadResultado
                                ? ` ${item.unidadResultado}`
                                : ""}
                            </span>
                          ) : (
                            <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                              Ver PDF adjunto
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Enlace al PDF de resultados en tab finalizado */}
            {tabActivo === "FINALIZADO" && orden.archivoResultadoUrl && (
              <div style={{ marginTop: "0.75rem" }}>
                <a
                  href={orden.archivoResultadoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lab-archivo-link"
                >
                  <FileText size={14} />
                  Descargar informe de resultados (PDF)
                </a>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Modal generar orden (selector de fecha) */}
      {modalGenerarOrden && (
        <ModalGenerarOrden
          orden={orden}
          onCerrar={() => setModalGenerarOrden(false)}
          onGuardado={onRefresh}
        />
      )}

      {/* Modal pago / nuevo ingreso (previo a registrar asistencia) */}
      {modalPago && (
        <ModalPagoIngreso
          orden={orden}
          onCerrar={() => setModalPago(false)}
          onConfirmado={handlePagoConfirmado}
        />
      )}

      {/* Modal cargar resultados */}
      {modalResultados && (
        <ModalCargarResultados
          orden={orden}
          onCerrar={() => setModalResultados(false)}
          onGuardado={onRefresh}
        />
      )}

      {/* Modal preguntas protocolares + asistencia */}
      {modalAsistencia && (
        <ModalAsistencia
          orden={orden}
          onCerrar={() => setModalAsistencia(false)}
          onGuardado={onRefresh}
        />
      )}
    </>
  );
};

// ─── Página principal ─────────────────────────────────────────
export default function LaboratorioImagen() {
  const [tabActivo, setTabActivo] = useState<EstadoOrden>("PENDIENTE");
  const [ordenes, setOrdenes] = useState<OrdenExamen[]>([]);
  const [conteos, setConteos] = useState<Partial<Record<EstadoOrden, number>>>({});
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [fechaFiltro, setFechaFiltro] = useState<string>(hoyISO());
  const fechaInputRef = useRef<HTMLInputElement>(null);
  const [actualizando, setActualizando] = useState(false);
  const inicializado = useRef(false);

  // ── Cargar conteos de todos los estados ──
  const cargarConteos = useCallback(async () => {
    try {
      const estados: EstadoOrden[] = [
        "PENDIENTE",
        "EN_PROCESO",
        "ASISTIDO",
        "FINALIZADO",
        "CANCELADA",
      ];
      const resultados = await Promise.all(
        estados.map((e) => ExamenService.listarPorEstado(e))
      );
      const nuevosConteos: Partial<Record<EstadoOrden, number>> = {};
      estados.forEach((e, i) => {
        nuevosConteos[e] = resultados[i].length;
      });
      setConteos(nuevosConteos);
    } catch {
      // silencioso
    }
  }, []);

  // ── Cargar órdenes del tab activo ──
  const cargarOrdenes = useCallback(
    async (estado: EstadoOrden) => {
      setCargando(true);
      setError("");
      try {
        const data = await ExamenService.listarPorEstado(estado);
        setOrdenes(data);
      } catch {
        setError("No se pudieron cargar las órdenes. Verifique su conexión e intente nuevamente.");
      } finally {
        setCargando(false);
      }
    },
    []
  );

  // ── Inicialización: procesar vencidas, luego cargar datos ──
  useEffect(() => {
    if (inicializado.current) return;
    inicializado.current = true;

    const inicializar = async () => {
      try {
        await ExamenService.procesarVencidas();
      } catch {
        // No bloquea la UI
      }
      await Promise.all([cargarOrdenes("PENDIENTE"), cargarConteos()]);
    };
    inicializar();
  }, [cargarOrdenes, cargarConteos]);

  // ── Cambio de tab ──
  const cambiarTab = (estado: EstadoOrden) => {
    setTabActivo(estado);
    setBusqueda("");
    cargarOrdenes(estado);
  };

  // ── Actualizar manualmente ──
  const handleActualizar = async () => {
    setActualizando(true);
    try {
      await ExamenService.procesarVencidas();
      await Promise.all([cargarOrdenes(tabActivo), cargarConteos()]);
    } finally {
      setActualizando(false);
    }
  };

  // ── Callback tras una acción en una fila ──
  const handleRefresh = () => {
    cargarOrdenes(tabActivo);
    cargarConteos();
  };

  // ── Filtrar por fecha y búsqueda local ──
  const ordenesFiltradas = ordenes.filter((o) => {
    if (fechaFiltro) {
      const fechaOrden = (o.fecha ?? "").slice(0, 10);
      if (fechaOrden !== fechaFiltro) return false;
    }
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    const p = o.pacienteId;
    return (
      `${p.nombres} ${p.apellidos}`.toLowerCase().includes(q) ||
      p.dni.includes(q) ||
      (o.codigoOrden ?? "").toLowerCase().includes(q)
    );
  });

  const tabInfo = TABS.find((t) => t.estado === tabActivo)!;

  return (
    <div className="lab-page">
      {/* ── Header ── */}
      <div className="lab-header">
        <div className="lab-header-title">
          <FlaskConical size={28} className="lab-header-icon" />
          <div>
            <h1>Gestión de Órdenes de Análisis Clínicos</h1>
            <p>Autorización, seguimiento y entrega de resultados de exámenes de laboratorio</p>
          </div>
        </div>
        <button
          className="lab-btn lab-btn--cancel lab-btn--sm"
          onClick={handleActualizar}
          disabled={actualizando || cargando}
          title="Actualizar y procesar vencimientos"
        >
          <RefreshCw
            size={14}
            style={{
              marginRight: 5,
              animation: actualizando ? "spin 1s linear infinite" : undefined,
            }}
          />
          {actualizando ? "Actualizando…" : "Actualizar"}
        </button>
      </div>

      {/* ── Tabs de estado ── */}
      <div className="lab-filtros" role="tablist">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const activo = tabActivo === tab.estado;
          return (
            <button
              key={tab.estado}
              role="tab"
              aria-selected={activo}
              className={`lab-filtro-btn ${activo ? "active" : ""}`}
              onClick={() => cambiarTab(tab.estado)}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              {conteos[tab.estado] !== undefined && (
                <span className="lab-filtro-count">{conteos[tab.estado]}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Filtros ── */}
      <div className="lab-filtros-avanzados">
        {/* Navegador de fecha */}
        <div className="lab-filtro-campo">
          <label className="lab-filtro-label">Fecha</label>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button
              className="lab-cal-nav-btn"
              onClick={() => setFechaFiltro((f) => sumarDias(f, -1))}
              title="Día anterior"
            >
              <ChevronLeft size={15} />
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
                color: "var(--text-primary)",
                background: "var(--bg-body)",
                minWidth: 112,
                textAlign: "center",
                pointerEvents: "none",
                userSelect: "none",
                display: "inline-block",
              }}>
                {isoADMY(fechaFiltro)}
              </span>
              <input
                ref={fechaInputRef}
                type="date"
                value={fechaFiltro}
                onChange={(e) => setFechaFiltro(e.target.value)}
                style={{ position: "absolute", inset: 0, opacity: 0, pointerEvents: "none", width: "100%", height: "100%" }}
              />
            </div>
            <button
              className="lab-cal-nav-btn"
              onClick={() => setFechaFiltro((f) => sumarDias(f, 1))}
              title="Día siguiente"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        {/* Buscador */}
        <div className="lab-filtro-campo" style={{ flex: 1, minWidth: 240 }}>
          <label className="lab-filtro-label">Buscar en {tabInfo.label}</label>
          <div style={{ position: "relative", width: "100%" }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                left: "0.65rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
                pointerEvents: "none",
              }}
            />
            <input
              className="lab-filtro-input"
              placeholder="Nombre, DNI o código de orden…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ paddingLeft: "2.2rem" }}
            />
          </div>
        </div>

        {busqueda && (
          <button
            className="lab-btn-limpiar"
            onClick={() => setBusqueda("")}
            style={{ alignSelf: "flex-end" }}
          >
            <X size={13} />
            Limpiar
          </button>
        )}
        <span
          className="lab-resultados-info"
          style={{ alignSelf: "flex-end", paddingBottom: "0.1rem" }}
        >
          {ordenesFiltradas.length}{" "}
          {ordenesFiltradas.length === 1 ? "resultado" : "resultados"}
        </span>
      </div>

      {/* ── Contenido del tab ── */}
      {cargando ? (
        <div className="lab-loading">
          <RefreshCw size={24} style={{ animation: "spin 1s linear infinite" }} />
          <span>Cargando órdenes…</span>
        </div>
      ) : error ? (
        <div className="lab-error">
          <AlertTriangle size={24} />
          <span>{error}</span>
        </div>
      ) : ordenesFiltradas.length === 0 ? (
        <div className="lab-empty">
          {tabInfo.icon && <tabInfo.icon size={32} style={{ opacity: 0.3 }} />}
          <span>
            {busqueda
              ? "No se encontraron órdenes con ese criterio de búsqueda."
              : `No hay órdenes en la sección "${tabInfo.label}".`}
          </span>
        </div>
      ) : (
        <div className="lab-lista">
          {/* Cabecera */}
          <div
            className="lab-lista-header"
            style={{
              gridTemplateColumns:
                tabActivo === "EN_PROCESO"
                  ? "2fr 2fr 1.5fr 1.2fr 1.5fr 2fr 24px"
                  : "2fr 2fr 1.5fr 1.5fr 2fr 24px",
            }}
          >
            <span>Paciente</span>
            <span>Médico / Especialidad</span>
            <span>Código / Fecha</span>
            {tabActivo === "EN_PROCESO" && <span>Cita Lab</span>}
            <span className="center">Exámenes</span>
            <span className="center">Acción</span>
            <span />
          </div>

          {ordenesFiltradas.map((orden) => (
            <FilaOrden
              key={orden._id}
              orden={orden}
              tabActivo={tabActivo}
              onRefresh={handleRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}
