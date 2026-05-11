import { Plus, FlaskConical, FileText, Pill } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { SectionPData, ExamenOrdenado, MedicamentoSOAP } from "../types";

interface Props {
  data: SectionPData;
  setData: Dispatch<SetStateAction<SectionPData>>;
  onPrev: () => void;
  onFinalize: () => void;
  examenes: ExamenOrdenado[];
  setExamenes: React.Dispatch<React.SetStateAction<ExamenOrdenado[]>>;
  medicamentos: MedicamentoSOAP[];
  setMedicamentos: React.Dispatch<React.SetStateAction<MedicamentoSOAP[]>>;
  onOpenModal: (m: string) => void;
}

const MEDIDAS = [
  "Reposo relativo",
  "Restricción de sal (<2 g/día)",
  "Restricción hídrica (especificar mL/día)",
  "Dieta hipocalórica",
  "Actividad física moderada",
  "Elevar miembros inferiores",
  "Monitoreo de presión en domicilio",
  "Dejar de fumar",
];

const TIEMPOS_SEGUIMIENTO = [
  "1 semana", "2 semanas", "1 mes", "3 meses", "6 meses", "Según evolución",
];

export default function SectionP({
  data, setData, onPrev, onFinalize,
  examenes, setExamenes, medicamentos, setMedicamentos, onOpenModal,
}: Props) {
  const up = <K extends keyof SectionPData>(key: K, val: SectionPData[K]) =>
    setData(prev => ({ ...prev, [key]: val }));

  const toggleMedida = (m: string) =>
    setData(prev => ({ ...prev, medidas: prev.medidas.includes(m) ? prev.medidas.filter(x => x !== m) : [...prev.medidas, m] }));

  const removeExamen = (i: number) => setExamenes(prev => prev.filter((_, idx) => idx !== i));
  const removeMed    = (i: number) => setMedicamentos(prev => prev.filter((_, idx) => idx !== i));

  const tipoIcon = (tipo: string) => {
    if (tipo === "Laboratorio") return <FlaskConical size={14} color="var(--info)" />;
    if (tipo === "Radiología")  return <FileText size={14} color="var(--warning)" />;
    return <FileText size={14} color="var(--primary)" />;
  };

  return (
    <div className="soap-content-inner">
      {/* P.1 - Exámenes */}
      <div className="soap-plan-section">
        <div className="soap-plan-section-header">
          <span className="soap-plan-section-title">P.1 - Exámenes Solicitados</span>
          <button
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: "var(--radius-md)", background: "var(--primary)", color: "white", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
            onClick={() => onOpenModal("examen")}
          >
            <Plus size={14} /> Solicitar Examen
          </button>
        </div>
        {examenes.length > 0 ? (
          examenes.map((e, i) => (
            <div key={e._uid ?? `${e.tipo}-${e.nombre}`} className="soap-plan-item">
              {tipoIcon(e.tipo)}
              <div className="soap-plan-item-info">
                <div className="soap-plan-item-name">{e.nombre}</div>
                <div className="soap-plan-item-sub">{e.tipo}</div>
              </div>
              {e.urgente && <span className="soap-urgente-badge">Urgente</span>}
              <button className="soap-plan-remove" onClick={() => removeExamen(i)}>×</button>
            </div>
          ))
        ) : (
          <div className="soap-plan-empty">
            Sin exámenes - presione "Solicitar Examen" para agregar
          </div>
        )}
      </div>

      {/* P.2 - Medicamentos */}
      <div className="soap-plan-section">
        <div className="soap-plan-section-header">
          <span className="soap-plan-section-title">P.2 - Medicamentos Prescritos</span>
          <button
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: "var(--radius-md)", background: "var(--primary)", color: "white", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
            onClick={() => onOpenModal("receta")}
          >
            <Pill size={14} /> Agregar Medicamento
          </button>
        </div>
        {medicamentos.length > 0 ? (
          medicamentos.map((m, i) => (
            <div key={m._uid ?? `${m.nombre}-${m.concentracion}`} className="soap-plan-item">
              <Pill size={14} color="var(--primary)" />
              <div className="soap-plan-item-info">
                <div className="soap-plan-item-name">{m.nombre} {m.concentracion}</div>
                <div className="soap-plan-item-sub">{m.forma} · {m.via} · {m.frecuencia} · {m.duracion}</div>
                {m.instrucciones && <div className="soap-plan-item-sub">Instruc.: {m.instrucciones}</div>}
              </div>
              <button className="soap-plan-remove" onClick={() => removeMed(i)}>×</button>
            </div>
          ))
        ) : (
          <div className="soap-plan-empty">Sin medicamentos prescritos</div>
        )}
      </div>

      {/* P.3 - Medidas No Farmacológicas */}
      <div className="soap-plan-section">
        <div className="soap-plan-section-title" style={{ marginBottom: 12 }}>
          P.3 - Medidas No Farmacológicas
        </div>
        <div className="soap-check-grid" style={{ marginBottom: 10 }}>
          {MEDIDAS.map(m => (
            <label key={m} className={`soap-check-item ${data.medidas.includes(m) ? "checked" : ""}`}>
              <input
                type="checkbox"
                checked={data.medidas.includes(m)}
                onChange={() => toggleMedida(m)}
                style={{ accentColor: "var(--primary)", width: 14, height: 14, flexShrink: 0 }}
              />
              <span>{m}</span>
            </label>
          ))}
        </div>
        <div>
          <label className="soap-section-label">Otras indicaciones</label>
          <textarea
            className="soap-input soap-textarea"
            style={{ minHeight: 56 }}
            placeholder="Indicaciones adicionales para el paciente..."
            value={data.otrasIndicaciones}
            onChange={e => up("otrasIndicaciones", e.target.value)}
          />
        </div>
      </div>

      {/* P.4 - Seguimiento */}
      <div className="soap-plan-section">
        <div className="soap-plan-section-title" style={{ marginBottom: 12 }}>
          P.4 - Plan de Seguimiento
        </div>
        <div className="soap-followup-grid">
          <div>
            <label className="soap-section-label">Próxima cita</label>
            <input
              type="date"
              className="soap-input"
              value={data.proximaCita}
              onChange={e => up("proximaCita", e.target.value)}
            />
          </div>
          <div>
            <label className="soap-section-label">Tiempo de seguimiento</label>
            <select className="soap-select" value={data.tiempoSeguimiento} onChange={e => up("tiempoSeguimiento", e.target.value)}>
              <option value="">- Seleccionar -</option>
              {TIEMPOS_SEGUIMIENTO.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="soap-section-label">Criterios de alarma</label>
          <textarea
            className="soap-input soap-textarea"
            style={{ minHeight: 70 }}
            placeholder="Indicar al paciente que consulte urgente si: disnea en reposo, PA >180/110, dolor torácico..."
            value={data.criteriosAlarma}
            onChange={e => up("criteriosAlarma", e.target.value)}
          />
        </div>
      </div>

      {/* P.5 - Referencia */}
      <div style={{ background: "var(--bg-muted)", borderRadius: "var(--radius-lg)", padding: 16, border: "1px solid var(--border)", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
            P.5 - Referencia / Interconsulta
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              style={{ padding: "5px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--primary)", background: "transparent", color: "var(--primary)", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
              onClick={() => onOpenModal("interconsulta")}
            >
              Interconsulta interna
            </button>
            <button
              style={{ padding: "5px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--primary)", background: "transparent", color: "var(--primary)", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
              onClick={() => onOpenModal("referencia")}
            >
              Referencia a EESS
            </button>
          </div>
        </div>
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Use los botones para generar el documento formal.
        </p>
      </div>

      <div className="soap-nav-row">
        <button className="soap-btn-prev" onClick={onPrev}>← Anterior: Análisis</button>
        <button className="soap-btn-next" onClick={onFinalize}>Revisar y Finalizar</button>
      </div>
    </div>
  );
}
