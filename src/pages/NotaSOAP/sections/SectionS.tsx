import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { SectionSData } from "../types";

interface Props {
  data: SectionSData;
  setData: Dispatch<SetStateAction<SectionSData>>;
  onNext: () => void;
}

const SINTOMAS = [
  { id: "fiebre",        label: "Fiebre" },
  { id: "tos",           label: "Tos" },
  { id: "disnea",        label: "Disnea" },
  { id: "dolorToracico", label: "Dolor torácico" },
  { id: "palpitaciones", label: "Palpitaciones" },
  { id: "nauseas",       label: "Náuseas / vómitos" },
  { id: "pesoChange",    label: "Cambios en peso" },
  { id: "dolor",         label: "Dolor" },
  { id: "urinario",      label: "Cambios urinarios" },
  { id: "apetito",       label: "Cambios en apetito" },
] as const;

const UNIDADES = ["días", "semanas", "meses", "años"] as const;

// Parsea "5 días" → { num: "5", unidad: "días" }
function parseTiempo(val: string | undefined | null): { num: string; unidad: string } {
  const m = (val ?? "").match(/^(\d+)\s*(días|semanas|meses|años)$/);
  if (m) return { num: m[1], unidad: m[2] };
  return { num: "", unidad: "días" };
}

export default function SectionS({ data, setData, onNext }: Props) {
  const parsed = parseTiempo(data.tiempoEnfermedad);
  const [tiempoNum,    setTiempoNum]    = useState(parsed.num);
  const [tiempoUnidad, setTiempoUnidad] = useState(parsed.unidad || "días");

  const up = <K extends keyof SectionSData>(key: K, val: SectionSData[K]) =>
    setData({ ...data, [key]: val });

  const upSintoma = (id: string, val: "si" | "no") =>
    setData({ ...data, sintomas: { ...(data.sintomas ?? {}), [id]: val } });

  const handleTiempoNum = (val: string) => {
    setTiempoNum(val);
    if (val && tiempoUnidad) up("tiempoEnfermedad", `${val} ${tiempoUnidad}`);
    else up("tiempoEnfermedad", "");
  };

  const handleTiempoUnidad = (val: string) => {
    setTiempoUnidad(val);
    if (tiempoNum && val) up("tiempoEnfermedad", `${tiempoNum} ${val}`);
  };

  return (
    <div className="soap-content-inner">
      {/* Motivo de consulta */}
      <div style={{ marginBottom: 18 }}>
        <label className="soap-section-label">
          Motivo de consulta <span className="soap-required">*</span>
        </label>
        <textarea
          className="soap-input soap-textarea"
          style={{ minHeight: 90 }}
          value={data.motivoConsulta}
          onChange={e => up("motivoConsulta", e.target.value)}
        />
      </div>

      {/* Tiempo de enfermedad + Forma de inicio + Curso */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 18 }}>
        <div>
          <label className="soap-section-label">Tiempo de enfermedad</label>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              type="number"
              min={1}
              max={999}
              className="soap-input"
              style={{ width: 70, textAlign: "center" }}
              placeholder=""
              value={tiempoNum}
              onChange={e => handleTiempoNum(e.target.value)}
            />
            <select
              className="soap-input"
              style={{ flex: 1 }}
              value={tiempoUnidad}
              onChange={e => handleTiempoUnidad(e.target.value)}
            >
              {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="soap-section-label">Forma de inicio</label>
          <select
            className="soap-input"
            value={data.formaInicio}
            onChange={e => up("formaInicio", e.target.value as SectionSData["formaInicio"])}
          >
            <option value="">— Seleccionar —</option>
            <option value="Brusco">Brusco</option>
            <option value="Insidioso">Insidioso</option>
          </select>
        </div>
        <div>
          <label className="soap-section-label">Curso</label>
          <select
            className="soap-input"
            value={data.curso}
            onChange={e => up("curso", e.target.value as SectionSData["curso"])}
          >
            <option value="">— Seleccionar —</option>
            <option value="Estacionario">Estacionario</option>
            <option value="Progresivo">Progresivo</option>
            <option value="Recurrente">Recurrente</option>
          </select>
        </div>
      </div>

      {/*
        Enfermedad actual — narrativa cronológica (HPI).
        Fuente: NCBI StatPearls "SOAP Notes" (NIH) — mnemónico OLD CARTS:
        Onset, Location, Duration, Character, Aggravating/Alleviating,
        Radiation, Temporal pattern, Severity.
        Ref: https://www.ncbi.nlm.nih.gov/books/NBK482263/
      */}
      <div style={{ marginBottom: 20 }}>
        <label className="soap-section-label">
          Enfermedad Actual <span className="soap-required">*</span>
        </label>
        <textarea
          className="soap-input soap-textarea"
          style={{ minHeight: 110 }}
          value={data.enfermedadActual}
          onChange={e => up("enfermedadActual", e.target.value)}
        />
      </div>

      {/*
        Revisión por Sistemas (ROS) — componente estándar del Subjetivo SOAP.
        Fuente: NCBI StatPearls "SOAP Notes" (NIH) — sección Review of Systems.
        Se aplica como interrogatorio dirigido por aparatos para detectar síntomas
        positivos o negativos relevantes.
      */}
      <div className="soap-section-divider" />
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 4 }}>
        Revisión por Sistemas (ROS)
      </p>

      <div className="soap-check-grid" style={{ marginBottom: 16 }}>
        {SINTOMAS.map(s => {
          const val = (data.sintomas ?? {})[s.id];
          return (
            <div key={s.id} className={`soap-sintoma-item ${val === "si" ? "si" : ""}`}>
              <div className="soap-sintoma-row">
                <span className="soap-sintoma-label">{s.label}</span>
                <div className="soap-sintoma-radios">
                  {(["si", "no"] as const).map(v => (
                    <label key={v} className="soap-sintoma-radio">
                      <input
                        type="radio"
                        name={`sint-${s.id}`}
                        value={v}
                        checked={val === v}
                        onChange={() => upSintoma(s.id, v)}
                        style={{ accentColor: "var(--primary)" }}
                      />
                      {v === "si" ? "Sí" : "No"}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginBottom: 20 }}>
        <label className="soap-section-label">Otros síntomas</label>
        <textarea
          className="soap-input soap-textarea"
          style={{ minHeight: 56 }}
          placeholder=""
          value={data.otrosSintomas}
          onChange={e => up("otrosSintomas", e.target.value)}
        />
      </div>

      <div className="soap-nav-row" style={{ justifyContent: "flex-end" }}>
        <button className="soap-btn-next" onClick={onNext}>
          Siguiente: Objetivo →
        </button>
      </div>
    </div>
  );
}
