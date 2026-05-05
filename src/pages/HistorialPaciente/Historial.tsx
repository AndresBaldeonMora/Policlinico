import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  User, Phone, Mail, MapPin, Calendar, FileText,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { PacienteApiService, type PacienteTransformado } from "../../services/paciente.service";
import { TIPO_EXAMEN_LABEL, type ExamenLaboratorioImagen, type ItemOrden } from "../../services/examen.service";
import "./Historial.css";

const formatFecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });

const ESTADO_CITA_BADGE: Record<string, { label: string; clase: string }> = {
  PENDIENTE: { label: "Pendiente", clase: "hist-badge--pending" },
  ATENDIDA: { label: "Atendida", clase: "hist-badge--done" },
  CANCELADA: { label: "Cancelada", clase: "hist-badge--cancel" },
  REPROGRAMADA: { label: "Reprogramada", clase: "hist-badge--warning" },
};

const ESTADO_ORDEN_BADGE: Record<string, { label: string; clase: string }> = {
  PENDIENTE: { label: "Pendiente", clase: "hist-badge--pending" },
  EN_PROCESO: { label: "En proceso", clase: "hist-badge--process" },
  COMPLETADO: { label: "Completado", clase: "hist-badge--done" },
  CANCELADA: { label: "Cancelada", clase: "hist-badge--cancel" },
  VENCIDA: { label: "Vencida", clase: "hist-badge--cancel" },
};

const TIPO_CITA_LABEL: Record<string, string> = {
  CONSULTA: "Consulta",
  LABORATORIO: "Laboratorio",
  REMOTA: "Remota",
  DOMICILIO: "Domicilio",
};

type FiltroTipo = "TODOS" | "CITAS" | "ORDENES";

