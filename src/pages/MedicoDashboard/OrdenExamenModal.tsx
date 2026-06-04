import { useEffect, useState } from "react";
import { X, FlaskConical, ChevronDown, ChevronUp } from "lucide-react";
import type {
  ExamenLaboratorioImagen,
  TipoExamen,
  RespuestaProtocolar,
} from "../../services/examen.service";
import { ExamenService, TIPO_EXAMEN_LABEL } from "../../services/examen.service";
import { toastExito } from "../../utils/toast";
import "./OrdenExamenModal.css";

interface Props {
  citaId: string;
  pacienteId: string;
  doctorId: string;
  especialidadId: string;
  onCerrar: () => void;
  onOrdenCreada: () => void;
  // Modo edición (opcional)
  ordenId?: string;
  seleccionadosIniciales?: Set<string>;
  obsItemIniciales?: Record<string, string>;
  obsGeneralesInicial?: string;
  respuestasProtocolaresIniciales?: Record<string, Record<string, string>>;
}

type GrupoExamenes = Record<string, ExamenLaboratorioImagen[]>;

const OrdenExamenModal = ({
  citaId,
  pacienteId,
  doctorId,
  especialidadId,
  onCerrar,
  onOrdenCreada,
  ordenId,
  seleccionadosIniciales,
  obsItemIniciales,
  obsGeneralesInicial,
  respuestasProtocolaresIniciales,
}: Props) => {
  const modoEdicion = Boolean(ordenId);
  const [examenes, setExamenes] = useState<ExamenLaboratorioImagen[]>([]);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(seleccionadosIniciales ?? new Set());
  const [observaciones, setObservaciones] = useState<Record<string, string>>(obsItemIniciales ?? {});
  const [observacionesGenerales, setObservacionesGenerales] = useState(obsGeneralesInicial ?? "");
  // Respuestas protocolares: { examenId: { preguntaId: respuesta } }
  const [respuestasProtocolo, setRespuestasProtocolo] = useState<
    Record<string, Record<string, string>>
  >(respuestasProtocolaresIniciales ?? {});
  const [diagnosticoPresuntivo, setDiagnosticoPresuntivo] = useState("");
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [gruposAbiertos, setGruposAbiertos] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

  const handleRespuestaChange = (examenId: string, preguntaId: string, valor: string) => {
    setRespuestasProtocolo((prev) => ({
      ...prev,
      [examenId]: {
        ...(prev[examenId] || {}),
        [preguntaId]: valor,
      },
    }));
  };

  useEffect(() => {
    ExamenService.listarExamenes()
      .then((data) => {
        setExamenes(data);
        // Abrir primer grupo por defecto
        const tipos = [...new Set(data.map((e) => e.tipo))];
        if (tipos.length > 0) setGruposAbiertos(new Set([tipos[0]]));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const grupos: GrupoExamenes = examenes.reduce((acc, ex) => {
    if (!acc[ex.tipo]) acc[ex.tipo] = [];
    acc[ex.tipo].push(ex);
    return acc;
  }, {} as GrupoExamenes);

  const toggleExamen = (id: string) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleGrupo = (tipo: string) => {
    setGruposAbiertos((prev) => {
      const next = new Set(prev);
      if (next.has(tipo)) next.delete(tipo);
      else next.add(tipo);
      return next;
    });
  };

  const handleCrear = async () => {
    setError("");

    if (seleccionados.size === 0) {
      setError("Debes seleccionar al menos un examen.");
      return;
    }

    // Validar preguntas protocolares obligatorias
    const examenesPorId = new Map(examenes.map((e) => [e._id, e]));
    for (const examenId of seleccionados) {
      const examen = examenesPorId.get(examenId);
      if (!examen?.preguntasProtocolares?.length) continue;
      for (const preg of examen.preguntasProtocolares) {
        if (!preg.obligatoria) continue;
        const resp = respuestasProtocolo[examenId]?.[preg.id];
        if (!resp || !resp.trim()) {
          setError(
            `Responde todas las preguntas obligatorias para "${examen.nombre}".`,
          );
          return;
        }
      }
    }

    const obsGeneralesTrimmed  = observacionesGenerales.trim();
    const dxPresuntivo         = diagnosticoPresuntivo.trim();
    const itemsPayload = [...seleccionados].map((examenId) => {
      const examen = examenesPorId.get(examenId);
      const respuestas: RespuestaProtocolar[] =
        examen?.preguntasProtocolares
          ?.filter((p) => {
            const r = respuestasProtocolo[examenId]?.[p.id];
            return r !== undefined && r !== "";
          })
          .map((p) => ({
            preguntaId: p.id,
            preguntaTexto: p.texto,
            respuesta: respuestasProtocolo[examenId][p.id],
          })) ?? [];
      return {
        examenId,
        observaciones: (observaciones[examenId] || "").trim(),
        respuestasProtocolares: respuestas,
      };
    });

    setGuardando(true);
    try {
      if (modoEdicion && ordenId) {
        await ExamenService.actualizarOrden(ordenId, itemsPayload, obsGeneralesTrimmed, dxPresuntivo || undefined);
        toastExito("Orden actualizada correctamente");
      } else {
        await ExamenService.crearOrden({
          pacienteId,
          doctorId,
          citaId,
          especialidadId,
          observacionesGenerales: obsGeneralesTrimmed,
          diagnosticoPresuntivo: dxPresuntivo || undefined,
          items: itemsPayload,
        });
        toastExito("Orden de examen creada exitosamente");
      }
      onOrdenCreada();
      onCerrar();
    } catch (err: any) {
      const mensaje =
        err?.response?.data?.message || `Error al ${modoEdicion ? "actualizar" : "crear"} la orden. Intenta de nuevo.`;
      setError(mensaje);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="orden-modal-overlay">
      <div className="orden-modal-card">
        <div className="orden-modal-header">
          <div className="orden-modal-title">
            <FlaskConical size={20} />
            <h3>{modoEdicion ? "Editar Orden" : "Solicitar Exámenes de Laboratorio / Imagen"}</h3>
          </div>
          <button className="orden-modal-close" onClick={onCerrar}>
            <X size={18} />
          </button>
        </div>

        <div className="orden-modal-body">
          {loading ? (
            <div className="orden-modal-loading">
              <div className="spinner-small" />
              <p>Cargando catálogo…</p>
            </div>
          ) : (
            <>
              {/* Diagnóstico presuntivo — campo obligatorio NTS 139-MINSA */}
              <div className="orden-obs-general" style={{ marginBottom: 0 }}>
                <label>
                  Diagnóstico presuntivo <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  type="text"
                  style={{
                    padding: "0.6rem 0.8rem",
                    border: "1px solid var(--text-muted)",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.875rem",
                    background: "transparent",
                    color: "var(--text-primary)",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                  placeholder="Ej: Diabetes mellitus tipo 2 (E11), Anemia ferropénica (D50)…"
                  value={diagnosticoPresuntivo}
                  onChange={e => setDiagnosticoPresuntivo(e.target.value)}
                />
              </div>

              <p className="orden-modal-hint">
                Selecciona los exámenes que necesita el paciente:
              </p>

              <div className="orden-grupos">
                {(Object.keys(grupos) as TipoExamen[]).map((tipo) => {
                  const abierto = gruposAbiertos.has(tipo);
                  const cantSelec = grupos[tipo].filter((e) => seleccionados.has(e._id)).length;
                  return (
                    <div key={tipo} className="orden-grupo">
                      <button
                        className="orden-grupo-header"
                        onClick={() => toggleGrupo(tipo)}
                      >
                        <span className="orden-grupo-nombre">
                          {TIPO_EXAMEN_LABEL[tipo] || tipo}
                          {cantSelec > 0 && (
                            <span className="orden-grupo-badge">{cantSelec}</span>
                          )}
                        </span>
                        {abierto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>

                      {abierto && (
                        <div className="orden-grupo-items">
                          {grupos[tipo].map((ex) => (
                            <div key={ex._id} className="orden-item-wrapper">
                              <label className="orden-item">
                                <input
                                  type="checkbox"
                                  checked={seleccionados.has(ex._id)}
                                  onChange={() => toggleExamen(ex._id)}
                                />
                                <div className="orden-item-info">
                                  <span className="orden-item-nombre">{ex.nombre}</span>
                                </div>
                                {seleccionados.has(ex._id) && (
                                  <input
                                    className="orden-item-obs"
                                    type="text"
                                    placeholder="Observación (opcional)"
                                    value={observaciones[ex._id] || ""}
                                    onChange={(e) =>
                                      setObservaciones((prev) => ({
                                        ...prev,
                                        [ex._id]: e.target.value,
                                      }))
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                )}
                              </label>

                              {/* Preguntas protocolares (fuera del label para evitar toggles accidentales) */}
                              {seleccionados.has(ex._id) &&
                                ex.preguntasProtocolares?.length > 0 && (
                                  <div className="protocolar-preguntas">
                                    <p className="protocolar-titulo">
                                      Preguntas protocolares
                                    </p>
                                    {ex.preguntasProtocolares.map((preg) => {
                                      const valor =
                                        respuestasProtocolo[ex._id]?.[preg.id] ?? "";
                                      return (
                                        <div
                                          key={preg.id}
                                          className="protocolar-pregunta"
                                        >
                                          <label>
                                            {preg.texto}
                                            {preg.obligatoria && (
                                              <span className="protocolar-required">
                                                *
                                              </span>
                                            )}
                                          </label>

                                          {preg.tipo === "BOOLEAN" && (
                                            <div className="protocolar-bool">
                                              <label className="protocolar-bool-opt">
                                                <input
                                                  type="radio"
                                                  name={`preg-${ex._id}-${preg.id}`}
                                                  value="Sí"
                                                  checked={valor === "Sí"}
                                                  onChange={(e) =>
                                                    handleRespuestaChange(
                                                      ex._id,
                                                      preg.id,
                                                      e.target.value,
                                                    )
                                                  }
                                                />
                                                Sí
                                              </label>
                                              <label className="protocolar-bool-opt">
                                                <input
                                                  type="radio"
                                                  name={`preg-${ex._id}-${preg.id}`}
                                                  value="No"
                                                  checked={valor === "No"}
                                                  onChange={(e) =>
                                                    handleRespuestaChange(
                                                      ex._id,
                                                      preg.id,
                                                      e.target.value,
                                                    )
                                                  }
                                                />
                                                No
                                              </label>
                                            </div>
                                          )}

                                          {preg.tipo === "TEXTO" && (
                                            <input
                                              type="text"
                                              className="protocolar-input"
                                              placeholder="Responder..."
                                              value={valor}
                                              onChange={(e) =>
                                                handleRespuestaChange(
                                                  ex._id,
                                                  preg.id,
                                                  e.target.value,
                                                )
                                              }
                                            />
                                          )}

                                          {preg.tipo === "SELECCION" && (
                                            <select
                                              className="protocolar-input"
                                              value={valor}
                                              onChange={(e) =>
                                                handleRespuestaChange(
                                                  ex._id,
                                                  preg.id,
                                                  e.target.value,
                                                )
                                              }
                                            >
                                              <option value="">
                                                -- Seleccionar --
                                              </option>
                                              {preg.opciones?.map((op) => (
                                                <option key={op} value={op}>
                                                  {op}
                                                </option>
                                              ))}
                                            </select>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="orden-obs-general">
                <label>Indicaciones generales</label>
                <textarea
                  rows={2}
                  placeholder="Ej: Acudir en ayunas, muestra de madrugada..."
                  value={observacionesGenerales}
                  onChange={(e) => setObservacionesGenerales(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <div className="orden-modal-footer">
          {error && <p className="orden-modal-error">{error}</p>}
          <span className="orden-seleccionados-count">
            {seleccionados.size > 0
              ? `${seleccionados.size} examen${seleccionados.size > 1 ? "es" : ""} seleccionado${seleccionados.size > 1 ? "s" : ""}`
              : "Ningún examen seleccionado"}
          </span>
          <div className="orden-modal-actions">
            <button className="orden-btn orden-btn--cancel" onClick={onCerrar}>
              Cancelar
            </button>
            <button
              className="orden-btn orden-btn--primary"
              onClick={handleCrear}
              disabled={seleccionados.size === 0 || guardando}
            >
              {guardando
                ? (modoEdicion ? "Guardando..." : "Creando orden...")
                : (modoEdicion ? "Guardar Cambios" : "Crear Orden")
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdenExamenModal;
