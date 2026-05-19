import * as React from "react";
import type { EspecialidadData } from "../../types";

interface Props {
  data: EspecialidadData;
  setData: React.Dispatch<React.SetStateAction<EspecialidadData>>;
  onPrev: () => void;
}

export default function SectionEndocrinologia({ data, setData, onPrev }: Props) {
  const up = (k: string, v: string) => setData(prev => ({ ...prev, [k]: v }));
  const val = (k: string) => data[k] ?? '';

  return (
    <div className="soap-content-inner">

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Antecedentes Endocrinológicos
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label htmlFor="endocrinologia-patologiaEndocrina" className="soap-section-label">Patología endocrina previa</label>
          <input id="endocrinologia-patologiaEndocrina" className="soap-input" value={val('patologiaEndocrina')} onChange={e => up('patologiaEndocrina', e.target.value)} placeholder="DM1/2, hipotiroidismo, hipertiroidismo, Cushing, Addison…" />
        </div>
        <div>
          <label htmlFor="endocrinologia-antFamEndocrino" className="soap-section-label">Antecedentes familiares</label>
          <input id="endocrinologia-antFamEndocrino" className="soap-input" value={val('antFamEndocrino')} onChange={e => up('antFamEndocrino', e.target.value)} placeholder="DM, tiroides, obesidad, osteoporosis…" />
        </div>
        <div>
          <label htmlFor="endocrinologia-tipoDiabetes" className="soap-section-label">Tipo de Diabetes (si aplica)</label>
          <select id="endocrinologia-tipoDiabetes" className="soap-input" value={val('tipoDiabetes')} onChange={e => up('tipoDiabetes', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>DM Tipo 1</option>
            <option>DM Tipo 2</option>
            <option>MODY</option>
            <option>DM Gestacional</option>
            <option>Prediabetes</option>
            <option>No aplica</option>
          </select>
        </div>
        <div>
          <label htmlFor="endocrinologia-anosDiabetes" className="soap-section-label">Años de evolución de DM</label>
          <input id="endocrinologia-anosDiabetes" className="soap-input" value={val('anosDiabetes')} onChange={e => up('anosDiabetes', e.target.value)} placeholder="Ej: 8 años" />
        </div>
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Síntomas Metabólicos
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label htmlFor="endocrinologia-polidipsia" className="soap-section-label">Polidipsia</label>
          <select id="endocrinologia-polidipsia" className="soap-input" value={val('polidipsia')} onChange={e => up('polidipsia', e.target.value)}>
            <option value="">Seleccionar</option><option>No</option><option>Sí</option>
          </select>
        </div>
        <div>
          <label htmlFor="endocrinologia-polifagia" className="soap-section-label">Polifagia</label>
          <select id="endocrinologia-polifagia" className="soap-input" value={val('polifagia')} onChange={e => up('polifagia', e.target.value)}>
            <option value="">Seleccionar</option><option>No</option><option>Sí</option>
          </select>
        </div>
        <div>
          <label htmlFor="endocrinologia-poliuria" className="soap-section-label">Poliuria</label>
          <select id="endocrinologia-poliuria" className="soap-input" value={val('poliuria')} onChange={e => up('poliuria', e.target.value)}>
            <option value="">Seleccionar</option><option>No</option><option>Sí</option>
          </select>
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="endocrinologia-sintomasTiroideos" className="soap-section-label">Síntomas tiroideos</label>
        <input id="endocrinologia-sintomasTiroideos" className="soap-input" value={val('sintomasTiroideos')} onChange={e => up('sintomasTiroideos', e.target.value)} placeholder="Intolerancia calor/frío, palpitaciones, cambios peso, caída cabello, voz, bocio…" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="endocrinologia-sintomasHipoglucemia" className="soap-section-label">Síntomas de hipoglucemia</label>
        <input id="endocrinologia-sintomasHipoglucemia" className="soap-input" value={val('sintomasHipoglucemia')} onChange={e => up('sintomasHipoglucemia', e.target.value)} placeholder="Sudoración, temblor, confusión, palpitaciones — frecuencia…" />
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Control Metabólico
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label htmlFor="endocrinologia-hba1c" className="soap-section-label">HbA1c (%)</label>
          <input id="endocrinologia-hba1c" className="soap-input" value={val('hba1c')} onChange={e => up('hba1c', e.target.value)} placeholder="Ej: 7.8%" />
        </div>
        <div>
          <label htmlFor="endocrinologia-glucosaBasal" className="soap-section-label">Glucosa basal (mg/dL)</label>
          <input id="endocrinologia-glucosaBasal" className="soap-input" value={val('glucosaBasal')} onChange={e => up('glucosaBasal', e.target.value)} placeholder="Ej: 145" />
        </div>
        <div>
          <label htmlFor="endocrinologia-glucosaPost" className="soap-section-label">Glucosa 2h posprandial</label>
          <input id="endocrinologia-glucosaPost" className="soap-input" value={val('glucosaPost')} onChange={e => up('glucosaPost', e.target.value)} placeholder="Ej: 195" />
        </div>
        <div>
          <label htmlFor="endocrinologia-tsh" className="soap-section-label">TSH (mUI/L)</label>
          <input id="endocrinologia-tsh" className="soap-input" value={val('tsh')} onChange={e => up('tsh', e.target.value)} placeholder="Normal: 0.4–4.0" />
        </div>
        <div>
          <label htmlFor="endocrinologia-t4Libre" className="soap-section-label">T4 libre (ng/dL)</label>
          <input id="endocrinologia-t4Libre" className="soap-input" value={val('t4Libre')} onChange={e => up('t4Libre', e.target.value)} placeholder="Normal: 0.8–1.8" />
        </div>
        <div>
          <label htmlFor="endocrinologia-t3Libre" className="soap-section-label">T3 libre (pg/mL)</label>
          <input id="endocrinologia-t3Libre" className="soap-input" value={val('t3Libre')} onChange={e => up('t3Libre', e.target.value)} placeholder="Normal: 2.3–4.2" />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label htmlFor="endocrinologia-perimetroAbdominal" className="soap-section-label">Perímetro abdominal (cm)</label>
          <input id="endocrinologia-perimetroAbdominal" className="soap-input" value={val('perimetroAbdominal')} onChange={e => up('perimetroAbdominal', e.target.value)} placeholder="Ej: 102" />
        </div>
        <div>
          <label htmlFor="endocrinologia-icc" className="soap-section-label">Índice cintura-cadera (ICC)</label>
          <input id="endocrinologia-icc" className="soap-input" value={val('icc')} onChange={e => up('icc', e.target.value)} placeholder="Ej: 0.95" />
        </div>
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Complicaciones de Diabetes
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label htmlFor="endocrinologia-retinopatia" className="soap-section-label">Retinopatía diabética</label>
          <select id="endocrinologia-retinopatia" className="soap-input" value={val('retinopatia')} onChange={e => up('retinopatia', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>No evaluada</option>
            <option>Ausente</option>
            <option>RDNP leve</option>
            <option>RDNP moderada</option>
            <option>RDNP severa</option>
            <option>RDP (proliferativa)</option>
          </select>
        </div>
        <div>
          <label htmlFor="endocrinologia-nefropatia" className="soap-section-label">Nefropatía (proteinuria/creatinina)</label>
          <input id="endocrinologia-nefropatia" className="soap-input" value={val('nefropatia')} onChange={e => up('nefropatia', e.target.value)} placeholder="Ej: Microalbuminuria 50 mg/g, Cr 1.1 mg/dL" />
        </div>
        <div>
          <label htmlFor="endocrinologia-neuropatia" className="soap-section-label">Neuropatía periférica</label>
          <select id="endocrinologia-neuropatia" className="soap-input" value={val('neuropatia')} onChange={e => up('neuropatia', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>No evaluada</option>
            <option>Ausente</option>
            <option>Presente - hormigueo/dolor pies</option>
            <option>Presente - pérdida de sensibilidad</option>
          </select>
        </div>
        <div>
          <label htmlFor="endocrinologia-pieDiabetico" className="soap-section-label">Pie diabético</label>
          <select id="endocrinologia-pieDiabetico" className="soap-input" value={val('pieDiabetico')} onChange={e => up('pieDiabetico', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Sin lesiones</option>
            <option>Riesgo alto (deformidades/callosidades)</option>
            <option>Úlcera presente - grado Wagner __</option>
            <option>Infección activa</option>
          </select>
        </div>
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Examen de Tiroides
      </p>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="endocrinologia-examenTiroides" className="soap-section-label">Hallazgos a la palpación</label>
        <input id="endocrinologia-examenTiroides" className="soap-input" value={val('examenTiroides')} onChange={e => up('examenTiroides', e.target.value)} placeholder="Normal / bocio difuso / bocio nodular (descripción) / dolor / adenopatías" />
      </div>

      <div className="soap-section-divider" />

      <div style={{ marginBottom: 14 }}>
        <label htmlFor="endocrinologia-notasAdicionales" className="soap-section-label">Notas adicionales de Endocrinología</label>
        <textarea id="endocrinologia-notasAdicionales" className="soap-input soap-textarea" style={{ minHeight: 60 }} value={val('notasAdicionales')} onChange={e => up('notasAdicionales', e.target.value)} placeholder="Adherencia al tratamiento, tipo de dieta, actividad física, anticuerpos tiroideos…" />
      </div>

      <div className="soap-nav-row" style={{ justifyContent: "flex-start", marginTop: 8 }}>
        <button className="soap-btn-secondary" onClick={onPrev}>← Volver al Plan</button>
      </div>
    </div>
  );
}
