import type { EspecialidadData } from "../../types";

interface Props {
  data: EspecialidadData;
  setData: (d: EspecialidadData) => void;
  onPrev: () => void;
}

export default function SectionCosmiatra({ data, setData, onPrev }: Props) {
  const up = (k: string, v: string) => setData({ ...data, [k]: v });
  const val = (k: string) => data[k] ?? '';

  return (
    <div className="soap-content-inner">

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Motivo de Consulta Cosmética
      </p>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Área(s) de interés del paciente</label>
        <input className="soap-input" value={val('areaInteres')} onChange={e => up('areaInteres', e.target.value)} placeholder="Rostro, cuello, abdomen, piernas, manos, espalda…" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Objetivo estético</label>
        <input className="soap-input" value={val('objetivoEstetico')} onChange={e => up('objetivoEstetico', e.target.value)} placeholder="Rejuvenecimiento, hidratación, manchas, arrugas, flacidez, celulitis, cicatrices…" />
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Antecedentes Dermatológicos y Cosméticos
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">Patología dermatológica previa</label>
          <input className="soap-input" value={val('patologiaDerm')} onChange={e => up('patologiaDerm', e.target.value)} placeholder="Acné, rosácea, vitiligo, psoriasis, dermatitis atópica…" />
        </div>
        <div>
          <label className="soap-section-label">Tratamientos estéticos previos</label>
          <input className="soap-input" value={val('tratamientosPrevios')} onChange={e => up('tratamientosPrevios', e.target.value)} placeholder="Peeling, toxina botulínica, rellenos, láser, mesoterapia, IPL…" />
        </div>
        <div>
          <label className="soap-section-label">Reacciones adversas previas</label>
          <select className="soap-input" value={val('reaccionesAdversas')} onChange={e => up('reaccionesAdversas', e.target.value)}>
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
          <label className="soap-section-label">Fototipo de Fitzpatrick</label>
          <select className="soap-input" value={val('fototipo')} onChange={e => up('fototipo', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>I — Muy claro, siempre se quema</option>
            <option>II — Claro, casi siempre se quema</option>
            <option>III — Intermedio, a veces se quema</option>
            <option>IV — Moreno claro, raramente se quema</option>
            <option>V — Moreno oscuro, nunca se quema</option>
            <option>VI — Negro, nunca se quema</option>
          </select>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">Alergias a cosméticos o medicamentos tópicos</label>
          <input className="soap-input" value={val('alergiasCosmeticos')} onChange={e => up('alergiasCosmeticos', e.target.value)} placeholder="Parabenos, fragancias, ácido retinoico, hidroquinona…" />
        </div>
        <div>
          <label className="soap-section-label">Uso de medicamentos sistémicos de interés</label>
          <input className="soap-input" value={val('medicamentosSistemicos')} onChange={e => up('medicamentosSistemicos', e.target.value)} placeholder="Retinoides orales, anticoagulantes, antiagregantes, corticoides…" />
        </div>
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Evaluación de la Piel
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">Tipo de piel</label>
          <select className="soap-input" value={val('tipoPiel')} onChange={e => up('tipoPiel', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Normal</option>
            <option>Seca</option>
            <option>Grasa</option>
            <option>Mixta</option>
            <option>Sensible</option>
          </select>
        </div>
        <div>
          <label className="soap-section-label">Hidratación cutánea</label>
          <select className="soap-input" value={val('hidratacionCutanea')} onChange={e => up('hidratacionCutanea', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Adecuada</option>
            <option>Disminuida</option>
            <option>Muy disminuida — descamación</option>
          </select>
        </div>
        <div>
          <label className="soap-section-label">Tono y manchas</label>
          <select className="soap-input" value={val('tonoManchas')} onChange={e => up('tonoManchas', e.target.value)}>
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
          <label className="soap-section-label">Arrugas (clasificación)</label>
          <select className="soap-input" value={val('arrugas')} onChange={e => up('arrugas', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Ausentes</option>
            <option>Finas — expresión dinámica</option>
            <option>Moderadas — estáticas leves</option>
            <option>Profundas — estáticas marcadas</option>
          </select>
        </div>
        <div>
          <label className="soap-section-label">Flacidez cutánea</label>
          <select className="soap-input" value={val('flacidez')} onChange={e => up('flacidez', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>Ausente</option>
            <option>Grado I — leve</option>
            <option>Grado II — moderada</option>
            <option>Grado III — severa</option>
          </select>
        </div>
        <div>
          <label className="soap-section-label">Acné activo</label>
          <select className="soap-input" value={val('acneActivo')} onChange={e => up('acneActivo', e.target.value)}>
            <option value="">Seleccionar</option>
            <option>No</option>
            <option>Comedones — grado I</option>
            <option>Pápulas/pústulas — grado II</option>
            <option>Nódulos — grado III</option>
            <option>Quístico — grado IV</option>
          </select>
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Celulitis (localización y grado)</label>
        <input className="soap-input" value={val('celulitis')} onChange={e => up('celulitis', e.target.value)} placeholder="Grado I–IV según clasificación de Nürnberger-Müller, zona afectada…" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Lesiones relevantes observadas</label>
        <textarea className="soap-input soap-textarea" style={{ minHeight: 56 }} value={val('lesionesRelevantes')} onChange={e => up('lesionesRelevantes', e.target.value)} placeholder="Describir lesiones elementales: máculas, pápulas, cicatrices, queloides, telangiectasias, angiomas, nevos…" />
      </div>

      <div className="soap-section-divider" />

      <p style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 10 }}>
        Plan de Tratamiento Cosmético
      </p>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Procedimiento(s) indicado(s)</label>
        <textarea className="soap-input soap-textarea" style={{ minHeight: 56 }} value={val('procedimientosIndicados')} onChange={e => up('procedimientosIndicados', e.target.value)} placeholder="Peeling químico (TCA 15%, glicólico 30%), toxina botulínica (unidades, zona), relleno (ácido hialurónico), mesoterapia, radiofrecuencia, láser IPL…" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label className="soap-section-label">Número de sesiones previstas</label>
          <input className="soap-input" value={val('numSesiones')} onChange={e => up('numSesiones', e.target.value)} placeholder="Ej: 6 sesiones mensuales" />
        </div>
        <div>
          <label className="soap-section-label">Contraindicaciones identificadas</label>
          <input className="soap-input" value={val('contraindicaciones')} onChange={e => up('contraindicaciones', e.target.value)} placeholder="Embarazo, lactancia, infección activa, herpes labial activo, isotretinoína <6m…" />
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Cuidados en casa indicados</label>
        <textarea className="soap-input soap-textarea" style={{ minHeight: 56 }} value={val('cuidadosCasa')} onChange={e => up('cuidadosCasa', e.target.value)} placeholder="Fotoprotección diaria SPF ≥50, hidratante, ácido retinoico nocturno, vitamina C, evitar sol post procedimiento…" />
      </div>

      <div className="soap-section-divider" />

      <div style={{ marginBottom: 14 }}>
        <label className="soap-section-label">Notas adicionales de Cosmiatría</label>
        <textarea className="soap-input soap-textarea" style={{ minHeight: 60 }} value={val('notasAdicionales')} onChange={e => up('notasAdicionales', e.target.value)} placeholder="Consentimiento informado, fotografías clínicas, próxima sesión, derivación a dermatología…" />
      </div>

      <div className="soap-nav-row" style={{ justifyContent: "flex-start", marginTop: 8 }}>
        <button className="soap-btn-secondary" onClick={onPrev}>← Volver al Plan</button>
      </div>
    </div>
  );
}
