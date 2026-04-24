import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "./NotaSOAP.css";

import type { SOAPData, ExamenOrdenado, MedicamentoSOAP } from "./types";
import { INITIAL_SOAP } from "./types";
import SectionS from "./sections/SectionS";
import SectionO from "./sections/SectionO";
import SectionA from "./sections/SectionA";
import SectionP from "./sections/SectionP";

import ModalSolicitudExamen from "../../components/modals/ModalSolicitudExamen";
import ModalReceta          from "../../components/modals/ModalReceta";
import ModalReferencia      from "../../components/modals/ModalReferencia";
import ModalInterconsulta   from "../../components/modals/ModalInterconsulta";

import { MedicoApiService } from "../../services/medico.service";
import type { CitaMedico } from "../../services/medico.service";

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

  useEffect(() => {
    if (!citaId) return;
    MedicoApiService.obtenerDetalleCita(citaId)
      .then(data => {
        setCita(data);
        if (data.notasClinicas) {
          try {
            const parsed = JSON.parse(data.notasClinicas);
            if (parsed.soap) setSoapData(parsed.soap);
            if (parsed.examenes) setExamenes(parsed.examenes);
            if (parsed.medicamentos) setMedicamentos(parsed.medicamentos);
          } catch { /* borrador no parseable, ignorar */ }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [citaId]);

  const updateSection = <K extends Section>(sec: K, val: SOAPData[K]) =>
    setSoapData(prev => ({ ...prev, [sec]: val }));

  const isDone = (sec: Section) => {
    const d = soapData[sec];
    if (sec === "S") return !!(d as SOAPData["S"]).motivoConsulta && !!(d as SOAPData["S"]).enfermedadActual;
    if (sec === "O") return !!(d as SOAPData["O"]).pa_s || !!(d as SOAPData["O"]).temp;
    if (sec === "A") return (d as SOAPData["A"]).diagnoses.length > 0;
    if (sec === "P") return !!(examenes.length || medicamentos.length || (d as SOAPData["P"]).medidas.length);
    return false;
  };

  const buildPayload = () => {
    const dxPrimario = soapData.A.diagnoses[0];
    return {
      notasClinicas: JSON.stringify({ soap: soapData, examenes, medicamentos }),
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
        <div style={{ padding: "10px 14px", flex: 1 }}>
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
    </div>
  );
}
