import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { X, Phone, ExternalLink, Calendar, FlaskConical } from "lucide-react";
import { PacienteApiService } from "../../services/paciente.service";
import "./PacienteDrawer.css";

type TabDrawer = "citas" | "presupuestos";

const ESTADO_CITA: Record<string, { label: string; cls: string }> = {
  PENDIENTE:    { label: "Por confirmar",   cls: "pd-estado--pendiente" },
  ASISTIO:      { label: "En sala",         cls: "pd-estado--asistio" },
  ATENDIDA:     { label: "Confirmada",      cls: "pd-estado--atendida" },
  CANCELADA:    { label: "Cancelada",       cls: "pd-estado--cancelada" },
  REPROGRAMADA: { label: "Reprogramada",    cls: "pd-estado--reprogramada" },
};

const ESTADO_ORDEN: Record<string, string> = {
  PENDIENTE:    "Pendiente",
  EN_PROCESO:   "En proceso",
  ASISTIDO:     "Asistido",
  FINALIZADO:   "Finalizado",
  CANCELADA:    "Cancelada",
  // Alias defensivo para datos heredados sin migrar (VENCIDA → Cancelada)
  VENCIDA:      "Cancelada",
};

const fmtFecha = (iso: string) =>
  new Date(iso + (iso.length === 10 ? "T00:00:00" : "")).toLocaleDateString("es-PE", {
    day: "2-digit", month: "short", year: "numeric", timeZone: "UTC",
  });

const calcEdad = (fechaNac?: string): string => {
  if (!fechaNac) return "";
  const diff = Date.now() - new Date(fechaNac).getTime();
  return `${Math.floor(diff / (365.25 * 24 * 3600 * 1000))} años`;
};

interface Props {
  pacienteId: string;
  onCerrar: () => void;
}

export default function PacienteDrawer({ pacienteId, onCerrar }: Props) {
  const navigate  = useNavigate();
  const [tab, setTab]         = useState<TabDrawer>("citas");
  const [loading, setLoading] = useState(true);
  const [paciente, setPaciente] = useState<any>(null);
  const [citas,    setCitas]    = useState<any[]>([]);
  const [ordenes,  setOrdenes]  = useState<any[]>([]);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await PacienteApiService.obtenerHistorial(pacienteId);
      setPaciente(data.paciente);
      setCitas(data.citas?.data ?? []);
      setOrdenes(data.ordenes?.data ?? []);
    } catch {
      /* silencioso */
    } finally {
      setLoading(false);
    }
  }, [pacienteId]);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onCerrar(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onCerrar]);

  const nombre   = paciente ? `${paciente.apellidos}, ${paciente.nombres}` : "Cargando…";
  const iniciales = paciente
    ? `${paciente.nombres?.[0] ?? ""}${paciente.apellidos?.[0] ?? ""}`.toUpperCase()
    : "?";
  const edad     = calcEdad(paciente?.fechaNacimiento);

  return (
    <>
      {/* Overlay izquierdo */}
      <div className="pd-overlay" onClick={onCerrar} aria-hidden="true" />

      {/* Drawer */}
      <aside className="pd-drawer" role="complementary" aria-label="Datos del paciente">
        {/* ── Header ── */}
        <div className="pd-header">
          <div className="pd-avatar">{iniciales}</div>
          <div className="pd-header-info">
            <div className="pd-header-top">
              <h2 className="pd-nombre">{nombre}</h2>
              <button
                className="pd-abrir-historia"
                onClick={() => { onCerrar(); navigate(`/pacientes/${pacienteId}`); }}
                title="Abrir historia completa"
              >
                Abrir historia <ExternalLink size={13} />
              </button>
            </div>
            <div className="pd-meta">
              {edad && <span>{edad}</span>}
              {paciente?.telefono && (
                <>
                  <span className="pd-meta-sep">|</span>
                  <span><Phone size={12} style={{ verticalAlign: "middle", marginRight: 3 }} />{paciente.telefono}</span>
                </>
              )}
            </div>
          </div>
          <button className="pd-close" onClick={onCerrar} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        {/* ── Nota general ── */}
        <div className="pd-nota-section">
          <span className="pd-nota-label">Nota general</span>
          <textarea
            className="pd-nota-textarea"
            placeholder="Escribe aquí..."
            rows={2}
          />
        </div>

        {/* ── Tabs ── */}
        <div className="pd-tabs">
          <button
            className={`pd-tab${tab === "citas" ? " pd-tab--active" : ""}`}
            onClick={() => setTab("citas")}
          >
            <Calendar size={14} /> Citas
          </button>
          <button
            className={`pd-tab${tab === "presupuestos" ? " pd-tab--active" : ""}`}
            onClick={() => setTab("presupuestos")}
          >
            <FlaskConical size={14} /> Presupuestos
          </button>
        </div>

        {/* ── Contenido ── */}
        <div className="pd-body">
          {loading ? (
            <div className="pd-loading">
              <div className="spinner-small" />
              <p>Cargando…</p>
            </div>
          ) : tab === "citas" ? (
            <CitasTab citas={citas} />
          ) : (
            <PresupuestosTab ordenes={ordenes} />
          )}
        </div>
      </aside>
    </>
  );
}

