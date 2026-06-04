import { Plus, FlaskConical, FileText, Pill } from "lucide-react";
import type { SectionPData, ExamenOrdenado, MedicamentoSOAP } from "../types";

interface Props {
  data: SectionPData;
  setData: (val: SectionPData) => void;
  onPrev: () => void;
  onFinalize: () => void;
  examenes: ExamenOrdenado[];
  setExamenes: React.Dispatch<React.SetStateAction<ExamenOrdenado[]>>;
  medicamentos: MedicamentoSOAP[];
  setMedicamentos: React.Dispatch<React.SetStateAction<MedicamentoSOAP[]>>;
  onOpenModal: (m: string) => void;
}

// Medidas no farmacológicas más comunes en atención primaria.
// Base: GPC MINSA (HTA, diabetes, obesidad), recomendaciones OMS para riesgo
// cardiovascular y guías nacionales de promoción de la salud.
const MEDIDAS = [
  // Dieta y nutrición
  "Dieta hiposódica (< 2 g sal/día)",
  "Dieta hipograsa",
  "Dieta para diabético (control glucémico)",
  "Dieta hipocalórica (reducción de peso)",
  "Hidratación oral abundante (1.5 – 2 L/día)",
  // Actividad física y peso
  "Actividad física aeróbica ≥ 150 min/semana",
  "Reducción de peso corporal",
  // Hábitos
  "Cese del consumo de tabaco",
  "Reducción del consumo de alcohol",
  "Higiene del sueño",
  // Reposo y postura
  "Reposo relativo",
  "Reposo absoluto",
  "Elevación de miembros inferiores",
  "Aplicación de frío local",
  "Aplicación de calor local",
  // Monitoreo en domicilio
  "Monitoreo domiciliario de presión arterial",
  "Monitoreo domiciliario de glucemia capilar",
  // Educación y adherencia
  "Educación en signos de alarma",
  "Adherencia estricta al tratamiento",
  "Vacunación según calendario nacional",
  "Apoyo en salud mental",
];

const TIEMPOS_SEGUIMIENTO = [
  "1 semana", "2 semanas", "1 mes", "3 meses", "6 meses", "Según evolución",
];

export default function SectionP({
  data, setData, onPrev, onFinalize,
  examenes, setExamenes, medicamentos, setMedicamentos, onOpenModal,
}: Props) {
  const up = <K extends keyof SectionPData>(key: K, val: SectionPData[K]) =>
    setData({ ...data, [key]: val });

  const toggleMedida = (m: string) => {
    const medidas = data.medidas ?? [];
    setData({ ...data, medidas: medidas.includes(m) ? medidas.filter(x => x !== m) : [...medidas, m] });
  };

  const removeExamen = (i: number) => setExamenes(prev => prev.filter((_, idx) => idx !== i));
  const removeMed    = (i: number) => setMedicamentos(prev => prev.filter((_, idx) => idx !== i));

  const tipoIcon = (tipo: string) => {
    if (tipo === "Patología Clínica") return <FlaskConical size={14} color="var(--info)" />;
    if (tipo === "Diagnóstico por Imágenes") return <FileText size={14} color="var(--warning)" />;
    // compatibilidad con borradores guardados con categorías anteriores
    if (tipo === "Laboratorio") return <FlaskConical size={14} color="var(--info)" />;
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
            placeholder=""
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
            <label htmlFor="p-tiempoSeguimiento" className="soap-section-label">Tiempo de seguimiento</label>
            <select id="p-tiempoSeguimiento" className="soap-select" value={data.tiempoSeguimiento} onChange={e => up("tiempoSeguimiento", e.target.value)}>
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
            placeholder=""
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
          </div>
        </div>
      </div>

      <div className="soap-nav-row">
        <button className="soap-btn-prev" onClick={onPrev}>← Anterior: Análisis</button>
        <button className="soap-btn-next" onClick={onFinalize}>Revisar y Finalizar</button>
      </div>
    </div>
  );
}
