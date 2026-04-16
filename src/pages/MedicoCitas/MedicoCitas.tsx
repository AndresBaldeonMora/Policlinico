import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MedicoApiService } from "../../services/medico.service";
import type { CitaMedico } from "../../services/medico.service";
import { Search, Calendar, Clock, User } from "lucide-react";
import "../ListaCitas/ListaCitas.css";
import "../ListaPacientes/ListaPacientes.css";

const ESTADO_CONFIG: Record<string, { class: string; label: string }> = {
  PENDIENTE:    { class: "badge-info",  label: "Pendiente" },
  REPROGRAMADA: { class: "badge-warning", label: "Reprogramada" },
  ATENDIDA:     { class: "badge-success",  label: "Atendida" },
  CANCELADA:    { class: "badge-danger",   label: "Cancelada" },
};

const normalizeString = (str: string): string =>
  (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const MedicoCitas = () => {
  const [citas, setCitas]               = useState<CitaMedico[]>([]);
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [busqueda, setBusqueda]         = useState("");
  const [cargando, setCargando]         = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    MedicoApiService.obtenerMisCitas()
      .then(setCitas)
      .catch(console.error)
      .finally(() => setCargando(false));
  }, []);

  const citasFiltradas = citas.filter((c) => {
    const pasaEstado    = filtroEstado === "TODOS" || c.estado === filtroEstado;
    const filtro = normalizeString(busqueda);
    const pasaBusqueda  = normalizeString(`${c.pacienteId.nombres} ${c.pacienteId.apellidos}`).includes(filtro) ||
                          normalizeString(c.pacienteId.dni).includes(filtro);
    return pasaEstado && pasaBusqueda;
  });

  return (
    <div className="lista-page">
      <div className="lista-page-header">
        <div>
          <h1>Mis Citas</h1>
          <p className="lista-page-subtitle">{citasFiltradas.length} resultado{citasFiltradas.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', alignItems: 'center' }}>
        <div className="lista-search-bar" style={{ marginBottom: 0, flex: 1, maxWidth: '400px' }}>
          <Search size={18} className="lista-search-icon" />
          <input
            type="text"
            placeholder="Buscar por nombre o DNI..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="lista-search-input"
          />
        </div>
        
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          style={{ 
            width: '200px', 
            padding: '0.625rem 0.875rem', 
            borderRadius: 'var(--radius-md)', 
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: '0.85rem'
          }}
        >
          <option value="TODOS">Todos los estados</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="ATENDIDA">Atendida</option>
          <option value="CANCELADA">Cancelada</option>
          <option value="REPROGRAMADA">Reprogramada</option>
        </select>
      </div>

      {cargando ? (
        <div className="lista-loading">
          <div className="lista-loading-spinner" />
          <p>Cargando citas...</p>
        </div>
      ) : (
        <div className="lista-table-card">
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th style={{ width: 220 }}>Paciente</th>
                  <th style={{ width: 120 }}>DNI</th>
                  <th style={{ width: 140 }}>Fecha / Hora</th>
                  <th style={{ width: 130 }}>Tipo</th>
                  <th style={{ width: 130 }}>Estado</th>
                  <th style={{ width: 80 }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {citasFiltradas.length > 0 ? (
                  citasFiltradas.map((c) => {
                    const estadoInfo = ESTADO_CONFIG[c.estado] || { class: "badge-warning", label: c.estado };
                    const inicialPaciente = c.pacienteId.nombres.charAt(0).toUpperCase();

                    return (
                      <tr key={c._id}>
                        <td>
                          <div className="td-person">
                            <div className="td-avatar">{inicialPaciente}</div>
                            <div className="td-person-info">
                              <span className="td-person-name">{c.pacienteId.nombres} {c.pacienteId.apellidos}</span>
                            </div>
                          </div>
                        </td>
                        <td><span className="td-mono">{c.pacienteId.dni}</span></td>
                        <td>
                          <div className="td-datetime">
                            <span className="td-date"><Calendar size={13} /> {new Date(c.fecha).toLocaleDateString("es-PE", { timeZone: "UTC" })}</span>
                            <span className="td-time"><Clock size={13} /> {c.hora || "—"}</span>
                          </div>
                        </td>
                        <td><span className="td-specialty">{c.tipo || "CONSULTA"}</span></td>
                        <td>
                          <span className={`modern-badge ${estadoInfo.class}`}>
                            <span className="modern-badge-dot" />
                            {estadoInfo.label}
                          </span>
                        </td>
                        <td className="td-center">
                          <button className="btn-action" onClick={() => navigate(`/citas/${c._id}`)} title="Ver detalle">
                            Ver
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                   <tr>
                     <td colSpan={6} className="td-empty">
                       <User size={32} className="td-empty-icon" />
                       <p>No hay citas que coincidan con los filtros.</p>
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
};

export default MedicoCitas;
