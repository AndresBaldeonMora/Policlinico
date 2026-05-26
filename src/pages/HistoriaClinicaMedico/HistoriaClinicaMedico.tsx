import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Phone, Mail, BookOpen,
  FlaskConical, Pill, Stethoscope, Calendar,
  ChevronDown, ChevronRight, FileText,
  AlertTriangle, Activity, Scissors, Users,
} from "lucide-react";
import { MedicoApiService } from "../../services/medico.service";
import { useAuth } from "../../hooks/userAuth";
import "./HistoriaClinicaMedico.css";

type Tab = "resumen" | "consultas" | "estudios";

const formatFecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit", month: "short", year: "numeric", timeZone: "UTC",
  });

const calcAge = (fechaNac?: string): string => {
  if (!fechaNac) return "—";
  const diff = Date.now() - new Date(fechaNac).getTime();
  return `${Math.floor(diff / (365.25 * 24 * 3600 * 1000))} años`;
};

interface SOAPParsed {
  diagnoses:       { code: string; name: string; tipo: "presuntivo" | "confirmado" }[];
  medicamentos:    { nombre: string; concentracion: string; forma: string; via: string; frecuencia: string; duracion: string }[];
  motivoConsulta:  string;
  evaluacion:      string;
}

const parsearSOAP = (notasClinicas?: string): SOAPParsed | null => {
  if (!notasClinicas) return null;
  try {
    const parsed = JSON.parse(notasClinicas);
    return {
      diagnoses:      parsed.soap?.A?.diagnoses   ?? [],
      medicamentos:   parsed.medicamentos          ?? [],
      motivoConsulta: parsed.soap?.S?.motivoConsulta ?? "",
      evaluacion:     parsed.soap?.A?.evaluacion    ?? "",
    };
  } catch { return null; }
};

