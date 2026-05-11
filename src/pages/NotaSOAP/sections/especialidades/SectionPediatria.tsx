import * as React from "react";
import type { EspecialidadData } from "../../types";

interface Props {
  data: EspecialidadData;
  setData: React.Dispatch<React.SetStateAction<EspecialidadData>>;
  onPrev: () => void;
}

export default function SectionPediatria({ data, setData, onPrev }: Props) {
  const up = (k: string, v: string) => setData(prev => ({ ...prev, [k]: v }));
  const val = (k: string) => data[k] ?? '';

  return (
    <div className="soap-content-inner">

      {/* ANTECEDENTES PERINATALES */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Antecedentes Perinatales
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">Edad gestacional al nacer (semanas)</label>
          <input className="soap-input" value={val('edadGestacional')} onChange={e => up('edadGestacional', e.target.value)} placeholder="Ej: 38" />
        </div>
        <div>
          <label className="soap-section-label">Tipo de parto</label>
          <select className="soap-input" value={val('tipoParto')} onChange={e => up('tipoParto', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Vaginal eutócico</option>
            <option>Vaginal distócico</option>
            <option>Cesárea programada</option>
            <option>Cesárea de urgencia</option>
          </select>
        </div>
        <div>
          <label className="soap-section-label">Peso al nacer (kg)</label>
          <input className="soap-input" value={val('pesoNacer')} onChange={e => up('pesoNacer', e.target.value)} placeholder="Ej: 3.2" />
        </div>
        <div>
          <label className="soap-section-label">Talla al nacer (cm)</label>
          <input className="soap-input" value={val('tallaNacer')} onChange={e => up('tallaNacer', e.target.value)} placeholder="Ej: 50" />
        </div>
        <div>
          <label className="soap-section-label">APGAR 1 minuto</label>
          <input className="soap-input" type="number" min="0" max="10" value={val('apgar1')} onChange={e => up('apgar1', e.target.value)} placeholder="0–10" />
        </div>
        <div>
          <label className="soap-section-label">APGAR 5 minutos</label>
          <input className="soap-input" type="number" min="0" max="10" value={val('apgar5')} onChange={e => up('apgar5', e.target.value)} placeholder="0–10" />
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Complicaciones perinatales</label>
        <input className="soap-input" value={val('complPerinatales')} onChange={e => up('complPerinatales', e.target.value)} placeholder="Ictericia neonatal, malformaciones, hospitalizaciones…" />
      </div>

      <div className="soap-section-divider" />

      {/* ALIMENTACIÓN */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Historia de Alimentación
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">Tipo de lactancia</label>
          <select className="soap-input" value={val('tipoLactancia')} onChange={e => up('tipoLactancia', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Materna exclusiva</option>
            <option>Artificial / Fórmula</option>
            <option>Mixta</option>
            <option>No lacta</option>
          </select>
        </div>
        <div>
          <label className="soap-section-label">Edad de inicio alimentación complementaria (meses)</label>
          <input className="soap-input" value={val('inicioComplementaria')} onChange={e => up('inicioComplementaria', e.target.value)} placeholder="Ej: 6" />
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Alimentación actual</label>
        <input className="soap-input" value={val('alimentacionActual')} onChange={e => up('alimentacionActual', e.target.value)} placeholder="Descripción de la dieta actual del niño" />
      </div>

      <div className="soap-section-divider" />

      {/* DESARROLLO PSICOMOTOR */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Desarrollo Psicomotor
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">Control cefálico (meses)</label>
          <input className="soap-input" value={val('controlCefalico')} onChange={e => up('controlCefalico', e.target.value)} placeholder="Ej: 3" />
        </div>
        <div>
          <label className="soap-section-label">Sedestación (meses)</label>
          <input className="soap-input" value={val('sedestacion')} onChange={e => up('sedestacion', e.target.value)} placeholder="Ej: 6" />
        </div>
        <div>
          <label className="soap-section-label">Bipedestación/Marcha (meses)</label>
          <input className="soap-input" value={val('marcha')} onChange={e => up('marcha', e.target.value)} placeholder="Ej: 12" />
        </div>
        <div>
          <label className="soap-section-label">Primeras palabras (meses)</label>
          <input className="soap-input" value={val('primerasPalabras')} onChange={e => up('primerasPalabras', e.target.value)} placeholder="Ej: 12" />
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Evaluación del desarrollo</label>
        <select className="soap-input" value={val('estadoDesarrollo')} onChange={e => up('estadoDesarrollo', e.target.value)}>
          <option value="">Seleccionar</option>
          <option>Desarrollo normal para la edad</option>
          <option>Retraso leve</option>
          <option>Retraso moderado</option>
          <option>Retraso severo</option>
          <option>Adelantado para la edad</option>
        </select>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Observaciones del desarrollo</label>
        <textarea className="soap-input soap-textarea" style={{ minHeight: 56 }} value={val('obsDesarrollo')} onChange={e => up('obsDesarrollo', e.target.value)} placeholder="Conducta social, lenguaje, habilidades motoras finas…" />
      </div>

      <div className="soap-section-divider" />

      {/* VACUNACIÓN */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Vacunación
      </p>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Estado del esquema de vacunación</label>
        <select className="soap-input" value={val('estadoVacunacion')} onChange={e => up('estadoVacunacion', e.target.value)}>
          <option value="">Seleccionar</option>
          <option>Completo para la edad</option>
          <option>Incompleto</option>
          <option>No vacunado</option>
          <option>Desconocido</option>
        </select>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Vacunas pendientes / observaciones</label>
        <textarea className="soap-input soap-textarea" style={{ minHeight: 56 }} value={val('vacunasPendientes')} onChange={e => up('vacunasPendientes', e.target.value)} placeholder="Vacunas que faltan, reacciones adversas observadas…" />
      </div>

      <div className="soap-section-divider" />

      {/* EXAMEN PEDIÁTRICO */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Mediciones y Examen Pediátrico
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">Perímetro cefálico (cm)</label>
          <input className="soap-input" value={val('perimetroCefalico')} onChange={e => up('perimetroCefalico', e.target.value)} placeholder="Ej: 46" />
        </div>
        <div>
          <label className="soap-section-label">Fontanela anterior</label>
          <select className="soap-input" value={val('fontanelaAnterior')} onChange={e => up('fontanelaAnterior', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Cerrada</option>
            <option>Abierta - normotensa</option>
            <option>Abierta - abombada</option>
            <option>Abierta - deprimida</option>
          </select>
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Reflejos arcaicos (según edad)</label>
        <input className="soap-input" value={val('reflejosArcaicos')} onChange={e => up('reflejosArcaicos', e.target.value)} placeholder="Ej: Moro presente, Prensión presente, Marcha automática ausente" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Evaluación de genitales</label>
        <input className="soap-input" value={val('genitales')} onChange={e => up('genitales', e.target.value)} placeholder="Normal / hallazgos relevantes" />
      </div>

      <div className="soap-section-divider" />

      {/* NOTAS */}
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Notas adicionales de Pediatría</label>
        <textarea className="soap-input soap-textarea" style={{ minHeight: 72 }} value={val('notasAdicionales')} onChange={e => up('notasAdicionales', e.target.value)} placeholder="Observaciones clínicas adicionales relevantes para la especialidad…" />
      </div>

      <div className="soap-nav-row" style={{ justifyContent: "flex-start", marginTop: 8 }}>
        <button className="soap-btn-secondary" onClick={onPrev}>← Volver al Plan</button>
      </div>
    </div>
  );
}
