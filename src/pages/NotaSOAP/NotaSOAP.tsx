import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { AlertTriangle, Pill, FileText, Plus, ChevronDown, ChevronUp, Scissors, Users, Activity } from "lucide-react";
import "./NotaSOAP.css";
import { fmtEstado, formatearFechaDMY, formatearFechaCorta } from "../../utils/fecha.utils";

import type { SOAPData, ExamenOrdenado, MedicamentoSOAP } from "./types";
import { INITIAL_SOAP } from "./types";
import SectionS from "./sections/SectionS";
import SectionO from "./sections/SectionO";
import SectionA from "./sections/SectionA";
import SectionP from "./sections/SectionP";
import PanelOrdenesPaciente from "./PanelOrdenesPaciente";

import ModalSolicitudExamen from "../../components/modals/ModalSolicitudExamen";
import ModalReceta          from "../../components/modals/ModalReceta";
import ModalReferencia      from "../../components/modals/ModalReferencia";
import ModalInterconsulta   from "../../components/modals/ModalInterconsulta";

import { MedicoApiService } from "../../services/medico.service";
import type { CitaMedico, CitaHistorial, Alergia, MedicamentoHabitual, ProblemaMedico, CirugiaPevia, AntecedenteFamiliar } from "../../services/medico.service";
import { PacienteApiService } from "../../services/paciente.service";

// SOAP: 4 secciones estándar según NTS-022 MINSA y CMP.
// No existe "Sección E" — la NTS-022 no la define; variaciones por especialidad
// van dentro de S/O/A como "otras variables" (norma lo autoriza, pero no tipifica).
type Section = "S" | "O" | "A" | "P";

const SECTIONS: { id: Section; label: string; sub: string }[] = [
  { id: "S", label: "S", sub: "Subjetivo" },
  { id: "O", label: "O", sub: "Objetivo" },
  { id: "A", label: "A", sub: "Análisis" },
  { id: "P", label: "P", sub: "Plan" },
];

function calcAge(fechaNac?: string): string {
  if (!fechaNac) return "—";
  const diff = Date.now() - new Date(fechaNac).getTime();
  const age = Math.floor(diff / (365.25 * 24 * 3600 * 1000));
  return `${age} años`;
}

function initials(nombres: string, apellidos: string) {
  return `${nombres[0] ?? ""}${apellidos[0] ?? ""}`.toUpperCase();
}

