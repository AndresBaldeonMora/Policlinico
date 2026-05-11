import * as React from "react";
import type { EspecialidadData } from "../../types";

interface Props {
  data: EspecialidadData;
  setData: React.Dispatch<React.SetStateAction<EspecialidadData>>;
  onPrev: () => void;
}

export default function SectionNeumologia({ data, setData, onPrev }: Props) {
  const up = (k: string, v: string) => setData(prev => ({ ...prev, [k]: v }));
  const val = (k: string) => data[k] ?? '';

  return (
    <div className="soap-content-inner">

      {/* ANTECEDENTES RESPIRATORIOS */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Antecedentes Respiratorios
      </p>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Patología respiratoria previa</label>
        <input className="soap-input" value={val('patologiaRespiratoria')} onChange={e => up('patologiaRespiratoria', e.target.value)} placeholder="Asma, EPOC, TBC, COVID-19, neumonía, bronquiectasias…" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Alergias respiratorias</label>
        <input className="soap-input" value={val('alergiasRespiratorias')} onChange={e => up('alergiasRespiratorias', e.target.value)} placeholder="Polvo, pólenes, ácaros, mascotas, hongos…" />
      </div>

      <div className="soap-section-divider" />

      {/* EXPOSICIÓN */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Exposición y Hábitos
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">Tabaquismo</label>
          <select className="soap-input" value={val('tabaquismo')} onChange={e => up('tabaquismo', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>No fumador</option>
            <option>Ex-fumador</option>
            <option>Fumador activo</option>
          </select>
        </div>
        <div>
          <label className="soap-section-label">Paquetes/año</label>
          <input className="soap-input" value={val('paquetesAno')} onChange={e => up('paquetesAno', e.target.value)} placeholder="Ej: 20" />
        </div>
        <div>
          <label className="soap-section-label">Años de fumador / cese</label>
          <input className="soap-input" value={val('anosFumador')} onChange={e => up('anosFumador', e.target.value)} placeholder="Ej: 15 años / cesó hace 2 años" />
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Exposición ocupacional / doméstica</label>
        <input className="soap-input" value={val('exposicionOcupacional')} onChange={e => up('exposicionOcupacional', e.target.value)} placeholder="Polvo, gases, vapores, humo de biomasa (leña/carbón), asbesto…" />
      </div>

      <div className="soap-section-divider" />

      {/* SÍNTOMAS RESPIRATORIOS */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Síntomas Respiratorios Actuales
      </p>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Tos (características)</label>
        <input className="soap-input" value={val('tosCaracteristicas')} onChange={e => up('tosCaracteristicas', e.target.value)} placeholder="Seca / productiva / hemoptoica / duración / horario…" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">Expectoración (características)</label>
          <input className="soap-input" value={val('expectoracion')} onChange={e => up('expectoracion', e.target.value)} placeholder="Mucosa, purulenta, hemoptoica, cantidad…" />
        </div>
        <div>
          <label className="soap-section-label">Hemoptisis</label>
          <select className="soap-input" value={val('hemoptisis')} onChange={e => up('hemoptisis', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Ausente</option>
            <option>Hemoptisis leve (esputo hemoptoico)</option>
            <option>Hemoptisis moderada</option>
            <option>Hemoptisis masiva</option>
          </select>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">Disnea</label>
          <select className="soap-input" value={val('disnea')} onChange={e => up('disnea', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Ausente</option>
            <option>Escala MRC 1 — grandes esfuerzos</option>
            <option>Escala MRC 2 — cuesta o escaleras</option>
            <option>Escala MRC 3 — caminar en plano (&lt; coetáneos)</option>
            <option>Escala MRC 4 — caminar 100m debe parar</option>
            <option>Escala MRC 5 — de reposo / al vestirse</option>
          </select>
        </div>
        <div>
          <label className="soap-section-label">Sibilancias</label>
          <select className="soap-input" value={val('sibilancias')} onChange={e => up('sibilancias', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Ausentes</option>
            <option>Ocasionales (con esfuerzo o noche)</option>
            <option>Frecuentes (diurnas y nocturnas)</option>
            <option>Continuas</option>
          </select>
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Dolor torácico pleurítico</label>
        <input className="soap-input" value={val('dolorTorPleuritico')} onChange={e => up('dolorTorPleuritico', e.target.value)} placeholder="Localización, carácter, relación con la respiración…" />
      </div>

      <div className="soap-section-divider" />

      {/* EXAMEN RESPIRATORIO */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Examen Respiratorio
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">Patrón respiratorio</label>
          <select className="soap-input" value={val('patronRespiratorio')} onChange={e => up('patronRespiratorio', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Normal (eupnea)</option>
            <option>Taquipnea</option>
            <option>Bradipnea</option>
            <option>Cheyne-Stokes</option>
            <option>Kussmaul</option>
            <option>Biot</option>
          </select>
        </div>
        <div>
          <label className="soap-section-label">Simetría de la expansión</label>
          <select className="soap-input" value={val('simetriaExpansion')} onChange={e => up('simetriaExpansion', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Simétrica</option>
            <option>Asimétrica — derecha disminuida</option>
            <option>Asimétrica — izquierda disminuida</option>
          </select>
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Auscultación pulmonar</label>
        <textarea className="soap-input soap-textarea" style={{ minHeight: 60 }} value={val('auscultacionPulmonar')} onChange={e => up('auscultacionPulmonar', e.target.value)} placeholder="MV conservado/disminuido, estertores (localizados/difusos, crepitantes/subcrepitantes), sibilancias, roncus, frote pleural…" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">Uso de músculos accesorios</label>
          <select className="soap-input" value={val('musculosAccesorios')} onChange={e => up('musculosAccesorios', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Ausente</option>
            <option>Presente</option>
          </select>
        </div>
        <div>
          <label className="soap-section-label">Cianosis</label>
          <select className="soap-input" value={val('cianosis')} onChange={e => up('cianosis', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Ausente</option>
            <option>Periférica</option>
            <option>Central</option>
          </select>
        </div>
      </div>

      <div className="soap-section-divider" />

      {/* ESPIROMETRÍA */}
      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Espirometría / Función Pulmonar
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">FEV1 (% predicho)</label>
          <input className="soap-input" value={val('fev1')} onChange={e => up('fev1', e.target.value)} placeholder="Ej: 65%" />
        </div>
        <div>
          <label className="soap-section-label">FVC (% predicho)</label>
          <input className="soap-input" value={val('fvc')} onChange={e => up('fvc', e.target.value)} placeholder="Ej: 80%" />
        </div>
        <div>
          <label className="soap-section-label">FEV1/FVC (cociente)</label>
          <input className="soap-input" value={val('fev1Fvc')} onChange={e => up('fev1Fvc', e.target.value)} placeholder="Ej: 0.65" />
        </div>
        <div>
          <label className="soap-section-label">Clasificación GOLD (EPOC)</label>
          <select className="soap-input" value={val('goldEpoc')} onChange={e => up('goldEpoc', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>No aplica</option>
            <option>GOLD 1 — Leve (FEV1 ≥80%)</option>
            <option>GOLD 2 — Moderado (FEV1 50–79%)</option>
            <option>GOLD 3 — Grave (FEV1 30–49%)</option>
            <option>GOLD 4 — Muy grave (FEV1 &lt;30%)</option>
          </select>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">SatO2 basal (%)</label>
          <input className="soap-input" value={val('satO2Basal')} onChange={e => up('satO2Basal', e.target.value)} placeholder="Ej: 95" />
        </div>
        <div>
          <label className="soap-section-label">SatO2 con esfuerzo (%)</label>
          <input className="soap-input" value={val('satO2Esfuerzo')} onChange={e => up('satO2Esfuerzo', e.target.value)} placeholder="Ej: 88" />
        </div>
      </div>

      <div className="soap-section-divider" />

      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Notas adicionales de Neumología</label>
        <textarea className="soap-input soap-textarea" style={{ minHeight: 60 }} value={val('notasAdicionales')} onChange={e => up('notasAdicionales', e.target.value)} placeholder="Observaciones clínicas adicionales, radiografía, TC tórax…" />
      </div>

      <div className="soap-nav-row" style={{ justifyContent: "flex-start", marginTop: 8 }}>
        <button className="soap-btn-secondary" onClick={onPrev}>← Volver al Plan</button>
      </div>
    </div>
  );
}
