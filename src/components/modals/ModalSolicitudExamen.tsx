import { useState, useEffect } from "react";
import { X, ChevronDown, ChevronRight, FlaskConical, AlertCircle } from "lucide-react";
import type { ExamenOrdenado } from "../../pages/NotaSOAP/types";
import type { CitaMedico } from "../../services/medico.service";
import { ExamenService, type ExamenLaboratorioImagen } from "../../services/examen.service";

interface Props {
  cita: CitaMedico;
  onClose: () => void;
  onAdd: (e: ExamenOrdenado) => void;
  diagnosticoPrefill?: string;
}

type TabMINSA = "Patología Clínica" | "Diagnóstico por Imágenes";

const TIPOS_LAB    = ["HEMATOLOGIA","BIOQUIMICA","ORINA","HECES","MICROBIOLOGIA","INMUNOLOGIA","HORMONAS"];
const TIPOS_IMAGEN = ["RADIOGRAFIA","ECOGRAFIA","TOMOGRAFIA","RESONANCIA","ELECTROCARDIOGRAMA"];

const ETIQUETA_TIPO: Record<string, string> = {
  HEMATOLOGIA:       "Hematología",
  BIOQUIMICA:        "Bioquímica",
  ORINA:             "Orina y Heces",
  HECES:             "Orina y Heces",
  MICROBIOLOGIA:     "Microbiología",
  INMUNOLOGIA:       "Inmunología / Serología",
  HORMONAS:          "Hormonas",
  RADIOGRAFIA:       "Radiología Convencional",
  ECOGRAFIA:         "Ecografía",
  TOMOGRAFIA:        "Tomografía / Resonancia",
  RESONANCIA:        "Tomografía / Resonancia",
  ELECTROCARDIOGRAMA:"Electrofisiología",
  OTRO:              "Otros",
};

function agrupar(items: ExamenLaboratorioImagen[], tipos: string[]): Record<string, ExamenLaboratorioImagen[]> {
  const grupos: Record<string, ExamenLaboratorioImagen[]> = {};
  const filtrados = tipos.length
    ? items.filter(e => tipos.includes(e.tipo) || (e.tipo === "OTRO"))
    : items;
  for (const ex of filtrados) {
    const etiqueta = ETIQUETA_TIPO[ex.tipo] ?? "Otros";
    if (!grupos[etiqueta]) grupos[etiqueta] = [];
    grupos[etiqueta].push(ex);
  }
  return grupos;
}

