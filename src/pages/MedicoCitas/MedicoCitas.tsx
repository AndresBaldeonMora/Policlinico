import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MedicoApiService } from "../../services/medico.service";
import type { CitaMedico, MedicoPerfil } from "../../services/medico.service";
import {
  Search, User, Play, FileText,
} from "lucide-react";
import { toISODateLocal } from "../../utils/fecha.utils";
import "../ListaCitas/ListaCitas.css";
import "./MedicoCitas.css";

// ─── Constantes ────────────────────────────────────────────────────────────────

const ESTADO_CONFIG: Record<string, { class: string; label: string }> = {
  PENDIENTE:    { class: "badge-info",         label: "Pendiente" },
  REPROGRAMADA: { class: "badge-reprogramada", label: "Reprogramada" },
  ATENDIDA:     { class: "badge-success",      label: "Atendida" },
  CANCELADA:    { class: "badge-danger",       label: "Cancelada" },
  ASISTIO:      { class: "badge-asistio",      label: "En sala" },
  VENCIDA:      { class: "badge-vencida",      label: "Vencida" },
};

const TIPO_CONFIG: Record<string, { label: string; cls: string }> = {
  NUEVA:       { label: "1ª Consulta", cls: "mc-tipo-nueva" },
  SEGUIMIENTO: { label: "Seguimiento", cls: "mc-tipo-seguim" },
  CONSULTA:    { label: "Consulta",    cls: "mc-tipo-nueva" },
  LABORATORIO: { label: "Laboratorio", cls: "mc-tipo-lab" },
  REMOTA:      { label: "Remota",      cls: "mc-tipo-nueva" },
  DOMICILIO:   { label: "Domicilio",   cls: "mc-tipo-nueva" },
};

const ESTADOS_FILTER = ["ASISTIO", "PENDIENTE", "ATENDIDA", "CANCELADA"];