export default function HistoriaClinicaMedico() {
  const params = useParams<{ pacienteId?: string; id?: string }>();
  const pacienteId = params.pacienteId ?? params.id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const rutaPacientes = user?.rol === "administrador" ? "/admin/pacientes" : "/pacientes";

  const [tab,      setTab]      = useState<Tab>("resumen");
  const [loading,  setLoading]  = useState(true);
  const [paciente, setPaciente] = useState<any>(null);
  const [citas,    setCitas]    = useState<any[]>([]);
  const [ordenes,  setOrdenes]  = useState<any[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!pacienteId) return;
    MedicoApiService.obtenerHistorialPaciente(pacienteId)
      .then(data => {
        setPaciente(data.paciente);
        setCitas(data.citas.data);
        setOrdenes(data.ordenes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [pacienteId]);

  const toggleCita = (id: string) =>
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  if (loading) return <div className="hcm-loading">Cargando historia clínica…</div>;
  if (!paciente) return <div className="hcm-loading">Paciente no encontrado.</div>;

  const nombre        = `${paciente.nombres} ${paciente.apellidos}`;
  const iniciales     = `${paciente.nombres[0] ?? ""}${paciente.apellidos[0] ?? ""}`.toUpperCase();
  const citasAtendidas = citas.filter((c: any) => c.estado === "ATENDIDA");
  const ultimaNota    = citasAtendidas.find((c: any) => c.notasClinicas);
  const datosActuales = ultimaNota ? parsearSOAP(ultimaNota.notasClinicas) : null;

  return (
    <div className="hcm-page">

      {/* Breadcrumb */}
      <div className="hcm-breadcrumb">
        <button className="hcm-back-btn" onClick={() => navigate(rutaPacientes)}>
          <ArrowLeft size={14} /> Pacientes
        </button>
        <span className="hcm-sep">/</span>
        <span className="hcm-current">{nombre}</span>
      </div>

      {/* Encabezado del paciente */}
      <div className="hcm-header-card">
        <div className="hcm-header-left">
          <div className="hcm-avatar">{iniciales}</div>
          <div className="hcm-header-info">
            <div className="hcm-header-name">{nombre}</div>
            <div className="hcm-header-meta">
              DNI: <strong>{paciente.dni}</strong>
              {paciente.fechaNacimiento && <> · {calcAge(paciente.fechaNacimiento)}</>}
              {paciente.sexo && <> · {paciente.sexo === "M" ? "Masculino" : "Femenino"}</>}
              {paciente.estadoCivil && paciente.estadoCivil !== "" && <> · {paciente.estadoCivil.charAt(0) + paciente.estadoCivil.slice(1).toLowerCase()}</>}
            </div>
            <div className="hcm-header-contact">
              {paciente.telefono && (
                <span><Phone size={11} /> {paciente.telefono}</span>
              )}
              {paciente.correo && (
                <span><Mail size={11} /> {paciente.correo}</span>
              )}
              {paciente.direccion && paciente.direccion !== "" && (
                <span>{paciente.direccion}{paciente.distrito ? `, ${paciente.distrito}` : ""}</span>
              )}
            </div>
          </div>
        </div>
        <div className="hcm-header-stats">
          <div className="hcm-stat">
            <span className="hcm-stat-num">{citas.length}</span>
            <span className="hcm-stat-label">Citas totales</span>
          </div>
          <div className="hcm-stat">
            <span className="hcm-stat-num">{citasAtendidas.length}</span>
            <span className="hcm-stat-label">Atendidas</span>
          </div>
          <div className="hcm-stat">
            <span className="hcm-stat-num">{ordenes.length}</span>
            <span className="hcm-stat-label">Exámenes</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="hcm-tabs">
        {([
          { id: "resumen",   label: "Resumen" },
          { id: "consultas", label: `Consultas (${citasAtendidas.length})` },
          { id: "estudios",  label: `Estudios (${ordenes.length})` },
        ] as const).map(t => (
          <button
            key={t.id}
            className={`hcm-tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── TAB: RESUMEN ─── */}
      {tab === "resumen" && (
        <div className="hcm-resumen-layout">

          {/* Columna izquierda: Datos clínicos derivados */}
          <div className="hcm-col-left">

            {/* Diagnósticos activos */}
            <div className="hcm-clinical-card">
              <div className="hcm-clinical-title">
                <Stethoscope size={13} /> Diagnósticos Activos
              </div>
              {datosActuales?.diagnoses?.length ? (
                datosActuales.diagnoses.map((dx) => (
                  <div key={dx.code} className="hcm-dx-item">
                    <span className="hcm-dx-code">{dx.code}</span>
                    <span className="hcm-dx-name">{dx.name}</span>
                    <span className={`hcm-dx-tipo hcm-dx-tipo--${dx.tipo}`}>
                      {dx.tipo === "confirmado" ? "Confirmado" : "Presuntivo"}
                    </span>
                  </div>
                ))
              ) : (
                <p className="hcm-empty-hint">Sin diagnósticos registrados.</p>
              )}
            </div>

            {/* Medicamentos actuales */}
            <div className="hcm-clinical-card">
              <div className="hcm-clinical-title">
                <Pill size={13} /> Medicamentos Actuales
              </div>
              {datosActuales?.medicamentos?.length ? (
                <>
                  {datosActuales.medicamentos.map((m) => (
                    <div key={`${m.nombre}-${m.concentracion}-${m.frecuencia}`} className="hcm-med-item">
                      <div className="hcm-med-nombre">{m.nombre} {m.concentracion}</div>
                      <div className="hcm-med-detalle">
                        {m.forma} · {m.via} · {m.frecuencia} · {m.duracion}
                      </div>
                    </div>
                  ))}
                  <div className="hcm-source-note">
                    Última consulta con nota: {formatFecha(ultimaNota.fecha)}
                  </div>
                </>
              ) : (
                <p className="hcm-empty-hint">Sin medicamentos registrados.</p>
              )}
            </div>

            {/* Alergias (antecedente persistente del paciente) */}
            <div className="hcm-clinical-card">
              <div className="hcm-clinical-title">
                <AlertTriangle size={13} /> Alergias
              </div>
              {paciente.alergias?.length ? (
                paciente.alergias.map((a: any) => (
                  <div key={a._id ?? a.sustancia} className="hcm-dx-item">
                    <span className="hcm-dx-name">{a.sustancia}{a.reaccion ? ` — ${a.reaccion}` : ""}</span>
                    <span className={`hcm-sev-badge hcm-sev-badge--${a.severidad}`}>{a.severidad}</span>
                  </div>
                ))
              ) : (
                <p className="hcm-empty-hint">Sin alergias registradas.</p>
              )}
            </div>

            {/* Problemas médicos activos */}
            <div className="hcm-clinical-card">
              <div className="hcm-clinical-title">
                <Activity size={13} /> Problemas Médicos
              </div>
              {paciente.problemasMedicos?.filter((p: any) => p.estado === "activo").length ? (
                paciente.problemasMedicos
                  .filter((p: any) => p.estado === "activo")
                  .map((p: any) => (
                    <div key={p._id ?? p.descripcion} className="hcm-dx-item">
                      <span className="hcm-dx-name">{p.descripcion}</span>
                      {p.fechaInicio && (
                        <span className="hcm-dx-tipo">{new Date(p.fechaInicio).getFullYear()}</span>
                      )}
                    </div>
                  ))
              ) : (
                <p className="hcm-empty-hint">Sin problemas registrados.</p>
              )}
            </div>

            {/* Cirugías previas */}
            <div className="hcm-clinical-card">
              <div className="hcm-clinical-title">
                <Scissors size={13} /> Cirugías Previas
              </div>
              {paciente.cirugiasPrevias?.length ? (
                paciente.cirugiasPrevias.map((c: any) => (
                  <div key={c._id ?? c.procedimiento} className="hcm-dx-item">
                    <span className="hcm-dx-name">{c.procedimiento}{c.hospital ? ` · ${c.hospital}` : ""}</span>
                    {c.fecha && (
                      <span className="hcm-dx-tipo">{new Date(c.fecha).getFullYear()}</span>
                    )}
                  </div>
                ))
              ) : (
                <p className="hcm-empty-hint">Sin cirugías registradas.</p>
              )}
            </div>

            {/* Antecedentes familiares */}
            <div className="hcm-clinical-card">
              <div className="hcm-clinical-title">
                <Users size={13} /> Antecedentes Familiares
              </div>
              {paciente.antecedentesFamiliares?.length ? (
                paciente.antecedentesFamiliares.map((a: any) => (
                  <div key={a._id ?? `${a.parentesco}-${a.condicion}`} className="hcm-dx-item">
                    <span className="hcm-dx-name"><strong>{a.parentesco}:</strong> {a.condicion}</span>
                  </div>
                ))
              ) : (
                <p className="hcm-empty-hint">Sin antecedentes registrados.</p>
              )}
            </div>

          </div>

          {/* Columna derecha: Últimas 5 consultas */}
          <div className="hcm-col-right">
            <div className="hcm-card">
              <div className="hcm-card-title">Últimas Consultas</div>
              {citasAtendidas.length > 0 ? (
                <div className="table-container">
                  <table className="modern-table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Motivo</th>
                        <th>Diagnóstico</th>
                        <th>Médico</th>
                      </tr>
                    </thead>
                    <tbody>
                      {citasAtendidas.slice(0, 5).map((c: any) => {
                        const soap = parsearSOAP(c.notasClinicas);
                        const motivo = soap?.motivoConsulta || c.notas || "—";
                        return (
                          <tr key={c._id}>
                            <td style={{ whiteSpace: "nowrap", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                              {formatFecha(c.fecha)}
                            </td>
                            <td style={{ maxWidth: 180, fontSize: "0.82rem" }}>
                              {motivo.length > 55 ? motivo.substring(0, 55) + "…" : motivo}
                            </td>
                            <td>
                              {c.diagnostico ? (
                                <span className="hcm-dx-tag-small">
                                  {c.diagnostico.length > 45 ? c.diagnostico.substring(0, 45) + "…" : c.diagnostico}
                                </span>
                              ) : "—"}
                            </td>
                            <td style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                              {c.doctorId
                                ? `${c.doctorId.nombres} ${c.doctorId.apellidos}`
                                : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="hcm-empty-hint">Sin consultas atendidas registradas.</p>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ─── TAB: CONSULTAS ─── */}
      {tab === "consultas" && (
        <div className="hcm-consultas-list">
          {citasAtendidas.length === 0 ? (
            <div className="hcm-empty">
              <BookOpen size={28} color="var(--text-muted)" />
              <p>Sin consultas atendidas registradas.</p>
            </div>
          ) : (
            citasAtendidas.map((c: any) => {
              const isOpen = expanded.has(c._id);
              const soap   = parsearSOAP(c.notasClinicas);
              return (
                <div key={c._id} className="hcm-consulta-card">
                  <button
                    className="hcm-consulta-header"
                    onClick={() => toggleCita(c._id)}
                  >
                    <div className="hcm-consulta-header-left">
                      <Calendar size={13} color="var(--primary)" />
                      <span className="hcm-consulta-fecha">
                        {formatFecha(c.fecha)} - {c.hora}
                      </span>
                      {c.diagnostico && (
                        <span className="hcm-dx-tag-small">
                          {c.diagnostico.length > 50 ? c.diagnostico.substring(0, 50) + "…" : c.diagnostico}
                        </span>
                      )}
                    </div>
                    {isOpen
                      ? <ChevronDown size={15} color="var(--text-muted)" />
                      : <ChevronRight size={15} color="var(--text-muted)" />}
                  </button>

                  {isOpen && (
                    <div className="hcm-consulta-body">
                      {soap ? (
                        <>
                          {soap.motivoConsulta && (
                            <div className="hcm-soap-row">
                              <span className="hcm-soap-lbl">Motivo</span>
                              <span className="hcm-soap-val">{soap.motivoConsulta}</span>
                            </div>
                          )}
                          {soap.diagnoses?.length > 0 && (
                            <div className="hcm-soap-row">
                              <span className="hcm-soap-lbl">Diagnósticos</span>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {soap.diagnoses.map((d) => (
                                  <span key={d.code} className="hcm-dx-tag-small">
                                    {d.code} - {d.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {soap.evaluacion && (
                            <div className="hcm-soap-row">
                              <span className="hcm-soap-lbl">Evaluación clínica</span>
                              <span className="hcm-soap-val">{soap.evaluacion}</span>
                            </div>
                          )}
                          {soap.medicamentos?.length > 0 && (
                            <div className="hcm-soap-row">
                              <span className="hcm-soap-lbl">Medicamentos prescritos</span>
                              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                {soap.medicamentos.map((m) => (
                                  <span key={`${m.nombre}-${m.concentracion}-${m.frecuencia}`} className="hcm-med-item-small">
                                    {m.nombre} {m.concentracion} - {m.frecuencia} · {m.duracion}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="hcm-empty-hint">Sin nota SOAP registrada para esta consulta.</p>
                      )}
                      {c.doctorId && (
                        <div className="hcm-soap-row" style={{ marginTop: 8, borderTop: "1px solid var(--border)", paddingTop: 8 }}>
                          <span className="hcm-soap-lbl">Médico</span>
                          <span className="hcm-soap-val">
                            {c.doctorId.nombres} {c.doctorId.apellidos}
                            {c.doctorId.especialidadId?.nombre && ` · ${c.doctorId.especialidadId.nombre}`}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ─── TAB: ESTUDIOS ─── */}
      {tab === "estudios" && (
        <div className="hcm-estudios">
          {ordenes.length === 0 ? (
            <div className="hcm-empty">
              <FlaskConical size={28} color="var(--text-muted)" />
              <p>Sin órdenes de examen registradas.</p>
            </div>
          ) : (
            <div className="hcm-card">
              <div className="hcm-card-title">Órdenes de Examen</div>
              <div className="table-container">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Exámenes</th>
                      <th>Estado</th>
                      <th>Médico</th>
                      <th>Resultados</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordenes.map((o: any) => (
                      <tr key={o._id}>
                        <td style={{ whiteSpace: "nowrap", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                          {formatFecha(o.fecha)}
                        </td>
                        <td>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {o.items?.slice(0, 3).map((item: any, i: number) => (
                              <span key={item._id ?? item.examenId?._id ?? `ex-${i}`} className="hcm-examen-tag">
                                {item.examenId?.nombre ?? item.nombre ?? "Examen"}
                              </span>
                            ))}
                            {(o.items?.length ?? 0) > 3 && (
                              <span className="hcm-examen-tag-more">
                                +{o.items.length - 3} más
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`hcm-orden-estado hcm-orden-estado--${(o.estado ?? "").toLowerCase()}`}>
                            {o.estado}
                          </span>
                        </td>
                        <td style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                          {o.doctorId
                            ? `${o.doctorId.nombres} ${o.doctorId.apellidos}`
                            : "—"}
                        </td>
                        <td>
                          {o.estado === "FINALIZADO" && o.archivoResultadoUrl ? (
                            <a
                              className="hcm-resultado-link"
                              href={o.archivoResultadoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <FileText size={13} /> Ver PDF
                            </a>
                          ) : (
                            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                              Pendiente
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
