import * as React from "react";
import type { EspecialidadData } from "../../types";

interface Props {
  data: EspecialidadData;
  setData: React.Dispatch<React.SetStateAction<EspecialidadData>>;
  onPrev: () => void;
}

export default function SectionOtorrino({ data, setData, onPrev }: Props) {
  const up = (k: string, v: string) => setData(prev => ({ ...prev, [k]: v }));
  const val = (k: string) => data[k] ?? '';

  return (
    <div className="soap-content-inner">

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Antecedentes ORL
      </p>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Patología ORL previa</label>
        <input className="soap-input" value={val('antORL')} onChange={e => up('antORL', e.target.value)} placeholder="Otitis crónica, sinusitis, desviación septal, pólipos, apnea del sueño, cirugías ORL…" />
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Síntomas Óticos
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">Otalgia</label>
          <input className="soap-input" value={val('otalgia')} onChange={e => up('otalgia', e.target.value)} placeholder="Localización, carácter, intensidad 0–10…" />
        </div>
        <div>
          <label className="soap-section-label">Otorrea</label>
          <input className="soap-input" value={val('otorrea')} onChange={e => up('otorrea', e.target.value)} placeholder="Cantidad, aspecto, olor, oído afectado…" />
        </div>
        <div>
          <label className="soap-section-label">Hipoacusia</label>
          <select className="soap-input" value={val('hipoacusia')} onChange={e => up('hipoacusia', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>No</option>
            <option>Unilateral derecha</option>
            <option>Unilateral izquierda</option>
            <option>Bilateral</option>
            <option>Progresiva</option>
            <option>Súbita</option>
          </select>
        </div>
        <div>
          <label className="soap-section-label">Tinnitus (acúfeno)</label>
          <input className="soap-input" value={val('tinnitus')} onChange={e => up('tinnitus', e.target.value)} placeholder="Continuo/intermitente, pitido/zumbido, oído, intensidad…" />
        </div>
        <div>
          <label className="soap-section-label">Vértigo</label>
          <select className="soap-input" value={val('vertigo')} onChange={e => up('vertigo', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>No</option>
            <option>VPPB (posicional, segundos)</option>
            <option>Enfermedad de Ménière (minutos–horas)</option>
            <option>Neuronitis vestibular (días)</option>
            <option>Origen central (sospecha)</option>
          </select>
        </div>
        <div>
          <label className="soap-section-label">Plenitud ótica</label>
          <select className="soap-input" value={val('plenitudOtica')} onChange={e => up('plenitudOtica', e.target.value)}>
            <option value="">Seleccionar</option><option>No</option><option>Sí - derecho</option><option>Sí - izquierdo</option><option>Sí - bilateral</option>
          </select>
        </div>
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Síntomas Nasales
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">Obstrucción nasal</label>
          <select className="soap-input" value={val('obstruccionNasal')} onChange={e => up('obstruccionNasal', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Ausente</option>
            <option>Unilateral derecha</option>
            <option>Unilateral izquierda</option>
            <option>Bilateral</option>
            <option>Alternante</option>
          </select>
        </div>
        <div>
          <label className="soap-section-label">Rinorrea</label>
          <input className="soap-input" value={val('rinorrea')} onChange={e => up('rinorrea', e.target.value)} placeholder="Anterior/posterior, serosa/mucopurulenta…" />
        </div>
        <div>
          <label className="soap-section-label">Epistaxis</label>
          <select className="soap-input" value={val('epistaxis')} onChange={e => up('epistaxis', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>No</option>
            <option>Esporádica - leve</option>
            <option>Frecuente - moderada</option>
            <option>Severa / hospitalización previa</option>
          </select>
        </div>
        <div>
          <label className="soap-section-label">Alteración del olfato (anosmia/hiposmia)</label>
          <select className="soap-input" value={val('olfato')} onChange={e => up('olfato', e.target.value)}>
            <option value="">Seleccionar</option><option>Normal</option><option>Hiposmia</option><option>Anosmia</option>
          </select>
        </div>
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Síntomas Faringolaríngeos
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">Dolor de garganta</label>
          <input className="soap-input" value={val('dolorGarganta')} onChange={e => up('dolorGarganta', e.target.value)} placeholder="Duración, intensidad, recurrencia…" />
        </div>
        <div>
          <label className="soap-section-label">Disfonía / Ronquera</label>
          <input className="soap-input" value={val('disfonia')} onChange={e => up('disfonia', e.target.value)} placeholder="Duración, carácter, progresiva/estable…" />
        </div>
        <div>
          <label className="soap-section-label">Disfagia</label>
          <select className="soap-input" value={val('disfagia')} onChange={e => up('disfagia', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>No</option>
            <option>A sólidos</option>
            <option>A líquidos</option>
            <option>A ambos</option>
          </select>
        </div>
        <div>
          <label className="soap-section-label">Ronquidos / Apnea del sueño</label>
          <select className="soap-input" value={val('ronquidos')} onChange={e => up('ronquidos', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>No</option>
            <option>Ronquidos sin apnea</option>
            <option>Ronquidos + pausas respiratorias observadas</option>
            <option>SAHOS confirmado</option>
          </select>
        </div>
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Exploración ORL
      </p>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Otoscopia (OD)</label>
        <input className="soap-input" value={val('otoscopiaOD')} onChange={e => up('otoscopiaOD', e.target.value)} placeholder="CAE permeable, MT íntegra/perforada/retráctil, color, cono de luz…" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Otoscopia (OI)</label>
        <input className="soap-input" value={val('otoscopiaOI')} onChange={e => up('otoscopiaOI', e.target.value)} placeholder="CAE permeable, MT íntegra/perforada/retráctil, color, cono de luz…" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">Prueba de Weber</label>
          <select className="soap-input" value={val('weber')} onChange={e => up('weber', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Centrado (normal)</option>
            <option>Lateralizado a la derecha</option>
            <option>Lateralizado a la izquierda</option>
          </select>
        </div>
        <div>
          <label className="soap-section-label">Prueba de Rinne (OD / OI)</label>
          <input className="soap-input" value={val('rinne')} onChange={e => up('rinne', e.target.value)} placeholder="OD: positivo / OI: negativo" />
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Rinoscopia anterior</label>
        <textarea className="soap-input soap-textarea" style={{ minHeight: 56 }} value={val('rinoscopiaAnterior')} onChange={e => up('rinoscopiaAnterior', e.target.value)} placeholder="Tabique: centrado/desviado (lado), cornetes: normales/hipertróficos, mucosa: normal/edematosa, pólipos, secreciones…" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Orofaringe</label>
        <textarea className="soap-input soap-textarea" style={{ minHeight: 56 }} value={val('orofaringe')} onChange={e => up('orofaringe', e.target.value)} placeholder="Tonsilas (tamaño I–IV, exudado), úvula, pared posterior, laringe (si visualizable)…" />
      </div>

      <div className="soap-section-divider" />

      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Notas adicionales de Otorrinolaringología</label>
        <textarea className="soap-input soap-textarea" style={{ minHeight: 60 }} value={val('notasAdicionales')} onChange={e => up('notasAdicionales', e.target.value)} placeholder="Audiometría (resultados), STOP-BANG score, nasofibroscopia, TC senos paranasales…" />
      </div>

      <div className="soap-nav-row" style={{ justifyContent: "flex-start", marginTop: 8 }}>
        <button className="soap-btn-secondary" onClick={onPrev}>← Volver al Plan</button>
      </div>
    </div>
  );
}
