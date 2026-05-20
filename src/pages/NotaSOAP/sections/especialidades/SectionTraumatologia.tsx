import * as React from "react";
import type { EspecialidadData } from "../../types";

interface Props {
  data: EspecialidadData;
  setData: React.Dispatch<React.SetStateAction<EspecialidadData>>;
  onPrev: () => void;
}

export default function SectionTraumatologia({ data, setData, onPrev }: Props) {
  const up = (k: string, v: string) => setData(prev => ({ ...prev, [k]: v }));
  const val = (k: string) => data[k] ?? '';

  return (
    <div className="soap-content-inner">

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Antecedentes Traumatológicos
      </p>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="traumatologia-antTraumatologicos" className="soap-section-label">Fracturas / cirugías ortopédicas previas</label>
        <input id="traumatologia-antTraumatologicos" className="soap-input" value={val('antTraumatologicos')} onChange={e => up('antTraumatologicos', e.target.value)} placeholder="" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label htmlFor="traumatologia-osteoporosis" className="soap-section-label">Osteoporosis / osteopenia</label>
          <select id="traumatologia-osteoporosis" className="soap-input" value={val('osteoporosis')} onChange={e => up('osteoporosis', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>No</option>
            <option>Osteopenia (T-score -1 a -2.5)</option>
            <option>Osteoporosis (T-score &lt; -2.5)</option>
            <option>No evaluado</option>
          </select>
        </div>
        <div>
          <label htmlFor="traumatologia-esguincesLuxaciones" className="soap-section-label">Esguinces / luxaciones previas</label>
          <input id="traumatologia-esguincesLuxaciones" className="soap-input" value={val('esguincesLuxaciones')} onChange={e => up('esguincesLuxaciones', e.target.value)} placeholder="" />
        </div>
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Mecanismo de Lesión
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label htmlFor="traumatologia-tipoTrauma" className="soap-section-label">Tipo de trauma</label>
          <select id="traumatologia-tipoTrauma" className="soap-input" value={val('tipoTrauma')} onChange={e => up('tipoTrauma', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Caída de propia altura</option>
            <option>Caída de altura</option>
            <option>Accidente de tránsito</option>
            <option>Golpe directo</option>
            <option>Torsión</option>
            <option>Aplastamiento</option>
            <option>Sin trauma (enfermedad)</option>
          </select>
        </div>
        <div>
          <label htmlFor="traumatologia-fechaTrauma" className="soap-section-label">Fecha/hora del trauma</label>
          <input id="traumatologia-fechaTrauma" className="soap-input" value={val('fechaTrauma')} onChange={e => up('fechaTrauma', e.target.value)} placeholder="" />
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="traumatologia-descripcionMecanismo" className="soap-section-label">Descripción del mecanismo</label>
        <textarea id="traumatologia-descripcionMecanismo" className="soap-input soap-textarea" style={{ minHeight: 56 }} value={val('descripcionMecanismo')} onChange={e => up('descripcionMecanismo', e.target.value)} placeholder="" />
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Síntomas y Examen Físico Traumatológico
      </p>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="traumatologia-zonaAfectada" className="soap-section-label">Zona afectada</label>
        <input id="traumatologia-zonaAfectada" className="soap-input" value={val('zonaAfectada')} onChange={e => up('zonaAfectada', e.target.value)} placeholder="" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label htmlFor="traumatologia-dolorEva" className="soap-section-label">Dolor (EVA 0–10)</label>
          <input id="traumatologia-dolorEva" className="soap-input" type="number" min="0" max="10" value={val('dolorEva')} onChange={e => up('dolorEva', e.target.value)} />
        </div>
        <div>
          <label htmlFor="traumatologia-edema" className="soap-section-label">Edema / Tumefacción</label>
          <select id="traumatologia-edema" className="soap-input" value={val('edema')} onChange={e => up('edema', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Ausente</option>
            <option>Leve</option>
            <option>Moderado</option>
            <option>Severo</option>
          </select>
        </div>
        <div>
          <label htmlFor="traumatologia-deformidad" className="soap-section-label">Deformidad visible</label>
          <select id="traumatologia-deformidad" className="soap-input" value={val('deformidad')} onChange={e => up('deformidad', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>No</option>
            <option>Sí - angulación</option>
            <option>Sí - rotación</option>
            <option>Sí - acortamiento</option>
          </select>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label htmlFor="traumatologia-equimosis" className="soap-section-label">Equimosis</label>
          <select id="traumatologia-equimosis" className="soap-input" value={val('equimosis')} onChange={e => up('equimosis', e.target.value)}>
            <option value="">Seleccionar</option><option>No</option><option>Sí - localizada</option><option>Sí - extensa</option>
          </select>
        </div>
        <div>
          <label htmlFor="traumatologia-heridas" className="soap-section-label">Heridas / Lesión abierta</label>
          <select id="traumatologia-heridas" className="soap-input" value={val('heridas')} onChange={e => up('heridas', e.target.value)}>
            <option value="">Seleccionar</option><option>No (fractura cerrada)</option><option>Sí - fractura abierta</option><option>Sí - laceración</option>
          </select>
        </div>
        <div>
          <label htmlFor="traumatologia-impotenciaFuncional" className="soap-section-label">Impotencia funcional</label>
          <select id="traumatologia-impotenciaFuncional" className="soap-input" value={val('impotenciaFuncional')} onChange={e => up('impotenciaFuncional', e.target.value)}>
            <option value="">Seleccionar</option><option>No</option><option>Parcial</option><option>Total</option>
          </select>
        </div>
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Evaluación Neurovascular
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label htmlFor="traumatologia-pulsoDistales" className="soap-section-label">Pulsos distales</label>
          <input id="traumatologia-pulsoDistales" className="soap-input" value={val('pulsoDistales')} onChange={e => up('pulsoDistales', e.target.value)} placeholder="" />
        </div>
        <div>
          <label htmlFor="traumatologia-llenadoCapilar" className="soap-section-label">Llenado capilar</label>
          <select id="traumatologia-llenadoCapilar" className="soap-input" value={val('llenadoCapilar')} onChange={e => up('llenadoCapilar', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Normal (&lt;2 seg)</option>
            <option>Lento (2–4 seg)</option>
            <option>Muy lento (&gt;4 seg)</option>
          </select>
        </div>
        <div>
          <label htmlFor="traumatologia-sensibilidadDistal" className="soap-section-label">Sensibilidad distal</label>
          <select id="traumatologia-sensibilidadDistal" className="soap-input" value={val('sensibilidadDistal')} onChange={e => up('sensibilidadDistal', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Conservada</option>
            <option>Disminuida</option>
            <option>Ausente</option>
          </select>
        </div>
        <div>
          <label htmlFor="traumatologia-motilidadDistal" className="soap-section-label">Motilidad distal</label>
          <select id="traumatologia-motilidadDistal" className="soap-input" value={val('motilidadDistal')} onChange={e => up('motilidadDistal', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Conservada</option>
            <option>Limitada</option>
            <option>Ausente</option>
          </select>
        </div>
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Clasificación y Hallazgos Imagenológicos
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label htmlFor="traumatologia-tipoLesion" className="soap-section-label">Tipo de lesión</label>
          <select id="traumatologia-tipoLesion" className="soap-input" value={val('tipoLesion')} onChange={e => up('tipoLesion', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Fractura</option>
            <option>Luxación</option>
            <option>Fractura-luxación</option>
            <option>Esguince</option>
            <option>Rotura muscular / tendinosa</option>
            <option>Contusión</option>
            <option>Artrosis / degenerativo</option>
          </select>
        </div>
        <div>
          <label htmlFor="traumatologia-clasificacionAO" className="soap-section-label">Clasificación AO/ASIF (fractura, si aplica)</label>
          <input id="traumatologia-clasificacionAO" className="soap-input" value={val('clasificacionAO')} onChange={e => up('clasificacionAO', e.target.value)} placeholder="" />
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="traumatologia-hallazgosRx" className="soap-section-label">Hallazgos radiológicos</label>
        <textarea id="traumatologia-hallazgosRx" className="soap-input soap-textarea" style={{ minHeight: 60 }} value={val('hallazgosRx')} onChange={e => up('hallazgosRx', e.target.value)} placeholder="" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label htmlFor="traumatologia-compromisoNV" className="soap-section-label">Compromiso neurovascular</label>
          <select id="traumatologia-compromisoNV" className="soap-input" value={val('compromisoNV')} onChange={e => up('compromisoNV', e.target.value)}>
            <option value="">Seleccionar</option><option>No</option><option>Sí</option>
          </select>
        </div>
        <div>
          <label htmlFor="traumatologia-indicacionQuirurgica" className="soap-section-label">Indicación quirúrgica</label>
          <select id="traumatologia-indicacionQuirurgica" className="soap-input" value={val('indicacionQuirurgica')} onChange={e => up('indicacionQuirurgica', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>No requiere cirugía</option>
            <option>Manejo conservador con seguimiento</option>
            <option>Cirugía electiva</option>
            <option>Cirugía urgente</option>
          </select>
        </div>
      </div>

      <div className="soap-section-divider" />

      <div style={{ marginBottom: 14 }}>
        <label htmlFor="traumatologia-notasAdicionales" className="soap-section-label">Notas adicionales de Traumatología</label>
        <textarea id="traumatologia-notasAdicionales" className="soap-input soap-textarea" style={{ minHeight: 60 }} value={val('notasAdicionales')} onChange={e => up('notasAdicionales', e.target.value)} placeholder="" />
      </div>

      <div className="soap-nav-row" style={{ justifyContent: "flex-start", marginTop: 8 }}>
        <button className="soap-btn-secondary" onClick={onPrev}>← Volver al Plan</button>
      </div>
    </div>
  );
}