export default function NotaSOAP() {
  const { citaId } = useParams<{ citaId: string }>();
  const navigate   = useNavigate();

  const [cita,         setCita]         = useState<CitaMedico | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [section,      setSection]      = useState<Section>("S");
  const [soapData,     setSoapData]     = useState<SOAPData>(INITIAL_SOAP);
  const [examenes,     setExamenes]     = useState<ExamenOrdenado[]>([]);
  const [medicamentos, setMedicamentos] = useState<MedicamentoSOAP[]>([]);
  const [modalAbierto, setModalAbierto] = useState<string | null>(null);
  const [lastSaved,    setLastSaved]    = useState<string | null>(null);
  const [saving,       setSaving]       = useState(false);

  // ── Historial clínico del paciente ──────────────────────────
  const [alergias,          setAlergias]          = useState<Alergia[]>([]);
  const [medicHabituales,   setMedicHabituales]   = useState<MedicamentoHabitual[]>([]);
  const [problemasMedicos,  setProblemasMedicos]  = useState<ProblemaMedico[]>([]);
  const [cirugiasPrevias,      setCirugiasPrevias]      = useState<CirugiaPevia[]>([]);
  const [antecedentesFam,      setAntecedentesFam]      = useState<AntecedenteFamiliar[]>([]);
  const [historialExpandido,   setHistorialExpandido]   = useState(true);
  const [historialCitas,       setHistorialCitas]       = useState<CitaHistorial[]>([]);
  const [historialCitasExp,    setHistorialCitasExp]    = useState(true);
  const [citaExpandidaId,      setCitaExpandidaId]      = useState<string | null>(null);
  const [modalCitas,           setModalCitas]           = useState(false);
  const [citaExpandidaModal,   setCitaExpandidaModal]   = useState<string | null>(null);
  const [paginaCitas,          setPaginaCitas]          = useState(0);
  const [savingHistorial,      setSavingHistorial]      = useState(false);
  const [modalHistorial,       setModalHistorial]       = useState<"alergia" | "medicamento" | "problema" | "cirugia" | "antFamiliar" | null>(null);
  const [nuevoItem,         setNuevoItem]         = useState<Record<string, string>>({});
  const [verSuspendidos,    setVerSuspendidos]    = useState(false);
  const [modalSuspender,    setModalSuspender]    = useState<MedicamentoHabitual | null>(null);
  const [suspForm,          setSuspForm]          = useState({ fecha: "", motivo: "" });

  useEffect(() => {
    if (!citaId) return;
    Promise.all([
      MedicoApiService.obtenerDetalleCita(citaId),
      MedicoApiService.obtenerMiPerfil(),
    ])
      .then(([data]) => {
        setCita(data);
        if (data.notasClinicas) {
          try {
            const parsed = JSON.parse(data.notasClinicas);
            if (parsed.soap) {
              // Merge profundo en TODAS las secciones para que borradores antiguos o
              // parciales nunca dejen campos undefined (sintomas, diagnoses, medidas, etc.).
              const sA = parsed.soap.A ?? {};
              setSoapData({
                S: {
                  ...INITIAL_SOAP.S,
                  ...(parsed.soap.S ?? {}),
                  sintomas:    { ...INITIAL_SOAP.S.sintomas,    ...((parsed.soap.S ?? {}).sintomas    ?? {}) },
                  sinoDetalle: { ...INITIAL_SOAP.S.sinoDetalle, ...((parsed.soap.S ?? {}).sinoDetalle ?? {}) },
                },
                O: { ...INITIAL_SOAP.O, ...(parsed.soap.O ?? {}) },
                A: {
                  ...INITIAL_SOAP.A,
                  ...sA,
                  diagnoses:         Array.isArray(sA.diagnoses) ? sA.diagnoses : [],
                  otrosDiagnosticos: { ...INITIAL_SOAP.A.otrosDiagnosticos, ...(sA.otrosDiagnosticos ?? {}) },
                },
                P: {
                  ...INITIAL_SOAP.P,
                  ...(parsed.soap.P ?? {}),
                  medidas: Array.isArray((parsed.soap.P ?? {}).medidas) ? (parsed.soap.P).medidas : [],
                },
              });
            }
            if (parsed.examenes) setExamenes(parsed.examenes);
            if (parsed.medicamentos) setMedicamentos(parsed.medicamentos);
          } catch { /* borrador no parseable, ignorar */ }
        }
        const pac = data.pacienteId;
        if (pac.alergias) setAlergias(pac.alergias);
        if (pac.medicamentosHabituales) setMedicHabituales(pac.medicamentosHabituales);
        if (pac.problemasMedicos) setProblemasMedicos(pac.problemasMedicos);
        if (pac.cirugiasPrevias) setCirugiasPrevias(pac.cirugiasPrevias);
        if (pac.antecedentesFamiliares) setAntecedentesFam(pac.antecedentesFamiliares);

        // Cargar historial de citas del paciente (todas las especialidades)
        MedicoApiService.obtenerHistorialCitasPaciente(pac._id, citaId)
          .then(setHistorialCitas)
          .catch(() => {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [citaId]);

  const guardarHistorialClinico = async (
    nuevasAlergias: Alergia[],
    nuevosMedic: MedicamentoHabitual[],
    nuevosProblemas: ProblemaMedico[],
    nuevasCirugias: CirugiaPevia[],
    nuevosAntFam: AntecedenteFamiliar[]
  ) => {
    if (!cita) return;
    setSavingHistorial(true);
    try {
      await PacienteApiService.actualizarHistorialClinico(cita.pacienteId._id, {
        alergias: nuevasAlergias,
        medicamentosHabituales: nuevosMedic,
        problemasMedicos: nuevosProblemas,
        cirugiasPrevias: nuevasCirugias,
        antecedentesFamiliares: nuevosAntFam,
      });
    } catch {
      Swal.fire({ icon: "error", title: "Error", text: "No se pudo guardar el historial.", confirmButtonColor: "var(--primary)" });
    } finally {
      setSavingHistorial(false);
    }
  };

  const handleAgregarAlergia = async () => {
    if (!nuevoItem.sustancia?.trim()) return;
    const nueva: Alergia = {
      sustancia: nuevoItem.sustancia,
      reaccion: nuevoItem.reaccion || "",
      severidad: (nuevoItem.severidad as Alergia["severidad"]) || "leve",
    };
    const actualizadas = [...alergias, nueva];
    setAlergias(actualizadas);
    setModalHistorial(null);
    setNuevoItem({});
    await guardarHistorialClinico(actualizadas, medicHabituales, problemasMedicos, cirugiasPrevias, antecedentesFam);
  };

  const handleAgregarMedicamento = async () => {
    if (!nuevoItem.nombre?.trim()) return;
    const nuevo: MedicamentoHabitual = {
      nombre: nuevoItem.nombre,
      dosis: nuevoItem.dosis || "",
      frecuencia: nuevoItem.frecuencia || "",
      activo: true,
    };
    const actualizados = [...medicHabituales, nuevo];
    setMedicHabituales(actualizados);
    setModalHistorial(null);
    setNuevoItem({});
    await guardarHistorialClinico(alergias, actualizados, problemasMedicos, cirugiasPrevias, antecedentesFam);
  };

  const handleAgregarProblema = async () => {
    if (!nuevoItem.descripcion?.trim()) return;
    const nuevo: ProblemaMedico = {
      descripcion: nuevoItem.descripcion,
      estado: "activo",
      fechaInicio: nuevoItem.fechaInicio || undefined,
    };
    const actualizados = [...problemasMedicos, nuevo];
    setProblemasMedicos(actualizados);
    setModalHistorial(null);
    setNuevoItem({});
    await guardarHistorialClinico(alergias, medicHabituales, actualizados, cirugiasPrevias, antecedentesFam);
  };

  const handleAgregarCirugia = async () => {
    if (!nuevoItem.procedimiento?.trim()) return;
    const nueva: CirugiaPevia = {
      procedimiento: nuevoItem.procedimiento,
      fecha: nuevoItem.fecha || undefined,
      hospital: nuevoItem.hospital || "",
    };
    const actualizadas = [...cirugiasPrevias, nueva];
    setCirugiasPrevias(actualizadas);
    setModalHistorial(null);
    setNuevoItem({});
    await guardarHistorialClinico(alergias, medicHabituales, problemasMedicos, actualizadas, antecedentesFam);
  };

  const handleAgregarAntFamiliar = async () => {
    if (!nuevoItem.parentesco?.trim() || !nuevoItem.condicion?.trim()) return;
    const nuevo: AntecedenteFamiliar = {
      parentesco: nuevoItem.parentesco,
      condicion: nuevoItem.condicion,
    };
    const actualizados = [...antecedentesFam, nuevo];
    setAntecedentesFam(actualizados);
    setModalHistorial(null);
    setNuevoItem({});
    await guardarHistorialClinico(alergias, medicHabituales, problemasMedicos, cirugiasPrevias, actualizados);
  };

  const MOTIVOS_SUSPENSION = [
    "Efectos adversos / intolerancia",
    "Problema médico resuelto",
    "Cambio de tratamiento",
    "Indicación médica",
    "Costo o acceso",
    "Decisión del paciente",
    "Otro",
  ] as const;

  const handleSuspenderMedicamento = async () => {
    if (!modalSuspender) return;
    const hoy = new Date().toISOString().slice(0, 10);
    const actualizados = medicHabituales.map(m =>
      (m._id ? m._id === modalSuspender._id : m.nombre === modalSuspender.nombre)
        ? { ...m, activo: false, fechaSuspension: suspForm.fecha || hoy, motivoSuspension: suspForm.motivo }
        : m
    );
    setMedicHabituales(actualizados);
    setModalSuspender(null);
    setSuspForm({ fecha: "", motivo: "" });
    await guardarHistorialClinico(alergias, actualizados, problemasMedicos, cirugiasPrevias, antecedentesFam);
  };

  const updateSection = <K extends keyof SOAPData>(sec: K, val: SOAPData[K]) =>
    setSoapData(prev => ({ ...prev, [sec]: val }));

  const isDone = (sec: Section) => {
    const d = soapData[sec];
    if (!d) return false;
    if (sec === "S") return !!(d as SOAPData["S"]).motivoConsulta;
    if (sec === "O") return !!(d as SOAPData["O"]).pa_s || !!(d as SOAPData["O"]).temp;
    if (sec === "A") return ((d as SOAPData["A"]).diagnoses?.length ?? 0) > 0;
    if (sec === "P") {
      const medidasLen = (d as SOAPData["P"]).medidas?.length ?? 0;
      return !!(examenes.length || medicamentos.length || medidasLen);
    }
    return false;
  };

  const buildPayload = () => {
    const dxPrimario = soapData.A.diagnoses[0];
    return {
      notasClinicas: JSON.stringify({ soap: soapData, examenes, medicamentos }),
      diagnostico:   dxPrimario ? `${dxPrimario.code} — ${dxPrimario.name}` : "",
      tratamiento:   medicamentos.map(m => `${m.nombre} ${m.concentracion} ${m.frecuencia}`).join("; "),
      // Diagnósticos CIE-10 estructurados — consultables/auditables (NTS-022, NTS-139)
      diagnosticos:  soapData.A.diagnoses.map((d, i) => ({
        codigo:      d.code,
        descripcion: d.name,
        tipo:        d.tipo,
        esPrincipal: i === 0,
      })),
      // Otros diagnósticos (NTS-022) — campo estructurado consultable
      otrosDiagnosticos: soapData.A.otrosDiagnosticos,
      // Medicamentos estructurados → Receta Única Estandarizada (DIGEMID / NTS 057)
      medicamentosPrescritos: medicamentos.map(m => ({
        nombre:            m.nombre,
        dci:               m.dci ?? "",
        concentracion:     m.concentracion ?? "",
        formaFarmaceutica: m.forma ?? "",
        viaAdministracion: m.via ?? "",
        dosis:             m.dosis ?? "",
        frecuencia:        m.frecuencia ?? "",
        duracion:          m.duracion ?? "",
        cantidad:          m.cantidad ?? "",
        observaciones:     m.instrucciones ?? "",
      })),
    };
  };

  const handleSaveDraft = async () => {
    if (!citaId || saving) return;
    setSaving(true);
    try {
      await MedicoApiService.guardarNotasClinicas(citaId, buildPayload());
      const now = new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
      setLastSaved(now);
    } catch {
      Swal.fire({ icon: "error", title: "Error", text: "No se pudo guardar el borrador.", confirmButtonColor: "var(--primary)" });
    } finally {
      setSaving(false);
    }
  };

  const handleImprimirReceta = async () => {
    if (!citaId || saving) return;
    if (medicamentos.length === 0) {
      Swal.fire({ icon: "info", title: "Sin medicamentos", text: "Agregue al menos un medicamento para generar la receta.", confirmButtonColor: "var(--primary)" });
      return;
    }
    setSaving(true);
    try {
      // Guardar primero para persistir los medicamentos estructurados en el backend.
      await MedicoApiService.guardarNotasClinicas(citaId, buildPayload());
      await MedicoApiService.abrirReceta(citaId);
    } catch {
      Swal.fire({ icon: "error", title: "Error", text: "No se pudo generar la receta.", confirmButtonColor: "var(--primary)" });
    } finally {
      setSaving(false);
    }
  };

  const handleFinalizar = async () => {
    const result = await Swal.fire({
      title: "¿Finalizar consulta?",
      html: "La consulta se marcará como <strong>ATENDIDA</strong>.<br>Esta acción no se puede deshacer.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, finalizar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "var(--primary)",
      cancelButtonColor: "#6b7280",
    });
    if (!result.isConfirmed || !citaId) return;

    setSaving(true);
    try {
      await Promise.all([
        MedicoApiService.guardarNotasClinicas(citaId, buildPayload()),
        MedicoApiService.actualizarEstadoCita(citaId, "ATENDIDA"),
      ]);
      await Swal.fire({ icon: "success", title: "Consulta finalizada", text: "La nota SOAP fue guardada correctamente.", confirmButtonColor: "var(--primary)" });
      navigate("/medico/citas");
    } catch {
      Swal.fire({ icon: "error", title: "Error", text: "No se pudo finalizar la consulta.", confirmButtonColor: "var(--primary)" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)", fontSize: 15 }}>
        Cargando datos de la consulta…
      </div>
    );
  }

  if (!cita) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)", fontSize: 15 }}>
        Consulta no encontrada.
      </div>
    );
  }

  const pac = cita.pacienteId;
  const pacNombre = `${pac.nombres} ${pac.apellidos}`;

  return (
    <div className="soap-wrapper">

      {/* ── Left panel ── */}
      <aside className="soap-panel">

        {/* ── Encabezado paciente ── */}
        <div className="sp-patient-header">
          <div className="soap-avatar">{initials(pac.nombres, pac.apellidos)}</div>
          <div className="sp-patient-info">
            <div className="sp-patient-name">{pacNombre}</div>
            <div className="sp-patient-meta">{calcAge(pac.fechaNacimiento)} · DNI {pac.dni}</div>
          </div>
        </div>

        {/* ── Bloque de cita ── */}
        <div className="sp-cita-block">
          <div className="sp-cita-top">
            <span className="sp-cita-id">Consulta #{cita._id.slice(-6).toUpperCase()}</span>
            <div className="sp-cita-badges">
              {cita.subtipoCita && (
                <span className={`sp-badge ${cita.subtipoCita === "NUEVA" ? "sp-badge--nueva" : "sp-badge--seguimiento"}`}>
                  {cita.subtipoCita === "NUEVA" ? "1ª Consulta" : "Seguimiento"}
                </span>
              )}
              <span className={`sp-badge ${cita.estado === "PENDIENTE" ? "sp-badge--pendiente" : "sp-badge--atendida"}`}>
                {fmtEstado(cita.estado)}
              </span>
            </div>
          </div>
          <div className="sp-cita-fecha">
            {new Date(cita.fecha).toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" })} — {cita.hora}
          </div>
          {cita.notas && (
            <div className="sp-cita-nota">"{cita.notas.substring(0, 70)}{cita.notas.length > 70 ? "…" : ""}"</div>
          )}
        </div>

        {/* ── Progreso SOAP ── */}
        <div className="soap-panel-progress">
          <div className="sp-progress-title">Progreso de la consulta</div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {SECTIONS.map((s, i) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", flex: i < SECTIONS.length - 1 ? "1 1 0" : "none" }}>
                <div
                  className={`soap-progress-dot ${section === s.id ? "active" : isDone(s.id) ? "done" : ""}`}
                  onClick={() => setSection(s.id)}
                  title={s.sub}
                >
                  {s.label}
                </div>
                {i < SECTIONS.length - 1 && <div className={`soap-progress-line ${isDone(s.id) ? "done" : ""}`} />}
              </div>
            ))}
          </div>
          <div className="sp-progress-current">
            Completando: <strong>{SECTIONS.find(s => s.id === section)?.sub}</strong>
          </div>
        </div>

        {/* ── Historial Clínico ── */}
        <div className="sp-section-container">
          <button className="sp-section-toggle" onClick={() => setHistorialExpandido(v => !v)}>
            <span>Historial Clínico</span>
            {historialExpandido ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {historialExpandido && (
            <div className="sp-section-body">
              {savingHistorial && <div className="sp-saving-indicator">Guardando…</div>}

              {/* Alergias */}
              <div className="sp-hist-group">
                <div className="sp-hist-group-header">
                  <div className="sp-hist-group-title">
                    <span className="sp-hist-icon sp-hist-icon--warning"><AlertTriangle size={10} /></span>
                    Alergias
                  </div>
                  <button className="sp-hist-add-btn" onClick={() => { setNuevoItem({}); setModalHistorial("alergia"); }} title="Agregar alergia">
                    <Plus size={12} />
                  </button>
                </div>
                {alergias.length === 0 ? (
                  <p className="sp-hist-empty">Sin alergias registradas</p>
                ) : alergias.map((a) => (
                  <div key={a._id ?? a.sustancia} className="sp-hist-item">
                    <div className="sp-hist-item-main">
                      <span className="sp-hist-item-name">{a.sustancia}</span>
                      {a.reaccion && <span className="sp-hist-item-sub">{a.reaccion}</span>}
                    </div>
                    <span className={`sp-sev-badge sp-sev--${a.severidad}`}>{a.severidad}</span>
                  </div>
                ))}
              </div>

              {/* Medicamentos habituales */}
              <div className="sp-hist-group">
                <div className="sp-hist-group-header">
                  <div className="sp-hist-group-title">
                    <span className="sp-hist-icon sp-hist-icon--indigo"><Pill size={10} /></span>
                    Medicamentos Habituales
                  </div>
                  <button className="sp-hist-add-btn" onClick={() => { setNuevoItem({}); setModalHistorial("medicamento"); }} title="Agregar medicamento">
                    <Plus size={12} />
                  </button>
                </div>
                {medicHabituales.filter(m => m.activo).length === 0 ? (
                  <p className="sp-hist-empty">Sin medicamentos activos</p>
                ) : medicHabituales.filter(m => m.activo).map((m) => (
                  <div key={m._id ?? m.nombre} className="sp-hist-item sp-hist-item--med">
                    <div className="sp-hist-item-main" style={{ flex: 1, minWidth: 0 }}>
                      <span className="sp-hist-item-name">{m.nombre}</span>
                      {(m.dosis || m.frecuencia) && (
                        <span className="sp-hist-item-sub">
                          {m.dosis}{m.dosis && m.frecuencia ? " · " : ""}{m.frecuencia}
                        </span>
                      )}
                    </div>
                    <button
                      className="sp-suspender-btn"
                      title="El paciente ya no toma este medicamento"
                      onClick={() => { setSuspForm({ fecha: new Date().toISOString().slice(0, 10), motivo: "" }); setModalSuspender(m); }}
                    >
                      Ya no lo toma
                    </button>
                  </div>
                ))}
                {medicHabituales.filter(m => !m.activo).length > 0 && (
                  <button className="sp-toggle-link" onClick={() => setVerSuspendidos(v => !v)}>
                    {verSuspendidos ? "Ocultar" : "Ver"} suspendidos ({medicHabituales.filter(m => !m.activo).length})
                  </button>
                )}
                {verSuspendidos && medicHabituales.filter(m => !m.activo).map((m) => (
                  <div key={(m._id ?? m.nombre) + "-susp"} className="sp-hist-item sp-hist-item--suspended">
                    <span className="sp-hist-item-name" style={{ textDecoration: "line-through" }}>{m.nombre}</span>
                    {m.dosis && <span className="sp-hist-item-sub">{m.dosis}</span>}
                    {m.fechaSuspension && (
                      <span className="sp-hist-item-sub"> · {formatearFechaDMY(m.fechaSuspension)}</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Problemas Médicos */}
              <div className="sp-hist-group">
                <div className="sp-hist-group-header">
                  <div className="sp-hist-group-title">
                    <span className="sp-hist-icon sp-hist-icon--sky"><Activity size={10} /></span>
                    Problemas Médicos
                  </div>
                  <button className="sp-hist-add-btn" onClick={() => { setNuevoItem({}); setModalHistorial("problema"); }} title="Agregar problema">
                    <Plus size={12} />
                  </button>
                </div>
                {problemasMedicos.filter(p => p.estado === "activo").length === 0 ? (
                  <p className="sp-hist-empty">Sin problemas registrados</p>
                ) : problemasMedicos.filter(p => p.estado === "activo").map((p) => (
                  <div key={p._id ?? p.descripcion} className="sp-hist-item">
                    <span className="sp-hist-item-name">{p.descripcion}</span>
                    {p.fechaInicio && <span className="sp-hist-item-year">{new Date(p.fechaInicio).getFullYear()}</span>}
                  </div>
                ))}
              </div>

              {/* Cirugías Previas */}
              <div className="sp-hist-group">
                <div className="sp-hist-group-header">
                  <div className="sp-hist-group-title">
                    <span className="sp-hist-icon sp-hist-icon--violet"><Scissors size={10} /></span>
                    Cirugías Previas
                  </div>
                  <button className="sp-hist-add-btn" onClick={() => { setNuevoItem({}); setModalHistorial("cirugia"); }} title="Agregar cirugía">
                    <Plus size={12} />
                  </button>
                </div>
                {cirugiasPrevias.length === 0 ? (
                  <p className="sp-hist-empty">Sin cirugías registradas</p>
                ) : cirugiasPrevias.map((c) => (
                  <div key={c._id ?? c.procedimiento} className="sp-hist-item">
                    <div className="sp-hist-item-main">
                      <span className="sp-hist-item-name">{c.procedimiento}</span>
                      {c.hospital && <span className="sp-hist-item-sub">{c.hospital}</span>}
                    </div>
                    {c.fecha && <span className="sp-hist-item-year">{new Date(c.fecha).getFullYear()}</span>}
                  </div>
                ))}
              </div>

              {/* Antecedentes Familiares */}
              <div className="sp-hist-group" style={{ marginBottom: 0 }}>
                <div className="sp-hist-group-header">
                  <div className="sp-hist-group-title">
                    <span className="sp-hist-icon sp-hist-icon--pink"><Users size={10} /></span>
                    Antecedentes Familiares
                  </div>
                  <button className="sp-hist-add-btn" onClick={() => { setNuevoItem({}); setModalHistorial("antFamiliar"); }} title="Agregar antecedente">
                    <Plus size={12} />
                  </button>
                </div>
                {antecedentesFam.length === 0 ? (
                  <p className="sp-hist-empty">Sin antecedentes registrados</p>
                ) : antecedentesFam.map((a) => (
                  <div key={a._id ?? `${a.parentesco}-${a.condicion}`} className="sp-hist-item sp-hist-item--fam">
                    <span className="sp-hist-item-rel">{a.parentesco}:</span>
                    <span className="sp-hist-item-cond">{a.condicion}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Órdenes y resultados del paciente (solo lectura) ── */}
        <PanelOrdenesPaciente pacienteId={pac._id} />

        {/* ── Citas Anteriores ── */}
        <div className="sp-section-container">
          <button className="sp-section-toggle" onClick={() => setHistorialCitasExp(v => !v)}>
            <span>
              Citas Anteriores
              {historialCitas.filter(c => c.estado === "ATENDIDA").length > 0 && (
                <span className="sp-count-pill">{historialCitas.filter(c => c.estado === "ATENDIDA").length}</span>
              )}
            </span>
            {historialCitasExp ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {historialCitasExp && (
            <div className="sp-section-body">
              {historialCitas.filter(c => c.estado === "ATENDIDA").length === 0 ? (
                <p className="sp-hist-empty">Sin consultas previas registradas</p>
              ) : (
                <>
                  {historialCitas.filter(c => c.estado === "ATENDIDA").slice(0, 3).map(c => {
                    const esExpandida = citaExpandidaId === c._id;
                    const especialidad = (c.doctorId as any)?.especialidadId?.nombre ?? "—";
                    const doctor = c.doctorId ? `${c.doctorId.nombres} ${c.doctorId.apellidos}` : "—";
                    let motivoConsulta = "";
                    if (c.notasClinicas) {
                      try {
                        const parsed = JSON.parse(c.notasClinicas);
                        motivoConsulta = parsed.soap?.S?.motivoConsulta ?? "";
                      } catch { /* ignorar */ }
                    }
                    return (
                      <div key={c._id} className={`sp-cita-card${esExpandida ? " sp-cita-card--open" : ""}`}>
                        <div className="sp-cita-card-header" onClick={() => setCitaExpandidaId(esExpandida ? null : c._id)}>
                          <div className="sp-cita-card-left">
                            <span className="sp-cita-card-fecha">{formatearFechaCorta(c.fecha)}</span>
                            <span className="sp-cita-card-esp">{especialidad}</span>
                            <span className="sp-cita-card-dr">Dr. {doctor}</span>
                          </div>
                          <span className="sp-badge sp-badge--atendida">ATENDIDA</span>
                        </div>
                        {esExpandida && (
                          <div className="sp-cita-card-body">
                            {motivoConsulta && (
                              <div className="sp-cita-detail-row">
                                <span className="sp-cita-detail-lbl">Motivo</span>
                                <span>{motivoConsulta}</span>
                              </div>
                            )}
                            {c.diagnostico ? (
                              <div className="sp-cita-detail-row">
                                <span className="sp-cita-detail-lbl">Dx</span>
                                <span>{c.diagnostico}</span>
                              </div>
                            ) : (
                              <span className="sp-hist-empty" style={{ fontStyle: "italic" }}>Sin diagnóstico registrado</span>
                            )}
                            {c.tratamiento && (
                              <div className="sp-cita-detail-row">
                                <span className="sp-cita-detail-lbl">Tx</span>
                                <span>{c.tratamiento}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {historialCitas.filter(c => c.estado === "ATENDIDA").length > 3 && (
                    <button
                      onClick={() => { setModalCitas(true); setPaginaCitas(0); }}
                      style={{
                        width: "100%", marginTop: 6, padding: "6px 0",
                        border: "1px dashed var(--border)", borderRadius: 8,
                        background: "none", color: "var(--primary)", cursor: "pointer",
                        fontSize: 11, fontWeight: 600,
                      }}
                    >
                      Ver todas ({historialCitas.filter(c => c.estado === "ATENDIDA").length})
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="soap-main">
        {/* SOAP tabs nav */}
        <nav className="soap-nav">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              className={`soap-nav-btn ${section === s.id ? "active" : ""}`}
              onClick={() => setSection(s.id)}
            >
              <span className="soap-nav-letter" style={{ color: section === s.id ? "var(--primary)" : isDone(s.id) ? "var(--success)" : "var(--text-muted)" }}>
                {s.label}
              </span>
              <span className="soap-nav-sub">{s.sub}</span>
              {isDone(s.id) && section !== s.id && <span className="soap-nav-check">✓</span>}
            </button>
          ))}
        </nav>

        {/* Section content */}
        <div className="soap-content">
          {section === "S" && (
            <SectionS
              data={soapData.S}
              setData={val => updateSection("S", val)}
              onNext={() => setSection("O")}
            />
          )}
          {section === "O" && (
            <SectionO
              data={soapData.O}
              setData={val => updateSection("O", val)}
              onPrev={() => setSection("S")}
              onNext={() => setSection("A")}
            />
          )}
          {section === "A" && (
            <SectionA
              data={soapData.A}
              setData={val => updateSection("A", val)}
              onPrev={() => setSection("O")}
              onNext={() => setSection("P")}
            />
          )}
          {section === "P" && (
            <SectionP
              data={soapData.P}
              setData={val => updateSection("P", val)}
              onPrev={() => setSection("A")}
              onFinalize={handleFinalizar}
              examenes={examenes}
              setExamenes={setExamenes}
              medicamentos={medicamentos}
              setMedicamentos={setMedicamentos}
              onOpenModal={setModalAbierto}
            />
          )}
        </div>

        {/* Footer */}
        <div className="soap-footer">
          <div className="soap-footer-status">
            {saving ? (
              <span style={{ color: "var(--primary)" }}>Guardando…</span>
            ) : lastSaved ? (
              <span style={{ color: "var(--success)" }}>✓ Guardado a las {lastSaved}</span>
            ) : (
              <span>Sin cambios guardados</span>
            )}
            <span className="soap-badge-progress">Consulta en progreso</span>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="soap-btn-secondary" onClick={handleSaveDraft} disabled={saving}>
              {saving ? "Guardando…" : "Guardar borrador"}
            </button>
            <button
              className="soap-btn-secondary"
              onClick={handleImprimirReceta}
              disabled={saving || medicamentos.length === 0}
              title={medicamentos.length === 0 ? "Agregue medicamentos para generar la receta" : "Generar Receta Única Estandarizada (PDF)"}
              style={{ opacity: medicamentos.length === 0 ? 0.5 : 1 }}
            >
              Imprimir receta
            </button>
            <button className="soap-btn-next" onClick={handleFinalizar} disabled={saving}>
              Finalizar Consulta
            </button>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {modalAbierto === "examen" && (
        <ModalSolicitudExamen
          cita={cita}
          onClose={() => setModalAbierto(null)}
          onAdd={e => { setExamenes(prev => [...prev, { ...e, _uid: crypto.randomUUID() }]); setModalAbierto(null); }}
          diagnosticoPrefill={
            soapData.A.diagnoses[0]
              ? `${soapData.A.diagnoses[0].name}${soapData.A.diagnoses[0].code ? ` (${soapData.A.diagnoses[0].code})` : ""}`
              : undefined
          }
        />
      )}
      {modalAbierto === "receta" && (
        <ModalReceta
          cita={cita}
          alergias={alergias.map(a => a.sustancia)}
          onClose={() => setModalAbierto(null)}
          onAdd={m => { setMedicamentos(prev => [...prev, { ...m, _uid: crypto.randomUUID() }]); setModalAbierto(null); }}
        />
      )}
      {modalAbierto === "referencia" && (
        <ModalReferencia cita={cita} onClose={() => setModalAbierto(null)} />
      )}
      {modalAbierto === "interconsulta" && (
        <ModalInterconsulta cita={cita} onClose={() => setModalAbierto(null)} />
      )}

      {/* ── Modal suspender medicamento ── */}
      {modalSuspender && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "var(--bg-card)", borderRadius: 12, padding: 24, width: 380, maxWidth: "90vw",
            boxShadow: "var(--shadow-xl)", border: "1px solid var(--border)",
          }}>
            <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
              Suspender medicamento
            </h3>
            <p style={{ margin: "0 0 16px", fontSize: 12, color: "var(--text-muted)" }}>
              El medicamento queda en el historial como suspendido, no se elimina.
            </p>

            {/* Nombre del medicamento */}
            <div style={{
              background: "var(--bg-muted)", borderRadius: 8, padding: "8px 12px", marginBottom: 14,
              border: "1px solid var(--border)",
            }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{modalSuspender.nombre}</div>
              {modalSuspender.dosis && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{modalSuspender.dosis} · {modalSuspender.frecuencia}</div>}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
                  Fecha en que dejó de tomarlo
                </label>
                <input
                  type="date"
                  value={suspForm.fecha}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={e => setSuspForm(p => ({ ...p, fecha: e.target.value }))}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, background: "var(--bg-body)", color: "var(--text-primary)", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
                  Motivo de suspensión <span style={{ color: "var(--error)" }}>*</span>
                </label>
                <select
                  value={suspForm.motivo}
                  onChange={e => setSuspForm(p => ({ ...p, motivo: e.target.value }))}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, background: "var(--bg-body)", color: "var(--text-primary)" }}
                >
                  <option value="">Seleccionar motivo...</option>
                  {MOTIVOS_SUSPENSION.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
              <button
                onClick={() => { setModalSuspender(null); setSuspForm({ fecha: "", motivo: "" }); }}
                style={{ padding: "8px 16px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg-body)", color: "var(--text-primary)", cursor: "pointer", fontSize: 13 }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSuspenderMedicamento}
                disabled={!suspForm.motivo}
                style={{
                  padding: "8px 16px", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: suspForm.motivo ? "var(--warning, #d97706)" : "var(--border)",
                  color: suspForm.motivo ? "white" : "var(--text-muted)",
                  cursor: suspForm.motivo ? "pointer" : "not-allowed",
                }}
              >
                Confirmar suspensión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal todas las citas anteriores ── */}
      {modalCitas && (() => {
        const ITEMS_PAG = 10;
        const citasAtendidas = historialCitas.filter(c => c.estado === "ATENDIDA");
        const totalPags = Math.ceil(citasAtendidas.length / ITEMS_PAG);
        const pagina = Math.min(paginaCitas, totalPags - 1);
        const citasPag = citasAtendidas.slice(pagina * ITEMS_PAG, (pagina + 1) * ITEMS_PAG);
        return (
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => { setModalCitas(false); setCitaExpandidaModal(null); }}
          >
            <div
              style={{ background: "var(--bg-card)", borderRadius: 12, width: 560, maxWidth: "94vw", maxHeight: "82vh", display: "flex", flexDirection: "column", boxShadow: "var(--shadow-xl)", border: "1px solid var(--border)" }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Citas Anteriores</h3>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-muted)" }}>
                    {citasAtendidas.length} consulta{citasAtendidas.length !== 1 ? "s" : ""} atendida{citasAtendidas.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  onClick={() => { setModalCitas(false); setCitaExpandidaModal(null); }}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "var(--text-muted)", lineHeight: 1, padding: "4px 8px" }}
                >×</button>
              </div>

              {/* Lista */}
              <div style={{ overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                {citasPag.map(c => {
                  const esExpandida = citaExpandidaModal === c._id;
                  const especialidad = (c.doctorId as any)?.especialidadId?.nombre ?? "—";
                  const doctor = c.doctorId ? `${c.doctorId.nombres} ${c.doctorId.apellidos}` : "—";
                  let motivoConsulta = "";
                  if (c.notasClinicas) {
                    try {
                      const parsed = JSON.parse(c.notasClinicas);
                      motivoConsulta = parsed.soap?.S?.motivoConsulta ?? "";
                    } catch { /* ignorar */ }
                  }
                  return (
                    <div key={c._id} className={`sp-cita-card${esExpandida ? " sp-cita-card--open" : ""}`}>
                      <div className="sp-cita-card-header" onClick={() => setCitaExpandidaModal(esExpandida ? null : c._id)}>
                        <div className="sp-cita-card-left">
                          <div className="sp-cita-card-top-row">
                            <span className="sp-cita-card-fecha">{formatearFechaCorta(c.fecha)}</span>
                            <span className="sp-cita-card-esp">{especialidad}</span>
                          </div>
                          <span className="sp-cita-card-dr">Dr. {doctor}</span>
                        </div>
                        <span className="sp-badge sp-badge--atendida">ATENDIDA</span>
                      </div>
                      {esExpandida && (
                        <div className="sp-cita-card-body">
                          {motivoConsulta && (
                            <div className="sp-cita-detail-row">
                              <span className="sp-cita-detail-lbl">Motivo</span>
                              <span>{motivoConsulta}</span>
                            </div>
                          )}
                          {c.diagnostico ? (
                            <div className="sp-cita-detail-row">
                              <span className="sp-cita-detail-lbl">Dx</span>
                              <span>{c.diagnostico}</span>
                            </div>
                          ) : (
                            <span className="sp-hist-empty" style={{ fontStyle: "italic" }}>Sin diagnóstico registrado</span>
                          )}
                          {c.tratamiento && (
                            <div className="sp-cita-detail-row">
                              <span className="sp-cita-detail-lbl">Tx</span>
                              <span>{c.tratamiento}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Paginación */}
              {totalPags > 1 && (
                <div className="sp-modal-pag">
                  <button
                    className="sp-pag-btn"
                    disabled={pagina === 0}
                    onClick={() => { setPaginaCitas(pagina - 1); setCitaExpandidaModal(null); }}
                  >← Anterior</button>
                  <span className="sp-pag-info">
                    Página {pagina + 1} de {totalPags}
                    <span className="sp-pag-rango">
                      &nbsp;({pagina * ITEMS_PAG + 1}–{Math.min((pagina + 1) * ITEMS_PAG, citasAtendidas.length)} de {citasAtendidas.length})
                    </span>
                  </span>
                  <button
                    className="sp-pag-btn"
                    disabled={pagina >= totalPags - 1}
                    onClick={() => { setPaginaCitas(pagina + 1); setCitaExpandidaModal(null); }}
                  >Siguiente →</button>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── Modales de historial clínico ── */}
      {modalHistorial && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "var(--bg-card)", borderRadius: 12, padding: 24, width: 360, maxWidth: "90vw",
            boxShadow: "var(--shadow-xl)", border: "1px solid var(--border)",
          }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
              {modalHistorial === "alergia"     && "Agregar Alergia"}
              {modalHistorial === "medicamento" && "Agregar Medicamento Habitual"}
              {modalHistorial === "problema"    && "Agregar Problema Médico"}
              {modalHistorial === "cirugia"     && "Agregar Cirugía Previa"}
              {modalHistorial === "antFamiliar" && "Agregar Antecedente Familiar"}
            </h3>

            {modalHistorial === "alergia" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>Sustancia o alergeno *</label>
                  <input placeholder="Ej. Penicilina, mariscos, látex" value={nuevoItem.sustancia || ""}
                    onChange={e => setNuevoItem(p => ({ ...p, sustancia: e.target.value }))}
                    style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, background: "var(--bg-body)", color: "var(--text-primary)" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>Reacción presentada *</label>
                  <input placeholder="Ej. Urticaria, anafilaxia, edema" value={nuevoItem.reaccion || ""}
                    onChange={e => setNuevoItem(p => ({ ...p, reaccion: e.target.value }))}
                    style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, background: "var(--bg-body)", color: "var(--text-primary)" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>Severidad</label>
                  <select value={nuevoItem.severidad || "leve"}
                    onChange={e => setNuevoItem(p => ({ ...p, severidad: e.target.value }))}
                    style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, background: "var(--bg-body)", color: "var(--text-primary)" }}>
                    <option value="leve">Leve</option>
                    <option value="moderada">Moderada</option>
                    <option value="severa">Severa</option>
                  </select>
                </div>
              </div>
            )}

            {modalHistorial === "medicamento" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>Nombre del medicamento *</label>
                  <input placeholder="Ej. Metformina, Losartán, Atorvastatina" value={nuevoItem.nombre || ""}
                    onChange={e => setNuevoItem(p => ({ ...p, nombre: e.target.value }))}
                    style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, background: "var(--bg-body)", color: "var(--text-primary)" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>Dosis</label>
                  <input placeholder="Ej. 500 mg, 10 mg" value={nuevoItem.dosis || ""}
                    onChange={e => setNuevoItem(p => ({ ...p, dosis: e.target.value }))}
                    style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, background: "var(--bg-body)", color: "var(--text-primary)" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>Frecuencia</label>
                  <input placeholder="Ej. Cada 8 horas, 1 vez al día" value={nuevoItem.frecuencia || ""}
                    onChange={e => setNuevoItem(p => ({ ...p, frecuencia: e.target.value }))}
                    style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, background: "var(--bg-body)", color: "var(--text-primary)" }} />
                </div>
              </div>
            )}

            {modalHistorial === "problema" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>Problema o enfermedad *</label>
                  <input placeholder="Ej. Diabetes tipo 2, Hipertensión arterial" value={nuevoItem.descripcion || ""}
                    onChange={e => setNuevoItem(p => ({ ...p, descripcion: e.target.value }))}
                    style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, background: "var(--bg-body)", color: "var(--text-primary)" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>Fecha de inicio (aproximada)</label>
                  <input type="date"
                    value={nuevoItem.fechaInicio || ""}
                    onChange={e => setNuevoItem(p => ({ ...p, fechaInicio: e.target.value }))}
                    style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, background: "var(--bg-body)", color: "var(--text-primary)" }} />
                </div>
              </div>
            )}

            {modalHistorial === "cirugia" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>Procedimiento quirúrgico *</label>
                  <input placeholder="Ej. Apendicectomía, colecistectomía" value={nuevoItem.procedimiento || ""}
                    onChange={e => setNuevoItem(p => ({ ...p, procedimiento: e.target.value }))}
                    style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, background: "var(--bg-body)", color: "var(--text-primary)" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>Fecha de la cirugía</label>
                  <input type="date"
                    value={nuevoItem.fecha || ""}
                    onChange={e => setNuevoItem(p => ({ ...p, fecha: e.target.value }))}
                    style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, background: "var(--bg-body)", color: "var(--text-primary)" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>Hospital o clínica</label>
                  <input placeholder="Ej. Hospital Loayza, Clínica San Pablo" value={nuevoItem.hospital || ""}
                    onChange={e => setNuevoItem(p => ({ ...p, hospital: e.target.value }))}
                    style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, background: "var(--bg-body)", color: "var(--text-primary)" }} />
                </div>
              </div>
            )}

            {modalHistorial === "antFamiliar" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <select value={nuevoItem.parentesco || ""}
                  onChange={e => setNuevoItem(p => ({ ...p, parentesco: e.target.value }))}
                  style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, background: "var(--bg-body)", color: "var(--text-primary)" }}>
                  <option value="">Parentesco *</option>
                  <option value="Padre">Padre</option>
                  <option value="Madre">Madre</option>
                  <option value="Hermano/a">Hermano/a</option>
                  <option value="Abuelo paterno">Abuelo paterno</option>
                  <option value="Abuela paterna">Abuela paterna</option>
                  <option value="Abuelo materno">Abuelo materno</option>
                  <option value="Abuela materna">Abuela materna</option>
                  <option value="Tío/a">Tío/a</option>
                  <option value="Otro">Otro</option>
                </select>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>Condición médica *</label>
                  <input placeholder="Ej. Diabetes tipo 2, cardiopatía, cáncer" value={nuevoItem.condicion || ""}
                    onChange={e => setNuevoItem(p => ({ ...p, condicion: e.target.value }))}
                    style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, background: "var(--bg-body)", color: "var(--text-primary)" }} />
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
              <button onClick={() => { setModalHistorial(null); setNuevoItem({}); }}
                style={{ padding: "8px 16px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg-body)", color: "var(--text-primary)", cursor: "pointer", fontSize: 13 }}>
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (modalHistorial === "alergia")     handleAgregarAlergia();
                  if (modalHistorial === "medicamento") handleAgregarMedicamento();
                  if (modalHistorial === "problema")    handleAgregarProblema();
                  if (modalHistorial === "cirugia")     handleAgregarCirugia();
                  if (modalHistorial === "antFamiliar") handleAgregarAntFamiliar();
                }}
                style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: "var(--primary)", color: "white", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
