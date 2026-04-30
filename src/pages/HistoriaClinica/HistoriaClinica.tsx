import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, User, Phone, Mail, Calendar,
  FileText, ChevronDown, ChevronUp, Play,
} from "lucide-react";
import { PacienteApiService, type PacienteTransformado } from "../../services/paciente.service";
import "./HistoriaClinica.css";

type Tab = "resumen" | "antecedentes" | "estudios" | "documentos" | "consultas";

const TABS: { key: Tab; label: string }[] = [
  { key: "resumen",      label: "Resumen" },
  { key: "antecedentes", label: "Antecedentes" },
  { key: "estudios",     label: "Estudios" },
  { key: "documentos",   label: "Documentos" },
  { key: "consultas",    label: "Consultas anteriores" },
];

const formatFecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit", month: "short", year: "numeric", timeZone: "UTC",
  });

const calcEdad = (fechaNac?: string): number | null => {
  if (!fechaNac) return null;
  return Math.floor((Date.now() - new Date(fechaNac).getTime()) / (365.25 * 24 * 3600 * 1000));
};

export default function HistoriaClinica() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading,   setLoading]   = useState(true);
  const [paciente,  setPaciente]  = useState<PacienteTransformado | null>(null);
  const [citas,     setCitas]     = useState<any[]>([]);
  const [ordenes,   setOrdenes]   = useState<any[]>([]);
  const [tab,       setTab]       = useState<Tab>("resumen");
  const [expanded,  setExpanded]  = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!id) return;
    PacienteApiService.obtenerHistorial(id)
      .then((data: any) => {
        setPaciente(data.paciente);
        setCitas(data.citas?.data ?? []);
        setOrdenes(data.ordenes?.data ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const toggleExpand = (cid: string) =>
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(cid) ? next.delete(cid) : next.add(cid);
      return next;
    });

  if (loading) {
    return (
      <div className="hc-page">
        <div className="hc-loading">Cargando historia clínica...</div>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="hc-page">
        <div className="hc-loading">Paciente no encontrado</div>
      </div>
    );
  }

  const edad = calcEdad(paciente.fechaNacimiento);

  // Derived data for Resumen tab
  const citasAtendidas = citas
    .filter(c => c.estado === "ATENDIDA")
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const diagnosticosActivos = Array.from(
    new Set(citasAtendidas.filter(c => c.diagnostico).map(c => c.diagnostico as string))
  ).slice(0, 5);

  const todosLosMedicamentos: string[] = [];
  citasAtendidas.forEach(c => {
    if (Array.isArray(c.medicamentosPrescritos)) {
      c.medicamentosPrescritos.forEach((m: any) => {
        if (m.nombre) todosLosMedicamentos.push(`${m.nombre} ${m.dosis ?? ""}`.trim());
      });
    }
  });
  const medicamentosUnicos = Array.from(new Set(todosLosMedicamentos)).slice(0, 6);

  // Consultas anteriores (all citas sorted desc)
  const consultasOrdenadas = [...citas].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );

  return (
    <div className="hc-page">
      {/* Banner */}
      <div className="hc-banner">
        <button className="hc-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Volver
        </button>

        <div className="hc-banner-body">
          <div className="hc-banner-avatar">
            {paciente.nombres[0]}{paciente.apellidos[0]}
          </div>
          <div className="hc-banner-info">
            <h1 className="hc-banner-nombre">{paciente.nombres} {paciente.apellidos}</h1>
            <div className="hc-banner-meta">
              {edad !== null && <span><User size={13} /> {edad} años</span>}
              {paciente.sexo && (
                <span>{paciente.sexo === "M" ? "Masculino" : "Femenino"}</span>
              )}
              {paciente.dni && <span>DNI: {paciente.dni}</span>}
              {paciente.telefono && <span><Phone size={13} /> {paciente.telefono}</span>}
              {paciente.correo  && <span><Mail  size={13} /> {paciente.correo}</span>}
            </div>
            <div className="hc-banner-stats">
              <span className="hc-stat-pill">{citas.length} citas</span>
              <span className="hc-stat-pill">{ordenes.length} órdenes</span>
              {diagnosticosActivos.length > 0 && (
                <span className="hc-stat-pill hc-stat-pill--warn">
                  {diagnosticosActivos.length} diagnóstico{diagnosticosActivos.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="hc-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`hc-tab-btn${tab === t.key ? " hc-tab-btn--active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="hc-content">

        {/* ── RESUMEN ── */}
        {tab === "resumen" && (
          <div className="hc-resumen">
            <div className="hc-resumen-grid">
              {/* Diagnósticos activos */}
              <div className="hc-section-card">
                <h3 className="hc-section-title">Diagnósticos activos</h3>
                {diagnosticosActivos.length === 0 ? (
                  <p className="hc-empty-text">Sin diagnósticos registrados</p>
                ) : (
                  <div className="hc-tags-list">
                    {diagnosticosActivos.map((dx, i) => (
                      <span key={i} className="hc-dx-tag">{dx}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Medicamentos */}
              <div className="hc-section-card">
                <h3 className="hc-section-title">Medicamentos prescritos</h3>
                {medicamentosUnicos.length === 0 ? (
                  <p className="hc-empty-text">Sin medicamentos registrados</p>
                ) : (
                  <ul className="hc-med-list">
                    {medicamentosUnicos.map((m, i) => (
                      <li key={i} className="hc-med-item">{m}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Últimas consultas */}
            <div className="hc-section-card" style={{ marginTop: "1.25rem" }}>
              <h3 className="hc-section-title">Últimas consultas</h3>
              {citasAtendidas.length === 0 ? (
                <p className="hc-empty-text">Sin consultas previas atendidas</p>
              ) : (
                <table className="hc-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Médico</th>
                      <th>Diagnóstico</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {citasAtendidas.slice(0, 5).map(c => (
                      <tr key={c._id}>
                        <td style={{ whiteSpace: "nowrap" }}>{formatFecha(c.fecha)}</td>
                        <td>
                          {c.doctorId
                            ? `Dr. ${c.doctorId.nombres} ${c.doctorId.apellidos}`
                            : "—"}
                        </td>
                        <td style={{ maxWidth: 260 }}>
                          {c.diagnostico
                            ? <span className="hc-dx-tag hc-dx-tag--sm">{c.diagnostico}</span>
                            : <span className="hc-muted">—</span>}
                        </td>
                        <td>
                          <button
                            className="btn-action"
                            onClick={() => navigate(`/citas/${c._id}`)}
                          >
                            Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── ANTECEDENTES ── */}
        {tab === "antecedentes" && (
          <div className="hc-section-card">
            <h3 className="hc-section-title">Antecedentes</h3>
            <p className="hc-empty-text">
              Módulo de antecedentes clínicos en desarrollo.
            </p>
          </div>
        )}

        {/* ── ESTUDIOS ── */}
        {tab === "estudios" && (
          <div className="hc-section-card">
            <h3 className="hc-section-title">Estudios y órdenes</h3>
            {ordenes.length === 0 ? (
              <p className="hc-empty-text">Sin órdenes de laboratorio o imagen</p>
            ) : (
              <table className="hc-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Código</th>
                    <th>Exámenes</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {ordenes.map(o => (
                    <tr key={o._id}>
                      <td>{formatFecha(o.fecha)}</td>
                      <td><span className="td-mono">{o.codigoOrden ?? "—"}</span></td>
                      <td>{o.items?.length ?? 0} examen{(o.items?.length ?? 0) !== 1 ? "es" : ""}</td>
                      <td>
                        <span className={`hc-badge hc-badge--${o.estado === "COMPLETADO" ? "done" : "pending"}`}>
                          {o.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── DOCUMENTOS ── */}
        {tab === "documentos" && (
          <div className="hc-section-card">
            <h3 className="hc-section-title">Documentos</h3>
            <p className="hc-empty-text">Módulo de documentos en desarrollo.</p>
          </div>
        )}

        {/* ── CONSULTAS ANTERIORES ── */}
        {tab === "consultas" && (
          <div>
            {consultasOrdenadas.length === 0 ? (
              <div className="hc-section-card">
                <p className="hc-empty-text">No hay consultas registradas</p>
              </div>
            ) : (
              consultasOrdenadas.map(c => {
                const isOpen = expanded.has(c._id);
                const doctor = c.doctorId;
                const estadoClass = c.estado === "ATENDIDA" ? "done" : c.estado === "CANCELADA" ? "cancel" : "pending";
                return (
                  <div key={c._id} className="hc-consulta-card">
                    <div className="hc-consulta-header" onClick={() => toggleExpand(c._id)}>
                      <div className="hc-consulta-left">
                        <Calendar size={14} className="hc-consulta-icon" />
                        <div>
                          <div className="hc-consulta-fecha">
                            {formatFecha(c.fecha)} · {c.hora ?? "—"}
                          </div>
                          <div className="hc-consulta-doctor">
                            {doctor ? `Dr. ${doctor.nombres} ${doctor.apellidos}` : "Médico no disponible"}
                            {doctor?.especialidadId?.nombre ? ` — ${doctor.especialidadId.nombre}` : ""}
                          </div>
                        </div>
                      </div>
                      <div className="hc-consulta-right">
                        <span className={`hc-badge hc-badge--${estadoClass}`}>{c.estado}</span>
                        {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </div>
                    </div>

                    {isOpen && (
                      <div className="hc-consulta-body">
                        {c.notas && (
                          <div className="hc-soap-section">
                            <span className="hc-soap-label">Motivo / S</span>
                            <p className="hc-soap-text">{c.notas}</p>
                          </div>
                        )}
                        {c.notasClinicas && (
                          <div className="hc-soap-section">
                            <span className="hc-soap-label">Notas clínicas / O-A</span>
                            <p className="hc-soap-text">{c.notasClinicas}</p>
                          </div>
                        )}
                        {c.diagnostico && (
                          <div className="hc-soap-section">
                            <span className="hc-soap-label">Diagnóstico</span>
                            <span className="hc-dx-tag">{c.diagnostico}</span>
                          </div>
                        )}
                        {c.tratamiento && (
                          <div className="hc-soap-section">
                            <span className="hc-soap-label">Tratamiento / P</span>
                            <p className="hc-soap-text">{c.tratamiento}</p>
                          </div>
                        )}
                        {Array.isArray(c.medicamentosPrescritos) && c.medicamentosPrescritos.length > 0 && (
                          <div className="hc-soap-section">
                            <span className="hc-soap-label">Medicamentos</span>
                            <ul className="hc-med-list">
                              {c.medicamentosPrescritos.map((m: any, i: number) => (
                                <li key={i} className="hc-med-item">
                                  {m.nombre} — {m.dosis} · {m.frecuencia} · {m.duracion}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div style={{ marginTop: "0.75rem" }}>
                          <button
                            className="btn-action btn-action--primary"
                            onClick={() => navigate(`/citas/${c._id}`)}
                          >
                            <FileText size={13} /> Ver detalle completo
                          </button>
                          {c.estado === "PENDIENTE" && (
                            <button
                              className="btn-action btn-action--primary"
                              style={{ marginLeft: 8 }}
                              onClick={() => navigate(`/medico/citas/${c._id}/consulta`)}
                            >
                              <Play size={13} /> Iniciar consulta
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
