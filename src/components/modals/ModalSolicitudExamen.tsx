import { useState, useEffect } from "react";
import { X, ChevronDown, ChevronRight } from "lucide-react";
import type { ExamenOrdenado } from "../../pages/NotaSOAP/types";
import type { CitaMedico } from "../../services/medico.service";

interface Props {
  cita: CitaMedico;
  onClose: () => void;
  onAdd: (e: ExamenOrdenado) => void;
  diagnosticoPrefill?: string;
}

type TabMINSA = "Patología Clínica" | "Diagnóstico por Imágenes";

// Categorías basadas en NTS N°139-MINSA/2018 (Gestión de Historia Clínica)
// y NTS N°072-MINSA (UPS de Patología Clínica).
const EXAMENES: Record<TabMINSA, Record<string, string[]>> = {
  "Patología Clínica": {
    Hematología: [
      "Hemograma completo",
      "Recuento de plaquetas",
      "Velocidad de sedimentación (VSG)",
      "Tiempo de protrombina (TP) / TTPA",
      "Grupo sanguíneo y factor Rh",
    ],
    Bioquímica: [
      "Glucosa basal",
      "HbA1c (hemoglobina glicosilada)",
      "Creatinina",
      "Urea / BUN",
      "Perfil lipídico (colesterol total, HDL, LDL, triglicéridos)",
      "Perfil hepático (TGO, TGP, bilirrubinas, fosfatasa alcalina)",
      "Electrolitos (Na, K, Cl)",
      "Ácido úrico",
      "Proteínas totales y albúmina",
    ],
    "Orina y Heces": [
      "Uroanálisis (examen completo de orina)",
      "Urocultivo + antibiograma",
      "Examen de orina de 24 horas",
      "Examen parasitológico de heces (seriado x3)",
      "Coprocultivo + antibiograma",
      "Test de sangre oculta en heces",
    ],
    Microbiología: [
      "Cultivo de secreción + antibiograma (especificar zona)",
      "Hemocultivo (x2)",
      "Cultivo de esputo + antibiograma",
    ],
    "Inmunología / Serología": [
      "PCR (Proteína C Reactiva)",
      "ANA (anticuerpos antinucleares)",
      "Factor reumatoide",
      "VDRL / RPR (sífilis)",
      "Prueba rápida VIH",
      "HBsAg (hepatitis B superficie)",
      "Anti-HCV (hepatitis C)",
      "Antígeno NS1 dengue",
      "IgM dengue / IgG dengue",
    ],
    Hormonas: [
      "TSH (hormona estimulante del tiroides)",
      "T3 libre / T4 libre",
      "FSH / LH",
      "Prolactina",
      "Testosterona total",
      "Cortisol basal",
      "Insulina basal",
      "PSA (antígeno prostático específico)",
    ],
  },
  "Diagnóstico por Imágenes": {
    "Radiología Convencional": [
      "Radiografía de tórax (PA y lateral)",
      "Radiografía de abdomen simple",
      "Radiografía de columna lumbosacra",
      "Radiografía de columna cervical",
      "Radiografía de manos / muñecas",
      "Radiografía de rodillas",
      "Mamografía bilateral",
    ],
    Ecografía: [
      "Ecografía abdominal",
      "Ecografía pélvica / transvaginal",
      "Ecografía de tiroides",
      "Ecografía renal y vías urinarias",
      "Ecografía de partes blandas (especificar zona)",
      "Ecografía obstétrica",
    ],
    "Tomografía / Resonancia": [
      "Tomografía computarizada (especificar región)",
      "Resonancia magnética (especificar región)",
    ],
    "Electrofisiología y Procedimientos": [
      "Electrocardiograma (ECG 12 derivaciones)",
      "Ecocardiograma transtorácico",
      "Espirometría / Prueba de función pulmonar",
      "Prueba de esfuerzo (ergometría)",
      "Electroencefalograma (EEG)",
      "Colonoscopia",
      "Endoscopia digestiva alta (EDA)",
    ],
  },
};

