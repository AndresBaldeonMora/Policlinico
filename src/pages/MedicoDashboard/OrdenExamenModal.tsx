import { useEffect, useState } from "react";
import { X, FlaskConical, ChevronDown, ChevronUp } from "lucide-react";
import type { ExamenLaboratorio, TipoExamen } from "../../services/examen.service";
import { ExamenService, TIPO_EXAMEN_LABEL } from "../../services/examen.service";
import "./OrdenExamenModal.css";

interface Props {
  citaId: string;
  pacienteId: string;
  doctorId: string;
  especialidadId: string;
  onCerrar: () => void;
  onOrdenCreada: () => void;
}

type GrupoExamenes = Record<string, ExamenLaboratorio[]>;

const OrdenExamenModal = ({
  citaId,
  pacienteId,
  doctorId,
  especialidadId,
  onCerrar,
  onOrdenCreada,
}: Props) => {
  const [examenes, setExamenes] = useState<ExamenLaboratorio[]>([]);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [observaciones, setObservaciones] = useState<Record<string, string>>({});
  const [observacionesGenerales, setObservacionesGenerales] = useState("");
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [gruposAbiertos, setGruposAbiertos] = useState<Set<string>>(new Set());

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
    if (seleccionados.size === 0) return;
    setGuardando(true);
    try {
      await ExamenService.crearOrden({
        pacienteId,
        doctorId,
        citaId,
        especialidadId,
        observacionesGenerales,
        items: [...seleccionados].map((examenId) => ({
          examenId,
          observaciones: observaciones[examenId] || "",
        })),
      });
      onOrdenCreada();
      onCerrar();
    } catch (error) {
      console.error("Error al crear orden:", error);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="orden-modal-overlay" onClick={onCerrar}>
      <div className="orden-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="orden-modal-header">
          <div className="orden-modal-title">
            <FlaskConical size={20} />
            <h3>Solicitar Exámenes de Laboratorio</h3>
          </div>
          <button className="orden-modal-close" onClick={onCerrar}>
            <X size={18} />
          </button>
        </div>

        <div className="orden-modal-body">
          {loading ? (
            <div className="orden-modal-loading">
              <div className="spinner-small" />
              <p>Cargando catálogo...</p>
            </div>
          ) : (
            <>
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
                            <label key={ex._id} className="orden-item">
                              <input
                                type="checkbox"
                                checked={seleccionados.has(ex._id)}
                                onChange={() => toggleExamen(ex._id)}
                              />
                              <div className="orden-item-info">
                                <span className="orden-item-nombre">{ex.nombre}</span>
                                {ex.unidad && (
                                  <span className="orden-item-unidad">{ex.unidad}</span>
                                )}
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
              {guardando ? "Creando orden..." : "Crear Orden"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdenExamenModal;
