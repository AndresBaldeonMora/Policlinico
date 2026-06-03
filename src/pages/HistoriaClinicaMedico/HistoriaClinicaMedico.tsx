import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Phone, Mail, BookOpen,
  FlaskConical, Pill, Stethoscope, Calendar,
  ChevronDown, ChevronRight, FileText,
  AlertTriangle, Activity, Scissors, Users,
  ChevronLeft, MessageCircle, MoreVertical,
  Camera, Download, GitMerge, PowerOff, Trash2,
} from "lucide-react";
import { MedicoApiService } from "../../services/medico.service";
import { PacienteApiService } from "../../services/paciente.service";
import { useAuth } from "../../hooks/userAuth";
import HistoriaClinicaTabs from "./HistoriaClinicaTabs";
import "./HistoriaClinicaMedico.css";
import { fmtEstado } from "../../utils/fecha.utils";

type Tab = "consultas" | "antecedentes" | "fisiologicos" | "familiares" | "habitos" | "estudios";

const formatFecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit", month: "short", year: "numeric", timeZone: "UTC",
  });

const calcAge = (fechaNac?: string): string => {
  if (!fechaNac) return "—";
  const diff = Date.now() - new Date(fechaNac).getTime();
  return `${Math.floor(diff / (365.25 * 24 * 3600 * 1000))} años`;
};

interface SOAPParsed {
  motivoConsulta: string; tiempoEnfermedad: string; formaInicio: string;
  curso: string; enfermedadActual: string;
  temp: string; pa_s: string; pa_d: string; fc: string; fr: string;
  spo2: string; peso: string; talla: string;
  estadoGeneral: string; cardiovascular: string; respiratorio: string;
  abdomen: string; neurologico: string; musculoesqueletico: string; otrosAp: string;
  diagnoses: { code: string; name: string; tipo: "presuntivo" | "confirmado" }[];
  evaluacion: string; severidad: string;
  otrosDx: { riesgo: string; nutricional: string; saludMental: string; causaExterna: string; estadoFuncional: string };
  medidas: string[]; otrasIndicaciones: string; criteriosAlarma: string; proximaCita: string;
  medicamentos: { nombre: string; concentracion: string; forma: string; via: string; dosis: string; frecuencia: string; duracion: string; cantidad?: string }[];
}

const parsearSOAP = (notasClinicas?: string): SOAPParsed | null => {
  if (!notasClinicas) return null;
  try {
    const p = JSON.parse(notasClinicas);
    const S = p.soap?.S ?? {}; const O = p.soap?.O ?? {};
    const A = p.soap?.A ?? {}; const P = p.soap?.P ?? {};
    const ox = A.otrosDiagnosticos ?? {};
    return {
      motivoConsulta: S.motivoConsulta ?? "", tiempoEnfermedad: S.tiempoEnfermedad ?? "",
      formaInicio: S.formaInicio ?? "", curso: S.curso ?? "", enfermedadActual: S.enfermedadActual ?? "",
      temp: O.temp ?? "", pa_s: O.pa_s ?? "", pa_d: O.pa_d ?? "",
      fc: O.fc ?? "", fr: O.fr ?? "", spo2: O.spo2 ?? "",
      peso: O.peso ?? "", talla: O.talla ?? "",
      estadoGeneral: O.estadoGeneral ?? "", cardiovascular: O.cardiovascular ?? "",
      respiratorio: O.respiratorio ?? "", abdomen: O.abdomen ?? "",
      neurologico: O.neurologico ?? "", musculoesqueletico: O.musculoesqueletico ?? "", otrosAp: O.otrosAp ?? "",
      diagnoses: A.diagnoses ?? [], evaluacion: A.evaluacion ?? "", severidad: A.severidad ?? "",
      otrosDx: { riesgo: ox.riesgo ?? "", nutricional: ox.nutricional ?? "", saludMental: ox.saludMental ?? "", causaExterna: ox.causaExterna ?? "", estadoFuncional: ox.estadoFuncional ?? "" },
      medidas: P.medidas ?? [], otrasIndicaciones: P.otrasIndicaciones ?? "",
      criteriosAlarma: P.criteriosAlarma ?? "", proximaCita: P.proximaCita ?? "",
      medicamentos: p.medicamentos ?? [],
    };
  } catch { return null; }
};