export default function ModalSolicitudExamen({ cita, onClose, onAdd, diagnosticoPrefill }: Props) {
  const [tab, setTab]     = useState<TabMINSA>("Patología Clínica");
  const [selected, setSelected] = useState<{ nombre: string; tipo: TabMINSA }[]>([]);
  const [urgente, setUrgente]   = useState(false);
  const [otroExamen, setOtro]   = useState("");
  const [instrucciones, setInstr] = useState("");
  const [diagnosticoPresuntivo, setDx] = useState(diagnosticoPrefill ?? "");
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  useEffect(() => { setOpenGroups(new Set()); }, [tab]);

  const toggleGroup = (g: string) =>
    setOpenGroups(prev => {
      const next = new Set(prev);
      next.has(g) ? next.delete(g) : next.add(g);
      return next;
    });

  const pac    = cita.pacienteId;
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
    const dx = diagnosticoPresuntivo.trim();
    selected.forEach(e =>
      onAdd({ nombre: e.nombre, tipo: e.tipo, urgente, diagnosticoPresuntivo: dx || undefined })
    );
  };

  const addOtro = () => {
    const t = otroExamen.trim();
    if (!t) return;
    toggle(t);
    setOtro("");
  };

  const dxVacio    = !diagnosticoPresuntivo.trim();
  const sinExamenes = selected.length === 0;
  const disabled   = sinExamenes || dxVacio;

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 720 }}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="modal-title">Solicitud de Exámenes Diagnósticos</div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Banda paciente */}
          <div className="modal-pac-band">
            <span className="modal-pac-name">{nombre}</span>
            <span className="modal-pac-meta">DNI: {pac.dni}</span>
          </div>

          {/* Diagnóstico presuntivo — campo obligatorio NTS 139 */}
          <div style={{ marginBottom: 16 }}>
            <label className="soap-section-label">
              Diagnóstico presuntivo <span style={{ color: "var(--error, #dc2626)" }}>*</span>
            </label>
            <input
              className="soap-input"
              placeholder="Ej: Diabetes mellitus tipo 2 (E11), Anemia ferropénica (D50)…"
              value={diagnosticoPresuntivo}
              onChange={e => setDx(e.target.value)}
            />
            {dxVacio && (
              <span style={{ fontSize: 11, color: "var(--error, #dc2626)", marginTop: 3, display: "block" }}>
                Campo obligatorio.
              </span>
            )}
          </div>

          {/* Tabs MINSA */}
          <div className="modal-tabs">
            {(["Patología Clínica", "Diagnóstico por Imágenes"] as const).map(t => (
              <button
                key={t}
                className={`modal-tab ${tab === t ? "active" : ""}`}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Grupos de exámenes */}
          {Object.entries(EXAMENES[tab]).map(([group, exams]) => {
            const isOpen = openGroups.has(group);
            const checkedCount = exams.filter(ex => isChecked(ex)).length;
            return (
              <div key={group} style={{ marginBottom: 8, border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
                <button
                  type="button"
                  onClick={() => toggleGroup(group)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 14px", background: isOpen ? "var(--bg-muted)" : "var(--bg-card)",
                    border: "none", cursor: "pointer", gap: 8,
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {isOpen ? <ChevronDown size={15} color="var(--text-muted)" /> : <ChevronRight size={15} color="var(--text-muted)" />}
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{group}</span>
                  </span>
                  {checkedCount > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 700, background: "var(--primary-lighter)", color: "var(--primary)", padding: "2px 8px", borderRadius: 10 }}>
                      {checkedCount} seleccionado{checkedCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </button>
                {isOpen && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "8px 12px 10px" }}>
                    {exams.map(ex => (
                      <label key={ex} className={`soap-check-item ${isChecked(ex) ? "checked" : ""}`} style={{ padding: "7px 10px" }}>
                        <input
                          type="checkbox"
                          checked={isChecked(ex)}
                          onChange={() => toggle(ex)}
                          style={{ accentColor: "var(--primary)", flexShrink: 0 }}
                        />
                        <span style={{ fontSize: 13 }}>{ex}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Examen libre */}
          <div style={{ marginBottom: 16 }}>
            <label className="soap-section-label">Otro examen (campo libre)</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className="soap-input"
                style={{ flex: 1 }}
                placeholder="Escriba el nombre y presione Agregar"
                value={otroExamen}
                onChange={e => setOtro(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addOtro()}
              />
              <button className="soap-btn-secondary" onClick={addOtro}>Agregar</button>
            </div>
          </div>

          {/* Indicaciones + Prioridad */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "flex-start" }}>
            <div>
              <label className="soap-section-label">Indicaciones para el paciente</label>
              <textarea
                className="soap-input soap-textarea"
                style={{ minHeight: 60 }}
                placeholder="Ej: Acudir en ayunas, traer muestra de primera hora…"
                value={instrucciones}
                onChange={e => setInstr(e.target.value)}
              />
            </div>
            <div>
              <label className="soap-section-label">Prioridad</label>
              {([
                { val: false, label: "Rutina",  sub: "Orden estándar" },
                { val: true,  label: "Urgente", sub: "Resultado prioritario" },
              ] as const).map(p => (
                <label key={p.label} style={{ display: "flex", alignItems: "flex-start", gap: 7, marginBottom: 10, cursor: "pointer" }}>
                  <input
                    type="radio"
                    checked={urgente === p.val}
                    onChange={() => setUrgente(p.val)}
                    style={{ accentColor: "var(--primary)", marginTop: 2 }}
                  />
                  <span>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{p.label}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{p.sub}</div>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Resumen seleccionados */}
          {selected.length > 0 && (
            <div style={{ marginTop: 16, background: "var(--bg-muted)", borderRadius: 8, padding: 12, border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6 }}>
                EXÁMENES SELECCIONADOS ({selected.length})
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {selected.map(e => (
                  <span
                    key={e.nombre}
                    style={{ fontSize: 12, background: "var(--primary-lighter)", color: "var(--primary)", padding: "3px 10px", borderRadius: 12, fontWeight: 500 }}
                  >
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
          <button
            className="soap-btn-next"
            onClick={handleAdd}
            disabled={disabled}
            style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? "not-allowed" : "pointer" }}
            title={dxVacio ? "Complete el diagnóstico presuntivo" : sinExamenes ? "Seleccione al menos un examen" : ""}
          >
            Agregar {selected.length > 0 ? `${selected.length} examen${selected.length !== 1 ? "es" : ""}` : "exámenes"}
          </button>
        </div>
      </div>
    </div>
  );
}
