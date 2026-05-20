import * as React from "react";
import type { EspecialidadData } from "../../types";

interface Props {
  data: EspecialidadData;
  setData: React.Dispatch<React.SetStateAction<EspecialidadData>>;
  onPrev: () => void;
}

export default function SectionReumatologia({ data, setData, onPrev }: Props) {
  const up = (k: string, v: string) => setData(prev => ({ ...prev, [k]: v }));
  const val = (k: string) => data[k] ?? '';

  return (
    <div className="soap-content-inner">

      {/* ANTECEDENTES */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Antecedentes Reumatológicos
      </p>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="reumatologia-enfermedadesAutoinmunes" className="soap-section-label">Enfermedades autoinmunes previas / diagnósticos previos</label>
        <input id="reumatologia-enfermedadesAutoinmunes" className="soap-input" value={val('enfermedadesAutoinmunes')} onChange={e => up('enfermedadesAutoinmunes', e.target.value)} placeholder="" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label htmlFor="reumatologia-antFamiliaresAutoinmune" className="soap-section-label">Antecedentes familiares autoinmunes</label>
          <input id="reumatologia-antFamiliaresAutoinmune" className="soap-input" value={val('antFamiliaresAutoinmune')} onChange={e => up('antFamiliaresAutoinmune', e.target.value)} placeholder="" />
        </div>
        <div>
          <label htmlFor="reumatologia-trombosis" className="soap-section-label">Trombosis previas</label>
          <input id="reumatologia-trombosis" className="soap-input" value={val('trombosis')} onChange={e => up('trombosis', e.target.value)} placeholder="" />
        </div>
      </div>

      <div className="soap-section-divider" />

      {/* SÍNTOMAS ARTICULARES */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Síntomas Articulares y Sistémicos
      </p>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="reumatologia-articulacionesAfectadas" className="soap-section-label">Articulaciones afectadas (distribución)</label>
        <textarea id="reumatologia-articulacionesAfectadas" className="soap-input soap-textarea" style={{ minHeight: 56 }} value={val('articulacionesAfectadas')} onChange={e => up('articulacionesAfectadas', e.target.value)} placeholder="" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label htmlFor="reumatologia-rigidezMatutina" className="soap-section-label">Rigidez matutina (duración en minutos)</label>
          <input id="reumatologia-rigidezMatutina" className="soap-input" type="number" min="0" value={val('rigidezMatutina')} onChange={e => up('rigidezMatutina', e.target.value)} placeholder="" />
        </div>
        <div>
          <label htmlFor="reumatologia-caracterDolor" className="soap-section-label">Carácter del dolor</label>
          <select id="reumatologia-caracterDolor" className="soap-input" value={val('caracterDolor')} onChange={e => up('caracterDolor', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Inflamatorio (mejora con movimiento/peor en reposo)</option>
            <option>Mecánico (peor con movimiento/mejora con reposo)</option>
            <option>Mixto</option>
          </select>
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="reumatologia-sintomasSistemicos" className="soap-section-label">Síntomas sistémicos</label>
        <input id="reumatologia-sintomasSistemicos" className="soap-input" value={val('sintomasSistemicos')} onChange={e => up('sintomasSistemicos', e.target.value)} placeholder="" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label htmlFor="reumatologia-raynaud" className="soap-section-label">Fenómeno de Raynaud</label>
          <select id="reumatologia-raynaud" className="soap-input" value={val('raynaud')} onChange={e => up('raynaud', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Ausente</option>
            <option>Presente - desencadenado por frío</option>
            <option>Presente - espontáneo</option>
          </select>
        </div>
        <div>
          <label className="soap-section-label">Sequedad ojos/boca (Sjögren)</label>
          <select className="soap-input" value={val('sjögren')} onChange={e => up('sjögren', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>No</option>
            <option>Sí - ojos secos</option>
            <option>Sí - boca seca</option>
            <option>Sí - ambos</option>
          </select>
        </div>
        <div>
          <label htmlFor="reumatologia-ulcerasOrales" className="soap-section-label">Úlceras orales</label>
          <select id="reumatologia-ulcerasOrales" className="soap-input" value={val('ulcerasOrales')} onChange={e => up('ulcerasOrales', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>No</option>
            <option>Sí - ocasionales</option>
            <option>Sí - recurrentes</option>
          </select>
        </div>
        <div>
          <label htmlFor="reumatologia-rashCutaneo" className="soap-section-label">Rash cutáneo</label>
          <input id="reumatologia-rashCutaneo" className="soap-input" value={val('rashCutaneo')} onChange={e => up('rashCutaneo', e.target.value)} placeholder="" />
        </div>
      </div>

      <div className="soap-section-divider" />

      {/* EVALUACIÓN ARTICULAR */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Evaluación Articular Detallada
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label htmlFor="reumatologia-articulacionesDolorosas" className="soap-section-label">Nº articulaciones dolorosas (28 joint count)</label>
          <input id="reumatologia-articulacionesDolorosas" className="soap-input" type="number" min="0" max="28" value={val('articulacionesDolorosas')} onChange={e => up('articulacionesDolorosas', e.target.value)} placeholder="" />
        </div>
        <div>
          <label htmlFor="reumatologia-articulacionesInflamadas" className="soap-section-label">Nº articulaciones inflamadas (28 joint count)</label>
          <input id="reumatologia-articulacionesInflamadas" className="soap-input" type="number" min="0" max="28" value={val('articulacionesInflamadas')} onChange={e => up('articulacionesInflamadas', e.target.value)} placeholder="" />
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="reumatologia-examenArticular" className="soap-section-label">Descripción del examen articular</label>
        <textarea id="reumatologia-examenArticular" className="soap-input soap-textarea" style={{ minHeight: 60 }} value={val('examenArticular')} onChange={e => up('examenArticular', e.target.value)} placeholder="" />
      </div>

      <div className="soap-section-divider" />

      {/* LABORATORIO */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Resultados de Laboratorio Reumatológico
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label htmlFor="reumatologia-factorReumatoide" className="soap-section-label">Factor Reumatoide (FR)</label>
          <input id="reumatologia-factorReumatoide" className="soap-input" value={val('factorReumatoide')} onChange={e => up('factorReumatoide', e.target.value)} placeholder="" />
        </div>
        <div>
          <label htmlFor="reumatologia-antiCcp" className="soap-section-label">Anti-CCP (ACPA)</label>
          <input id="reumatologia-antiCcp" className="soap-input" value={val('antiCcp')} onChange={e => up('antiCcp', e.target.value)} placeholder="" />
        </div>
        <div>
          <label htmlFor="reumatologia-pcrVsg" className="soap-section-label">PCR / VSG</label>
          <input id="reumatologia-pcrVsg" className="soap-input" value={val('pcrVsg')} onChange={e => up('pcrVsg', e.target.value)} placeholder="" />
        </div>
        <div>
          <label htmlFor="reumatologia-ana" className="soap-section-label">ANA (FAN)</label>
          <input id="reumatologia-ana" className="soap-input" value={val('ana')} onChange={e => up('ana', e.target.value)} placeholder="" />
        </div>
        <div>
          <label htmlFor="reumatologia-complemento" className="soap-section-label">Complemento C3/C4</label>
          <input id="reumatologia-complemento" className="soap-input" value={val('complemento')} onChange={e => up('complemento', e.target.value)} placeholder="" />
        </div>
        <div>
          <label htmlFor="reumatologia-hlaB27" className="soap-section-label">HLA-B27</label>
          <select id="reumatologia-hlaB27" className="soap-input" value={val('hlaB27')} onChange={e => up('hlaB27', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Positivo</option>
            <option>Negativo</option>
            <option>No solicitado</option>
          </select>
        </div>
      </div>

      <div className="soap-section-divider" />

      <div style={{ marginBottom: 14 }}>
        <label htmlFor="reumatologia-notasAdicionales" className="soap-section-label">Notas adicionales de Reumatología</label>
        <textarea id="reumatologia-notasAdicionales" className="soap-input soap-textarea" style={{ minHeight: 60 }} value={val('notasAdicionales')} onChange={e => up('notasAdicionales', e.target.value)} placeholder="" />
      </div>

      <div className="soap-nav-row" style={{ justifyContent: "flex-start", marginTop: 8 }}>
        <button className="soap-btn-secondary" onClick={onPrev}>← Volver al Plan</button>
      </div>
    </div>
  );
}
