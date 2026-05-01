import type { EspecialidadData } from "../../types";

interface Props {
  data: EspecialidadData;
  setData: (d: EspecialidadData) => void;
  onPrev: () => void;
}

export default function SectionGinecologia({ data, setData, onPrev }: Props) {
  const up = (k: string, v: string) => setData({ ...data, [k]: v });
  const val = (k: string) => data[k] ?? '';

  return (
    <div className="soap-content-inner">

      {/* ANTECEDENTES GINECOBSTÉTRICOS */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Antecedentes Ginecobstétricos
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">Menarca (edad en años)</label>
          <input className="soap-input" value={val('menarca')} onChange={e => up('menarca', e.target.value)} placeholder="Ej: 12" />
        </div>
        <div>
          <label className="soap-section-label">Última menstruación (FUR)</label>
          <input className="soap-input" type="date" value={val('fur')} onChange={e => up('fur', e.target.value)} />
        </div>
        <div>
          <label className="soap-section-label">Frecuencia del ciclo (días)</label>
          <input className="soap-input" value={val('frecuenciaCiclo')} onChange={e => up('frecuenciaCiclo', e.target.value)} placeholder="Ej: 28" />
        </div>
        <div>
          <label className="soap-section-label">Duración sangrado (días)</label>
          <input className="soap-input" value={val('duracionSangrado')} onChange={e => up('duracionSangrado', e.target.value)} placeholder="Ej: 5" />
        </div>
        <div>
          <label className="soap-section-label">Regularidad del ciclo</label>
          <select className="soap-input" value={val('regularidadCiclo')} onChange={e => up('regularidadCiclo', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Regular</option>
            <option>Irregular</option>
            <option>Amenorrea</option>
            <option>Postmenopausia</option>
          </select>
        </div>
        <div>
          <label className="soap-section-label">Dismenorrea</label>
          <select className="soap-input" value={val('dismenorrea')} onChange={e => up('dismenorrea', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Ausente</option>
            <option>Leve</option>
            <option>Moderada</option>
            <option>Severa / incapacitante</option>
          </select>
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Método anticonceptivo actual</label>
        <input className="soap-input" value={val('metodoAnticonceptivo')} onChange={e => up('metodoAnticonceptivo', e.target.value)} placeholder="ACO, DIU, condón, inyectable, ninguno…" />
      </div>

      <div className="soap-section-divider" />

      {/* ANTECEDENTES OBSTÉTRICOS */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Antecedentes Obstétricos (GPAEV)
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">G (Gestas)</label>
          <input className="soap-input" type="number" min="0" value={val('gestas')} onChange={e => up('gestas', e.target.value)} />
        </div>
        <div>
          <label className="soap-section-label">P (Partos)</label>
          <input className="soap-input" type="number" min="0" value={val('partos')} onChange={e => up('partos', e.target.value)} />
        </div>
        <div>
          <label className="soap-section-label">A (Abortos)</label>
          <input className="soap-input" type="number" min="0" value={val('abortos')} onChange={e => up('abortos', e.target.value)} />
        </div>
        <div>
          <label className="soap-section-label">E (Ectópicos)</label>
          <input className="soap-input" type="number" min="0" value={val('ectopicos')} onChange={e => up('ectopicos', e.target.value)} />
        </div>
        <div>
          <label className="soap-section-label">V (Vivos)</label>
          <input className="soap-input" type="number" min="0" value={val('vivosMuertos')} onChange={e => up('vivosMuertos', e.target.value)} />
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Complicaciones obstétricas previas</label>
        <input className="soap-input" value={val('complObstetricas')} onChange={e => up('complObstetricas', e.target.value)} placeholder="Preeclampsia, hemorragia postparto, prematuridad…" />
      </div>

      <div className="soap-section-divider" />

      {/* SÍNTOMAS GINECOLÓGICOS */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Síntomas Ginecológicos Actuales
      </p>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Flujo vaginal (características)</label>
        <input className="soap-input" value={val('flujoVaginal')} onChange={e => up('flujoVaginal', e.target.value)} placeholder="Color, olor, cantidad, picazón…" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Sangrado anormal / intermenstrual</label>
        <input className="soap-input" value={val('sangradoAnormal')} onChange={e => up('sangradoAnormal', e.target.value)} placeholder="Descripción, volumen, frecuencia…" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Dolor pélvico</label>
        <input className="soap-input" value={val('dolorPelvico')} onChange={e => up('dolorPelvico', e.target.value)} placeholder="Localización, carácter, intensidad 0–10…" />
      </div>

      <div className="soap-section-divider" />

      {/* EXAMEN GINECOLÓGICO */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Examen Ginecológico
      </p>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Genitales externos</label>
        <input className="soap-input" value={val('genitalesExternos')} onChange={e => up('genitalesExternos', e.target.value)} placeholder="Normal / hallazgos relevantes" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Especuloscopía (cuello uterino, secreciones)</label>
        <textarea className="soap-input soap-textarea" style={{ minHeight: 56 }} value={val('especuloscopia')} onChange={e => up('especuloscopia', e.target.value)} placeholder="Aspecto del cuello, ectropión, lesiones, secreción…" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Exploración bimanual (útero, anexos)</label>
        <textarea className="soap-input soap-textarea" style={{ minHeight: 56 }} value={val('exploracionBimanual')} onChange={e => up('exploracionBimanual', e.target.value)} placeholder="Tamaño uterino, movilidad, dolor, masas anexiales…" />
      </div>

      <div className="soap-section-divider" />

      {/* MAMAS */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Evaluación de Mamas
      </p>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Inspección</label>
        <input className="soap-input" value={val('mamaInspeccion')} onChange={e => up('mamaInspeccion', e.target.value)} placeholder="Simetría, retracción, enrojecimiento, piel de naranja…" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Palpación (nódulos, mastalgia, secreción)</label>
        <input className="soap-input" value={val('mamaPalpacion')} onChange={e => up('mamaPalpacion', e.target.value)} placeholder="Normal / hallazgos relevantes" />
      </div>

      <div className="soap-section-divider" />

      {/* PAP */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Citología / Papanicolaou
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">Fecha último PAP</label>
          <input className="soap-input" type="date" value={val('fechaPap')} onChange={e => up('fechaPap', e.target.value)} />
        </div>
        <div>
          <label className="soap-section-label">Resultado</label>
          <select className="soap-input" value={val('resultadoPap')} onChange={e => up('resultadoPap', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Normal / Negativo</option>
            <option>ASCUS</option>
            <option>LSIL (NIC I)</option>
            <option>HSIL (NIC II/III)</option>
            <option>Células glandulares atípicas</option>
            <option>Maligno</option>
            <option>Pendiente</option>
            <option>No realizado</option>
          </select>
        </div>
      </div>

      <div className="soap-section-divider" />

      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Notas adicionales de Ginecología</label>
        <textarea className="soap-input soap-textarea" style={{ minHeight: 60 }} value={val('notasAdicionales')} onChange={e => up('notasAdicionales', e.target.value)} placeholder="Observaciones clínicas adicionales…" />
      </div>

      <div className="soap-nav-row" style={{ justifyContent: "flex-start", marginTop: 8 }}>
        <button className="soap-btn-secondary" onClick={onPrev}>← Volver al Plan</button>
      </div>
    </div>
  );
}
