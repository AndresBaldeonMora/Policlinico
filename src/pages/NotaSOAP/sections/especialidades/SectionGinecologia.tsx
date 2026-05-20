import * as React from "react";
import type { EspecialidadData } from "../../types";

interface Props {
  data: EspecialidadData;
  setData: React.Dispatch<React.SetStateAction<EspecialidadData>>;
  onPrev: () => void;
}

export default function SectionGinecologia({ data, setData, onPrev }: Props) {
  const up = (k: string, v: string) => setData(prev => ({ ...prev, [k]: v }));
  const val = (k: string) => data[k] ?? '';

  return (
    <div className="soap-content-inner">

      {/* ANTECEDENTES GINECOBSTÉTRICOS */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Antecedentes Ginecobstétricos
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label htmlFor="ginecologia-menarca" className="soap-section-label">Menarca (edad en años)</label>
          <input id="ginecologia-menarca" className="soap-input" value={val('menarca')} onChange={e => up('menarca', e.target.value)} placeholder="" />
        </div>
        <div>
          <label htmlFor="ginecologia-fur" className="soap-section-label">Última menstruación (FUR)</label>
          <input id="ginecologia-fur" className="soap-input" type="date" value={val('fur')} onChange={e => up('fur', e.target.value)} />
        </div>
        <div>
          <label htmlFor="ginecologia-frecuenciaCiclo" className="soap-section-label">Frecuencia del ciclo (días)</label>
          <input id="ginecologia-frecuenciaCiclo" className="soap-input" value={val('frecuenciaCiclo')} onChange={e => up('frecuenciaCiclo', e.target.value)} placeholder="" />
        </div>
        <div>
          <label htmlFor="ginecologia-duracionSangrado" className="soap-section-label">Duración sangrado (días)</label>
          <input id="ginecologia-duracionSangrado" className="soap-input" value={val('duracionSangrado')} onChange={e => up('duracionSangrado', e.target.value)} placeholder="" />
        </div>
        <div>
          <label htmlFor="ginecologia-regularidadCiclo" className="soap-section-label">Regularidad del ciclo</label>
          <select id="ginecologia-regularidadCiclo" className="soap-input" value={val('regularidadCiclo')} onChange={e => up('regularidadCiclo', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Regular</option>
            <option>Irregular</option>
            <option>Amenorrea</option>
            <option>Postmenopausia</option>
          </select>
        </div>
        <div>
          <label htmlFor="ginecologia-dismenorrea" className="soap-section-label">Dismenorrea</label>
          <select id="ginecologia-dismenorrea" className="soap-input" value={val('dismenorrea')} onChange={e => up('dismenorrea', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Ausente</option>
            <option>Leve</option>
            <option>Moderada</option>
            <option>Severa / incapacitante</option>
          </select>
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="ginecologia-metodoAnticonceptivo" className="soap-section-label">Método anticonceptivo actual</label>
        <input id="ginecologia-metodoAnticonceptivo" className="soap-input" value={val('metodoAnticonceptivo')} onChange={e => up('metodoAnticonceptivo', e.target.value)} placeholder="" />
      </div>

      <div className="soap-section-divider" />

      {/* ANTECEDENTES OBSTÉTRICOS */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Antecedentes Obstétricos (GPAEV)
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label htmlFor="ginecologia-gestas" className="soap-section-label">G (Gestas)</label>
          <input id="ginecologia-gestas" className="soap-input" type="number" min="0" value={val('gestas')} onChange={e => up('gestas', e.target.value)} />
        </div>
        <div>
          <label htmlFor="ginecologia-partos" className="soap-section-label">P (Partos)</label>
          <input id="ginecologia-partos" className="soap-input" type="number" min="0" value={val('partos')} onChange={e => up('partos', e.target.value)} />
        </div>
        <div>
          <label htmlFor="ginecologia-abortos" className="soap-section-label">A (Abortos)</label>
          <input id="ginecologia-abortos" className="soap-input" type="number" min="0" value={val('abortos')} onChange={e => up('abortos', e.target.value)} />
        </div>
        <div>
          <label htmlFor="ginecologia-ectopicos" className="soap-section-label">E (Ectópicos)</label>
          <input id="ginecologia-ectopicos" className="soap-input" type="number" min="0" value={val('ectopicos')} onChange={e => up('ectopicos', e.target.value)} />
        </div>
        <div>
          <label htmlFor="ginecologia-vivosMuertos" className="soap-section-label">V (Vivos)</label>
          <input id="ginecologia-vivosMuertos" className="soap-input" type="number" min="0" value={val('vivosMuertos')} onChange={e => up('vivosMuertos', e.target.value)} />
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="ginecologia-complObstetricas" className="soap-section-label">Complicaciones obstétricas previas</label>
        <input id="ginecologia-complObstetricas" className="soap-input" value={val('complObstetricas')} onChange={e => up('complObstetricas', e.target.value)} placeholder="" />
      </div>

      <div className="soap-section-divider" />

      {/* SÍNTOMAS GINECOLÓGICOS */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Síntomas Ginecológicos Actuales
      </p>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="ginecologia-flujoVaginal" className="soap-section-label">Flujo vaginal (características)</label>
        <input id="ginecologia-flujoVaginal" className="soap-input" value={val('flujoVaginal')} onChange={e => up('flujoVaginal', e.target.value)} placeholder="" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="ginecologia-sangradoAnormal" className="soap-section-label">Sangrado anormal / intermenstrual</label>
        <input id="ginecologia-sangradoAnormal" className="soap-input" value={val('sangradoAnormal')} onChange={e => up('sangradoAnormal', e.target.value)} placeholder="" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="ginecologia-dolorPelvico" className="soap-section-label">Dolor pélvico</label>
        <input id="ginecologia-dolorPelvico" className="soap-input" value={val('dolorPelvico')} onChange={e => up('dolorPelvico', e.target.value)} placeholder="" />
      </div>

      <div className="soap-section-divider" />

      {/* EXAMEN GINECOLÓGICO */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Examen Ginecológico
      </p>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="ginecologia-genitalesExternos" className="soap-section-label">Genitales externos</label>
        <input id="ginecologia-genitalesExternos" className="soap-input" value={val('genitalesExternos')} onChange={e => up('genitalesExternos', e.target.value)} placeholder="" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="ginecologia-especuloscopia" className="soap-section-label">Especuloscopía (cuello uterino, secreciones)</label>
        <textarea id="ginecologia-especuloscopia" className="soap-input soap-textarea" style={{ minHeight: 56 }} value={val('especuloscopia')} onChange={e => up('especuloscopia', e.target.value)} placeholder="" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="ginecologia-exploracionBimanual" className="soap-section-label">Exploración bimanual (útero, anexos)</label>
        <textarea id="ginecologia-exploracionBimanual" className="soap-input soap-textarea" style={{ minHeight: 56 }} value={val('exploracionBimanual')} onChange={e => up('exploracionBimanual', e.target.value)} placeholder="" />
      </div>

      <div className="soap-section-divider" />

      {/* MAMAS */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Evaluación de Mamas
      </p>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="ginecologia-mamaInspeccion" className="soap-section-label">Inspección</label>
        <input id="ginecologia-mamaInspeccion" className="soap-input" value={val('mamaInspeccion')} onChange={e => up('mamaInspeccion', e.target.value)} placeholder="" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="ginecologia-mamaPalpacion" className="soap-section-label">Palpación (nódulos, mastalgia, secreción)</label>
        <input id="ginecologia-mamaPalpacion" className="soap-input" value={val('mamaPalpacion')} onChange={e => up('mamaPalpacion', e.target.value)} placeholder="" />
      </div>

      <div className="soap-section-divider" />

      {/* PAP */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Citología / Papanicolaou
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label htmlFor="ginecologia-fechaPap" className="soap-section-label">Fecha último PAP</label>
          <input id="ginecologia-fechaPap" className="soap-input" type="date" value={val('fechaPap')} onChange={e => up('fechaPap', e.target.value)} />
        </div>
        <div>
          <label htmlFor="ginecologia-resultadoPap" className="soap-section-label">Resultado</label>
          <select id="ginecologia-resultadoPap" className="soap-input" value={val('resultadoPap')} onChange={e => up('resultadoPap', e.target.value)}>
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
        <label htmlFor="ginecologia-notasAdicionales" className="soap-section-label">Notas adicionales de Ginecología</label>
        <textarea id="ginecologia-notasAdicionales" className="soap-input soap-textarea" style={{ minHeight: 60 }} value={val('notasAdicionales')} onChange={e => up('notasAdicionales', e.target.value)} placeholder="" />
      </div>

      <div className="soap-nav-row" style={{ justifyContent: "flex-start", marginTop: 8 }}>
        <button className="soap-btn-secondary" onClick={onPrev}>← Volver al Plan</button>
      </div>
    </div>
  );
}
