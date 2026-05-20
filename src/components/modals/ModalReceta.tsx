import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import type { MedicamentoSOAP } from "../../pages/NotaSOAP/types";
import type { CitaMedico } from "../../services/medico.service";

interface Props {
  cita: CitaMedico;
  alergias?: string[];
  onClose: () => void;
  onAdd: (m: MedicamentoSOAP) => void;
}

const FORMAS  = ["Tableta", "Cápsula", "Jarabe", "Inyectable", "Ungüento", "Gotas", "Inhalador", "Supositorio"];
const VIAS    = ["Oral", "Intramuscular", "Intravenosa", "Subcutánea", "Tópica", "Oftálmica", "Inhalatoria"];
const FREQ    = ["Cada 6h", "Cada 8h", "Cada 12h", "Cada 24h", "2 veces/día", "3 veces/día", "Solo si necesario"];
const DURAC   = ["3 días", "5 días", "7 días", "14 días", "30 días", "Indefinido"];

const EMPTY: MedicamentoSOAP = { nombre: "", concentracion: "", forma: "Tableta", via: "Oral", dosis: "", frecuencia: "Cada 24h", duracion: "7 días", instrucciones: "" };
const EMPTY_ALERGIAS: string[] = [];

export default function ModalReceta({ cita, alergias = EMPTY_ALERGIAS, onClose, onAdd }: Props) {
  const [meds, setMeds]       = useState<MedicamentoSOAP[]>([]);
  const [form, setForm]       = useState<MedicamentoSOAP>({ ...EMPTY });
  const [alertaMed, setAlerta] = useState<string | null>(null);

  const pac = cita.pacienteId;
  const nombre = `${pac.nombres} ${pac.apellidos}`;

  const upF = (key: keyof MedicamentoSOAP, val: string) => setForm(p => ({ ...p, [key]: val }));

  const checkAlergia = (n: string) => {
    if (!n || alergias.length === 0) { setAlerta(null); return; }
    const found = alergias.find(a =>
      n.toLowerCase().includes(a.toLowerCase()) || a.toLowerCase().includes(n.toLowerCase())
    );
    setAlerta(found || null);
  };

  const handleAgregar = () => {
    if (!form.nombre.trim()) return;
    setMeds(prev => [...prev, { ...form, _uid: crypto.randomUUID() }]);
    setForm({ ...EMPTY });
    setAlerta(null);
  };

  const handleGuardar = () => {
    meds.forEach(m => onAdd(m));
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 700 }}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="modal-title">Nueva Prescripción Médica</div>
            <div className="modal-subtitle">Registre los medicamentos para agregar a la nota SOAP</div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          {/* Patient band */}
          <div className="modal-pac-band">
            <span className="modal-pac-name">{nombre}</span>
            <span className="modal-pac-meta">DNI: {pac.dni}</span>
            {alergias.length > 0 && (
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {alergias.map((a) => (
                  <span key={a} style={{ fontSize: 11, fontWeight: 700, background: "var(--error-bg)", color: "var(--error)", padding: "2px 8px", borderRadius: 10 }}>⛔ {a}</span>
                ))}
              </div>
            )}
          </div>

          {/* Form */}
          <div style={{ background: "var(--bg-muted)", borderRadius: 10, padding: 16, marginBottom: 16, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>Agregar medicamento</div>

            {alertaMed && (
              <div style={{ background: "var(--error-bg)", border: "1px solid var(--error)", borderRadius: 8, padding: "10px 14px", marginBottom: 12, display: "flex", gap: 8, alignItems: "flex-start" }}>
                <AlertTriangle size={16} color="var(--error)" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontWeight: 700, color: "var(--error)", fontSize: 13 }}>ALERTA DE ALERGIA</div>
                  <div style={{ color: "var(--error)", fontSize: 13 }}>El paciente tiene alergia registrada a <strong>{alertaMed}</strong></div>
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div>
                <label className="soap-section-label">Medicamento <span className="soap-required">*</span></label>
                <input className="soap-input" placeholder=""
                  value={form.nombre} onChange={e => { upF("nombre", e.target.value); checkAlergia(e.target.value); }} />
              </div>
              <div>
                <label className="soap-section-label">Concentración</label>
                <input className="soap-input" placeholder="" value={form.concentracion} onChange={e => upF("concentracion", e.target.value)} />
              </div>
              <div>
                <label className="soap-section-label">Forma farm.</label>
                <select className="soap-select" value={form.forma} onChange={e => upF("forma", e.target.value)}>
                  {FORMAS.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="soap-section-label">Vía</label>
                <select className="soap-select" value={form.via} onChange={e => upF("via", e.target.value)}>
                  {VIAS.map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
              <div>
                <label className="soap-section-label">Dosis</label>
                <input className="soap-input" placeholder="" value={form.dosis} onChange={e => upF("dosis", e.target.value)} />
              </div>
              <div>
                <label className="soap-section-label">Frecuencia</label>
                <select className="soap-select" value={form.frecuencia} onChange={e => upF("frecuencia", e.target.value)}>
                  {FREQ.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="soap-section-label">Duración</label>
                <select className="soap-select" value={form.duracion} onChange={e => upF("duracion", e.target.value)}>
                  {DURAC.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label className="soap-section-label">Instrucciones al paciente</label>
              <input className="soap-input" placeholder=""
                value={form.instrucciones} onChange={e => upF("instrucciones", e.target.value)} />
            </div>

            <button className="soap-btn-next" style={{ padding: "8px 20px" }} onClick={handleAgregar} disabled={!form.nombre.trim()}>
              + Agregar a la lista
            </button>
          </div>

          {/* Added meds */}
          {meds.length > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Medicamentos agregados ({meds.length})</div>
              {meds.map((m, i) => (
                <div key={m._uid ?? `${m.nombre}-${m.concentracion}-${i}`} style={{ background: "var(--bg-muted)", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, border: "1px solid var(--border)", marginBottom: 6 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>{m.nombre} {m.concentracion}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{m.forma} · {m.via} · {m.frecuencia} · {m.duracion}</div>
                    {m.instrucciones && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Instruc.: {m.instrucciones}</div>}
                  </div>
                  <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--error)", fontSize: 18 }}
                    onClick={() => setMeds(prev => prev.filter((_, idx) => idx !== i))}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="soap-btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="soap-btn-next" onClick={handleGuardar} disabled={meds.length === 0}
            style={{ opacity: meds.length === 0 ? 0.5 : 1, cursor: meds.length === 0 ? "not-allowed" : "pointer" }}>
            Agregar a la nota SOAP ({meds.length})
          </button>
        </div>
      </div>
    </div>
  );
}
