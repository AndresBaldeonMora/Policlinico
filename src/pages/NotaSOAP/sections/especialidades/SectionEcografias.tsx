import * as React from "react";
import type { EspecialidadData } from "../../types";

interface Props {
  data: EspecialidadData;
  setData: React.Dispatch<React.SetStateAction<EspecialidadData>>;
  onPrev: () => void;
}

export default function SectionEcografias({ data, setData, onPrev }: Props) {
  const up = (k: string, v: string) => setData(prev => ({ ...prev, [k]: v }));
  const val = (k: string) => data[k] ?? '';

  return (
    <div className="soap-content-inner">

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Indicación del Estudio
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label htmlFor="ecografias-tipoEcografia" className="soap-section-label">Tipo de ecografía</label>
          <select id="ecografias-tipoEcografia" className="soap-input" value={val('tipoEcografia')} onChange={e => up('tipoEcografia', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Abdominal completa</option>
            <option>Pélvica</option>
            <option>Obstétrica (1er trimestre)</option>
            <option>Obstétrica (2do trimestre)</option>
            <option>Obstétrica (3er trimestre)</option>
            <option>Mama</option>
            <option>Tiroidea</option>
            <option>Renal</option>
            <option>Testicular</option>
            <option>Partes blandas</option>
            <option>Doppler vascular</option>
            <option>Cardíaca (ecocardiograma)</option>
          </select>
        </div>
        <div>
          <label htmlFor="ecografias-indicacion" className="soap-section-label">Indicación clínica</label>
          <input id="ecografias-indicacion" className="soap-input" value={val('indicacion')} onChange={e => up('indicacion', e.target.value)} placeholder="" />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label htmlFor="ecografias-tecnica" className="soap-section-label">Técnica</label>
          <select id="ecografias-tecnica" className="soap-input" value={val('tecnica')} onChange={e => up('tecnica', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>2D convencional</option>
            <option>2D + Doppler color</option>
            <option>3D/4D</option>
            <option>Endovaginal</option>
            <option>Endorrectal</option>
          </select>
        </div>
        <div>
          <label htmlFor="ecografias-ventanaAcustica" className="soap-section-label">Ventana acústica</label>
          <select id="ecografias-ventanaAcustica" className="soap-input" value={val('ventanaAcustica')} onChange={e => up('ventanaAcustica', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Adecuada</option>
            <option>Limitada (obesidad / gas)</option>
            <option>Mala - estudio limitado</option>
          </select>
        </div>
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Hallazgos por Órgano
      </p>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="ecografias-hallazgosPrincipales" className="soap-section-label">Hallazgos principales</label>
        <textarea id="ecografias-hallazgosPrincipales" className="soap-input soap-textarea" style={{ minHeight: 100 }} value={val('hallazgosPrincipales')} onChange={e => up('hallazgosPrincipales', e.target.value)} placeholder="" />
      </div>

      {/* SECCIÓN OBSTÉTRICA */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10, marginTop: 4 }}>
        Biometría Fetal (si obstétrica)
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
        <div>
          <label htmlFor="ecografias-dbp" className="soap-section-label">DBP (mm)</label>
          <input id="ecografias-dbp" className="soap-input" value={val('dbp')} onChange={e => up('dbp', e.target.value)} placeholder="" />
        </div>
        <div>
          <label htmlFor="ecografias-pc" className="soap-section-label">PC (mm)</label>
          <input id="ecografias-pc" className="soap-input" value={val('pc')} onChange={e => up('pc', e.target.value)} placeholder="" />
        </div>
        <div>
          <label htmlFor="ecografias-lf" className="soap-section-label">LF (mm)</label>
          <input id="ecografias-lf" className="soap-input" value={val('lf')} onChange={e => up('lf', e.target.value)} placeholder="" />
        </div>
        <div>
          <label htmlFor="ecografias-egBiometria" className="soap-section-label">EG por biometría (semanas)</label>
          <input id="ecografias-egBiometria" className="soap-input" value={val('egBiometria')} onChange={e => up('egBiometria', e.target.value)} placeholder="" />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label htmlFor="ecografias-fcf" className="soap-section-label">FCF (lpm)</label>
          <input id="ecografias-fcf" className="soap-input" value={val('fcf')} onChange={e => up('fcf', e.target.value)} placeholder="" />
        </div>
        <div>
          <label htmlFor="ecografias-ila" className="soap-section-label">Líquido amniótico (ILA cm)</label>
          <input id="ecografias-ila" className="soap-input" value={val('ila')} onChange={e => up('ila', e.target.value)} placeholder="" />
        </div>
        <div>
          <label htmlFor="ecografias-placenta" className="soap-section-label">Placenta (localización)</label>
          <input id="ecografias-placenta" className="soap-input" value={val('placenta')} onChange={e => up('placenta', e.target.value)} placeholder="" />
        </div>
      </div>

      {/* MAMA - BIRADS */}
      <div className="soap-section-divider" />
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Evaluación de Mama (si aplica)
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label htmlFor="ecografias-biradsD" className="soap-section-label">BI-RADS (mama derecha)</label>
          <select id="ecografias-biradsD" className="soap-input" value={val('biradsD')} onChange={e => up('biradsD', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>1 - Negativo</option>
            <option>2 - Benigno</option>
            <option>3 - Probablemente benigno</option>
            <option>4A - Baja sospecha</option>
            <option>4B - Sospecha moderada</option>
            <option>4C - Alta sospecha</option>
            <option>5 - Altamente maligno</option>
            <option>6 - Maligno confirmado</option>
          </select>
        </div>
        <div>
          <label htmlFor="ecografias-biradsI" className="soap-section-label">BI-RADS (mama izquierda)</label>
          <select id="ecografias-biradsI" className="soap-input" value={val('biradsI')} onChange={e => up('biradsI', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>1 - Negativo</option>
            <option>2 - Benigno</option>
            <option>3 - Probablemente benigno</option>
            <option>4A - Baja sospecha</option>
            <option>4B - Sospecha moderada</option>
            <option>4C - Alta sospecha</option>
            <option>5 - Altamente maligno</option>
            <option>6 - Maligno confirmado</option>
          </select>
        </div>
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Impresión Ecográfica
      </p>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="ecografias-diagnosticoEcografico" className="soap-section-label">Diagnóstico ecográfico</label>
        <textarea id="ecografias-diagnosticoEcografico" className="soap-input soap-textarea" style={{ minHeight: 60 }} value={val('diagnosticoEcografico')} onChange={e => up('diagnosticoEcografico', e.target.value)} placeholder="" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="ecografias-recomendaciones" className="soap-section-label">Recomendaciones</label>
        <input id="ecografias-recomendaciones" className="soap-input" value={val('recomendaciones')} onChange={e => up('recomendaciones', e.target.value)} placeholder="" />
      </div>

      <div className="soap-section-divider" />

      <div style={{ marginBottom: 14 }}>
        <label htmlFor="ecografias-notasAdicionales" className="soap-section-label">Notas adicionales de Ecografía</label>
        <textarea id="ecografias-notasAdicionales" className="soap-input soap-textarea" style={{ minHeight: 60 }} value={val('notasAdicionales')} onChange={e => up('notasAdicionales', e.target.value)} placeholder="" />
      </div>

      <div className="soap-nav-row" style={{ justifyContent: "flex-start", marginTop: 8 }}>
        <button className="soap-btn-secondary" onClick={onPrev}>← Volver al Plan</button>
      </div>
    </div>
  );
}
