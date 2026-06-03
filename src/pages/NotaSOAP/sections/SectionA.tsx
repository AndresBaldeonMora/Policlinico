import { useState, useRef, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { X, Search, Plus } from "lucide-react";
import type { SectionAData, Diagnostico } from "../types";
import { CIE10ApiService } from "../../../services/cie10.service";
import type { CIE10Item } from "../../../services/cie10.service";

interface Props {
  data: SectionAData;
  setData: Dispatch<SetStateAction<SectionAData>>;
  onPrev: () => void;
  onNext: () => void;
}

// ── Modal de búsqueda CIE-10 ──────────────────────────────────────────────────
function ModalCIE10({
  onClose,
  onSeleccionar,
  yaAgregados,
}: {
  onClose: () => void;
  onSeleccionar: (item: CIE10Item) => void;
  yaAgregados: string[];
}) {
  const [query,      setQuery]      = useState("");
  const [resultados, setResultados] = useState<CIE10Item[]>([]);
  const [buscando,   setBuscando]   = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (query.trim().length < 2) { setResultados([]); setBuscando(false); return; }
    setBuscando(true);
    const t = setTimeout(async () => {
      setResultados(await CIE10ApiService.buscar(query));
      setBuscando(false);
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div
      className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-box" style={{ maxWidth: 580, width: "94vw" }}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="modal-title">Buscar diagnóstico CIE-10</div>
            <div className="modal-subtitle">Ingresa el nombre o código de la enfermedad</div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Buscador */}
        <div className="modal-body" style={{ paddingBottom: 0 }}>
          <div style={{ position: "relative", marginBottom: 12 }}>
            <Search size={15} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
            <input
              ref={inputRef}
              className="soap-input"
              style={{ paddingLeft: 34 }}
              placeholder="Ej: diabetes, hipertensión, E11, I10…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>

          {/* Resultados */}
          <div className="cie10-modal-results">
            {query.trim().length < 2 ? (
              <p className="cie10-modal-hint">Escribe al menos 2 caracteres para buscar.</p>
            ) : buscando ? (
              <p className="cie10-modal-hint">Buscando…</p>
            ) : resultados.length === 0 ? (
              <p className="cie10-modal-hint">Sin coincidencias para "{query}"</p>
            ) : (
              resultados.map(item => {
                const yaEsta = yaAgregados.includes(item.codigo);
                return (
                  <button
                    key={item.codigo}
                    className={`cie10-modal-item${yaEsta ? " cie10-modal-item--ya" : ""}`}
                    onClick={() => { if (!yaEsta) { onSeleccionar(item); onClose(); } }}
                    disabled={yaEsta}
                  >
                    <span className="cie10-modal-code">{item.codigo}</span>
                    <span className="cie10-modal-name">{item.descripcion}</span>
                    {yaEsta && <span className="cie10-modal-ya">Ya agregado</span>}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="soap-btn-secondary" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ── Sección A principal ───────────────────────────────────────────────────────
export default function SectionA({ data, setData, onPrev, onNext }: Props) {
  const [modalAbierto, setModalAbierto] = useState(false);

  const up = <K extends keyof SectionAData>(key: K, val: SectionAData[K]) =>
    setData({ ...data, [key]: val });

  const addDx = (item: CIE10Item) => {
    if (data.diagnoses.find(d => d.code === item.codigo)) return;
    up("diagnoses", [
      ...data.diagnoses,
      { code: item.codigo, name: item.descripcion, tipo: "presuntivo" },
    ]);
  };

  const removeDx = (code: string) =>
    up("diagnoses", data.diagnoses.filter(d => d.code !== code));

  const updateTipo = (code: string, tipo: Diagnostico["tipo"]) =>
    up("diagnoses", data.diagnoses.map(d => d.code === code ? { ...d, tipo } : d));

  return (
    <div className="soap-content-inner">

      {/* ── Diagnóstico(s) Principal(es) ── */}
      <div style={{ marginBottom: 22 }}>
        <label className="soap-section-label">
          Diagnóstico(s) Principal(es) <span className="soap-required">*</span>
        </label>

        {/* Chips CIE-10 agregados */}
        {data.diagnoses.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            {data.diagnoses.map(d => (
              <div key={d.code} className="soap-dx-chip">
                <div className="soap-dx-chip-info">
                  <span className="soap-dx-chip-code">{d.code}</span>
                  <span className="soap-dx-chip-name">{d.name}</span>
                </div>
                <div className="soap-dx-chip-actions">
                  {(["presuntivo", "confirmado"] as const).map(t => (
                    <label key={t} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 12 }}>
                      <input
                        type="radio"
                        name={`dx-tipo-${d.code}`}
                        checked={d.tipo === t}
                        onChange={() => updateTipo(d.code, t)}
                        style={{ accentColor: "var(--primary)" }}
                      />
                      <span style={{ fontWeight: d.tipo === t ? 700 : 400, color: d.tipo === t ? "var(--primary)" : "var(--text-muted)" }}>
                        {t === "presuntivo" ? "Presuntivo" : "Confirmado"}
                      </span>
                    </label>
                  ))}
                  <button className="soap-dx-remove" onClick={() => removeDx(d.code)}>
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Campo libre */}
        <textarea
          className="soap-input soap-textarea"
          style={{ minHeight: 44, marginBottom: 10 }}
          placeholder="Sin diagnósticos agregados"
          value={data.diagnosisManual}
          onChange={e => up("diagnosisManual", e.target.value)}
        />

        {/* Botón para abrir modal */}
        <button
          type="button"
          className="cie10-open-btn"
          onClick={() => setModalAbierto(true)}
        >
          <Search size={14} />
          Buscar por CIE-10
          <Plus size={13} style={{ marginLeft: "auto" }} />
        </button>
      </div>

      {/* ── Diferencial ── */}
      <div style={{ marginBottom: 18 }}>
        <label className="soap-section-label">
          Diagnóstico Diferencial{" "}
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 400 }}>(opcional)</span>
        </label>
        <textarea
          className="soap-input soap-textarea"
          style={{ minHeight: 60 }}
          value={data.diferenciales}
          onChange={e => up("diferenciales", e.target.value)}
        />
      </div>

      {/* ── Severidad ── */}
      <div style={{ marginBottom: 18 }}>
        <label className="soap-section-label">Severidad del cuadro</label>
        <div style={{ display: "flex", gap: 24, marginTop: 4 }}>
          {(["Leve", "Moderada", "Severa"] as const).map(s => (
            <label key={s} style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer" }}>
              <input
                type="radio"
                name="severidad"
                checked={data.severidad === s}
                onChange={() => up("severidad", s)}
                style={{ accentColor: "var(--primary)", width: 15, height: 15 }}
              />
              <span style={{ fontSize: 13, fontWeight: data.severidad === s ? 700 : 400, color: data.severidad === s ? "var(--text-primary)" : "var(--text-muted)" }}>
                {s}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* ── Otros diagnósticos NTS-022 ── */}
      <div style={{ marginBottom: 18 }}>
        <label className="soap-section-label">Otros Diagnósticos</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 4 }}>
          {([
            ["riesgo",      "Diagnóstico de riesgo"],
            ["nutricional", "Diagnóstico nutricional"],
            ["saludMental", "Diagnóstico de salud mental"],
            ["causaExterna","Causa externa de morbilidad"],
          ] as const).map(([key, label]) => (
            <div key={key}>
              <label className="soap-section-label">{label}</label>
              <input
                className="soap-input"
                value={data.otrosDiagnosticos[key]}
                onChange={e => up("otrosDiagnosticos", { ...data.otrosDiagnosticos, [key]: e.target.value })}
              />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          <label className="soap-section-label">Discapacidad / estado funcional</label>
          <input
            className="soap-input"
            value={data.otrosDiagnosticos.estadoFuncional}
            onChange={e => up("otrosDiagnosticos", { ...data.otrosDiagnosticos, estadoFuncional: e.target.value })}
          />
        </div>
      </div>

      {/* ── Evaluación clínica ── */}
      <div style={{ marginBottom: 20 }}>
        <label className="soap-section-label">Evaluación y Razonamiento Clínico</label>
        <textarea
          className="soap-input soap-textarea"
          style={{ minHeight: 110 }}
          value={data.evaluacion}
          onChange={e => up("evaluacion", e.target.value)}
        />
      </div>

      <div className="soap-nav-row">
        <button className="soap-btn-prev" onClick={onPrev}>← Anterior: Objetivo</button>
        <button className="soap-btn-next" onClick={onNext}>Siguiente: Plan →</button>
      </div>

      {/* Modal CIE-10 */}
      {modalAbierto && (
        <ModalCIE10
          onClose={() => setModalAbierto(false)}
          onSeleccionar={addDx}
          yaAgregados={data.diagnoses.map(d => d.code)}
        />
      )}
    </div>
  );
}
