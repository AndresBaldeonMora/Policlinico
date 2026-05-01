import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { AlertTriangle, Pill, FileText, Plus, ChevronDown, ChevronUp } from "lucide-react";
import "./NotaSOAP.css";

import type { SOAPData, ExamenOrdenado, MedicamentoSOAP, EspecialidadData } from "./types";
import { INITIAL_SOAP } from "./types";
import SectionS from "./sections/SectionS";
import SectionO from "./sections/SectionO";
import SectionA from "./sections/SectionA";
import SectionP from "./sections/SectionP";
import SectionE from "./sections/SectionE";

import ModalSolicitudExamen from "../../components/modals/ModalSolicitudExamen";
import ModalReceta          from "../../components/modals/ModalReceta";
import ModalReferencia      from "../../components/modals/ModalReferencia";
import ModalInterconsulta   from "../../components/modals/ModalInterconsulta";

import { MedicoApiService } from "../../services/medico.service";
import type { CitaMedico, Alergia, MedicamentoHabitual, ProblemaMedico, CirugiaPevia, AntecedenteFamiliar } from "../../services/medico.service";
import { PacienteApiService } from "../../services/paciente.service";

type Section = "S" | "O" | "A" | "P" | "E";

const SECTIONS: { id: Section; label: string; sub: string }[] = [
  { id: "S", label: "S", sub: "Subjetivo" },
  { id: "O", label: "O", sub: "Objetivo" },
  { id: "A", label: "A", sub: "Análisis" },
  { id: "P", label: "P", sub: "Plan" },
  { id: "E", label: "E", sub: "Especialidad" },
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
  const [especData,    setEspecData]    = useState<EspecialidadData>({});
  const [especialidadNombre, setEspecialidadNombre] = useState<string>("");

  // ── Historial clínico del paciente ──────────────────────────
  const [alergias,          setAlergias]          = useState<Alergia[]>([]);
  const [medicHabituales,   setMedicHabituales]   = useState<MedicamentoHabitual[]>([]);
  const [problemasMedicos,  setProblemasMedicos]  = useState<ProblemaMedico[]>([]);
  const [cirugiasPrevias,      setCirugiasPrevias]      = useState<CirugiaPevia[]>([]);
  const [antecedentesFam,      setAntecedentesFam]      = useState<AntecedenteFamiliar[]>([]);
  const [historialExpandido,   setHistorialExpandido]   = useState(true);
  const [savingHistorial,      setSavingHistorial]      = useState(false);
  const [modalHistorial,       setModalHistorial]       = useState<"alergia" | "medicamento" | "problema" | "cirugia" | "antFamiliar" | null>(null);
  const [nuevoItem,         setNuevoItem]         = useState<Record<string, string>>({});

  useEffect(() => {
    if (!citaId) return;
    Promise.all([
      MedicoApiService.obtenerDetalleCita(citaId),
      MedicoApiService.obtenerMiPerfil(),
    ])
      .then(([data, perfil]) => {
        setCita(data);
        if (perfil?.especialidadId?.nombre) {
          setEspecialidadNombre(perfil.especialidadId.nombre);
        }
        if (data.notasClinicas) {
          try {
            const parsed = JSON.parse(data.notasClinicas);
            if (parsed.soap) setSoapData(parsed.soap);
            if (parsed.examenes) setExamenes(parsed.examenes);
            if (parsed.medicamentos) setMedicamentos(parsed.medicamentos);
            if (parsed.especialidad) setEspecData(parsed.especialidad);
          } catch { /* borrador no parseable, ignorar */ }
        }
        const pac = data.pacienteId;
        if (pac.alergias) setAlergias(pac.alergias);
        if (pac.medicamentosHabituales) setMedicHabituales(pac.medicamentosHabituales);
        if (pac.problemasMedicos) setProblemasMedicos(pac.problemasMedicos);
        if (pac.cirugiasPrevias) setCirugiasPrevias(pac.cirugiasPrevias);
        if (pac.antecedentesFamiliares) setAntecedentesFam(pac.antecedentesFamiliares);
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

  const updateSection = <K extends keyof SOAPData>(sec: K, val: SOAPData[K]) =>
    setSoapData(prev => ({ ...prev, [sec]: val }));

  const isDone = (sec: Section) => {
    if (sec === "E") return Object.keys(especData).some(k => especData[k] !== "");
    const d = soapData[sec as Exclude<Section, "E">];
    if (sec === "S") return !!(d as SOAPData["S"]).motivoConsulta && !!(d as SOAPData["S"]).enfermedadActual;
    if (sec === "O") return !!(d as SOAPData["O"]).pa_s || !!(d as SOAPData["O"]).temp;
    if (sec === "A") return (d as SOAPData["A"]).diagnoses.length > 0;
    if (sec === "P") return !!(examenes.length || medicamentos.length || (d as SOAPData["P"]).medidas.length);
    return false;
  };

  const buildPayload = () => {
    const dxPrimario = soapData.A.diagnoses[0];
    return {
      notasClinicas: JSON.stringify({ soap: soapData, examenes, medicamentos, especialidad: especData }),
      diagnostico:   dxPrimario ? `${dxPrimario.code} — ${dxPrimario.name}` : "",
      tratamiento:   medicamentos.map(m => `${m.nombre} ${m.concentracion} ${m.frecuencia}`).join("; "),
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
      await MedicoApiService.guardarNotasClinicas(citaId, buildPayload());
      await MedicoApiService.actualizarEstadoCita(citaId, "ATENDIDA");
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
        {/* Patient header */}
        <div className="soap-panel-header">
          <div className="soap-avatar">{initials(pac.nombres, pac.apellidos)}</div>
          <div>
            <div className="soap-panel-name">{pacNombre}</div>
            <div className="soap-panel-meta">{calcAge(pac.fechaNacimiento)} · DNI {pac.dni}</div>
          </div>
        </div>

        {/* Cita info */}
        <div className="soap-panel-cita">
          <div style={{ fontWeight: 600, color: "var(--primary)", fontSize: 12 }}>Consulta #{cita._id.slice(-6).toUpperCase()}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
            {new Date(cita.fecha).toLocaleDateString("es-PE")} — {cita.hora}
          </div>
          {cita.notas && (
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, fontStyle: "italic" }}>
              "{cita.notas.substring(0, 60)}{cita.notas.length > 60 ? "…" : ""}"
            </div>
          )}
        </div>

        {/* Estado */}
        <div style={{ padding: "8px 14px", borderBottom: "1px solid var(--border)" }}>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 10,
            background: cita.estado === "PENDIENTE" ? "var(--warning-bg, #fffbeb)" : "var(--primary-lighter)",
            color: cita.estado === "PENDIENTE" ? "var(--warning)" : "var(--primary)",
          }}>
            {cita.estado}
          </span>
        </div>

        {/* Progress dots */}
        <div className="soap-panel-progress">
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Progreso</div>
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
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>
            Sección actual: <strong style={{ color: "var(--text-primary)" }}>{SECTIONS.find(s => s.id === section)?.sub}</strong>
          </div>
        </div>

        {/* Checklist summary */}
        <div style={{ padding: "10px 14px" }}>
          {SECTIONS.map(s => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, fontSize: 12, cursor: "pointer" }}
              onClick={() => setSection(s.id)}>
              <span style={{
                width: 16, height: 16, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 700, flexShrink: 0,
                background: isDone(s.id) ? "var(--success)" : "var(--border)",
                color: isDone(s.id) ? "white" : "var(--text-muted)",
              }}>
                {isDone(s.id) ? "✓" : s.label}
              </span>
              <span style={{ color: isDone(s.id) ? "var(--text-primary)" : "var(--text-muted)", fontWeight: isDone(s.id) ? 600 : 400 }}>
                {s.sub}
              </span>
            </div>
          ))}
        </div>

        {/* ── Historial Clínico del Paciente ── */}
        <div style={{ borderTop: "1px solid var(--border)", margin: "0 0 0 0" }}>
          <button
            onClick={() => setHistorialExpandido(v => !v)}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 14px", background: "none", border: "none", cursor: "pointer",
              fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.8,
            }}
          >
            <span>Historial Clínico</span>
            {historialExpandido ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {historialExpandido && (
            <div style={{ padding: "0 14px 14px" }}>
              {savingHistorial && (
                <div style={{ fontSize: 10, color: "var(--primary)", marginBottom: 6 }}>Guardando…</div>
              )}

              {/* Alergias */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600 }}>
                    <AlertTriangle size={11} style={{ color: "#f59e0b" }} />
                    Alergias
                  </div>
                  <button onClick={() => { setNuevoItem({}); setModalHistorial("alergia"); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary)", padding: 2 }}>
                    <Plus size={12} />
                  </button>
                </div>
                {alergias.length === 0 ? (
                  <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>Sin alergias registradas</p>
                ) : alergias.map((a, i) => (
                  <div key={i} style={{ fontSize: 11, padding: "2px 0", color: "var(--text-primary)", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontWeight: 500 }}>{a.sustancia}</span>
                    {a.reaccion && <span style={{ color: "var(--text-muted)" }}> — {a.reaccion}</span>}
                    <span style={{
                      float: "right", fontSize: 10, fontWeight: 600, padding: "1px 5px", borderRadius: 4,
                      background: a.severidad === "severa" ? "#fee2e2" : a.severidad === "moderada" ? "#fef3c7" : "#f0fdf4",
                      color: a.severidad === "severa" ? "#dc2626" : a.severidad === "moderada" ? "#d97706" : "#16a34a",
                    }}>
                      {a.severidad}
                    </span>
                  </div>
                ))}
              </div>

              {/* Medicamentos habituales */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600 }}>
                    <Pill size={11} style={{ color: "#6366f1" }} />
                    Medicamentos Habituales
                  </div>
                  <button onClick={() => { setNuevoItem({}); setModalHistorial("medicamento"); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary)", padding: 2 }}>
                    <Plus size={12} />
                  </button>
                </div>
                {medicHabituales.filter(m => m.activo).length === 0 ? (
                  <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>Sin medicamentos registrados</p>
                ) : medicHabituales.filter(m => m.activo).map((m, i) => (
                  <div key={i} style={{ fontSize: 11, padding: "2px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontWeight: 500 }}>{m.nombre}</span>
                    {m.dosis && <span style={{ color: "var(--text-muted)" }}> {m.dosis}</span>}
                    {m.frecuencia && <span style={{ color: "var(--text-muted)" }}> — {m.frecuencia}</span>}
                  </div>
                ))}
              </div>

              {/* Problemas médicos */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600 }}>
                    <FileText size={11} style={{ color: "#0ea5e9" }} />
                    Problemas Médicos
                  </div>
                  <button onClick={() => { setNuevoItem({}); setModalHistorial("problema"); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary)", padding: 2 }}>
                    <Plus size={12} />
                  </button>
                </div>
                {problemasMedicos.filter(p => p.estado === "activo").length === 0 ? (
                  <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>Sin problemas registrados</p>
                ) : problemasMedicos.filter(p => p.estado === "activo").map((p, i) => (
                  <div key={i} style={{ fontSize: 11, padding: "2px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontWeight: 500 }}>{p.descripcion}</span>
                    {p.fechaInicio && <span style={{ color: "var(--text-muted)", fontSize: 10 }}> ({new Date(p.fechaInicio).getFullYear()})</span>}
                  </div>
                ))}
              </div>

              {/* Cirugías previas */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600 }}>
                    <span style={{ fontSize: 11, color: "#8b5cf6" }}>✂</span>
                    Cirugías Previas
                  </div>
                  <button onClick={() => { setNuevoItem({}); setModalHistorial("cirugia"); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary)", padding: 2 }}>
                    <Plus size={12} />
                  </button>
                </div>
                {cirugiasPrevias.length === 0 ? (
                  <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>Sin cirugías registradas</p>
                ) : cirugiasPrevias.map((c, i) => (
                  <div key={i} style={{ fontSize: 11, padding: "2px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontWeight: 500 }}>{c.procedimiento}</span>
                    {c.fecha && <span style={{ color: "var(--text-muted)", fontSize: 10 }}> ({new Date(c.fecha).getFullYear()})</span>}
                    {c.hospital && <span style={{ color: "var(--text-muted)" }}> · {c.hospital}</span>}
                  </div>
                ))}
              </div>

              {/* Antecedentes familiares */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600 }}>
                    <span style={{ fontSize: 11, color: "#ec4899" }}>👨‍👩‍👧</span>
                    Antecedentes Familiares
                  </div>
                  <button onClick={() => { setNuevoItem({}); setModalHistorial("antFamiliar"); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary)", padding: 2 }}>
                    <Plus size={12} />
                  </button>
                </div>
                {antecedentesFam.length === 0 ? (
                  <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>Sin antecedentes registrados</p>
                ) : antecedentesFam.map((a, i) => (
                  <div key={i} style={{ fontSize: 11, padding: "2px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontWeight: 500, color: "var(--text-muted)", textTransform: "capitalize" }}>{a.parentesco}:</span>
                    <span style={{ marginLeft: 4 }}>{a.condicion}</span>
                  </div>
                ))}
              </div>
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
          {section === "E" && (
            <SectionE
              especialidadNombre={especialidadNombre}
              data={especData}
              setData={setEspecData}
              onPrev={() => setSection("P")}
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
          onAdd={e => { setExamenes(prev => [...prev, e]); setModalAbierto(null); }}
        />
      )}
      {modalAbierto === "receta" && (
        <ModalReceta
          cita={cita}
          onClose={() => setModalAbierto(null)}
          onAdd={m => { setMedicamentos(prev => [...prev, m]); setModalAbierto(null); }}
        />
      )}
      {modalAbierto === "referencia" && (
        <ModalReferencia cita={cita} onClose={() => setModalAbierto(null)} />
      )}
      {modalAbierto === "interconsulta" && (
        <ModalInterconsulta cita={cita} onClose={() => setModalAbierto(null)} />
      )}

      {/* ── Modales de historial clínico ── */}
      {modalHistorial && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "white", borderRadius: 12, padding: 24, width: 360, maxWidth: "90vw",
            boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>
              {modalHistorial === "alergia"     && "Agregar Alergia"}
              {modalHistorial === "medicamento" && "Agregar Medicamento Habitual"}
              {modalHistorial === "problema"    && "Agregar Problema Médico"}
              {modalHistorial === "cirugia"     && "Agregar Cirugía Previa"}
              {modalHistorial === "antFamiliar" && "Agregar Antecedente Familiar"}
            </h3>

            {modalHistorial === "alergia" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input placeholder="Sustancia alérgena *" value={nuevoItem.sustancia || ""}
                  onChange={e => setNuevoItem(p => ({ ...p, sustancia: e.target.value }))}
                  style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }} />
                <input placeholder="Reacción (ej: urticaria, anafilaxia)" value={nuevoItem.reaccion || ""}
                  onChange={e => setNuevoItem(p => ({ ...p, reaccion: e.target.value }))}
                  style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }} />
                <select value={nuevoItem.severidad || "leve"}
                  onChange={e => setNuevoItem(p => ({ ...p, severidad: e.target.value }))}
                  style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }}>
                  <option value="leve">Leve</option>
                  <option value="moderada">Moderada</option>
                  <option value="severa">Severa</option>
                </select>
              </div>
            )}

            {modalHistorial === "medicamento" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input placeholder="Nombre del medicamento *" value={nuevoItem.nombre || ""}
                  onChange={e => setNuevoItem(p => ({ ...p, nombre: e.target.value }))}
                  style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }} />
                <input placeholder="Dosis (ej: 500mg)" value={nuevoItem.dosis || ""}
                  onChange={e => setNuevoItem(p => ({ ...p, dosis: e.target.value }))}
                  style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }} />
                <input placeholder="Frecuencia (ej: cada 8 horas)" value={nuevoItem.frecuencia || ""}
                  onChange={e => setNuevoItem(p => ({ ...p, frecuencia: e.target.value }))}
                  style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }} />
              </div>
            )}

            {modalHistorial === "problema" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input placeholder="Descripción del problema *" value={nuevoItem.descripcion || ""}
                  onChange={e => setNuevoItem(p => ({ ...p, descripcion: e.target.value }))}
                  style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }} />
                <input type="date" placeholder="Fecha de inicio"
                  value={nuevoItem.fechaInicio || ""}
                  onChange={e => setNuevoItem(p => ({ ...p, fechaInicio: e.target.value }))}
                  style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }} />
              </div>
            )}

            {modalHistorial === "cirugia" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input placeholder="Procedimiento quirúrgico *" value={nuevoItem.procedimiento || ""}
                  onChange={e => setNuevoItem(p => ({ ...p, procedimiento: e.target.value }))}
                  style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }} />
                <input type="date" placeholder="Fecha"
                  value={nuevoItem.fecha || ""}
                  onChange={e => setNuevoItem(p => ({ ...p, fecha: e.target.value }))}
                  style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }} />
                <input placeholder="Hospital / Centro (opcional)" value={nuevoItem.hospital || ""}
                  onChange={e => setNuevoItem(p => ({ ...p, hospital: e.target.value }))}
                  style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }} />
              </div>
            )}

            {modalHistorial === "antFamiliar" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <select value={nuevoItem.parentesco || ""}
                  onChange={e => setNuevoItem(p => ({ ...p, parentesco: e.target.value }))}
                  style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }}>
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
                <input placeholder="Condición / enfermedad *" value={nuevoItem.condicion || ""}
                  onChange={e => setNuevoItem(p => ({ ...p, condicion: e.target.value }))}
                  style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }} />
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
              <button onClick={() => { setModalHistorial(null); setNuevoItem({}); }}
                style={{ padding: "8px 16px", border: "1px solid var(--border)", borderRadius: 8, background: "white", cursor: "pointer", fontSize: 13 }}>
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
