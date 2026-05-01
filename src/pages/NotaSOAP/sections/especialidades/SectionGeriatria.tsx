import type { EspecialidadData } from "../../types";

interface Props {
  data: EspecialidadData;
  setData: (d: EspecialidadData) => void;
  onPrev: () => void;
}

export default function SectionGeriatria({ data, setData, onPrev }: Props) {
  const up = (k: string, v: string) => setData({ ...data, [k]: v });
  const val = (k: string) => data[k] ?? '';

  return (
    <div className="soap-content-inner">

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Valoración Funcional — VACAM
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">Índice de Barthel AVD (0–100)</label>
          <input className="soap-input" type="number" min="0" max="100" value={val('barthel')} onChange={e => up('barthel', e.target.value)} placeholder="0=dependencia total" />
          <p className="soap-field-hint">100=independiente · 91–99=independiente con ayuda · ≤60=dependiente</p>
        </div>
        <div>
          <label className="soap-section-label">Lawton-Brody AIVD (0–8)</label>
          <input className="soap-input" type="number" min="0" max="8" value={val('lawtonBrody')} onChange={e => up('lawtonBrody', e.target.value)} placeholder="0=dependencia total" />
          <p className="soap-field-hint">8=independiente en todas las AIVD</p>
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Actividades con mayor limitación</label>
        <input className="soap-input" value={val('actividadesLimitadas')} onChange={e => up('actividadesLimitadas', e.target.value)} placeholder="Bañarse, vestirse, transferencias, preparar alimentos, manejo de dinero…" />
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Evaluación Cognitiva
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">MMSE / Mini-Mental (puntuación /30)</label>
          <input className="soap-input" type="number" min="0" max="30" value={val('mmse')} onChange={e => up('mmse', e.target.value)} placeholder="Normal ≥24 · Deterioro &lt;24" />
        </div>
        <div>
          <label className="soap-section-label">Mini-Cog (0–5)</label>
          <input className="soap-input" type="number" min="0" max="5" value={val('miniCog')} onChange={e => up('miniCog', e.target.value)} placeholder="Deterioro probable ≤2" />
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Orientación (persona / lugar / tiempo)</label>
        <input className="soap-input" value={val('orientacion')} onChange={e => up('orientacion', e.target.value)} placeholder="Orientado en las 3 esferas / desorientado en…" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Queja de memoria (paciente / familiar)</label>
        <select className="soap-input" value={val('quejasMemoria')} onChange={e => up('quejasMemoria', e.target.value)}>
          <option value="">Seleccionar</option>
          <option>No</option>
          <option>Sí — referida solo por el paciente</option>
          <option>Sí — confirmada por familiar</option>
          <option>Impacta en actividades diarias</option>
        </select>
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Evaluación Afectiva
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">GDS — Escala de Depresión Geriátrica</label>
          <select className="soap-input" value={val('gds')} onChange={e => up('gds', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>GDS 0–5 — Normal</option>
            <option>GDS 6–10 — Depresión leve probable</option>
            <option>GDS 11–15 — Depresión establecida</option>
          </select>
        </div>
        <div>
          <label className="soap-section-label">Ideación suicida</label>
          <select className="soap-input" value={val('ideacionSuicida')} onChange={e => up('ideacionSuicida', e.target.value)}>
            <option value="">Seleccionar</option><option>No</option><option>Sí (requiere evaluación especializada)</option>
          </select>
        </div>
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Síndromes Geriátricos
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">Caídas en el último año</label>
          <input className="soap-input" type="number" min="0" value={val('caidasUltimoAno')} onChange={e => up('caidasUltimoAno', e.target.value)} placeholder="Número de caídas" />
        </div>
        <div>
          <label className="soap-section-label">Tinetti (0–28)</label>
          <input className="soap-input" type="number" min="0" max="28" value={val('tinetti')} onChange={e => up('tinetti', e.target.value)} placeholder="&lt;19 = alto riesgo caída" />
        </div>
        <div>
          <label className="soap-section-label">Incontinencia urinaria</label>
          <select className="soap-input" value={val('incontinenciaUrinaria')} onChange={e => up('incontinenciaUrinaria', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Continente</option>
            <option>Urgencia</option>
            <option>Estrés</option>
            <option>Mixta</option>
            <option>Rebosamiento</option>
            <option>Con pañal</option>
          </select>
        </div>
        <div>
          <label className="soap-section-label">Úlceras por presión</label>
          <select className="soap-input" value={val('ulcerasPresion')} onChange={e => up('ulcerasPresion', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>No</option>
            <option>Estadío I</option>
            <option>Estadío II</option>
            <option>Estadío III</option>
            <option>Estadío IV</option>
          </select>
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Estado nutricional</label>
        <select className="soap-input" value={val('estadoNutricional')} onChange={e => up('estadoNutricional', e.target.value)}>
          <option value="">Seleccionar</option>
          <option>Normal</option>
          <option>Riesgo de desnutrición</option>
          <option>Desnutrición</option>
          <option>Obesidad</option>
        </select>
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Evaluación Social
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">Situación de convivencia</label>
          <select className="soap-input" value={val('convivencia')} onChange={e => up('convivencia', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Con cónyuge</option>
            <option>Con familia</option>
            <option>Solo / Solo con cuidador</option>
            <option>Residencia geriátrica</option>
          </select>
        </div>
        <div>
          <label className="soap-section-label">Red de apoyo familiar</label>
          <select className="soap-input" value={val('redApoyoFamiliar')} onChange={e => up('redApoyoFamiliar', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Adecuada</option>
            <option>Limitada</option>
            <option>Ausente</option>
          </select>
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Signos de maltrato o abandono</label>
        <select className="soap-input" value={val('maltratoAbandono')} onChange={e => up('maltratoAbandono', e.target.value)}>
          <option value="">Seleccionar</option>
          <option>No evidentes</option>
          <option>Sospecha — requiere evaluación social</option>
          <option>Confirmado</option>
        </select>
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Medicamentos y Polifarmacia
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">Número total de medicamentos</label>
          <input className="soap-input" type="number" min="0" value={val('numMedicamentos')} onChange={e => up('numMedicamentos', e.target.value)} placeholder="≥5 = polifarmacia" />
        </div>
        <div>
          <label className="soap-section-label">Medicamentos potencialmente inapropiados (Beers)</label>
          <input className="soap-input" value={val('medicamentosInapropiados')} onChange={e => up('medicamentosInapropiados', e.target.value)} placeholder="BZD, anticolinérgicos, AINES, antihistamínicos 1ª gen…" />
        </div>
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Inmunizaciones
      </p>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Estado de vacunación geriátrica</label>
        <textarea className="soap-input soap-textarea" style={{ minHeight: 56 }} value={val('vacunacionGeriatrica')} onChange={e => up('vacunacionGeriatrica', e.target.value)} placeholder="Influenza: anual ✓/✗ · Neumocócica: ✓/✗ · COVID: dosis __· Tétano: año __ · Zóster: ✓/✗" />
      </div>

      <div className="soap-section-divider" />

      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Notas adicionales de Geriatría</label>
        <textarea className="soap-input soap-textarea" style={{ minHeight: 60 }} value={val('notasAdicionales')} onChange={e => up('notasAdicionales', e.target.value)} placeholder="Fragilidad, consejería preventiva, objetivos de cuidado…" />
      </div>

      <div className="soap-nav-row" style={{ justifyContent: "flex-start", marginTop: 8 }}>
        <button className="soap-btn-secondary" onClick={onPrev}>← Volver al Plan</button>
      </div>
    </div>
  );
}
