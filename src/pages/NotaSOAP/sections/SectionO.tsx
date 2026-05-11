import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import type { SectionOData } from "../types";

interface Props {
  data: SectionOData;
  setData: Dispatch<SetStateAction<SectionOData>>;
  onPrev: () => void;
  onNext: () => void;
}

const APARATOS = [
  { id: "cardiovascular",     label: "Cardiovascular",     ph: "Ruidos cardíacos, soplos (grado, foco, irradiación), ritmo, PVY..." },
  { id: "respiratorio",       label: "Respiratorio",       ph: "FR, tipo respiratorio, percusión, auscultación pulmonar..." },
  { id: "abdomen",            label: "Abdomen",            ph: "Inspección, auscultación, palpación, percusión, hepato/esplenomegalia..." },
  { id: "neurologico",        label: "Neurológico",        ph: "Conciencia, orientación, fuerza muscular, sensibilidad, reflejos..." },
  { id: "musculoesqueletico", label: "Musculoesquelético", ph: "Articulaciones, rango de movimiento, dolor a la palpación..." },
  { id: "otrosAp",            label: "Otros hallazgos",   ph: "Hallazgos relevantes no incluidos arriba..." },
] as const;

type AparatoKey = (typeof APARATOS)[number]["id"];

function VitalBox({
  label, unit, placeholder, value, onChange, alertClass, note,
}: {
  label: string; unit: string; placeholder: string;
  value: string; onChange: (v: string) => void;
  alertClass?: string; note?: string;
}) {
  return (
    <div className={`soap-vital-box ${alertClass ?? ""}`}>
      <div className="soap-vital-box-label">{label}</div>
      <input
        className="soap-vital-input"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      <div className="soap-vital-unit">{unit}</div>
      {note && <div className={`soap-vital-note ${alertClass?.includes("warning") ? "warning" : "error"}`}>{note}</div>}
    </div>
  );
}