const Historial = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [paciente, setPaciente] = useState<PacienteTransformado | null>(null);
  const [citas, setCitas] = useState<any[]>([]);
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("TODOS");
  const [expandedOrdenes, setExpandedOrdenes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    PacienteApiService.obtenerHistorial(id)
      .then((data: any) => {
        setPaciente(data.paciente);
        setCitas(data.citas.data);
        setOrdenes(data.ordenes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const toggleOrden = (ordenId: string) => {
    setExpandedOrdenes((prev) => {
      const next = new Set(prev);
      if (next.has(ordenId)) next.delete(ordenId);
      else next.add(ordenId);
      return next;
    });
  };

  // Unificar citas y órdenes en una timeline
  const timeline = [
    ...citas.map((c) => ({ ...c, _tipo: "cita" as const, _fecha: c.fecha })),
    ...ordenes.map((o) => ({ ...o, _tipo: "orden" as const, _fecha: o.fecha })),
  ]
    .sort((a, b) => new Date(b._fecha).getTime() - new Date(a._fecha).getTime())
    .filter((item) => {
      if (filtroTipo === "CITAS") return item._tipo === "cita";
      if (filtroTipo === "ORDENES") return item._tipo === "orden";
      return true;
    });

  if (loading) {
    return (
      <div className="hist-page">
        <div className="hist-loading">Cargando historial...</div>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="hist-page">
        <div className="hist-loading">Paciente no encontrado</div>
      </div>
    );
  }

  const edad = paciente.edad ?? (paciente.fechaNacimiento
    ? Math.floor((Date.now() - new Date(paciente.fechaNacimiento).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null);

  return (
    <div className="hist-page">
      <div className="hist-layout">
        {/* Panel izquierdo: datos del paciente */}
        <div className="hist-panel-izq">
          <div className="hist-avatar-big">
            <User size={32} />
          </div>
          <h2 className="hist-nombre">{paciente.nombres} {paciente.apellidos}</h2>

          <div className="hist-datos">
            <div className="hist-dato">
              <span className="hist-dato-label">DNI</span>
              <span className="hist-dato-value">{paciente.dni}</span>
            </div>
            {edad !== null && (
              <div className="hist-dato">
                <span className="hist-dato-label">Edad</span>
                <span className="hist-dato-value">{edad} años</span>
              </div>
            )}
            {paciente.sexo && (
              <div className="hist-dato">
                <span className="hist-dato-label">Sexo</span>
                <span className="hist-dato-value">{paciente.sexo === "M" ? "Masculino" : "Femenino"}</span>
              </div>
            )}
            {paciente.telefono && (
              <div className="hist-dato">
                <Phone size={14} />
                <span className="hist-dato-value">{paciente.telefono}</span>
              </div>
            )}
            {paciente.correo && (
              <div className="hist-dato">
                <Mail size={14} />
                <span className="hist-dato-value">{paciente.correo}</span>
              </div>
            )}
            {paciente.direccion && (
              <div className="hist-dato">
                <MapPin size={14} />
                <span className="hist-dato-value">{paciente.direccion}{paciente.distrito ? `, ${paciente.distrito}` : ""}</span>
              </div>
            )}
            {paciente.apoderadoNombre && (
              <div className="hist-dato-grupo">
                <span className="hist-dato-label">Apoderado</span>
                <span className="hist-dato-value">{paciente.apoderadoNombre}</span>
                {paciente.apoderadoParentesco && <span className="hist-dato-meta">({paciente.apoderadoParentesco})</span>}
                {paciente.apoderadoTelefono && <span className="hist-dato-meta">Tel: {paciente.apoderadoTelefono}</span>}
              </div>
            )}
          </div>

          <div className="hist-resumen">
            <div className="hist-resumen-item">
              <Calendar size={14} />
              <span>{citas.length} citas</span>
            </div>
            <div className="hist-resumen-item">
              <FileText size={14} />
              <span>{ordenes.length} órdenes</span>
            </div>
          </div>
        </div>

        {/* Panel derecho: timeline */}
        <div className="hist-panel-der">
          <div className="hist-timeline-header">
            <h2>Historial</h2>
            <div className="hist-filtros">
              {(["TODOS", "CITAS", "ORDENES"] as FiltroTipo[]).map((f) => (
                <button
                  key={f}
                  className={`hist-filtro-btn ${filtroTipo === f ? "active" : ""}`}
                  onClick={() => setFiltroTipo(f)}
                >
                  {f === "TODOS" ? "Todo" : f === "CITAS" ? "Citas" : "Órdenes"}
                </button>
              ))}
            </div>
          </div>

          {timeline.length === 0 ? (
            <div className="hist-empty">No hay registros para este paciente.</div>
          ) : (
            <div className="hist-timeline">
              {timeline.map((item) => {
                if (item._tipo === "cita") {
                  const doctor = item.doctorId;
                  const esp = doctor?.especialidadId;
                  const badge = ESTADO_CITA_BADGE[item.estado] || ESTADO_CITA_BADGE.PENDIENTE;
                  return (
                    <div key={`cita-${item._id}`} className="hist-item hist-item--cita">
                      <div className="hist-item-icon"><Calendar size={16} /></div>
                      <div className="hist-item-content">
                        <div className="hist-item-top">
                          <span className="hist-item-fecha">{formatFecha(item.fecha)} · {item.hora}</span>
                          <span className={`hist-badge ${badge.clase}`}>{badge.label}</span>
                          {item.tipo && item.tipo !== "CONSULTA" && (
                            <span className="hist-tipo-chip">{TIPO_CITA_LABEL[item.tipo] || item.tipo}</span>
                          )}
                        </div>
                        <div className="hist-item-body">
                          <span>
                            Dr. {doctor?.nombres} {doctor?.apellidos}
                            {esp?.nombre ? ` — ${esp.nombre}` : ""}
                          </span>
                        </div>
                        <button
                          className="hist-link"
                          onClick={() => navigate(`/citas/${item._id}`)}
                        >
                          Ver detalle
                        </button>
                      </div>
                    </div>
                  );
                } else {
                  const doctor = item.doctorId;
                  const badge = ESTADO_ORDEN_BADGE[item.estado] || ESTADO_ORDEN_BADGE.PENDIENTE;
                  const expanded = expandedOrdenes.has(item._id);
                  return (
                    <div key={`orden-${item._id}`} className="hist-item hist-item--orden">
                      <div className="hist-item-icon hist-item-icon--orden"><FileText size={16} /></div>
                      <div className="hist-item-content">
                        <div className="hist-item-top" onClick={() => toggleOrden(item._id)} style={{ cursor: "pointer" }}>
                          <span className="hist-item-fecha">
                            {formatFecha(item.fecha)}
                            {item.codigoOrden && <span className="hist-codigo">{item.codigoOrden}</span>}
                          </span>
                          <span className={`hist-badge ${badge.clase}`}>{badge.label}</span>
                          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </div>
                        <div className="hist-item-body">
                          <span>
                            Dr. {doctor?.nombres} {doctor?.apellidos}
                            {item.especialidadId?.nombre ? ` — ${item.especialidadId.nombre}` : ""}
                          </span>
                          <span className="hist-item-meta">{item.items?.length} exámenes</span>
                        </div>
                        {expanded && (
                          <div className="hist-orden-detalle">
                            <table className="hist-tabla">
                              <thead>
                                <tr>
                                  <th>Examen</th>
                                  <th>Tipo</th>
                                  <th>Resultado</th>
                                  <th>Estado</th>
                                </tr>
                              </thead>
                              <tbody>
                                {item.items?.map((it: ItemOrden, i: number) => {
                                  const ex = typeof it.examenId === "object" ? (it.examenId as ExamenLaboratorioImagen) : null;
                                  return (
                                    <tr key={i}>
                                      <td>{ex?.nombre ?? "—"}</td>
                                      <td>{ex ? TIPO_EXAMEN_LABEL[ex.tipo] : "—"}</td>
                                      <td>
                                        {it.valorResultado
                                          ? <span className="hist-resultado">{it.valorResultado} {it.unidadResultado}</span>
                                          : <span className="hist-muted">—</span>}
                                      </td>
                                      <td>
                                        <span className={`hist-badge ${it.estadoItem === "COMPLETADO" ? "hist-badge--done" : "hist-badge--pending"}`}>
                                          {it.estadoItem === "COMPLETADO" ? "Listo" : "Pendiente"}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Historial;
