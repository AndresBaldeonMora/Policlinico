import * as React from "react";
import type { EspecialidadData } from "../../types";

interface Props {
  data: EspecialidadData;
  setData: React.Dispatch<React.SetStateAction<EspecialidadData>>;
  onPrev: () => void;
}

export default function SectionUrologia({ data, setData, onPrev }: Props) {
  const up = (k: string, v: string) => setData(prev => ({ ...prev, [k]: v }));
  const val = (k: string) => data[k] ?? '';

  return (
    <div className="soap-content-inner">

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Antecedentes Urológicos
      </p>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="urologia-antUrologia" className="soap-section-label">Patología urológica previa</label>
        <input id="urologia-antUrologia" className="soap-input" value={val('antUrologia')} onChange={e => up('antUrologia', e.target.value)} placeholder="Litiasis renal, infecciones urinarias recurrentes, cirugías urológicas, prostatismo…" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label htmlFor="urologia-enfermedadesSistemicas" className="soap-section-label">Enfermedades sistémicas relacionadas</label>
          <input id="urologia-enfermedadesSistemicas" className="soap-input" value={val('enfermedadesSistemicas')} onChange={e => up('enfermedadesSistemicas', e.target.value)} placeholder="DM, HTA, gota, enfermedad renal crónica…" />
        </div>
        <div>
          <label htmlFor="urologia-medicamentosUro" className="soap-section-label">Medicamentos de interés urológico</label>
          <input id="urologia-medicamentosUro" className="soap-input" value={val('medicamentosUro')} onChange={e => up('medicamentosUro', e.target.value)} placeholder="Alfa-bloqueantes, inhibidores 5-AR, anticolinérgicos, AINES…" />
        </div>
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Síntomas del Tracto Urinario Inferior (STUI)
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label htmlFor="urologia-sintomasLlenado" className="soap-section-label">Síntomas de llenado</label>
          <select id="urologia-sintomasLlenado" className="soap-input" value={val('sintomasLlenado')} onChange={e => up('sintomasLlenado', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Ninguno</option>
            <option>Polaquiuria diurna</option>
            <option>Nicturia (veces/noche)</option>
            <option>Urgencia miccional</option>
            <option>Incontinencia de urgencia</option>
          </select>
        </div>
        <div>
          <label htmlFor="urologia-sintomasVaciado" className="soap-section-label">Síntomas de vaciado</label>
          <select id="urologia-sintomasVaciado" className="soap-input" value={val('sintomasVaciado')} onChange={e => up('sintomasVaciado', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Ninguno</option>
            <option>Chorro débil</option>
            <option>Goteo terminal</option>
            <option>Esfuerzo miccional</option>
            <option>Vaciado incompleto</option>
            <option>Retención aguda de orina</option>
          </select>
        </div>
        <div>
          <label htmlFor="urologia-ipss" className="soap-section-label">Puntuación IPSS (0–35)</label>
          <input id="urologia-ipss" className="soap-input" type="number" min="0" max="35" value={val('ipss')} onChange={e => up('ipss', e.target.value)} placeholder="0–7: leve · 8–19: moderado · 20–35: grave" />
          <p className="soap-field-hint">International Prostate Symptom Score</p>
        </div>
        <div>
          <label htmlFor="urologia-incontinencia" className="soap-section-label">Incontinencia urinaria</label>
          <select id="urologia-incontinencia" className="soap-input" value={val('incontinencia')} onChange={e => up('incontinencia', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>No</option>
            <option>De estrés</option>
            <option>De urgencia</option>
            <option>Mixta</option>
            <option>Por rebosamiento</option>
          </select>
        </div>
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Síntomas del Tracto Urinario Superior
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label htmlFor="urologia-dolorLumbar" className="soap-section-label">Dolor lumbar / cólico renal</label>
          <input id="urologia-dolorLumbar" className="soap-input" value={val('dolorLumbar')} onChange={e => up('dolorLumbar', e.target.value)} placeholder="Localización, irradiación, intensidad EVA, episodios…" />
        </div>
        <div>
          <label htmlFor="urologia-hematuria" className="soap-section-label">Hematuria</label>
          <select id="urologia-hematuria" className="soap-input" value={val('hematuria')} onChange={e => up('hematuria', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Ausente</option>
            <option>Micro - hallazgo laboratorio</option>
            <option>Macro - 1er chorro (uretral)</option>
            <option>Macro - 3er chorro (vesical/prostática)</option>
            <option>Macro - total (renal)</option>
          </select>
        </div>
        <div>
          <label htmlFor="urologia-fiebreAsociada" className="soap-section-label">Fiebre asociada</label>
          <select id="urologia-fiebreAsociada" className="soap-input" value={val('fiebreAsociada')} onChange={e => up('fiebreAsociada', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>No</option>
            <option>Sí - sin foco claro</option>
            <option>Sí - sospecha infección urinaria alta</option>
          </select>
        </div>
        <div>
          <label htmlFor="urologia-litiasis" className="soap-section-label">Litiasis conocida</label>
          <select id="urologia-litiasis" className="soap-input" value={val('litiasis')} onChange={e => up('litiasis', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>No</option>
            <option>Sí - sin tratamiento previo</option>
            <option>Sí - LEOC previa</option>
            <option>Sí - cirugía previa</option>
          </select>
        </div>
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Evaluación Andrológica (si aplica)
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label htmlFor="urologia-disfuncionErectil" className="soap-section-label">Disfunción eréctil (IIEF)</label>
          <select id="urologia-disfuncionErectil" className="soap-input" value={val('disfuncionErectil')} onChange={e => up('disfuncionErectil', e.target.value)}>
            <option value="">Seleccionar / no aplica</option>
            <option>Ausente</option>
            <option>Leve</option>
            <option>Moderada</option>
            <option>Severa</option>
          </select>
        </div>
        <div>
          <label htmlFor="urologia-fertilidad" className="soap-section-label">Fertilidad / espermatograma</label>
          <input id="urologia-fertilidad" className="soap-input" value={val('fertilidad')} onChange={e => up('fertilidad', e.target.value)} placeholder="Resultado espermatograma, tiempo infertilidad…" />
        </div>
        <div>
          <label htmlFor="urologia-patologiaEscrotal" className="soap-section-label">Patología escrotal</label>
          <input id="urologia-patologiaEscrotal" className="soap-input" value={val('patologiaEscrotal')} onChange={e => up('patologiaEscrotal', e.target.value)} placeholder="Varicocele, hidrocele, masa testicular…" />
        </div>
        <div>
          <label htmlFor="urologia-tactoRectal" className="soap-section-label">Tacto rectal (próstata)</label>
          <input id="urologia-tactoRectal" className="soap-input" value={val('tactoRectal')} onChange={e => up('tactoRectal', e.target.value)} placeholder="Tamaño estimado, consistencia, nódulos, límites, dolor…" />
        </div>
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Exámenes Complementarios
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label htmlFor="urologia-uroanalisis" className="soap-section-label">Uroanálisis</label>
          <input id="urologia-uroanalisis" className="soap-input" value={val('uroanalisis')} onChange={e => up('uroanalisis', e.target.value)} placeholder="pH, densidad, proteínas, leucocitos, nitritos, hematíes…" />
        </div>
        <div>
          <label htmlFor="urologia-urocultivo" className="soap-section-label">Urocultivo</label>
          <input id="urologia-urocultivo" className="soap-input" value={val('urocultivo')} onChange={e => up('urocultivo', e.target.value)} placeholder="Germen aislado, sensibilidad antibiótica, UFC/mL…" />
        </div>
        <div>
          <label htmlFor="urologia-creatinina" className="soap-section-label">Creatinina / TFG estimada</label>
          <input id="urologia-creatinina" className="soap-input" value={val('creatinina')} onChange={e => up('creatinina', e.target.value)} placeholder="Creatinina mg/dL · TFG mL/min/1.73m²" />
        </div>
        <div>
          <label htmlFor="urologia-psa" className="soap-section-label">PSA total / libre (ng/mL)</label>
          <input id="urologia-psa" className="soap-input" value={val('psa')} onChange={e => up('psa', e.target.value)} placeholder="PSA total · PSA libre · % libre/total" />
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="urologia-ecografiaRenovesical" className="soap-section-label">Ecografía renal y vesical</label>
        <textarea id="urologia-ecografiaRenovesical" className="soap-input soap-textarea" style={{ minHeight: 56 }} value={val('ecografiaRenovesical')} onChange={e => up('ecografiaRenovesical', e.target.value)} placeholder="Riñones: tamaño, ecotextura, hidronefrosis, litiasis&#10;Vejiga: residuo postmiccional (mL), paredes, lesiones&#10;Próstata: volumen cc (si transrectal), adenoma…" />
      </div>

      <div className="soap-section-divider" />

      <div style={{ marginBottom: 14 }}>
        <label htmlFor="urologia-notasAdicionales" className="soap-section-label">Notas adicionales de Urología</label>
        <textarea id="urologia-notasAdicionales" className="soap-input soap-textarea" style={{ minHeight: 60 }} value={val('notasAdicionales')} onChange={e => up('notasAdicionales', e.target.value)} placeholder="Observaciones clínicas adicionales, plan quirúrgico, seguimiento…" />
      </div>

      <div className="soap-nav-row" style={{ justifyContent: "flex-start", marginTop: 8 }}>
        <button className="soap-btn-secondary" onClick={onPrev}>← Volver al Plan</button>
      </div>
    </div>
  );
}
