import { useState } from "react";
import { X } from "lucide-react";
import type { ExamenOrdenado } from "../../pages/NotaSOAP/types";
import type { CitaMedico } from "../../services/medico.service";

interface Props {
  cita: CitaMedico;
  onClose: () => void;
  onAdd: (e: ExamenOrdenado) => void;
}

const EXAMENES: Record<string, Record<string, string[]>> = {
  Laboratorio: {
    Hematología:  ["Hemograma completo", "Recuento de plaquetas", "Velocidad de sedimentación"],
    Bioquímica:   ["Glucosa basal", "HbA1c (hemoglobina glicosilada)", "Creatinina / BUN", "Perfil lipídico", "Perfil hepático (TGO, TGP)", "Electrolitos (Na, K, Cl)", "Ácido úrico"],
    Cardiaco:     ["BNP (Péptido natriurético)", "Troponina I o T", "CK-MB"],
    Otros:        ["Uroanálisis", "Urocultivo", "TSH (Tiroides)", "Examen de orina 24h"],
  },
  Radiología: {
    Imágenes:     ["Radiografía de tórax PA y Lateral", "Radiografía de abdomen", "Ecografía abdominal", "Ecografía pélvica", "Ecografía de tiroides", "Mamografía"],
    Avanzado:     ["Tomografía computarizada (especificar)", "Resonancia magnética (especificar)"],
  },
  Especializado: {
    Procedimientos: ["Electrocardiograma (ECG 12 derivaciones)", "Ecocardiograma transtorácico", "Espirometría", "Prueba de esfuerzo", "Electroencefalograma"],
    Endoscopia:     ["Colonoscopia", "Endoscopia digestiva alta"],
  },
};

export default function ModalSolicitudExamen({ cita, onClose, onAdd }: Props) {
  const [tab, setTab]           = useState<"Laboratorio" | "Radiología" | "Especializado">("Laboratorio");
  const [selected, setSelected] = useState<{ nombre: string; tipo: "Laboratorio" | "Radiología" | "Especializado" }[]>([]);
  const [urgente, setUrgente]   = useState(false);
  const [otroExamen, setOtro]   = useState("");
  const [instrucciones, setInstr] = useState("");

  const pac = cita.pacienteId;
  const nombre = `${pac.nombres} ${pac.apellidos}`;

  const toggle = (name: string) =>
    setSelected(prev =>
      prev.find(e => e.nombre === name)
        ? prev.filter(e => e.nombre !== name)
        : [...prev, { nombre: name, tipo: tab }]
    );

  const isChecked = (name: string) => !!selected.find(e => e.nombre === name);

  const handleAdd = () => {
    if (selected.length === 0) return;
    selected.forEach(e => onAdd({ ...e, urgente }));
  };

  const addOtro = () => {
    const t = otroExamen.trim();
    if (!t) return;
    toggle(t);
    setOtro("");
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 700 }}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="modal-title">Solicitud de Exámenes Diagnósticos</div>
            <div className="modal-subtitle">Seleccione los exámenes y establezca la prioridad</div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Patient band */}
          <div className="modal-pac-band">
            <span className="modal-pac-name">{nombre}</span>
            <span className="modal-pac-meta">DNI: {pac.dni}</span>
          </div>

          {/* Tabs */}
          <div className="modal-tabs">
            {(["Laboratorio", "Radiología", "Especializado"] as const).map(t => (
              <button key={t} className={`modal-tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>{t}</button>
            ))}
          </div>

          {/* Exam groups */}
          {Object.entries(EXAMENES[tab] || {}).map(([group, exams]) => (
            <div key={group} style={{ marginBottom: 16 }}>
              <div className="modal-group-label">{group}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {exams.map(ex => (
                  <label key={ex} className={`soap-check-item ${isChecked(ex) ? "checked" : ""}`} style={{ padding: "7px 10px" }}>
                    <input type="checkbox" checked={isChecked(ex)} onChange={() => toggle(ex)}
                      style={{ accentColor: "var(--primary)", flexShrink: 0 }} />
                    <span style={{ fontSize: 13 }}>{ex}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          {/* Otro examen */}
          <div style={{ marginBottom: 16 }}>
            <label className="soap-section-label">Otro examen (campo libre)</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="soap-input" style={{ flex: 1 }} placeholder=""
                value={otroExamen} onChange={e => setOtro(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addOtro()} />
              <button className="soap-btn-secondary" onClick={addOtro}>Agregar</button>
            </div>
          </div>

          {/* Instructions + Priority */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "flex-start" }}>
            <div>
              <label className="soap-section-label">Instrucciones para el paciente</label>
              <textarea className="soap-input soap-textarea" style={{ minHeight: 60 }}
                placeholder=""
                value={instrucciones} onChange={e => setInstr(e.target.value)} />
            </div>
            <div>
              <label className="soap-section-label">Prioridad</label>
              {[{ val: false, label: "Normal", sub: "3–5 días" }, { val: true, label: "Urgente", sub: "24 horas" }].map(p => (
                <label key={p.label} style={{ display: "flex", alignItems: "flex-start", gap: 7, marginBottom: 10, cursor: "pointer" }}>
                  <input type="radio" checked={urgente === p.val} onChange={() => setUrgente(p.val)}
                    style={{ accentColor: "var(--primary)", marginTop: 2 }} />
                  <span>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{p.label}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{p.sub}</div>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Selected summary */}
          {selected.length > 0 && (
            <div style={{ marginTop: 16, background: "var(--bg-muted)", borderRadius: 8, padding: 12, border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6 }}>
                EXÁMENES SELECCIONADOS ({selected.length})
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {selected.map((e) => (
                  <span key={e._id ?? e.nombre} style={{ fontSize: 12, background: "var(--primary-lighter)", color: "var(--primary)", padding: "3px 10px", borderRadius: 12, fontWeight: 500 }}>
                    {e.nombre}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="soap-btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="soap-btn-next" onClick={handleAdd} disabled={selected.length === 0}
            style={{ opacity: selected.length === 0 ? 0.5 : 1, cursor: selected.length === 0 ? "not-allowed" : "pointer" }}>
            Agregar {selected.length > 0 ? `${selected.length} examen${selected.length !== 1 ? "es" : ""}` : "exámenes"}
          </button>
        </div>
      </div>
    </div>
  );
}
