import { useState, useEffect, useRef, useCallback } from "react";
import { X, AlertTriangle, Search, Loader2 } from "lucide-react";
import type { MedicamentoSOAP } from "../../pages/NotaSOAP/types";
import type { CitaMedico } from "../../services/medico.service";
import { MedicamentoApiService, type Medicamento } from "../../services/medicamento.service";

interface Props {
  cita: CitaMedico;
  alergias?: string[];
  onClose: () => void;
  onAdd: (m: MedicamentoSOAP) => void;
}

// Opciones según abreviaturas internacionales aceptadas por MINSA/DIGEMID
// Fuente: NTS 057-MINSA/DIGEMID — se evitan decimales ambiguos
const FORMAS = [
  "Tableta", "Cápsula", "Jarabe", "Suspensión", "Solución oral",
  "Inyectable", "Ampolla", "Ungüento", "Crema", "Gel",
  "Gotas oftálmicas", "Gotas óticas", "Inhalador", "Supositorio",
  "Parche transdérmico", "Polvo para reconstituir",
];
const VIAS = [
  "Oral", "Intramuscular", "Intravenosa", "Subcutánea",
  "Tópica", "Oftálmica", "Ótica", "Inhalatoria",
  "Sublingual", "Rectal", "Transdérmica", "Nasal",
];
const FREQ = [
  "Cada 4h", "Cada 6h", "Cada 8h", "Cada 12h", "Cada 24h",
  "Una vez al día", "2 veces al día", "3 veces al día",
  "Una vez a la semana", "Solo si necesario",
];
const DURAC = [
  "1 día", "3 días", "5 días", "7 días", "10 días",
  "14 días", "21 días", "30 días", "3 meses", "6 meses", "Indefinido",
];
// Unidades aceptadas — NTS 057-MINSA/DIGEMID, DS 014-2011-SA
const UNIDADES = ["mg", "g", "mcg", "UI", "mg/mL", "mg/5mL", "mEq/L", "%"];

const EMPTY: MedicamentoSOAP = {
  nombre: "", dci: "", concentracion: "", forma: "Tableta",
  via: "Oral", dosis: "", frecuencia: "Cada 12h",
  duracion: "7 días", cantidad: "", instrucciones: "",
};

// Extrae concentración y forma farmacéutica de la presentación del catálogo
// Ej: "Tableta 500mg" → { forma: "Tableta", valor: "500", unidad: "mg" }
const parsePresentacion = (pres: string): { forma: string; valor: string; unidad: string } => {
  const formaMatch = FORMAS.find(f => pres.toLowerCase().startsWith(f.toLowerCase()));
  const forma = formaMatch ?? "Tableta";
  const resto = formaMatch ? pres.slice(forma.length).trim() : pres;
  const m = resto.match(/^([\d.,]+(?:\/\d+)?)\s*(mg(?:\/(?:mL|5mL))?|g|mcg|UI|mEq(?:\/L)?|%)/i);
  return { forma, valor: m?.[1] ?? "", unidad: m?.[2] ?? "mg" };
};

interface Errores { [k: string]: string }
const EMPTY_ALERGIAS: string[] = [];

