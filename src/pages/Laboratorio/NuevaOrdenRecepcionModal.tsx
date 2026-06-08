import { useEffect, useState, useMemo } from "react";
import {
  X, User, Stethoscope, FlaskConical, CalendarCheck,
  CreditCard, CheckCircle, ChevronRight, ChevronLeft,
  Search, Printer,
} from "lucide-react";
import { ExamenService, TIPO_EXAMEN_LABEL, TIPO_EXAMEN_CATEGORIA } from "../../services/examen.service";
import type { ExamenLaboratorioImagen, TipoExamen } from "../../services/examen.service";
import { PacienteApiService } from "../../services/paciente.service";
import type { PacienteTransformado } from "../../services/paciente.service";
import { DoctorApiService } from "../../services/doctor.service";
import type { DoctorTransformado } from "../../services/doctor.service";
import AgregarPacienteSimple from "../ReservaCita/AgregarPacienteSimple";
import Swal from "sweetalert2";
import "./NuevaOrdenRecepcionModal.css";

// ─── helpers ──────────────────────────────────────────────────────────────────
const hoyISO = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const isoADMY = (iso: string): string => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

type Paso = 1 | 2 | 3 | 4 | 5;
type MetodoPago = "EFECTIVO" | "TARJETA" | "TRANSFERENCIA";

const PASOS = [
  { num: 1, label: "Paciente",  icon: User },
  { num: 2, label: "Médico",    icon: Stethoscope },
  { num: 3, label: "Exámenes",  icon: FlaskConical },
  { num: 4, label: "Programa",  icon: CalendarCheck },
  { num: 5, label: "Pago",      icon: CreditCard },
] as const;

interface Props {
  onCerrar: () => void;
  onOrdenCreada: (ordenId: string) => void;
}

