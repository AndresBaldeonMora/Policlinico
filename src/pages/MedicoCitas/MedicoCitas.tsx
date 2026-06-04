import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MedicoApiService } from "../../services/medico.service";
import type { CitaMedico, MedicoPerfil } from "../../services/medico.service";
import {
  Search, User, Play, FileText, ChevronLeft, ChevronRight,
} from "lucide-react";
import { toISODateLocal, isoADMY } from "../../utils/fecha.utils";
import "../ListaCitas/ListaCitas.css";
import "./MedicoCitas.css";

// ─── Constantes ────────────────────────────────────────────────────────────────

const ESTADO_CONFIG: Record<string, { class: string; label: string }> = {
  PENDIENTE:    { class: "badge-info",         label: "Pendiente" },
  REPROGRAMADA: { class: "badge-reprogramada", label: "Reprogramada" },
  ATENDIDA:     { class: "badge-success",      label: "Atendida" },
  CANCELADA:    { class: "badge-danger",       label: "Cancelada" },
  ASISTIO:      { class: "badge-asistio",      label: "En sala" },
  // Alias defensivo para datos heredados sin migrar (VENCIDA → Cancelada)
  VENCIDA:      { class: "badge-danger",       label: "Cancelada" },
};

const TIPO_CONFIG: Record<string, { label: string; cls: string }> = {
  // Valores del backend (tipo canónico)
  CONSULTA:       { label: "1ª Consulta",  cls: "mc-tipo-nueva" },
  LABORATORIO:    { label: "Laboratorio",  cls: "mc-tipo-lab" },
  REMOTA:         { label: "Remota",       cls: "mc-tipo-nueva" },
  DOMICILIO:      { label: "Domicilio",    cls: "mc-tipo-nueva" },
  INTERCONSULTA:  { label: "Interconsulta",cls: "mc-tipo-seguim" },
  // Aliases de subtipoCita (cuando el booking flow los envía)
  NUEVA:          { label: "1ª Consulta",  cls: "mc-tipo-nueva" },
  SEGUIMIENTO:    { label: "Seguimiento",  cls: "mc-tipo-seguim" },
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

  const [, setPerfil]                     = useState<MedicoPerfil | null>(null);
  const [cargandoPerfil, setCargandoPerfil] = useState(true);
  const [todasCitas, setTodasCitas]       = useState<CitaMedico[]>([]);
  const [filtroEstado, setFiltro]         = useState("PENDIENTE");
  const [busqueda, setBusqueda]           = useState("");
  const [cargandoLista, setCargandoLista] = useState(true);
  const [fechaFiltro, setFechaFiltro]     = useState(() => toISODateLocal(new Date()));
  const fechaInputRef = useRef<HTMLInputElement>(null);

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

  const sumarDias = (iso: string, dias: number): string => {
    const d = new Date(`${iso}T12:00:00`);
    d.setDate(d.getDate() + dias);
    return toISODateLocal(d);
  };

  const toMin = (hora: string) => {
    const [h, m] = (hora || "00:00").split(":").map(Number);
    return h * 60 + (m || 0);
  };
  const ahoraMin = new Date().getHours() * 60 + new Date().getMinutes();

  const citasFiltradas = useMemo(() => {
    return todasCitas
      .filter(c => c.fecha.slice(0, 10) === fechaFiltro)
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
  }, [todasCitas, fechaFiltro, filtroEstado, busqueda, ahoraMin]);

  if (cargandoPerfil) {
    return (
      <div className="lista-page mc-lista-page">
        <div className="lista-loading">
          <div className="lista-loading-spinner" />
          <p>Cargando…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lista-page mc-lista-page">

      <div className="lista-page-header">
        <div>
          <h1>Mis Citas</h1>
          <p className="lista-page-subtitle mc-fecha-subtitle">{isoADMY(fechaFiltro)}</p>
        </div>
      </div>

      {/* ── Filtros ── */}
      <div className="lab-filtros-avanzados" style={{ marginBottom: "1rem" }}>
        {/* Navegador de fecha */}
        <div className="lab-filtro-campo">
          <label className="lab-filtro-label">Fecha</label>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button
              className="lab-cal-nav-btn"
              onClick={() => setFechaFiltro(f => sumarDias(f, -1))}
              title="Día anterior"
            >
              <ChevronLeft size={15} />
            </button>
            <div
              style={{ position: "relative", display: "inline-flex", cursor: "pointer" }}
              onClick={() => fechaInputRef.current?.showPicker()}
            >
              <span style={{
                padding: "0.38rem 0.75rem",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: "0.88rem",
                fontWeight: 600,
                color: "var(--text-primary)",
                background: "var(--bg-body)",
                minWidth: 112,
                textAlign: "center",
                pointerEvents: "none",
                userSelect: "none",
                display: "inline-block",
              }}>
                {isoADMY(fechaFiltro)}
              </span>
              <input
                ref={fechaInputRef}
                type="date"
                value={fechaFiltro}
                onChange={e => setFechaFiltro(e.target.value)}
                style={{ position: "absolute", inset: 0, opacity: 0, pointerEvents: "none", width: "100%", height: "100%" }}
              />
            </div>
            <button
              className="lab-cal-nav-btn"
              onClick={() => setFechaFiltro(f => sumarDias(f, 1))}
              title="Día siguiente"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        {/* Buscador */}
        <div className="lab-filtro-campo" style={{ flex: 1 }}>
          <label className="lab-filtro-label">Buscar</label>
          <div style={{ position: "relative", width: "100%" }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                left: "0.65rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
                pointerEvents: "none",
              }}
            />
            <input
              className="lab-filtro-input"
              placeholder="Buscar por nombre o DNI..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{ paddingLeft: "2.2rem" }}
            />
          </div>
        </div>
      </div>

      {/* ── Tabs de estado ── */}
      <div className="lab-filtros" style={{ marginBottom: "1rem" }} role="tablist">
        {ESTADOS_FILTER.map(e => (
          <button
            key={e}
            role="tab"
            aria-selected={filtroEstado === e}
            className={`lab-filtro-btn${filtroEstado === e ? " active" : ""}`}
            onClick={() => setFiltro(e)}
          >
            <span>{ESTADO_CONFIG[e]?.label ?? e}</span>
          </button>
        ))}
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
                  <th style={{ width: 90 }}>Hora</th>
                  <th>Paciente</th>
                  <th style={{ width: 70 }}>Edad</th>
                  <th style={{ width: 130 }}>Tipo</th>
                  <th style={{ width: 120 }}>Estado</th>
                  <th style={{ width: 240 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {citasFiltradas.length > 0 ? citasFiltradas.map(c => {
                  const pac       = c.pacienteId;
                  const iniciales = `${pac.nombres[0] ?? ""}${pac.apellidos[0] ?? ""}`.toUpperCase();
                  const edad      = calcAge(pac.fechaNacimiento);
                  const puedeConsultar = c.estado === "ASISTIO";
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
                          ? `No hay citas pendientes para el ${isoADMY(fechaFiltro)}.`
                          : `No hay citas con estado "${ESTADO_CONFIG[filtroEstado]?.label}" para el ${isoADMY(fechaFiltro)}.`}
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