export default function SectionO({ data, setData, onPrev, onNext }: Props) {
  const [openAp, setOpenAp] = useState<AparatoKey | null>(null);

  const up = <K extends keyof SectionOData>(key: K, val: SectionOData[K]) =>
    setData(prev => ({ ...prev, [key]: val }));

  const imc =
    data.peso && data.talla
      ? (parseFloat(data.peso) / (parseFloat(data.talla) / 100) ** 2).toFixed(1)
      : "";
  const imcNum = parseFloat(imc);
  const imcColor = !imc ? "var(--text-muted)" : imcNum < 18.5 || imcNum >= 30 ? "var(--error)" : imcNum >= 25 ? "var(--warning)" : "var(--success)";

  const paHigh = parseInt(data.pa_s) > 140 || parseInt(data.pa_d) > 90;
  const fcAlert = data.fc && (parseInt(data.fc) < 50 || parseInt(data.fc) > 100);
  const spo2Alert = data.spo2 ? (parseInt(data.spo2) < 90 ? "error" : parseInt(data.spo2) < 95 ? "warning" : "") : "";

  return (
    <div className="soap-content-inner">
      {/* Signos vitales */}
      <p style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 14 }}>
        Signos Vitales
      </p>
      <div className="soap-vital-grid">
        <VitalBox label="Temperatura" unit="°C" placeholder="36.5" value={data.temp} onChange={v => up("temp", v)} />

        {/* PA - doble campo */}
        <div className={`soap-vital-box ${paHigh && (data.pa_s || data.pa_d) ? "alert-error" : ""}`}>
          <div className="soap-vital-box-label">Presión Arterial</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <input className="soap-vital-input" style={{ flex: 1 }} placeholder="120" maxLength={3}
              value={data.pa_s} onChange={e => up("pa_s", e.target.value)} />
            <span style={{ color: "var(--text-muted)", fontWeight: 700 }}>/</span>
            <input className="soap-vital-input" style={{ flex: 1 }} placeholder="80" maxLength={3}
              value={data.pa_d} onChange={e => up("pa_d", e.target.value)} />
          </div>
          <div className="soap-vital-unit">mmHg</div>
          {paHigh && (data.pa_s || data.pa_d) && (
            <div className="soap-vital-note error">Hipertensión arterial</div>
          )}
        </div>

        <VitalBox label="Frec. Cardíaca" unit="lpm" placeholder="72" value={data.fc} onChange={v => up("fc", v)}
          alertClass={fcAlert ? "alert-warning" : ""} note={fcAlert ? "Revisar ritmo cardíaco" : undefined} />

        <VitalBox label="Frec. Respiratoria" unit="rpm" placeholder="16" value={data.fr} onChange={v => up("fr", v)} />

        <VitalBox label="Peso" unit="kg" placeholder="70" value={data.peso} onChange={v => up("peso", v)} />
        <VitalBox label="Talla" unit="cm" placeholder="165" value={data.talla} onChange={v => up("talla", v)} />

        {/* IMC auto */}
        <div className="soap-imc-box">
          <div className="soap-imc-label">IMC (Automático)</div>
          <div className="soap-imc-value" style={{ color: imcColor }}>{imc || "—"}</div>
          <div className="soap-imc-unit">kg/m²</div>
        </div>

        <VitalBox label="Saturación O₂" unit="%" placeholder="98" value={data.spo2} onChange={v => up("spo2", v)}
          alertClass={spo2Alert ? `alert-${spo2Alert}` : ""}
          note={spo2Alert === "error" ? "Hipoxemia severa" : spo2Alert === "warning" ? "Hipoxemia leve" : undefined} />
      </div>

      {/* Examen físico general */}
      <div className="soap-section-divider" />
      <p style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 12 }}>
        Examen Físico General
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label className="soap-section-label">Estado General</label>
          <textarea className="soap-input soap-textarea"
            placeholder="Paciente adulta mayor, despierta, orientada en T/E/P, en regular estado general..."
            value={data.estadoGeneral} onChange={e => up("estadoGeneral", e.target.value)} />
        </div>
        <div>
          <label className="soap-section-label">Piel y Mucosas</label>
          <textarea className="soap-input soap-textarea"
            placeholder="Piel pálida, mucosas orales semihúmedas, sin ictericia, sin cianosis..."
            value={data.piel} onChange={e => up("piel", e.target.value)} />
        </div>
      </div>

      {/* Edema */}
      <div style={{ marginBottom: 20 }}>
        <label className="soap-section-label">Edema</label>
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
          <div style={{ display: "flex", gap: 16 }}>
            {(["no", "si"] as const).map(v => (
              <label key={v} style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer", fontSize: 13 }}>
                <input type="radio" name="edema" value={v} checked={data.edema === v}
                  onChange={() => up("edema", v)} style={{ accentColor: "var(--primary)" }} />
                {v === "si" ? "Sí" : "No"}
              </label>
            ))}
          </div>
          {data.edema === "si" && (
            <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <div>
                <label className="soap-section-label" style={{ fontSize: 11 }}>Localización</label>
                <select className="soap-select" style={{ padding: "6px 8px" }}
                  value={data.edemaLoc} onChange={e => up("edemaLoc", e.target.value)}>
                  <option value="">-</option>
                  {["Miembros inferiores", "Cara", "Generalizado", "Otros"].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="soap-section-label" style={{ fontSize: 11 }}>Grado</label>
                <select className="soap-select" style={{ padding: "6px 8px" }}
                  value={data.edemaGrado} onChange={e => up("edemaGrado", e.target.value)}>
                  <option value="">-</option>
                  {["+", "++", "+++", "++++"].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="soap-section-label" style={{ fontSize: 11 }}>Características</label>
                <input className="soap-input" style={{ padding: "6px 8px" }} placeholder="Fóvea, blando..."
                  value={data.edemaDetalle} onChange={e => up("edemaDetalle", e.target.value)} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Por aparatos */}
      <div className="soap-section-divider" />
      <p style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 12 }}>
        Examen Físico por Aparatos
      </p>
      {APARATOS.map(ap => (
        <div key={ap.id} className="soap-accordion">
          <button className={`soap-accordion-btn ${openAp === ap.id ? "open" : ""}`}
            onClick={() => setOpenAp(openAp === ap.id ? null : ap.id)}>
            <span>{ap.label}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {data[ap.id] && <span style={{ fontSize: 11, color: "var(--success)", fontWeight: 600 }}>✓ Completado</span>}
              {openAp === ap.id ? <ChevronDown size={15} color="var(--text-muted)" /> : <ChevronRight size={15} color="var(--text-muted)" />}
            </div>
          </button>
          {openAp === ap.id && (
            <div className="soap-accordion-body">
              <textarea className="soap-input soap-textarea" placeholder={ap.ph}
                value={data[ap.id]} onChange={e => up(ap.id, e.target.value)} />
            </div>
          )}
        </div>
      ))}

      <div className="soap-nav-row">
        <button className="soap-btn-prev" onClick={onPrev}>← Anterior: Subjetivo</button>
        <button className="soap-btn-next" onClick={onNext}>Siguiente: Análisis →</button>
      </div>
    </div>
  );
}