export default function ModalSolicitudExamen({ cita, onClose, onAdd, diagnosticoPrefill }: Props) {
  const [tab, setTab]           = useState<TabMINSA>("Patología Clínica");
  const [catalogo, setCatalogo] = useState<ExamenLaboratorioImagen[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCat, setErrorCat] = useState("");

  const [selected, setSelected]   = useState<ExamenLaboratorioImagen[]>([]);
  const [urgente, setUrgente]     = useState(false);
  const [instrucciones, setInstr] = useState("");
  const [diagnostico, setDx]      = useState(diagnosticoPrefill ?? "");
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    ExamenService.listarExamenes()
      .then(lista => {
        if (lista.length === 0) {
          setErrorCat("El catálogo de exámenes está vacío. Pida al administrador que registre los exámenes disponibles.");
        }
        setCatalogo(lista);
      })
      .catch(() => setErrorCat("No se pudo cargar el catálogo de exámenes."))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => { setOpenGroups(new Set()); }, [tab]);

  const toggleGroup = (g: string) =>
    setOpenGroups(prev => {
      const next = new Set(prev);
      next.has(g) ? next.delete(g) : next.add(g);
      return next;
    });

  const toggleExamen = (ex: ExamenLaboratorioImagen) =>
    setSelected(prev =>
      prev.find(e => e._id === ex._id)
        ? prev.filter(e => e._id !== ex._id)
        : [...prev, ex]
    );

  const isChecked = (id: string) => !!selected.find(e => e._id === id);

  const handleAdd = () => {
    if (selected.length === 0) return;
    const dx    = diagnostico.trim();
    const instr = instrucciones.trim();
    selected.forEach(ex =>
      onAdd({
        examenId:             ex._id,
        nombre:               ex.nombre,
        tipo:                 TIPOS_LAB.includes(ex.tipo) ? "Patología Clínica" : "Diagnóstico por Imágenes",
        urgente,
        diagnosticoPresuntivo: dx || undefined,
        instrucciones:         instr || ex.instrucciones || undefined,
      })
    );
  };

  const grupos = agrupar(catalogo, tab === "Patología Clínica" ? TIPOS_LAB : TIPOS_IMAGEN);
  const pac = cita.pacienteId;
  const nombre = `${pac.nombres} ${pac.apellidos}`;
  const dxVacio    = !diagnostico.trim();
  const instrVacio = !instrucciones.trim();
  const disabled   = selected.length === 0 || dxVacio || instrVacio;

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: 720 }}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Solicitud de Exámenes Diagnósticos</div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          <div className="modal-pac-band">
            <span className="modal-pac-name">{nombre}</span>
            <span className="modal-pac-meta">DNI: {pac.dni}</span>
          </div>

          {/* Diagnóstico presuntivo */}
          <div style={{ marginBottom: 16 }}>
            <label className="soap-section-label">
              Diagnóstico presuntivo <span style={{ color: "var(--error, #dc2626)" }}>*</span>
            </label>
            <input
              className="soap-input"
              placeholder="Ej: Diabetes mellitus tipo 2 (E11), Anemia ferropénica (D50)…"
              value={diagnostico}
              onChange={e => setDx(e.target.value)}
            />
            {dxVacio && (
              <span style={{ fontSize: 11, color: "var(--error, #dc2626)", marginTop: 3, display: "block" }}>
                Campo obligatorio.
              </span>
            )}
          </div>

          {/* Tabs */}
          <div className="modal-tabs">
            {(["Patología Clínica", "Diagnóstico por Imágenes"] as const).map(t => (
              <button key={t} className={`modal-tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
                {t}
              </button>
            ))}
          </div>

          {/* Catálogo */}
          {cargando ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontSize: 14 }}>
              Cargando catálogo de exámenes…
            </div>
          ) : errorCat ? (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "1rem", background: "#fef9c3", border: "1px solid #fde047", borderRadius: 8, fontSize: 13, color: "#a16207" }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }}/>
              <span>{errorCat}</span>
            </div>
          ) : Object.keys(grupos).length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "1rem", color: "var(--text-muted)", fontSize: 13 }}>
              <FlaskConical size={16}/>
              <span>No hay exámenes de tipo "{tab}" registrados en el catálogo.</span>
            </div>
          ) : (
            Object.entries(grupos).map(([group, exams]) => {
              const isOpen = openGroups.has(group);
              const checkedCount = exams.filter(ex => isChecked(ex._id)).length;
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
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>({exams.length})</span>
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
                        <label key={ex._id} className={`soap-check-item ${isChecked(ex._id) ? "checked" : ""}`} style={{ padding: "7px 10px" }}>
                          <input
                            type="checkbox"
                            checked={isChecked(ex._id)}
                            onChange={() => toggleExamen(ex)}
                            style={{ accentColor: "var(--primary)", flexShrink: 0 }}
                          />
                          <span>
                            <div style={{ fontSize: 13 }}>{ex.nombre}</div>
                            {ex.instrucciones && (
                              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{ex.instrucciones}</div>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Indicaciones + Prioridad */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "flex-start", marginTop: 16 }}>
            <div>
              <label className="soap-section-label">
                Indicaciones para el paciente <span style={{ color: "var(--error, #dc2626)" }}>*</span>
              </label>
              <textarea
                className="soap-input soap-textarea"
                style={{ minHeight: 60, borderColor: instrVacio ? "var(--error, #dc2626)" : undefined }}
                value={instrucciones}
                onChange={e => setInstr(e.target.value)}
              />
              {instrVacio && (
                <span style={{ fontSize: 11, color: "var(--error, #dc2626)", marginTop: 3, display: "block" }}>
                  Campo obligatorio.
                </span>
              )}
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
            <div style={{ marginTop: 12, background: "var(--bg-muted)", borderRadius: 8, padding: 12, border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6 }}>
                EXÁMENES SELECCIONADOS ({selected.length})
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {selected.map(e => (
                  <span key={e._id} style={{ fontSize: 12, background: "var(--primary-lighter)", color: "var(--primary)", padding: "3px 10px", borderRadius: 12, fontWeight: 500 }}>
                    {e.nombre}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="soap-btn-secondary" onClick={onClose}>Cancelar</button>
          <button
            className="soap-btn-next"
            onClick={handleAdd}
            disabled={disabled}
            style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? "not-allowed" : "pointer" }}
          >
            Agregar {selected.length > 0 ? `${selected.length} examen${selected.length !== 1 ? "es" : ""}` : "exámenes"}
          </button>
        </div>
      </div>
    </div>
  );
}