/* ── Tab: Citas ── */
function CitasTab({ citas }: { citas: any[] }) {
  if (citas.length === 0) {
    return <p className="pd-empty">Sin citas registradas.</p>;
  }

  return (
    <div className="pd-table-wrap">
      <table className="pd-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Doctor</th>
            <th>Motivo</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {citas.map((c: any) => {
            const doc = c.doctorId && typeof c.doctorId === "object" ? c.doctorId : null;
            const tipo = c.subtipoCita ?? c.tipo ?? "Consulta";
            const { label, cls } = ESTADO_CITA[c.estado] ?? { label: c.estado, cls: "" };
            return (
              <tr key={c._id}>
                <td className="pd-td-fecha">
                  <span>{fmtFecha(c.fecha)}</span>
                  <span className="pd-td-hora">{c.hora}</span>
                </td>
                <td title={doc ? `${doc.nombres} ${doc.apellidos}` : "—"}>
                  {doc ? `${doc.nombres} ${doc.apellidos}` : "—"}
                </td>
                <td title={tipo}>{tipo}</td>
                <td><span className={`pd-estado ${cls}`}>{label}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── Tab: Presupuestos (Órdenes) ── */
function PresupuestosTab({ ordenes }: { ordenes: any[] }) {
  if (ordenes.length === 0) {
    return <p className="pd-empty">Sin órdenes registradas.</p>;
  }

  return (
    <div className="pd-ordenes">
      {ordenes.map((o: any) => (
        <div key={o._id ?? o.id} className="pd-orden-card">
          <div className="pd-orden-header">
            <div className="pd-orden-titulo">
              <span className="pd-orden-badge">{o.tipoOrden ?? "ORDEN"}</span>
              <span className="pd-orden-codigo">{o.codigoOrden ?? "—"}</span>
            </div>
            <span className="pd-orden-estado">{ESTADO_ORDEN[o.estado] ?? o.estado}</span>
          </div>

          {o.examenes?.length > 0 && (
            <table className="pd-orden-tabla">
              <thead>
                <tr>
                  <th>Ítem</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {o.examenes.map((ex: any, i: number) => (
                  <tr key={ex.id ?? i}>
                    <td>{typeof ex.examenId === "object" ? ex.examenId?.nombre : (ex.nombre ?? "—")}</td>
                    <td>{ex.estado ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="pd-orden-footer">
            <span>Médico: {o.doctorId ? `${o.doctorId.nombres} ${o.doctorId.apellidos}` : (o.medicoNombre ?? "—")}</span>
            <span>{o.fechaCreacion ? fmtFecha(String(o.fechaCreacion)) : ""}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
