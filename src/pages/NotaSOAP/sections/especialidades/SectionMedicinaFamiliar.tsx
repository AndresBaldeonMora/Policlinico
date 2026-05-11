import * as React from "react";
import type { EspecialidadData } from "../../types";

interface Props {
  data: EspecialidadData;
  setData: React.Dispatch<React.SetStateAction<EspecialidadData>>;
  onPrev: () => void;
}

export default function SectionMedicinaFamiliar({ data, setData, onPrev }: Props) {
  const up = (k: string, v: string) => setData(prev => ({ ...prev, [k]: v }));
  const val = (k: string) => data[k] ?? '';

  return (
    <div className="soap-content-inner">

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Antecedentes Familiares Extendidos
      </p>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Árbol genealógico (3 generaciones)</label>
        <textarea className="soap-input soap-textarea" style={{ minHeight: 72 }} value={val('arbolGenealogico')} onChange={e => up('arbolGenealogico', e.target.value)} placeholder="Abuelo paterno: HTA, fallecido por IAM a los 70a&#10;Padre: DM2, vivo 65a&#10;Madre: hipotiroidismo, viva 62a&#10;Hermano mayor: sin antecedentes…" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Enfermedades crónicas familiares relevantes</label>
        <input className="soap-input" value={val('enfermedadesFamiliares')} onChange={e => up('enfermedadesFamiliares', e.target.value)} placeholder="HTA, DM, cáncer, cardiopatía, TB, enfermedades hereditarias…" />
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Composición y Dinámica Familiar
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">Composición del hogar</label>
          <input className="soap-input" value={val('composicionHogar')} onChange={e => up('composicionHogar', e.target.value)} placeholder="Ej: Paciente + cónyuge + 2 hijos (8 y 12 años)" />
        </div>
        <div>
          <label className="soap-section-label">Tipo de familia</label>
          <select className="soap-input" value={val('tipoFamilia')} onChange={e => up('tipoFamilia', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Nuclear</option>
            <option>Extensa</option>
            <option>Monoparental</option>
            <option>Unipersonal</option>
            <option>Reconstituida</option>
          </select>
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Dinámica y comunicación familiar</label>
        <select className="soap-input" value={val('dinamicaFamiliar')} onChange={e => up('dinamicaFamiliar', e.target.value)}>
          <option value="">Seleccionar</option>
          <option>Funcional — buena comunicación y apoyo</option>
          <option>Disfuncional leve</option>
          <option>Disfuncional moderada</option>
          <option>Crisis familiar activa</option>
        </select>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Violencia intrafamiliar</label>
        <select className="soap-input" value={val('violenciaFamiliar')} onChange={e => up('violenciaFamiliar', e.target.value)}>
          <option value="">Seleccionar</option>
          <option>No refiere</option>
          <option>Sospecha — requiere evaluación</option>
          <option>Confirmada — violencia física</option>
          <option>Confirmada — violencia psicológica</option>
        </select>
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Evaluación Socioeconómica y Vivienda
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">Tipo de vivienda</label>
          <select className="soap-input" value={val('tipoVivienda')} onChange={e => up('tipoVivienda', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Casa propia</option>
            <option>Casa alquilada</option>
            <option>Departamento</option>
            <option>Cuarto / habitación</option>
            <option>Material precario</option>
          </select>
        </div>
        <div>
          <label className="soap-section-label">Hacinamiento</label>
          <select className="soap-input" value={val('hacinamiento')} onChange={e => up('hacinamiento', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>No (&lt;2.5 personas/habitación)</option>
            <option>Sí (≥2.5 personas/habitación)</option>
          </select>
        </div>
        <div>
          <label className="soap-section-label">Acceso a agua potable</label>
          <select className="soap-input" value={val('aguaPotable')} onChange={e => up('aguaPotable', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Red pública intradomiciliaria</option>
            <option>Pilón / cisterna</option>
            <option>Sin acceso</option>
          </select>
        </div>
        <div>
          <label className="soap-section-label">Disposición de excretas</label>
          <select className="soap-input" value={val('disposicionExcretas')} onChange={e => up('disposicionExcretas', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Red de alcantarillado</option>
            <option>Pozo séptico</option>
            <option>Sin saneamiento</option>
          </select>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">Nivel socioeconómico</label>
          <select className="soap-input" value={val('nivelSocioeconomico')} onChange={e => up('nivelSocioeconomico', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>A/B — medio-alto</option>
            <option>C — medio</option>
            <option>D — bajo</option>
            <option>E — extrema pobreza</option>
          </select>
        </div>
        <div>
          <label className="soap-section-label">Seguro de salud</label>
          <select className="soap-input" value={val('seguroSalud')} onChange={e => up('seguroSalud', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>SIS</option>
            <option>EsSalud</option>
            <option>Seguro privado</option>
            <option>Sin seguro</option>
          </select>
        </div>
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Factores de Riesgo Biopsicosociales
      </p>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Riesgos identificados</label>
        <textarea className="soap-input soap-textarea" style={{ minHeight: 56 }} value={val('riesgosBiopsicosociales')} onChange={e => up('riesgosBiopsicosociales', e.target.value)} placeholder="Ocupacionales (exposición a tóxicos), ambientales (polvo/smog), violencia, consumo de drogas, desnutrición…" />
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Plan Familiar
      </p>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Problemas identificados a nivel familiar</label>
        <textarea className="soap-input soap-textarea" style={{ minHeight: 56 }} value={val('problemasFamiliares')} onChange={e => up('problemasFamiliares', e.target.value)} placeholder="Enfermedades crónicas no controladas en 2 miembros, riesgo nutricional en niño menor…" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Intervenciones y seguimiento programado</label>
        <textarea className="soap-input soap-textarea" style={{ minHeight: 56 }} value={val('intervencionFamiliar')} onChange={e => up('intervencionFamiliar', e.target.value)} placeholder="Consejería nutricional para toda la familia, visita domiciliaria en 1 mes, referencia a trabajo social…" />
      </div>

      <div className="soap-section-divider" />

      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Notas adicionales de Medicina Familiar</label>
        <textarea className="soap-input soap-textarea" style={{ minHeight: 60 }} value={val('notasAdicionales')} onChange={e => up('notasAdicionales', e.target.value)} placeholder="Observaciones clínicas adicionales…" />
      </div>

      <div className="soap-nav-row" style={{ justifyContent: "flex-start", marginTop: 8 }}>
        <button className="soap-btn-secondary" onClick={onPrev}>← Volver al Plan</button>
      </div>
    </div>
  );
}