const normalize = (s: string) =>
  (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const calcAge = (fechaNac?: string) => {
  if (!fechaNac) return "";
  const diff = Date.now() - new Date(fechaNac).getTime();
  return `${Math.floor(diff / (365.25 * 24 * 3600 * 1000))} a.`;
};

// ─── Componente ───────────────────────────────────────────────────────────────

export default function MedicoCitas() {
  const navigate = useNavigate();

  const [perfil, setPerfil]               = useState<MedicoPerfil | null>(null);
  const [cargandoPerfil, setCargandoPerfil] = useState(true);
  const [todasCitas, setTodasCitas]       = useState<CitaMedico[]>([]);
  const [filtroEstado, setFiltro]         = useState("PENDIENTE");
  const [busqueda, setBusqueda]           = useState("");
  const [cargandoLista, setCargandoLista] = useState(true);

  useEffect(() => {
    MedicoApiService.obtenerMiPerfil()
      .then(setPerfil)
      .catch(console.error)
      .finally(() => setCargandoPerfil(false));
  }, []);

  useEffect(() => {
    setCargandoLista(true);
    MedicoApiService.obtenerMisCitas()
      .then(setTodasCitas)
      .catch(console.error)
      .finally(() => setCargandoLista(false));
  }, []);

  const hoyISO = toISODateLocal(new Date());

  const toMin = (hora: string) => {
    const [h, m] = (hora || "00:00").split(":").map(Number);
    return h * 60 + (m || 0);
  };
  const ahoraMin = new Date().getHours() * 60 + new Date().getMinutes();

  const citasFiltradas = useMemo(() => {
    return todasCitas
      .filter(c => c.fecha.slice(0, 10) === hoyISO)
      .filter(c => {
        const pasaEstado =
          filtroEstado === "PENDIENTE"
            ? c.estado === "PENDIENTE" || c.estado === "REPROGRAMADA"
            : c.estado === filtroEstado;
        const term = normalize(busqueda);
        const pasaBusqueda = !term ||
          normalize(`${c.pacienteId.nombres} ${c.pacienteId.apellidos}`).includes(term) ||
          normalize(c.pacienteId.dni).includes(term) ||
          (c.notas && normalize(c.notas).includes(term));
        return pasaEstado && pasaBusqueda;
      })
      .sort((a, b) =>
        toMin(a.hora) - toMin(b.hora) ||
        Math.abs(toMin(a.hora) - ahoraMin) - Math.abs(toMin(b.hora) - ahoraMin)
      );
  }, [todasCitas, hoyISO, filtroEstado, busqueda, ahoraMin]);

  const fechaHoyLabel = new Date().toLocaleDateString("es-PE", {
    weekday: "long", day: "numeric", month: "long",
  });

  if (cargandoPerfil) {
    return (
      <div className="lista-page">
        <div className="lista-loading">
          <div className="lista-loading-spinner" />
          <p>Cargando…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lista-page">

      <div className="lista-page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1>Mis Citas</h1>
          <p className="lista-page-subtitle mc-fecha-subtitle">{fechaHoyLabel}</p>
        </div>
      </div>

      <div className="mc-toolbar">
        <div className="lista-search-bar">
          <Search size={16} className="lista-search-icon" />
          <input
            type="text"
            placeholder="Buscar por nombre, DNI o motivo..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="lista-search-input"
          />
        </div>
        <div className="mc-filters">
          {ESTADOS_FILTER.map(e => (
            <button
              key={e}
              className={`mc-filter-btn${filtroEstado === e ? " mc-filter-btn--active" : ""}`}
              onClick={() => setFiltro(e)}
            >
              {ESTADO_CONFIG[e]?.label ?? e}
            </button>
          ))}
        </div>
      </div>

      {cargandoLista ? (
        <div className="lista-loading">
          <div className="lista-loading-spinner" />
          <p>Cargando citas…</p>
        </div>
      ) : (
        <div className="lista-table-card">
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th style={{ width: 80 }}>Hora</th>
                  <th style={{ width: 230 }}>Paciente</th>
                  <th style={{ width: 50 }}>Edad</th>
                  <th style={{ width: 100 }}>Tipo</th>
                  <th style={{ width: 100 }}>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {citasFiltradas.length > 0 ? citasFiltradas.map(c => {
                  const pac       = c.pacienteId;
                  const iniciales = `${pac.nombres[0] ?? ""}${pac.apellidos[0] ?? ""}`.toUpperCase();
                  const edad      = calcAge(pac.fechaNacimiento);
                  const puedeConsultar = c.estado === "PENDIENTE" || c.estado === "ASISTIO";
                  return (
                    <tr key={c._id}>
                      <td>
                        <span className="mc-hora-badge">{c.hora || "—"}</span>
                      </td>
                      <td>
                        <div className="td-person">
                          <div className="td-avatar">{iniciales}</div>
                          <div className="td-person-info">
                            <span className="td-person-name">{pac.nombres} {pac.apellidos}</span>
                            <span className="td-person-sub">{pac.dni}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{edad}</td>
                      <td>
                        {(() => {
                          const key = c.subtipoCita ?? c.tipo?.toUpperCase() ?? "";
                          const t = TIPO_CONFIG[key] ?? { label: key || "-", cls: "mc-tipo-nueva" };
                          return key
                            ? <span className={`mc-tipo-badge ${t.cls}`}>{t.label}</span>
                            : <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>—</span>;
                        })()}
                      </td>
                      <td>
                        <span className={`badge ${ESTADO_CONFIG[c.estado]?.class ?? ""}`}>
                          {ESTADO_CONFIG[c.estado]?.label ?? c.estado}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => navigate(`/pacientes/${pac._id}`)}
                            title="Ver historia clínica"
                          >
                            <FileText size={12} /> HC
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => navigate(`/citas/${c._id}`)}
                          >
                            Perfil
                          </button>
                          {puedeConsultar && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => navigate(`/medico/citas/${c._id}/consulta`)}
                            >
                              <Play size={12} /> Iniciar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={6} className="td-empty">
                      <User size={28} className="td-empty-icon" />
                      <p>
                        {filtroEstado === "PENDIENTE"
                          ? "No hay citas pendientes para hoy."
                          : `No hay citas con estado "${ESTADO_CONFIG[filtroEstado]?.label}" para hoy.`}
                      </p>
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