export default function ModalReceta({ cita, alergias = EMPTY_ALERGIAS, onClose, onAdd }: Props) {
  const [meds, setMeds]               = useState<MedicamentoSOAP[]>([]);
  const [form, setForm]               = useState<MedicamentoSOAP>({ ...EMPTY });
  const [concValor, setConcValor]     = useState("");
  const [concUnidad, setConcUnidad]   = useState("mg");
  const [alertaAlergia, setAlerta]    = useState<string | null>(null);
  const [errores, setErrores]         = useState<Errores>({});

  // Autocomplete
  const [query, setQuery]             = useState("");
  const [sugerencias, setSugs]        = useState<Medicamento[]>([]);
  const [buscando, setBuscando]       = useState(false);
  const [mostrarSugs, setMostrarSugs] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  const pac = cita.pacienteId;

  // Sincronizar concentración combinada al form
  useEffect(() => {
    setForm(p => ({ ...p, concentracion: concValor ? `${concValor} ${concUnidad}` : "" }));
  }, [concValor, concUnidad]);

  // Cerrar autocomplete al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target as Node)) {
        setMostrarSugs(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const buscarMeds = useCallback((q: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (q.trim().length < 2) { setSugs([]); setMostrarSugs(false); return; }
    timerRef.current = setTimeout(async () => {
      setBuscando(true);
      try {
        const res = await MedicamentoApiService.listar({ q });
        setSugs(res.slice(0, 8));
        setMostrarSugs(true);
      } catch { setSugs([]); }
      finally { setBuscando(false); }
    }, 300);
  }, []);

  const checkAlergia = (nombre: string) => {
    if (!nombre || alergias.length === 0) { setAlerta(null); return; }
    const found = alergias.find(a =>
      nombre.toLowerCase().includes(a.toLowerCase()) || a.toLowerCase().includes(nombre.toLowerCase())
    );
    setAlerta(found ?? null);
  };

  const handleQueryChange = (v: string) => {
    setQuery(v);
    setForm(p => ({ ...p, nombre: v }));
    buscarMeds(v);
    checkAlergia(v);
    if (errores.nombre) setErrores(p => ({ ...p, nombre: "" }));
  };

  const seleccionarMed = (med: Medicamento) => {
    const { forma, valor, unidad } = parsePresentacion(med.presentacion);
    const formaValid = FORMAS.includes(forma) ? forma : "Tableta";
    setConcValor(valor);
    setConcUnidad(UNIDADES.includes(unidad) ? unidad : "mg");
    setForm(p => ({ ...p, nombre: med.nombre, dci: med.principioActivo, forma: formaValid }));
    setQuery(med.nombre);
    setSugs([]);
    setMostrarSugs(false);
    checkAlergia(med.nombre);
    setErrores({});
  };

  const upF = (key: keyof MedicamentoSOAP, val: string) => {
    setForm(p => ({ ...p, [key]: val }));
    if (errores[key]) setErrores(p => ({ ...p, [key]: "" }));
  };

  // Validación basada en campos obligatorios de la Receta Única Estandarizada
  // Fuente: DS 014-2011-SA Art. 23, NTS 057-MINSA/DIGEMID
  const validar = (): boolean => {
    const e: Errores = {};
    if (!form.nombre.trim())      e.nombre      = "Nombre obligatorio.";
    if (!form.dci?.trim())        e.dci         = "DCI obligatorio.";
    if (!concValor.trim())        e.concentracion = "Concentración obligatoria.";
    if (!form.dosis?.trim())      e.dosis       = "Dosis por toma obligatoria.";
    if (!form.frecuencia?.trim()) e.frecuencia  = "Frecuencia obligatoria.";
    if (!form.duracion?.trim())   e.duracion    = "Duración del tratamiento obligatoria.";
    if (!form.cantidad?.trim())   e.cantidad    = "Cantidad a dispensar obligatoria.";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const handleAgregar = () => {
    if (!validar()) return;
    setMeds(prev => [...prev, { ...form, _uid: crypto.randomUUID() }]);
    setForm({ ...EMPTY });
    setQuery("");
    setConcValor("");
    setConcUnidad("mg");
    setErrores({});
    setAlerta(null);
  };

  const handleGuardar = () => meds.forEach(m => onAdd(m));

  // ── Estilos inline compactos ──
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "7px 10px", fontSize: 13,
    border: "1px solid var(--border)", borderRadius: 8,
    background: "var(--bg-card)", color: "var(--text-primary)",
    boxSizing: "border-box",
  };
  const errStyle: React.CSSProperties = { color: "var(--error)", fontSize: 11, marginTop: 2 };
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 3, display: "block" };
  const requiredMark = <span style={{ color: "var(--error)" }}> *</span>;

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 720, maxHeight: "90vh", overflowY: "auto" }}>

        {/* ── Header ── */}
        <div className="modal-header">
          <div>
            <div className="modal-title">Nueva Prescripción Médica</div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">

          {/* ── Banda paciente ── */}
          <div className="modal-pac-band">
            <span className="modal-pac-name">{pac.nombres} {pac.apellidos}</span>
            <span className="modal-pac-meta">DNI: {pac.dni}</span>
            {alergias.length > 0 && (
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {alergias.map(a => (
                  <span key={a} style={{ fontSize: 11, fontWeight: 700, background: "var(--error-bg)", color: "var(--error)", padding: "2px 8px", borderRadius: 10 }}>
                    ⛔ {a}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── Formulario ── */}
          <div style={{ background: "var(--bg-muted)", borderRadius: 10, padding: 16, marginBottom: 16, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>
              Agregar medicamento
            </div>

            {/* Alerta de alergia */}
            {alertaAlergia && (
              <div style={{ background: "var(--error-bg)", border: "1px solid var(--error)", borderRadius: 8, padding: "10px 14px", marginBottom: 12, display: "flex", gap: 8 }}>
                <AlertTriangle size={16} color="var(--error)" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontWeight: 700, color: "var(--error)", fontSize: 13 }}>ALERTA DE ALERGIA</div>
                  <div style={{ color: "var(--error)", fontSize: 13 }}>El paciente tiene alergia registrada a <strong>{alertaAlergia}</strong></div>
                </div>
              </div>
            )}

            {/* ── Fila 1: Nombre del medicamento (con autocomplete) ── */}
            <div ref={autocompleteRef} style={{ position: "relative", marginBottom: 10 }}>
              <label style={labelStyle}>Medicamento (nombre comercial o genérico){requiredMark}</label>
              <div style={{ position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  style={{ ...inputStyle, paddingLeft: 32 }}
                  placeholder="Buscar en el catálogo o escribir nombre…"
                  value={query}
                  onChange={e => handleQueryChange(e.target.value)}
                  onFocus={() => query.length >= 2 && setMostrarSugs(true)}
                  autoComplete="off"
                />
                {buscando && <Loader2 size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", animation: "spin 1s linear infinite" }} />}
              </div>
              {errores.nombre && <p style={errStyle}>{errores.nombre}</p>}

              {/* Dropdown de sugerencias */}
              {mostrarSugs && sugerencias.length > 0 && (
                <div style={{
                  position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 200,
                  background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.12)", overflow: "hidden",
                }}>
                  {sugerencias.map(s => (
                    <button
                      key={s._id}
                      style={{
                        width: "100%", textAlign: "left", padding: "9px 14px", background: "none",
                        border: "none", cursor: "pointer", borderBottom: "1px solid var(--border)",
                        display: "flex", flexDirection: "column", gap: 2,
                      }}
                      onMouseDown={() => seleccionarMed(s)}
                    >
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{s.nombre}</span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        DCI: {s.principioActivo} · {s.presentacion}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Fila 2: DCI (obligatorio por Ley 29459) ── */}
            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>
                DCI — Denominación Común Internacional (principio activo){requiredMark}
              </label>
              <input
                style={{ ...inputStyle, borderColor: errores.dci ? "var(--error)" : "var(--border)" }}
                placeholder="ej. Paracetamol, Amoxicilina, Metformina…"
                value={form.dci}
                onChange={e => upF("dci", e.target.value)}
              />
              {errores.dci && <p style={errStyle}>{errores.dci}</p>}
            </div>

            {/* ── Fila 3: Concentración + Forma farm. + Vía ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
              {/* Concentración: valor + unidad */}
              <div>
                <label style={labelStyle}>Concentración{requiredMark}</label>
                <div style={{ display: "flex", gap: 4 }}>
                  <input
                    style={{ ...inputStyle, flex: 1, borderColor: errores.concentracion ? "var(--error)" : "var(--border)" }}
                    placeholder="ej. 500"
                    value={concValor}
                    onChange={e => { setConcValor(e.target.value); if (errores.concentracion) setErrores(p => ({ ...p, concentracion: "" })); }}
                  />
                  <select
                    style={{ ...inputStyle, width: 90, flexShrink: 0 }}
                    value={concUnidad}
                    onChange={e => setConcUnidad(e.target.value)}
                  >
                    {UNIDADES.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
                {errores.concentracion && <p style={errStyle}>{errores.concentracion}</p>}
              </div>

              <div>
                <label style={labelStyle}>Forma farmacéutica{requiredMark}</label>
                <select style={inputStyle} value={form.forma} onChange={e => upF("forma", e.target.value)}>
                  {FORMAS.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Vía de administración{requiredMark}</label>
                <select style={inputStyle} value={form.via} onChange={e => upF("via", e.target.value)}>
                  {VIAS.map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
            </div>

            {/* ── Fila 4: Dosis + Frecuencia + Duración + Cantidad ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <label style={labelStyle}>Dosis por toma{requiredMark}</label>
                <input
                  style={{ ...inputStyle, borderColor: errores.dosis ? "var(--error)" : "var(--border)" }}
                  placeholder="ej. 1 tableta"
                  value={form.dosis}
                  onChange={e => upF("dosis", e.target.value)}
                />
                {errores.dosis && <p style={errStyle}>{errores.dosis}</p>}
              </div>

              <div>
                <label style={labelStyle}>Frecuencia{requiredMark}</label>
                <select
                  style={{ ...inputStyle, borderColor: errores.frecuencia ? "var(--error)" : "var(--border)" }}
                  value={form.frecuencia}
                  onChange={e => upF("frecuencia", e.target.value)}
                >
                  {FREQ.map(f => <option key={f}>{f}</option>)}
                </select>
                {errores.frecuencia && <p style={errStyle}>{errores.frecuencia}</p>}
              </div>

              <div>
                <label style={labelStyle}>Duración{requiredMark}</label>
                <select
                  style={{ ...inputStyle, borderColor: errores.duracion ? "var(--error)" : "var(--border)" }}
                  value={form.duracion}
                  onChange={e => upF("duracion", e.target.value)}
                >
                  {DURAC.map(d => <option key={d}>{d}</option>)}
                </select>
                {errores.duracion && <p style={errStyle}>{errores.duracion}</p>}
              </div>

              <div>
                <label style={labelStyle}>
                  Cantidad a dispensar{requiredMark}
                </label>
                <input
                  style={{ ...inputStyle, borderColor: errores.cantidad ? "var(--error)" : "var(--border)" }}
                  placeholder="ej. 14 tabletas"
                  value={form.cantidad}
                  onChange={e => upF("cantidad", e.target.value)}
                />
                {errores.cantidad && <p style={errStyle}>{errores.cantidad}</p>}
              </div>
            </div>

            {/* ── Fila 5: Instrucciones al paciente (opcional) ── */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Instrucciones para el paciente (opcional)</label>
              <input
                style={inputStyle}
                placeholder="ej. Tomar con alimentos. Evitar alcohol durante el tratamiento."
                value={form.instrucciones}
                onChange={e => upF("instrucciones", e.target.value)}
              />
            </div>

            <button
              className="soap-btn-next"
              style={{ padding: "8px 22px" }}
              onClick={handleAgregar}
            >
              + Agregar a la lista
            </button>
          </div>

          {/* ── Lista de medicamentos agregados ── */}
          {meds.length > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                Medicamentos prescritos ({meds.length})
              </div>
              {meds.map((m, i) => (
                <div key={m._uid ?? i} style={{
                  background: "var(--bg-muted)", borderRadius: 8, padding: "10px 14px",
                  display: "flex", alignItems: "flex-start", gap: 10,
                  border: "1px solid var(--border)", marginBottom: 6,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>
                      {m.nombre} {m.concentracion}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                      DCI: {m.dci || "—"} · {m.forma} · {m.via}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {m.dosis} {m.frecuencia} · {m.duracion} · Cant.: {m.cantidad}
                    </div>
                    {m.instrucciones && (
                      <div style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
                        Indicación: {m.instrucciones}
                      </div>
                    )}
                  </div>
                  <button
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--error)", fontSize: 20, lineHeight: 1 }}
                    onClick={() => setMeds(prev => prev.filter((_, idx) => idx !== i))}
                    title="Quitar"
                  >×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="modal-footer">
          <button className="soap-btn-secondary" onClick={onClose}>Cancelar</button>
          <button
            className="soap-btn-next"
            onClick={handleGuardar}
            disabled={meds.length === 0}
            style={{ opacity: meds.length === 0 ? 0.5 : 1, cursor: meds.length === 0 ? "not-allowed" : "pointer" }}
          >
            Agregar a la nota SOAP ({meds.length})
          </button>
        </div>
      </div>
    </div>
  );
}
