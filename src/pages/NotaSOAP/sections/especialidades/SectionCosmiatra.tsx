import * as React from "react";
import type { EspecialidadData } from "../../types";

interface Props {
  data: EspecialidadData;
  setData: React.Dispatch<React.SetStateAction<EspecialidadData>>;
  onPrev: () => void;
}

export default function SectionCosmiatra({ data, setData, onPrev }: Props) {
  const up = (k: string, v: string) => setData(prev => ({ ...prev, [k]: v }));
  const val = (k: string) => data[k] ?? '';

  return (
    <div className="soap-content-inner">

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Motivo de Consulta Cosmética
      </p>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="cosmiatra-areaInteres" className="soap-section-label">Área(s) de interés del paciente</label>
        <input id="cosmiatra-areaInteres" className="soap-input" value={val('areaInteres')} onChange={e => up('areaInteres', e.target.value)} placeholder="Rostro, cuello, abdomen, piernas, manos, espalda…" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="cosmiatra-objetivoEstetico" className="soap-section-label">Objetivo estético</label>
        <input id="cosmiatra-objetivoEstetico" className="soap-input" value={val('objetivoEstetico')} onChange={e => up('objetivoEstetico', e.target.value)} placeholder="Rejuvenecimiento, hidratación, manchas, arrugas, flacidez, celulitis, cicatrices…" />
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Antecedentes Dermatológicos y Cosméticos
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label htmlFor="cosmiatra-patologiaDerm" className="soap-section-label">Patología dermatológica previa</label>
          <input id="cosmiatra-patologiaDerm" className="soap-input" value={val('patologiaDerm')} onChange={e => up('patologiaDerm', e.target.value)} placeholder="Acné, rosácea, vitiligo, psoriasis, dermatitis atópica…" />
        </div>
        <div>
          <label htmlFor="cosmiatra-tratamientosPrevios" className="soap-section-label">Tratamientos estéticos previos</label>
          <input id="cosmiatra-tratamientosPrevios" className="soap-input" value={val('tratamientosPrevios')} onChange={e => up('tratamientosPrevios', e.target.value)} placeholder="Peeling, toxina botulínica, rellenos, láser, mesoterapia, IPL…" />
        </div>
        <div>
          <label htmlFor="cosmiatra-reaccionesAdversas" className="soap-section-label">Reacciones adversas previas</label>
          <select id="cosmiatra-reaccionesAdversas" className="soap-input" value={val('reaccionesAdversas')} onChange={e => up('reaccionesAdversas', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Ninguna conocida</option>
            <option>Hiperpigmentación postinflamatoria</option>
            <option>Cicatriz queloide</option>
            <option>Reacción alérgica a producto cosmético</option>
            <option>Granuloma por relleno</option>
            <option>Otra</option>
          </select>
        </div>
        <div>
          <label htmlFor="cosmiatra-fototipo" className="soap-section-label">Fototipo de Fitzpatrick</label>
          <select id="cosmiatra-fototipo" className="soap-input" value={val('fototipo')} onChange={e => up('fototipo', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>I - Muy claro, siempre se quema</option>
            <option>II - Claro, casi siempre se quema</option>
            <option>III - Intermedio, a veces se quema</option>
            <option>IV - Moreno claro, raramente se quema</option>
            <option>V - Moreno oscuro, nunca se quema</option>
            <option>VI - Negro, nunca se quema</option>
          </select>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label htmlFor="cosmiatra-alergiasCosmeticos" className="soap-section-label">Alergias a cosméticos o medicamentos tópicos</label>
          <input id="cosmiatra-alergiasCosmeticos" className="soap-input" value={val('alergiasCosmeticos')} onChange={e => up('alergiasCosmeticos', e.target.value)} placeholder="Parabenos, fragancias, ácido retinoico, hidroquinona…" />
        </div>
        <div>
          <label htmlFor="cosmiatra-medicamentosSistemicos" className="soap-section-label">Uso de medicamentos sistémicos de interés</label>
          <input id="cosmiatra-medicamentosSistemicos" className="soap-input" value={val('medicamentosSistemicos')} onChange={e => up('medicamentosSistemicos', e.target.value)} placeholder="Retinoides orales, anticoagulantes, antiagregantes, corticoides…" />
        </div>
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Evaluación de la Piel
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label htmlFor="cosmiatra-tipoPiel" className="soap-section-label">Tipo de piel</label>
          <select id="cosmiatra-tipoPiel" className="soap-input" value={val('tipoPiel')} onChange={e => up('tipoPiel', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Normal</option>
            <option>Seca</option>
            <option>Grasa</option>
            <option>Mixta</option>
            <option>Sensible</option>
          </select>
        </div>
        <div>
          <label htmlFor="cosmiatra-hidratacionCutanea" className="soap-section-label">Hidratación cutánea</label>
          <select id="cosmiatra-hidratacionCutanea" className="soap-input" value={val('hidratacionCutanea')} onChange={e => up('hidratacionCutanea', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Adecuada</option>
            <option>Disminuida</option>
            <option>Muy disminuida - descamación</option>
          </select>
        </div>
        <div>
          <label htmlFor="cosmiatra-tonoManchas" className="soap-section-label">Tono y manchas</label>
          <select id="cosmiatra-tonoManchas" className="soap-input" value={val('tonoManchas')} onChange={e => up('tonoManchas', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Homogéneo</option>
            <option>Lentigos solares leves</option>
            <option>Melasma</option>
            <option>Hiperpigmentación posinflamatoria</option>
            <option>Hipopigmentación / vitiligo</option>
            <option>Manchas múltiples / mixto</option>
          </select>
        </div>
        <div>
          <label htmlFor="cosmiatra-arrugas" className="soap-section-label">Arrugas (clasificación)</label>
          <select id="cosmiatra-arrugas" className="soap-input" value={val('arrugas')} onChange={e => up('arrugas', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Ausentes</option>
            <option>Finas - expresión dinámica</option>
            <option>Moderadas - estáticas leves</option>
            <option>Profundas - estáticas marcadas</option>
          </select>
        </div>
        <div>
          <label htmlFor="cosmiatra-flacidez" className="soap-section-label">Flacidez cutánea</label>
          <select id="cosmiatra-flacidez" className="soap-input" value={val('flacidez')} onChange={e => up('flacidez', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Ausente</option>
            <option>Grado I - leve</option>
            <option>Grado II - moderada</option>
            <option>Grado III - severa</option>
          </select>
        </div>
        <div>
          <label htmlFor="cosmiatra-acneActivo" className="soap-section-label">Acné activo</label>
          <select id="cosmiatra-acneActivo" className="soap-input" value={val('acneActivo')} onChange={e => up('acneActivo', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>No</option>
            <option>Comedones - grado I</option>
            <option>Pápulas/pústulas - grado II</option>
            <option>Nódulos - grado III</option>
            <option>Quístico - grado IV</option>
          </select>
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="cosmiatra-celulitis" className="soap-section-label">Celulitis (localización y grado)</label>
        <input id="cosmiatra-celulitis" className="soap-input" value={val('celulitis')} onChange={e => up('celulitis', e.target.value)} placeholder="Grado I–IV según clasificación de Nürnberger-Müller, zona afectada…" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="cosmiatra-lesionesRelevantes" className="soap-section-label">Lesiones relevantes observadas</label>
        <textarea id="cosmiatra-lesionesRelevantes" className="soap-input soap-textarea" style={{ minHeight: 56 }} value={val('lesionesRelevantes')} onChange={e => up('lesionesRelevantes', e.target.value)} placeholder="Describir lesiones elementales: máculas, pápulas, cicatrices, queloides, telangiectasias, angiomas, nevos…" />
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Plan de Tratamiento Cosmético
      </p>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="cosmiatra-procedimientosIndicados" className="soap-section-label">Procedimiento(s) indicado(s)</label>
        <textarea id="cosmiatra-procedimientosIndicados" className="soap-input soap-textarea" style={{ minHeight: 56 }} value={val('procedimientosIndicados')} onChange={e => up('procedimientosIndicados', e.target.value)} placeholder="Peeling químico (TCA 15%, glicólico 30%), toxina botulínica (unidades, zona), relleno (ácido hialurónico), mesoterapia, radiofrecuencia, láser IPL…" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label htmlFor="cosmiatra-numSesiones" className="soap-section-label">Número de sesiones previstas</label>
          <input id="cosmiatra-numSesiones" className="soap-input" value={val('numSesiones')} onChange={e => up('numSesiones', e.target.value)} placeholder="Ej: 6 sesiones mensuales" />
        </div>
        <div>
          <label htmlFor="cosmiatra-contraindicaciones" className="soap-section-label">Contraindicaciones identificadas</label>
          <input id="cosmiatra-contraindicaciones" className="soap-input" value={val('contraindicaciones')} onChange={e => up('contraindicaciones', e.target.value)} placeholder="Embarazo, lactancia, infección activa, herpes labial activo, isotretinoína <6m…" />
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="cosmiatra-cuidadosCasa" className="soap-section-label">Cuidados en casa indicados</label>
        <textarea id="cosmiatra-cuidadosCasa" className="soap-input soap-textarea" style={{ minHeight: 56 }} value={val('cuidadosCasa')} onChange={e => up('cuidadosCasa', e.target.value)} placeholder="Fotoprotección diaria SPF ≥50, hidratante, ácido retinoico nocturno, vitamina C, evitar sol post procedimiento…" />
      </div>

      <div className="soap-section-divider" />

      <div style={{ marginBottom: 14 }}>
        <label htmlFor="cosmiatra-notasAdicionales" className="soap-section-label">Notas adicionales de Cosmiatría</label>
        <textarea id="cosmiatra-notasAdicionales" className="soap-input soap-textarea" style={{ minHeight: 60 }} value={val('notasAdicionales')} onChange={e => up('notasAdicionales', e.target.value)} placeholder="Consentimiento informado, fotografías clínicas, próxima sesión, derivación a dermatología…" />
      </div>

      <div className="soap-nav-row" style={{ justifyContent: "flex-start", marginTop: 8 }}>
        <button className="soap-btn-secondary" onClick={onPrev}>← Volver al Plan</button>
      </div>
    </div>
  );
}
