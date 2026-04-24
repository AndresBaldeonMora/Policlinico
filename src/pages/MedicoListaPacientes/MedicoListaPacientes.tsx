import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Users, BookOpen } from "lucide-react";
import { MedicoApiService } from "../../services/medico.service";
import type { CitaMedico } from "../../services/medico.service";
import "../ListaCitas/ListaCitas.css";
import "./MedicoListaPacientes.css";

interface PacienteDerived {
  _id: string;
  nombres: string;
  apellidos: string;
  dni: string;
  fechaNacimiento?: string;
  edad: string;
  ultimaVisita: string;
  ultimaFecha: Date | null;
  diagnostico: string | null;
  estado: "Activo" | "Sin seguimiento";
  totalCitas: number;
}

const calcAge = (fechaNac?: string): string => {
  if (!fechaNac) return "—";
  const diff = Date.now() - new Date(fechaNac).getTime();
  return `${Math.floor(diff / (365.25 * 24 * 3600 * 1000))} a.`;
};

const relativeFecha = (date: Date | null): string => {
  if (!date) return "—";
  const diffDias = Math.floor((Date.now() - date.getTime()) / (24 * 3600 * 1000));
  if (diffDias === 0) return "Hoy";
  if (diffDias === 1) return "Ayer";
  if (diffDias < 30) return `Hace ${diffDias} días`;
  const meses = Math.floor(diffDias / 30);
  return `Hace ${meses} mes${meses > 1 ? "es" : ""}`;
};

const normalize = (s: string) =>
  (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const derivarPacientes = (citas: CitaMedico[]): PacienteDerived[] => {
  const map = new Map<string, { pac: CitaMedico["pacienteId"]; citas: CitaMedico[] }>();
  citas.forEach(c => {
    const pid = c.pacienteId._id;
    if (!map.has(pid)) map.set(pid, { pac: c.pacienteId, citas: [] });
    map.get(pid)!.citas.push(c);
  });

  return Array.from(map.values()).map(({ pac, citas: cs }) => {
    const sorted = [...cs].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    const ultima = sorted[0];
    const ultimaFecha = ultima ? new Date(ultima.fecha) : null;
    const atendidaConDx = sorted.find(c => c.estado === "ATENDIDA" && c.diagnostico);
    const tieneProxima  = cs.some(c => c.estado === "PENDIENTE");

    return {
      _id:         pac._id,
      nombres:     pac.nombres,
      apellidos:   pac.apellidos,
      dni:         pac.dni,
      fechaNacimiento: pac.fechaNacimiento,
      edad:        calcAge(pac.fechaNacimiento),
      ultimaVisita: relativeFecha(ultimaFecha),
      ultimaFecha,
      diagnostico: atendidaConDx?.diagnostico ?? null,
      estado:      tieneProxima ? "Activo" : "Sin seguimiento",
      totalCitas:  cs.length,
    };
  }).sort((a, b) => {
    if (!a.ultimaFecha) return 1;
    if (!b.ultimaFecha) return -1;
    return b.ultimaFecha.getTime() - a.ultimaFecha.getTime();
  });
};

export default function MedicoListaPacientes() {
  const navigate  = useNavigate();
  const [cargando,   setCargando]   = useState(true);
  const [pacientes,  setPacientes]  = useState<PacienteDerived[]>([]);
  const [busqueda,   setBusqueda]   = useState("");
  const [filtroEst,  setFiltroEst]  = useState<"TODOS" | "Activo" | "Sin seguimiento">("TODOS");

  useEffect(() => {
    MedicoApiService.obtenerMisCitas()
      .then(citas => setPacientes(derivarPacientes(citas)))
      .catch(console.error)
      .finally(() => setCargando(false));
  }, []);

  const filtrados = pacientes.filter(p => {
    const term = normalize(busqueda);
    const pasaBusqueda = !term ||
      normalize(`${p.nombres} ${p.apellidos}`).includes(term) ||
      normalize(p.dni).includes(term);
    const pasaEstado = filtroEst === "TODOS" || p.estado === filtroEst;
    return pasaBusqueda && pasaEstado;
  });

  return (
    <div className="lista-page">
      <div className="lista-page-header">
        <div>
          <h1>Mis Pacientes</h1>
          <p className="lista-page-subtitle">
            {filtrados.length} paciente{filtrados.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mlp-toolbar">
        <div className="lista-search-bar">
          <Search size={16} className="lista-search-icon" />
          <input
            type="text"
            placeholder="Buscar por nombre o DNI..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="lista-search-input"
          />
        </div>
        <div className="mlp-filters">
          {(["TODOS", "Activo", "Sin seguimiento"] as const).map(f => (
            <button
              key={f}
              className={`mc-filter-btn${filtroEst === f ? " mc-filter-btn--active" : ""}`}
              onClick={() => setFiltroEst(f)}
            >
              {f === "TODOS" ? "Todos" : f}
            </button>
          ))}
        </div>
      </div>

      {cargando ? (
        <div className="lista-loading">
          <div className="lista-loading-spinner" />
          <p>Cargando pacientes...</p>
        </div>
      ) : (
        <div className="lista-table-card">
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th style={{ width: 230 }}>Paciente</th>
                  <th style={{ width: 110 }}>DNI</th>
                  <th style={{ width: 60 }}>Edad</th>
                  <th style={{ width: 130 }}>Última visita</th>
                  <th>Diagnóstico</th>
                  <th style={{ width: 130 }}>Estado</th>
                  <th style={{ width: 130 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.length > 0 ? (
                  filtrados.map(p => {
                    const iniciales = `${p.nombres[0] ?? ""}${p.apellidos[0] ?? ""}`.toUpperCase();
                    const esActivo  = p.estado === "Activo";
                    return (
                      <tr key={p._id}>
                        {/* Paciente */}
                        <td>
                          <div className="td-person">
                            <div className="td-avatar mlp-avatar">{iniciales}</div>
                            <div className="td-person-info">
                              <span className="td-person-name">{p.nombres} {p.apellidos}</span>
                              <span className="td-person-sub mlp-citas-count">
                                {p.totalCitas} cita{p.totalCitas !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* DNI */}
                        <td><span className="td-mono">{p.dni}</span></td>

                        {/* Edad */}
                        <td style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                          {p.edad}
                        </td>

                        {/* Última visita */}
                        <td>
                          <span className={`mlp-visita ${p.ultimaVisita === "Hoy" ? "mlp-visita--hoy" : ""}`}>
                            {p.ultimaVisita}
                          </span>
                        </td>

                        {/* Diagnóstico */}
                        <td style={{ maxWidth: 240 }}>
                          {p.diagnostico ? (
                            <span className="mlp-dx-tag">
                              {p.diagnostico.length > 60
                                ? p.diagnostico.substring(0, 60) + "…"
                                : p.diagnostico}
                            </span>
                          ) : (
                            <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>—</span>
                          )}
                        </td>

                        {/* Estado */}
                        <td>
                          <span className={`mlp-estado-badge ${esActivo ? "mlp-estado-badge--activo" : "mlp-estado-badge--sin"}`}>
                            <span className="modern-badge-dot" />
                            {p.estado}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td>
                          <button
                            className="btn-action btn-action--primary"
                            onClick={() => navigate(`/medico/pacientes/${p._id}`)}
                            title="Ver historia clínica"
                          >
                            <BookOpen size={13} /> Ver historial
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="td-empty">
                      <Users size={28} className="td-empty-icon" />
                      <p>No hay pacientes que coincidan con la búsqueda.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