export const NuevaOrdenRecepcionModal = ({ onCerrar, onOrdenCreada }: Props) => {
  const [paso, setPaso] = useState<Paso>(1);
  const [guardando, setGuardando] = useState(false);

  // Paso 1 – paciente
  const [pacientes, setPacientes]         = useState<PacienteTransformado[]>([]);
  const [busqPaciente, setBusqPaciente]   = useState("");
  const [pacienteSelec, setPacienteSelec] = useState<PacienteTransformado | null>(null);
  const [creandoPaciente, setCreandoPaciente] = useState(false);

  // Paso 2 – médico
  const [doctores, setDoctores]       = useState<DoctorTransformado[]>([]);
  const [busqDoctor, setBusqDoctor]   = useState("");
  const [doctorSelec, setDoctorSelec] = useState<DoctorTransformado | null>(null);

  // Paso 3 – exámenes
  const [examenes, setExamenes]             = useState<ExamenLaboratorioImagen[]>([]);
  const [seleccionados, setSeleccionados]   = useState<Set<string>>(new Set());
  const [obsItem, setObsItem]               = useState<Record<string, string>>({});
  const [obsGenerales, setObsGenerales]     = useState("");
  const [gruposAbiertos, setGruposAbiertos] = useState<Set<string>>(new Set());
  const [busqExamen, setBusqExamen]         = useState("");

  // Paso 4 – programación
  const [fechaLab, setFechaLab]         = useState(hoyISO());
  const [fechaImagen, setFechaImagen]   = useState(`${hoyISO()} 08:00`);
  const [salaEquipo, setSalaEquipo]     = useState("");
  const [duracion, setDuracion]         = useState(30);

  // Paso 5 – pago
  const [metodoPago, setMetodoPago]   = useState<MetodoPago>("EFECTIVO");
  const [monto, setMonto]             = useState("");

  // ── Cargar datos base ──────────────────────────────────────────────────────
  useEffect(() => {
    PacienteApiService.listar().then(setPacientes).catch(() => {});
    DoctorApiService.listar().then(setDoctores).catch(() => {});
    ExamenService.listarExamenes().then((data) => {
      setExamenes(data);
      const tipos = [...new Set(data.map((e) => e.tipo))];
      if (tipos.length) setGruposAbiertos(new Set([tipos[0]]));
    }).catch(() => {});
  }, []);

  // ── Tipo de orden detectado ────────────────────────────────────────────────
  const tipoOrden = useMemo(() => {
    const IMAGEN_TIPOS: TipoExamen[] = ["RADIOGRAFIA","ECOGRAFIA","TOMOGRAFIA","RESONANCIA","ELECTROCARDIOGRAMA"];
    const selArray = [...seleccionados];
    const exSel = examenes.filter((e) => selArray.includes(e._id));
    const tieneImagen = exSel.some((e) => IMAGEN_TIPOS.includes(e.tipo));
    const tieneLab    = exSel.some((e) => !IMAGEN_TIPOS.includes(e.tipo));
    if (tieneImagen && tieneLab) return "MIXTA";
    if (tieneImagen) return "IMAGEN";
    return "LABORATORIO";
  }, [seleccionados, examenes]);

  const necesitaLab    = tipoOrden === "LABORATORIO" || tipoOrden === "MIXTA";
  const necesitaImagen = tipoOrden === "IMAGEN"      || tipoOrden === "MIXTA";

  // ── Precio estimado ────────────────────────────────────────────────────────
  const precioEstimado = useMemo(() => {
    return examenes
      .filter((e) => seleccionados.has(e._id) && e.precio)
      .reduce((sum, e) => sum + (e.precio ?? 0), 0);
  }, [seleccionados, examenes]);

  // ── Filtros de lista ───────────────────────────────────────────────────────
  const pacientesFiltrados = useMemo(() => {
    const q = busqPaciente.toLowerCase();
    return pacientes.filter(
      (p) =>
        `${p.nombres} ${p.apellidos}`.toLowerCase().includes(q) ||
        p.dni?.toLowerCase().includes(q)
    );
  }, [pacientes, busqPaciente]);

  const doctoresFiltrados = useMemo(() => {
    const q = busqDoctor.toLowerCase();
    return doctores.filter(
      (d) =>
        `${d.nombres} ${d.apellidos}`.toLowerCase().includes(q) ||
        d.especialidad?.toLowerCase().includes(q)
    );
  }, [doctores, busqDoctor]);

  const examenesTotalesFiltrados = useMemo(() => {
    const q = busqExamen.toLowerCase();
    return examenes.filter(
      (e) => e.nombre.toLowerCase().includes(q) || TIPO_EXAMEN_LABEL[e.tipo].toLowerCase().includes(q)
    );
  }, [examenes, busqExamen]);

  const grupos = useMemo(() => {
    return examenesTotalesFiltrados.reduce<Record<string, ExamenLaboratorioImagen[]>>((acc, ex) => {
      if (!acc[ex.tipo]) acc[ex.tipo] = [];
      acc[ex.tipo].push(ex);
      return acc;
    }, {});
  }, [examenesTotalesFiltrados]);

  // ── Navegación entre pasos ─────────────────────────────────────────────────
  const puedeAvanzar = (): boolean => {
    if (paso === 1) return pacienteSelec !== null;
    if (paso === 2) return doctorSelec !== null;
    if (paso === 3) return seleccionados.size > 0;
    if (paso === 4) {
      if (necesitaLab    && !fechaLab)    return false;
      if (necesitaImagen && !fechaImagen) return false;
      return true;
    }
    return true;
  };

  const avanzar = () => { if (puedeAvanzar() && paso < 5) setPaso((p) => (p + 1) as Paso); };
  const retroceder = () => { if (paso > 1) setPaso((p) => (p - 1) as Paso); };

  // ── Confirmar orden ────────────────────────────────────────────────────────
  const confirmar = async () => {
    if (!pacienteSelec || !doctorSelec || seleccionados.size === 0) return;
    setGuardando(true);
    try {
      const items = [...seleccionados].map((id) => ({
        examenId: id,
        observaciones: obsItem[id] || "",
      }));

      // Convertir fechas a formato DD/MM/YYYY [HH:mm]
      const [fy, fm, fd] = fechaLab.split("-");
      const fechaCitaLab = necesitaLab ? `${fd}/${fm}/${fy}` : undefined;

      let citaImagenFechaFmt: string | undefined;
      if (necesitaImagen) {
        const [datePart, timePart] = fechaImagen.split(" ");
        const [iy, im, id_] = datePart.split("-");
        citaImagenFechaFmt = `${id_}/${im}/${iy} ${timePart ?? "08:00"}`;
      }

      const orden = await ExamenService.crearOrdenRecepcion({
        pacienteId:     pacienteSelec.id,
        doctorId:       doctorSelec.id,
        especialidadId: doctorSelec.especialidadId,
        items,
        observacionesGenerales: obsGenerales,
        fechaCitaLab,
        citaImagenFecha: citaImagenFechaFmt,
        salaEquipo:      salaEquipo || undefined,
        duracionEstimadaMin: necesitaImagen ? duracion : undefined,
        metodoPago,
        montoPagado:     monto ? parseFloat(monto) : undefined,
      });

      onOrdenCreada(orden._id);
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "Error", text: err.message ?? "No se pudo crear la orden", confirmButtonColor: "var(--primary)" });
    } finally {
      setGuardando(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="nor-overlay">
      <div className="nor-card">
        {/* Header */}
        <div className="nor-header">
          <div className="nor-header-title">
            <FlaskConical size={20} className="nor-header-icon" />
            <div>
              <h3>Nueva Orden de Exámenes</h3>
              <p>Autorización directa por recepción</p>
            </div>
          </div>
          <button className="nor-close" onClick={onCerrar}><X size={18} /></button>
        </div>

        {/* Stepper */}
        <div className="nor-stepper">
          {PASOS.map((p, i) => {
            const Ic = p.icon;
            const activo = paso === p.num;
            const completado = paso > p.num;
            return (
              <div key={p.num} className="nor-step-wrap">
                <div className={`nor-step ${activo ? "nor-step--active" : ""} ${completado ? "nor-step--done" : ""}`}>
                  <div className="nor-step-circle">
                    {completado ? <CheckCircle size={14} /> : <Ic size={14} />}
                  </div>
                  <span className="nor-step-label">{p.label}</span>
                </div>
                {i < PASOS.length - 1 && <div className={`nor-step-line ${completado ? "nor-step-line--done" : ""}`} />}
              </div>
            );
          })}
        </div>

        {/* Contenido */}
        <div className="nor-body">

          {/* ── Paso 1: Paciente ── */}
          {paso === 1 && (
            <div className="nor-paso">
              <h4 className="nor-paso-titulo"><User size={16} /> Seleccionar Paciente</h4>
              <div className="nor-search-wrap">
                <Search size={15} className="nor-search-icon" />
                <input
                  className="nor-search"
                  placeholder="Buscar por nombre o DNI…"
                  value={busqPaciente}
                  autoFocus
                  onChange={(e) => {
                    const v = e.target.value;
                    // Si son solo dígitos, limitar a 8; letras sin límite
                    if (/^\d+$/.test(v) && v.length > 8) return;
                    setBusqPaciente(v);
                  }}
                />
              </div>
              <div className="nor-lista">
                {pacientesFiltrados.slice(0, 50).map((p) => (
                  <button
                    key={p.id}
                    className={`nor-item ${pacienteSelec?.id === p.id ? "nor-item--active" : ""}`}
                    onClick={() => setPacienteSelec(p)}
                  >
                    <div className="nor-item-avatar">{(p.nombres?.[0] ?? "P").toUpperCase()}</div>
                    <div className="nor-item-info">
                      <span className="nor-item-name">{p.nombres} {p.apellidos}</span>
                      <span className="nor-item-sub">DNI: {p.dni}</span>
                    </div>
                    {pacienteSelec?.id === p.id && <CheckCircle size={16} className="nor-item-check" />}
                  </button>
                ))}
                {pacientesFiltrados.length === 0 && busqPaciente.trim() && (
                  <div className="nor-no-encontrado">
                    <p className="nor-empty">No se encontró ningún paciente con ese criterio.</p>
                    <button
                      className="nor-btn-crear-paciente"
                      onClick={() => setCreandoPaciente(true)}
                    >
                      <User size={14} /> Crear nuevo paciente
                      {/^\d{8}$/.test(busqPaciente.trim()) && (
                        <span className="nor-dni-hint"> con DNI {busqPaciente.trim()}</span>
                      )}
                    </button>
                  </div>
                )}
                {pacientesFiltrados.length === 0 && !busqPaciente.trim() && (
                  <p className="nor-empty">Escribe un nombre o DNI para buscar</p>
                )}
              </div>
            </div>
          )}

          {/* Sub-modal: crear paciente */}
          {creandoPaciente && (
            <AgregarPacienteSimple
              dniInicial={/^\d{8}$/.test(busqPaciente.trim()) ? busqPaciente.trim() : ""}
              onCancelar={() => setCreandoPaciente(false)}
              onPacienteCreado={async () => {
                setCreandoPaciente(false);
                // Recargar lista y seleccionar el recién creado
                const lista = await PacienteApiService.listar();
                setPacientes(lista);
                // Buscar por el DNI ingresado si aplica
                const recien = lista.find((p) =>
                  /^\d{8}$/.test(busqPaciente.trim())
                    ? p.dni === busqPaciente.trim()
                    : `${p.nombres} ${p.apellidos}`.toLowerCase().includes(busqPaciente.toLowerCase())
                );
                if (recien) setPacienteSelec(recien);
              }}
            />
          )}

          {/* ── Paso 2: Médico ── */}
          {paso === 2 && (
            <div className="nor-paso">
              <h4 className="nor-paso-titulo"><Stethoscope size={16} /> Médico Responsable</h4>
              <div className="nor-search-wrap">
                <Search size={15} className="nor-search-icon" />
                <input
                  className="nor-search"
                  placeholder="Buscar por nombre o especialidad…"
                  value={busqDoctor}
                  onChange={(e) => setBusqDoctor(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="nor-lista">
                {doctoresFiltrados.slice(0, 50).map((d) => (
                  <button
                    key={d.id}
                    className={`nor-item ${doctorSelec?.id === d.id ? "nor-item--active" : ""}`}
                    onClick={() => setDoctorSelec(d)}
                  >
                    <div className="nor-item-avatar nor-item-avatar--doc">{(d.nombres?.[0] ?? "M").toUpperCase()}</div>
                    <div className="nor-item-info">
                      <span className="nor-item-name">Dr(a). {d.nombres} {d.apellidos}</span>
                      <span className="nor-item-sub">{d.especialidad} · CMP {d.cmp}</span>
                    </div>
                    {doctorSelec?.id === d.id && <CheckCircle size={16} className="nor-item-check" />}
                  </button>
                ))}
                {doctoresFiltrados.length === 0 && (
                  <p className="nor-empty">No se encontraron médicos</p>
                )}
              </div>
            </div>
          )}

          {/* ── Paso 3: Exámenes ── */}
          {paso === 3 && (
            <div className="nor-paso">
              <h4 className="nor-paso-titulo"><FlaskConical size={16} /> Seleccionar Exámenes</h4>
              <div className="nor-search-wrap">
                <Search size={15} className="nor-search-icon" />
                <input
                  className="nor-search"
                  placeholder="Buscar examen…"
                  value={busqExamen}
                  onChange={(e) => setBusqExamen(e.target.value)}
                />
              </div>

              {seleccionados.size > 0 && (
                <div className="nor-selec-badge">
                  {seleccionados.size} examen{seleccionados.size > 1 ? "es" : ""} seleccionado{seleccionados.size > 1 ? "s" : ""}
                  {precioEstimado > 0 && <span> · S/ {precioEstimado.toFixed(2)}</span>}
                </div>
              )}

              <div className="nor-examenes-scroll">
                {Object.entries(grupos).map(([tipo, exs]) => {
                  const abierto = gruposAbiertos.has(tipo);
                  const cat = TIPO_EXAMEN_CATEGORIA[tipo as TipoExamen];
                  return (
                    <div key={tipo} className="nor-grupo">
                      <button
                        className="nor-grupo-header"
                        data-open={abierto ? "true" : "false"}
                        onClick={() => setGruposAbiertos((prev) => {
                          const next = new Set(prev);
                          next.has(tipo) ? next.delete(tipo) : next.add(tipo);
                          return next;
                        })}
                      >
                        <span className={`nor-grupo-cat nor-grupo-cat--${cat.toLowerCase()}`}>{cat}</span>
                        <span className="nor-grupo-nombre">{TIPO_EXAMEN_LABEL[tipo as TipoExamen]}</span>
                        <span className="nor-grupo-count">{exs.filter((e) => seleccionados.has(e._id)).length}/{exs.length}</span>
                        <span className="nor-grupo-arrow">{abierto ? "▲" : "▼"}</span>
                      </button>
                      {abierto && (
                        <div className="nor-grupo-body">
                          {exs.map((ex) => {
                            const sel = seleccionados.has(ex._id);
                            return (
                              <div key={ex._id} className={`nor-examen-row ${sel ? "nor-examen-row--sel" : ""}`}>
                                <label className="nor-examen-check-wrap">
                                  <input
                                    type="checkbox"
                                    checked={sel}
                                    onChange={() => {
                                      setSeleccionados((prev) => {
                                        const next = new Set(prev);
                                        next.has(ex._id) ? next.delete(ex._id) : next.add(ex._id);
                                        return next;
                                      });
                                    }}
                                  />
                                  <span className="nor-examen-nombre">{ex.nombre}</span>
                                  {ex.precio && <span className="nor-examen-precio">S/ {ex.precio.toFixed(2)}</span>}
                                </label>
                                {sel && (
                                  <input
                                    className="nor-examen-obs"
                                    placeholder="Observaciones (opcional)"
                                    value={obsItem[ex._id] ?? ""}
                                    onChange={(e) => setObsItem((prev) => ({ ...prev, [ex._id]: e.target.value }))}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <textarea
                className="nor-obs-generales"
                placeholder="Observaciones generales de la orden (opcional)…"
                value={obsGenerales}
                onChange={(e) => setObsGenerales(e.target.value)}
                rows={2}
              />
            </div>
          )}

          {/* ── Paso 4: Programación ── */}
          {paso === 4 && (
            <div className="nor-paso">
              <h4 className="nor-paso-titulo"><CalendarCheck size={16} /> Programar Cita</h4>
              <div className="nor-tipo-badge nor-tipo-badge--{tipoOrden.toLowerCase()}">
                Tipo de orden: <strong>{tipoOrden}</strong>
              </div>

              {necesitaLab && (
                <div className="nor-field-group">
                  <label className="nor-label">Fecha de toma de muestra (Laboratorio)</label>
                  <input
                    type="date"
                    className="nor-input"
                    value={fechaLab}
                    min={hoyISO()}
                    onChange={(e) => setFechaLab(e.target.value)}
                  />
                </div>
              )}

              {necesitaImagen && (
                <>
                  <div className="nor-field-group">
                    <label className="nor-label">Fecha y hora de cita (Imagenología)</label>
                    <input
                      type="datetime-local"
                      className="nor-input"
                      value={fechaImagen}
                      min={`${hoyISO()}T00:00`}
                      onChange={(e) => setFechaImagen(e.target.value)}
                    />
                  </div>
                  <div className="nor-row-2">
                    <div className="nor-field-group">
                      <label className="nor-label">Sala / Equipo (opcional)</label>
                      <input
                        className="nor-input"
                        placeholder="Ej: Sala de Rayos X"
                        value={salaEquipo}
                        onChange={(e) => setSalaEquipo(e.target.value)}
                      />
                    </div>
                    <div className="nor-field-group">
                      <label className="nor-label">Duración estimada (min)</label>
                      <input
                        type="number"
                        className="nor-input"
                        min={5}
                        max={180}
                        value={duracion}
                        onChange={(e) => setDuracion(Number(e.target.value))}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Paso 5: Pago y Confirmación ── */}
          {paso === 5 && (
            <div className="nor-paso">
              <h4 className="nor-paso-titulo"><CreditCard size={16} /> Pago y Confirmación</h4>

              {/* Resumen */}
              <div className="nor-resumen">
                <div className="nor-resumen-fila">
                  <span className="nor-resumen-lbl">Paciente</span>
                  <span className="nor-resumen-val">{pacienteSelec?.nombres} {pacienteSelec?.apellidos}</span>
                </div>
                <div className="nor-resumen-fila">
                  <span className="nor-resumen-lbl">Médico</span>
                  <span className="nor-resumen-val">Dr(a). {doctorSelec?.nombres} {doctorSelec?.apellidos}</span>
                </div>
                <div className="nor-resumen-fila">
                  <span className="nor-resumen-lbl">Tipo</span>
                  <span className="nor-resumen-val">{tipoOrden}</span>
                </div>
                <div className="nor-resumen-fila">
                  <span className="nor-resumen-lbl">Exámenes</span>
                  <span className="nor-resumen-val">{seleccionados.size} examen{seleccionados.size > 1 ? "es" : ""}</span>
                </div>
                {necesitaLab && (
                  <div className="nor-resumen-fila">
                    <span className="nor-resumen-lbl">Fecha Lab</span>
                    <span className="nor-resumen-val">{isoADMY(fechaLab)}</span>
                  </div>
                )}
                {necesitaImagen && (
                  <div className="nor-resumen-fila">
                    <span className="nor-resumen-lbl">Cita Imagen</span>
                    <span className="nor-resumen-val">{fechaImagen.replace("T", " ")}</span>
                  </div>
                )}
                {precioEstimado > 0 && (
                  <div className="nor-resumen-fila nor-resumen-fila--total">
                    <span className="nor-resumen-lbl">Total estimado</span>
                    <span className="nor-resumen-val">S/ {precioEstimado.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Pago */}
              <div className="nor-pago-metodos">
                {(["EFECTIVO", "TARJETA", "TRANSFERENCIA"] as MetodoPago[]).map((m) => (
                  <button
                    key={m}
                    className={`nor-pago-btn ${metodoPago === m ? "nor-pago-btn--active" : ""}`}
                    onClick={() => setMetodoPago(m)}
                  >
                    {m === "EFECTIVO" ? "💵 Efectivo" : m === "TARJETA" ? "💳 Tarjeta" : "🏦 Transferencia"}
                  </button>
                ))}
              </div>

              <div className="nor-field-group">
                <label className="nor-label">Monto pagado (S/)</label>
                <input
                  type="number"
                  className="nor-input"
                  placeholder={precioEstimado > 0 ? precioEstimado.toFixed(2) : "0.00"}
                  value={monto}
                  min={0}
                  step={0.01}
                  onChange={(e) => setMonto(e.target.value)}
                />
              </div>

              <div className="nor-confirm-note">
                <CheckCircle size={14} />
                Al confirmar, la orden se creará directamente <strong>En Vigencia</strong>. Se podrá imprimir de inmediato.
              </div>
            </div>
          )}
        </div>

        {/* Footer de navegación */}
        <div className="nor-footer">
          <button className="nor-btn-back" onClick={retroceder} disabled={paso === 1}>
            <ChevronLeft size={16} /> Atrás
          </button>

          <div className="nor-footer-right">
            {paso < 5 ? (
              <button
                className="nor-btn-next"
                onClick={avanzar}
                disabled={!puedeAvanzar()}
              >
                Siguiente <ChevronRight size={16} />
              </button>
            ) : (
              <button
                className="nor-btn-confirm"
                onClick={confirmar}
                disabled={guardando}
              >
                {guardando ? (
                  "Creando orden…"
                ) : (
                  <><Printer size={16} /> Confirmar e Imprimir</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