export default function HistoriaClinicaMedico() {
  const params = useParams<{ pacienteId?: string; id?: string }>();
  const pacienteId = params.pacienteId ?? params.id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const rutaPacientes = user?.rol === "administrador" ? "/admin/pacientes" : "/pacientes";

  const [tab,      setTab]      = useState<Tab>("consultas");
  const [loading,  setLoading]  = useState(true);
  const [paciente, setPaciente] = useState<any>(null);
  const [citas,    setCitas]    = useState<any[]>([]);
  const [ordenes,  setOrdenes]  = useState<any[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [notif, setNotif] = useState<{ msg: string; tipo: "success" | "error" } | null>(null);
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [enviandoWsp, setEnviandoWsp]   = useState(false);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pacienteId) return;
    MedicoApiService.obtenerHistorialPaciente(pacienteId)
      .then(data => {
        setPaciente(data.paciente);
        setCitas(data.citas.data);
        setOrdenes(data.ordenes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [pacienteId]);

  const toggleCita = (id: string) =>
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const checkScroll = () => {
    if (tabsContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const scrollAmount = 300;
      const newScroll = tabsContainerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      tabsContainerRef.current.scrollTo({ left: newScroll, behavior: 'smooth' });
      setTimeout(checkScroll, 400);
    }
  };

  useEffect(() => {
    checkScroll();
    const container = tabsContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        container.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuAbierto(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const mostrarNotif = (msg: string, tipo: "success" | "error") => {
    setNotif({ msg, tipo });
    setTimeout(() => setNotif(null), 3500);
  };

  const handleWspRecordatorio = async () => {
    if (!pacienteId) return;
    setEnviandoWsp(true);
    try {
      await PacienteApiService.enviarRecordatorioWsp(pacienteId);
      mostrarNotif("Recordatorio enviado por WhatsApp", "success");
    } catch (e: any) {
      mostrarNotif(e?.response?.data?.message ?? "Error al enviar WhatsApp", "error");
    } finally {
      setEnviandoWsp(false);
    }
  };

  const handleEmailRecordatorio = async () => {
    if (!pacienteId) return;
    setEnviandoEmail(true);
    try {
      await PacienteApiService.enviarRecordatorioEmail(pacienteId);
      mostrarNotif("Recordatorio enviado por correo", "success");
    } catch (e: any) {
      mostrarNotif(e?.response?.data?.message ?? "Error al enviar correo", "error");
    } finally {
      setEnviandoEmail(false);
    }
  };

  if (loading) return <div className="hcm-loading">Cargando historia clínica…</div>;
  if (!paciente) return <div className="hcm-loading">Paciente no encontrado.</div>;

  const nombre        = `${paciente.nombres} ${paciente.apellidos}`;
  const iniciales     = `${paciente.nombres[0] ?? ""}${paciente.apellidos[0] ?? ""}`.toUpperCase();
  const citasAtendidas = citas.filter((c: any) => c.estado === "ATENDIDA");
  const ultimaNota    = citasAtendidas.find((c: any) => c.notasClinicas);
  const datosActuales = ultimaNota ? parsearSOAP(ultimaNota.notasClinicas) : null;

  return (
    <div className="hcm-page">

      {notif && (
        <div className={`notification ${notif.tipo}`}>{notif.msg}</div>
      )}

      {/* Breadcrumb */}
      <div className="hcm-breadcrumb">
        <button className="hcm-back-btn" onClick={() => navigate(rutaPacientes)}>
          <ArrowLeft size={14} /> Pacientes
        </button>
        <span className="hcm-sep">/</span>
        <span className="hcm-current">{nombre}</span>
      </div>

      {/* Encabezado del paciente */}
      <div className="hcm-header-card">
        <div className="hcm-header-left">
          <div className="hcm-avatar">{iniciales}</div>
          <div className="hcm-header-info">
            <div className="hcm-header-name">{nombre}</div>
            <div className="hcm-header-meta">
              DNI: <strong>{paciente.dni}</strong>
              {paciente.fechaNacimiento && <> · {calcAge(paciente.fechaNacimiento)}</>}
              {paciente.sexo && <> · {paciente.sexo === "M" ? "Masculino" : "Femenino"}</>}
              {paciente.estadoCivil && paciente.estadoCivil !== "" && <> · {paciente.estadoCivil.charAt(0) + paciente.estadoCivil.slice(1).toLowerCase()}</>}
            </div>
            <div className="hcm-header-contact">
              {paciente.telefono && (
                <span><Phone size={11} /> {paciente.telefono}</span>
              )}
              {paciente.correo && (
                <span><Mail size={11} /> {paciente.correo}</span>
              )}
              {paciente.direccion && paciente.direccion !== "" && (
                <span>{paciente.direccion}{paciente.distrito ? `, ${paciente.distrito}` : ""}</span>
              )}
            </div>
          </div>
        </div>
        <div className="hcm-header-right">
          <div className="hcm-header-stats">
            <div className="hcm-stat">
              <span className="hcm-stat-num">{citas.length}</span>
              <span className="hcm-stat-label">Citas totales</span>
            </div>
            <div className="hcm-stat">
              <span className="hcm-stat-num">{citasAtendidas.length}</span>
              <span className="hcm-stat-label">Atendidas</span>
            </div>
            <div className="hcm-stat">
              <span className="hcm-stat-num">{ordenes.length}</span>
              <span className="hcm-stat-label">Exámenes</span>
            </div>
          </div>

          <div className="hcm-header-actions">
            <button
              className="hcm-action-btn hcm-action-btn--wsp"
              onClick={handleWspRecordatorio}
              title="Enviar recordatorio por WhatsApp"
              disabled={!paciente.telefono || enviandoWsp}
            >
              <MessageCircle size={18} className={enviandoWsp ? "hcm-spin" : ""} />
            </button>
            <button
              className="hcm-action-btn hcm-action-btn--email"
              onClick={handleEmailRecordatorio}
              title="Enviar recordatorio por email"
              disabled={!paciente.correo || enviandoEmail}
            >
              <Mail size={18} className={enviandoEmail ? "hcm-spin" : ""} />
            </button>
            <div className="hcm-action-menu-wrapper" ref={menuRef}>
              <button
                className="hcm-action-btn"
                onClick={() => setMenuAbierto(v => !v)}
                title="Más opciones"
              >
                <MoreVertical size={18} />
              </button>
              {menuAbierto && (
                <div className="hcm-action-dropdown">
                  <button className="hcm-dropdown-item" onClick={() => setMenuAbierto(false)}>
                    <Camera size={15} /> Subir foto
                  </button>
                  <button className="hcm-dropdown-item" onClick={() => setMenuAbierto(false)}>
                    <Download size={15} /> Descargar
                  </button>
                  <button className="hcm-dropdown-item" onClick={() => setMenuAbierto(false)}>
                    <GitMerge size={15} /> Fusionar paciente
                  </button>
                  <div className="hcm-dropdown-divider" />
                  <button className="hcm-dropdown-item" onClick={() => setMenuAbierto(false)}>
                    <PowerOff size={15} /> Desactivar
                  </button>
                  <button className="hcm-dropdown-item hcm-dropdown-item--danger" onClick={() => setMenuAbierto(false)}>
                    <Trash2 size={15} /> Eliminar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs - Historia Clínica por Especialidad */}
      <div className="hcm-tabs-wrapper">
        <button
          className={`hcm-tab-arrow hcm-tab-arrow--left ${!canScrollLeft ? 'disabled' : ''}`}
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
          title="Desplazar izquierda"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="hcm-tabs" ref={tabsContainerRef}>
          {([
            { id: "consultas",    label: "Consultas" },
            { id: "antecedentes", label: "Antecedentes" },
            { id: "fisiologicos", label: "Fisiológicos / Vacunas" },
            { id: "familiares",   label: "Ant. Familiares" },
            { id: "habitos",      label: "Hábitos / Estilo de vida" },
          ] as const).map(t => (
            <button
              key={t.id}
              className={`hcm-tab ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <button
          className={`hcm-tab-arrow hcm-tab-arrow--right ${!canScrollRight ? 'disabled' : ''}`}
          onClick={() => scroll('right')}
          disabled={!canScrollRight}
          title="Desplazar derecha"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* ─── HISTORIA CLÍNICA UNIFICADA (NTS N°139-MINSA/2018) ─── */}
      {tab !== "consultas" && (
        <HistoriaClinicaTabs
          pacienteId={pacienteId!}
          historiaClinica={paciente.historiaClinicaEspecialidad || {}}
          tabActivo={tab as any}
          sexoPaciente={paciente.sexo}
          onActualizar={async () => {
            const data = await MedicoApiService.obtenerHistorialPaciente(pacienteId!);
            setPaciente(data.paciente);
            setCitas(data.citas.data);
            setOrdenes(data.ordenes.data);
          }}
        />
      )}

      {/* ─── TAB: RESUMEN [OBSOLETO] ─── */}
      {false && (
        <div className="hcm-resumen-layout">

          {/* Columna izquierda: Datos clínicos derivados */}
          <div className="hcm-col-left">

            {/* Diagnósticos activos */}
            <div className="hcm-clinical-card">
              <div className="hcm-clinical-title">
                <Stethoscope size={13} /> Diagnósticos Activos
              </div>
              {datosActuales?.diagnoses?.length ? (
                datosActuales!.diagnoses!.map((dx) => (
                  <div key={dx.code} className="hcm-dx-item">
                    <span className="hcm-dx-code">{dx.code}</span>
                    <span className="hcm-dx-name">{dx.name}</span>
                    <span className={`hcm-dx-tipo hcm-dx-tipo--${dx.tipo}`}>
                      {dx.tipo === "confirmado" ? "Confirmado" : "Presuntivo"}
                    </span>
                  </div>
                ))
              ) : (
                <p className="hcm-empty-hint">Sin diagnósticos registrados.</p>
              )}
            </div>

            {/* Medicamentos actuales */}
            <div className="hcm-clinical-card">
              <div className="hcm-clinical-title">
                <Pill size={13} /> Medicamentos Actuales
              </div>
              {datosActuales?.medicamentos?.length ? (
                <>
                  {datosActuales!.medicamentos!.map((m) => (
                    <div key={`${m.nombre}-${m.concentracion}-${m.frecuencia}`} className="hcm-med-item">
                      <div className="hcm-med-nombre">{m.nombre} {m.concentracion}</div>
                      <div className="hcm-med-detalle">
                        {m.forma} · {m.via} · {m.frecuencia} · {m.duracion}
                      </div>
                    </div>
                  ))}
                  <div className="hcm-source-note">
                    Última consulta con nota: {formatFecha(ultimaNota.fecha)}
                  </div>
                </>
              ) : (
                <p className="hcm-empty-hint">Sin medicamentos registrados.</p>
              )}
            </div>

            {/* Alergias (antecedente persistente del paciente) */}
            <div className="hcm-clinical-card">
              <div className="hcm-clinical-title">
                <AlertTriangle size={13} /> Alergias
              </div>
              {paciente.alergias?.length ? (
                paciente.alergias.map((a: any) => (
                  <div key={a._id ?? a.sustancia} className="hcm-dx-item">
                    <span className="hcm-dx-name">{a.sustancia}{a.reaccion ? ` — ${a.reaccion}` : ""}</span>
                    <span className={`hcm-sev-badge hcm-sev-badge--${a.severidad}`}>{a.severidad}</span>
                  </div>
                ))
              ) : (
                <p className="hcm-empty-hint">Sin alergias registradas.</p>
              )}
            </div>

            {/* Problemas médicos activos */}
            <div className="hcm-clinical-card">
              <div className="hcm-clinical-title">
                <Activity size={13} /> Problemas Médicos
              </div>
              {paciente.problemasMedicos?.filter((p: any) => p.estado === "activo").length ? (
                paciente.problemasMedicos
                  .filter((p: any) => p.estado === "activo")
                  .map((p: any) => (
                    <div key={p._id ?? p.descripcion} className="hcm-dx-item">
                      <span className="hcm-dx-name">{p.descripcion}</span>
                      {p.fechaInicio && (
                        <span className="hcm-dx-tipo">{new Date(p.fechaInicio).getFullYear()}</span>
                      )}
                    </div>
                  ))
              ) : (
                <p className="hcm-empty-hint">Sin problemas registrados.</p>
              )}
            </div>

            {/* Cirugías previas */}
            <div className="hcm-clinical-card">
              <div className="hcm-clinical-title">
                <Scissors size={13} /> Cirugías Previas
              </div>
              {paciente.cirugiasPrevias?.length ? (
                paciente.cirugiasPrevias.map((c: any) => (
                  <div key={c._id ?? c.procedimiento} className="hcm-dx-item">
                    <span className="hcm-dx-name">{c.procedimiento}{c.hospital ? ` · ${c.hospital}` : ""}</span>
                    {c.fecha && (
                      <span className="hcm-dx-tipo">{new Date(c.fecha).getFullYear()}</span>
                    )}
                  </div>
                ))
              ) : (
                <p className="hcm-empty-hint">Sin cirugías registradas.</p>
              )}
            </div>

            {/* Antecedentes familiares */}
            <div className="hcm-clinical-card">
              <div className="hcm-clinical-title">
                <Users size={13} /> Antecedentes Familiares
              </div>
              {paciente.antecedentesFamiliares?.length ? (
                paciente.antecedentesFamiliares.map((a: any) => (
                  <div key={a._id ?? `${a.parentesco}-${a.condicion}`} className="hcm-dx-item">
                    <span className="hcm-dx-name"><strong>{a.parentesco}:</strong> {a.condicion}</span>
                  </div>
                ))
              ) : (
                <p className="hcm-empty-hint">Sin antecedentes registrados.</p>
              )}
            </div>

          </div>

          {/* Columna derecha: Últimas 5 consultas */}
          <div className="hcm-col-right">
            <div className="hcm-card">
              <div className="hcm-card-title">Últimas Consultas</div>
              {citasAtendidas.length > 0 ? (
                <div className="table-container">
                  <table className="modern-table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Motivo</th>
                        <th>Diagnóstico</th>
                        <th>Médico</th>
                      </tr>
                    </thead>
                    <tbody>
                      {citasAtendidas.slice(0, 5).map((c: any) => {
                        const soap = parsearSOAP(c.notasClinicas);
                        const motivo = soap?.motivoConsulta || c.notas || "—";
                        return (
                          <tr key={c._id}>
                            <td style={{ whiteSpace: "nowrap", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                              {formatFecha(c.fecha)}
                            </td>
                            <td style={{ maxWidth: 180, fontSize: "0.82rem" }}>
                              {motivo.length > 55 ? motivo.substring(0, 55) + "…" : motivo}
                            </td>
                            <td>
                              {c.diagnostico ? (
                                <span className="hcm-dx-tag-small">
                                  {c.diagnostico.length > 45 ? c.diagnostico.substring(0, 45) + "…" : c.diagnostico}
                                </span>
                              ) : "—"}
                            </td>
                            <td style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                              {c.doctorId
                                ? `${c.doctorId.nombres} ${c.doctorId.apellidos}`
                                : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="hcm-empty-hint">Sin consultas atendidas registradas.</p>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ─── TAB: CONSULTAS — Notas de Evolución (NTS-139 MINSA) ─── */}
      {tab === "consultas" && (
        <div className="hcm-consultas-list">
          {citasAtendidas.length === 0 ? (
            <div className="hcm-empty">
              <BookOpen size={28} color="var(--text-muted)" />
              <h3>Sin consultas registradas</h3>
              <p>Las consultas atendidas aparecerán aquí como notas de evolución.</p>
            </div>
          ) : (
            citasAtendidas.map((c: any) => {
              const isOpen = expanded.has(c._id);
              const soap   = parsearSOAP(c.notasClinicas);
              const doctor = c.doctorId;
              const esp    = doctor?.especialidadId?.nombre ?? "";
              const cmp    = c.firma?.numeroCMP ?? "";

              // Funciones vitales con valor
              const vitales = soap ? [
                { lbl: "T°", val: soap.temp, unit: "°C" },
                { lbl: "PA", val: soap.pa_s && soap.pa_d ? `${soap.pa_s}/${soap.pa_d}` : "", unit: "mmHg" },
                { lbl: "FC", val: soap.fc,   unit: "lpm" },
                { lbl: "FR", val: soap.fr,   unit: "rpm" },
                { lbl: "SpO₂", val: soap.spo2, unit: "%" },
                { lbl: "Peso", val: soap.peso, unit: "kg" },
                { lbl: "Talla", val: soap.talla, unit: "cm" },
              ].filter(v => v.val) : [];

              const tieneO = vitales.length > 0 || !!(soap?.estadoGeneral || soap?.cardiovascular || soap?.respiratorio || soap?.abdomen || soap?.neurologico || soap?.musculoesqueletico || soap?.otrosAp);
              const tieneOtrosDx = soap && (soap.otrosDx.riesgo || soap.otrosDx.nutricional || soap.otrosDx.saludMental || soap.otrosDx.causaExterna || soap.otrosDx.estadoFuncional);
              const tieneP = soap && (soap.medidas.length > 0 || soap.otrasIndicaciones || soap.criteriosAlarma || soap.proximaCita || soap.medicamentos.length > 0);

              return (
                <div key={c._id} className="hcm-consulta-card">
                  {/* ── Cabecera ── */}
                  <button className="hcm-consulta-header" onClick={() => toggleCita(c._id)}>
                    <div className="hcm-consulta-header-left">
                      <Calendar size={13} color="var(--primary)" />
                      <span className="hcm-consulta-fecha">{formatFecha(c.fecha)}{c.hora ? ` · ${c.hora}` : ""}</span>
                      {esp && <span className="hcm-consulta-esp">{esp}</span>}
                      {soap?.motivoConsulta && (
                        <span className="hcm-consulta-motivo-preview">
                          {soap.motivoConsulta.length > 60 ? soap.motivoConsulta.slice(0, 60) + "…" : soap.motivoConsulta}
                        </span>
                      )}
                    </div>
                    <div className="hcm-consulta-header-right">
                      {(soap?.diagnoses?.length ?? 0) > 0 && (
                        <span className="hcm-dx-tag-small">{soap!.diagnoses![0].code}</span>
                      )}
                      {isOpen ? <ChevronDown size={15} color="var(--text-muted)" /> : <ChevronRight size={15} color="var(--text-muted)" />}
                    </div>
                  </button>

                  {/* ── Cuerpo expandido: Nota de Evolución completa ── */}
                  {isOpen && (
                    <div className="hcm-nota-body">

                      {/* Firma del médico */}
                      {doctor && (
                        <div className="hcm-nota-firma">
                          <Stethoscope size={12} />
                          <span>
                            Dr. {doctor.nombres} {doctor.apellidos}
                            {esp && ` · ${esp}`}
                            {cmp && ` · CMP ${cmp}`}
                          </span>
                          <span className="hcm-nota-firma-fecha">{formatFecha(c.fecha)}{c.hora ? ` ${c.hora}` : ""}</span>
                        </div>
                      )}

                      {soap ? (
                        <>
                          {/* ── S: SUBJETIVO ── */}
                          {(soap.motivoConsulta || soap.enfermedadActual) && (
                            <div className="hcm-soap-section">
                              <div className="hcm-soap-section-title hcm-soap-s">S — Subjetivo</div>
                              {soap.motivoConsulta && (
                                <div className="hcm-soap-row">
                                  <span className="hcm-soap-lbl">Motivo de consulta</span>
                                  <span className="hcm-soap-val">{soap.motivoConsulta}</span>
                                </div>
                              )}
                              {soap.tiempoEnfermedad && (
                                <div className="hcm-soap-row">
                                  <span className="hcm-soap-lbl">Tiempo de enfermedad</span>
                                  <span className="hcm-soap-val">{soap.tiempoEnfermedad}{soap.formaInicio && ` · Inicio ${soap.formaInicio.toLowerCase()}`}{soap.curso && ` · Curso ${soap.curso.toLowerCase()}`}</span>
                                </div>
                              )}
                              {soap.enfermedadActual && (
                                <div className="hcm-soap-row">
                                  <span className="hcm-soap-lbl">Enfermedad actual</span>
                                  <span className="hcm-soap-val">{soap.enfermedadActual}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* ── O: OBJETIVO ── */}
                          {tieneO && (
                            <div className="hcm-soap-section">
                              <div className="hcm-soap-section-title hcm-soap-o">O — Objetivo</div>
                              {vitales.length > 0 && (
                                <div className="hcm-soap-row">
                                  <span className="hcm-soap-lbl">Funciones vitales</span>
                                  <div className="hcm-vitales-grid">
                                    {vitales.map(v => (
                                      <div key={v.lbl} className="hcm-vital-chip">
                                        <span className="hcm-vital-lbl">{v.lbl}</span>
                                        <span className="hcm-vital-val">{v.val} <span className="hcm-vital-unit">{v.unit}</span></span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {soap.estadoGeneral && (
                                <div className="hcm-soap-row">
                                  <span className="hcm-soap-lbl">Estado general</span>
                                  <span className="hcm-soap-val">{soap.estadoGeneral}</span>
                                </div>
                              )}
                              {[
                                { lbl: "Cardiovascular",    val: soap.cardiovascular },
                                { lbl: "Respiratorio",      val: soap.respiratorio },
                                { lbl: "Abdomen",           val: soap.abdomen },
                                { lbl: "Neurológico",       val: soap.neurologico },
                                { lbl: "Músculo-esquelético", val: soap.musculoesqueletico },
                                { lbl: "Otros aparatos",    val: soap.otrosAp },
                              ].filter(r => r.val).map(r => (
                                <div key={r.lbl} className="hcm-soap-row">
                                  <span className="hcm-soap-lbl">{r.lbl}</span>
                                  <span className="hcm-soap-val">{r.val}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* ── A: ANÁLISIS/DIAGNÓSTICO ── */}
                          {(soap.diagnoses.length > 0 || soap.evaluacion) && (
                            <div className="hcm-soap-section">
                              <div className="hcm-soap-section-title hcm-soap-a">A — Análisis / Diagnóstico</div>
                              {soap.diagnoses.length > 0 && (
                                <div className="hcm-soap-row">
                                  <span className="hcm-soap-lbl">Diagnósticos CIE-10</span>
                                  <div className="hcm-dx-list">
                                    {soap.diagnoses.map((d, i) => (
                                      <div key={`${d.code}-${i}`} className="hcm-dx-full">
                                        <span className="hcm-dx-code">{d.code}</span>
                                        <span className="hcm-dx-name">{d.name}</span>
                                        <span className={`hcm-dx-tipo hcm-dx-tipo--${d.tipo}`}>{d.tipo === "confirmado" ? "Confirmado" : "Presuntivo"}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {soap.severidad && (
                                <div className="hcm-soap-row">
                                  <span className="hcm-soap-lbl">Severidad</span>
                                  <span className="hcm-soap-val">{soap.severidad}</span>
                                </div>
                              )}
                              {soap.evaluacion && (
                                <div className="hcm-soap-row">
                                  <span className="hcm-soap-lbl">Evaluación clínica</span>
                                  <span className="hcm-soap-val">{soap.evaluacion}</span>
                                </div>
                              )}
                              {tieneOtrosDx && (
                                <div className="hcm-soap-row">
                                  <span className="hcm-soap-lbl">Otros diagnósticos</span>
                                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                    {[
                                      { lbl: "Riesgo",          val: soap.otrosDx.riesgo },
                                      { lbl: "Nutricional",     val: soap.otrosDx.nutricional },
                                      { lbl: "Salud mental",    val: soap.otrosDx.saludMental },
                                      { lbl: "Causa externa",   val: soap.otrosDx.causaExterna },
                                      { lbl: "Estado funcional",val: soap.otrosDx.estadoFuncional },
                                    ].filter(r => r.val).map(r => (
                                      <span key={r.lbl} className="hcm-soap-val" style={{ fontSize: "0.82rem" }}>
                                        <strong>{r.lbl}:</strong> {r.val}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* ── P: PLAN ── */}
                          {tieneP && (
                            <div className="hcm-soap-section">
                              <div className="hcm-soap-section-title hcm-soap-p">P — Plan</div>
                              {soap.medicamentos.length > 0 && (
                                <div className="hcm-soap-row">
                                  <span className="hcm-soap-lbl">Medicamentos</span>
                                  <div className="hcm-med-list">
                                    {soap.medicamentos.map((m, i) => (
                                      <div key={i} className="hcm-med-full">
                                        <span className="hcm-med-nombre">{m.nombre} {m.concentracion}</span>
                                        <span className="hcm-med-detalle">
                                          {[m.forma, m.via, m.dosis, m.frecuencia, m.duracion].filter(Boolean).join(" · ")}
                                          {m.cantidad && ` — ${m.cantidad} unid.`}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {soap.medidas.length > 0 && (
                                <div className="hcm-soap-row">
                                  <span className="hcm-soap-lbl">Plan de trabajo</span>
                                  <ul className="hcm-medidas-list">
                                    {soap.medidas.map((m, i) => <li key={i}>{m}</li>)}
                                  </ul>
                                </div>
                              )}
                              {soap.otrasIndicaciones && (
                                <div className="hcm-soap-row">
                                  <span className="hcm-soap-lbl">Indicaciones</span>
                                  <span className="hcm-soap-val">{soap.otrasIndicaciones}</span>
                                </div>
                              )}
                              {soap.criteriosAlarma && (
                                <div className="hcm-soap-row">
                                  <span className="hcm-soap-lbl">Criterios de alarma</span>
                                  <span className="hcm-soap-val">{soap.criteriosAlarma}</span>
                                </div>
                              )}
                              {soap.proximaCita && (
                                <div className="hcm-soap-row">
                                  <span className="hcm-soap-lbl">Próxima cita</span>
                                  <span className="hcm-soap-val">{soap.proximaCita}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="hcm-empty-hint" style={{ padding: "12px 0" }}>Sin nota clínica registrada para esta consulta.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ─── TAB: ESTUDIOS ─── */}
      {tab === "estudios" && (
        <div className="hcm-estudios">
          {ordenes.length === 0 ? (
            <div className="hcm-empty">
              <FlaskConical size={28} color="var(--text-muted)" />
              <p>Sin órdenes de examen registradas.</p>
            </div>
          ) : (
            <div className="hcm-card">
              <div className="hcm-card-title">Órdenes de Examen</div>
              <div className="table-container">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Exámenes</th>
                      <th>Estado</th>
                      <th>Médico</th>
                      <th>Resultados</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordenes.map((o: any) => (
                      <tr key={o._id}>
                        <td style={{ whiteSpace: "nowrap", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                          {formatFecha(o.fecha)}
                        </td>
                        <td>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {o.items?.slice(0, 3).map((item: any, i: number) => (
                              <span key={item._id ?? item.examenId?._id ?? `ex-${i}`} className="hcm-examen-tag">
                                {item.examenId?.nombre ?? item.nombre ?? "Examen"}
                              </span>
                            ))}
                            {(o.items?.length ?? 0) > 3 && (
                              <span className="hcm-examen-tag-more">
                                +{o.items.length - 3} más
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`hcm-orden-estado hcm-orden-estado--${(o.estado ?? "").toLowerCase()}`}>
                            {fmtEstado(o.estado)}
                          </span>
                        </td>
                        <td style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                          {o.doctorId
                            ? `${o.doctorId.nombres} ${o.doctorId.apellidos}`
                            : "—"}
                        </td>
                        <td>
                          {o.estado === "FINALIZADO" && o.archivoResultadoUrl ? (
                            <a
                              className="hcm-resultado-link"
                              href={o.archivoResultadoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <FileText size={13} /> Ver PDF
                            </a>
                          ) : (
                            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                              Pendiente
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
