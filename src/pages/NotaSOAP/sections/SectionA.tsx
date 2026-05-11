import { useState, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import { X } from "lucide-react";
import type { SectionAData, Diagnostico } from "../types";
import { CIE10_DB } from "../types";

interface Props {
  data: SectionAData;
  setData: Dispatch<SetStateAction<SectionAData>>;
  onPrev: () => void;
  onNext: () => void;
}

export default function SectionA({ data, setData, onPrev, onNext }: Props) {
  const [search, setSearch]   = useState("");
  const [showDrop, setShowDrop] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const up = <K extends keyof SectionAData>(key: K, val: SectionAData[K]) =>
    setData(prev => ({ ...prev, [key]: val }));

  const filtered = search.length > 1
    ? CIE10_DB.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 8)
    : [];

  const addDx = (item: { code: string; name: string }) => {
    if (data.diagnoses.find(d => d.code === item.code)) return;
    up("diagnoses", [...data.diagnoses, { ...item, tipo: "presuntivo" }]);
    setSearch("");
    setShowDrop(false);
  };

  const removeDx = (code: string) =>
    up("diagnoses", data.diagnoses.filter(d => d.code !== code));

  const updateTipo = (code: string, tipo: Diagnostico["tipo"]) =>
    up("diagnoses", data.diagnoses.map(d => d.code === code ? { ...d, tipo } : d));

  return (
    <div className="soap-content-inner">
      {/* Diagnóstico principal */}
      <div style={{ marginBottom: 22 }}>
        <label className="soap-section-label">
          Diagnóstico(s) Principal(es) <span className="soap-required">*</span>
        </label>

        <div className="soap-cie-wrapper" ref={wrapperRef}
          onBlur={e => { if (!wrapperRef.current?.contains(e.relatedTarget as Node)) setShowDrop(false); }}>
          <input
            className="soap-input"
            style={{ marginBottom: 10 }}
            placeholder="Buscar por nombre de enfermedad o código CIE-10..."
            value={search}
            onChange={e => { setSearch(e.target.value); setShowDrop(true); }}
            onFocus={() => setShowDrop(true)}
          />
          {showDrop && filtered.length > 0 && (
            <div className="soap-cie-dropdown">
              {filtered.map(item => (
                <div key={item.code} className="soap-cie-item"
                  onMouseDown={() => addDx(item)}>
                  <span className="soap-cie-code">{item.code}</span>
                  <span className="soap-cie-name">{item.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {data.diagnoses.length > 0 ? (
          <div>
            {data.diagnoses.map(d => (
              <div key={d.code} className="soap-dx-chip">
                <div className="soap-dx-chip-info">
                  <span className="soap-dx-chip-code">{d.code}</span>
                  <span className="soap-dx-chip-name">{d.name}</span>
                </div>
                <div className="soap-dx-chip-actions">
                  {(["presuntivo", "confirmado"] as const).map(t => (
                    <label key={t} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 12 }}>
                      <input type="radio" checked={d.tipo === t} onChange={() => updateTipo(d.code, t)}
                        style={{ accentColor: "var(--primary)" }} />
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
        ) : (
          <div className="soap-plan-empty">
            Sin diagnósticos - busque y seleccione un diagnóstico arriba
          </div>
        )}
      </div>

      {/* Diferencial */}
      <div style={{ marginBottom: 18 }}>
        <label className="soap-section-label">
          Diagnóstico Diferencial{" "}
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 400 }}>(opcional)</span>
        </label>
        <textarea
          className="soap-input soap-textarea"
          style={{ minHeight: 60 }}
          placeholder="Ej: Síndrome nefrótico — descartado por proteinuria negativa..."
          value={data.diferenciales}
          onChange={e => up("diferenciales", e.target.value)}
        />
      </div>

      {/* Severidad */}
      <div style={{ marginBottom: 18 }}>
        <label className="soap-section-label">Severidad del cuadro</label>
        <div style={{ display: "flex", gap: 24, marginTop: 4 }}>
          {(["Leve", "Moderada", "Severa"] as const).map(s => (
            <label key={s} style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer" }}>
              <input type="radio" name="severidad" checked={data.severidad === s}
                onChange={() => up("severidad", s)}
                style={{ accentColor: "var(--primary)", width: 15, height: 15 }} />
              <span style={{ fontSize: 13, fontWeight: data.severidad === s ? 700 : 400, color: data.severidad === s ? "var(--text-primary)" : "var(--text-muted)" }}>
                {s}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Evaluación */}
      <div style={{ marginBottom: 20 }}>
        <label className="soap-section-label">Evaluación y Razonamiento Clínico</label>
        <textarea
          className="soap-input soap-textarea"
          style={{ minHeight: 110 }}
          placeholder="Paciente con ICC descompensada evidenciada por disnea progresiva, edemas en MMII y rales bibasales. Se suma HTA no controlada como factor desencadenante..."
          value={data.evaluacion}
          onChange={e => up("evaluacion", e.target.value)}
        />
      </div>

      <div className="soap-nav-row">
        <button className="soap-btn-prev" onClick={onPrev}>← Anterior: Objetivo</button>
        <button className="soap-btn-next" onClick={onNext}>Siguiente: Plan →</button>
      </div>
    </div>
  );
}
