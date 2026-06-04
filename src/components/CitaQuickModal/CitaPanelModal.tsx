import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight, CalendarCheck, ClipboardList, User, Trash2, ChevronDown,
  CalendarClock, ArmchairIcon, MessageCircle,
} from "lucide-react";
import type { CitaTransformada } from "../../services/cita.service";
import { horasHastaCitaISO } from "../../utils/fecha.utils";
import "./CitaPanelModal.css";

interface Posicion { x: number; y: number }

interface Props {
  cita: CitaTransformada;
  posicion: Posicion;
  onCerrar: () => void;
  onVerDetalle: (citaId: string) => void;
  onReprogramar: (cita: CitaTransformada) => void;
  onEnSalaEspera: (citaId: string) => void;
  onEliminar: (citaId: string) => void;
  onDatosPaciente: (pacienteId: string) => void;
}

const ESTADO_LABEL: Record<string, string> = {
  PENDIENTE:    "Pendiente",
  ASISTIO:      "En sala",
  ATENDIDA:     "Atendida",
  CANCELADA:    "Cancelada",
  REPROGRAMADA: "Reprogramada",
};

const ESTADO_CLASS: Record<string, string> = {
  PENDIENTE:    "cpop-badge--pendiente",
  ASISTIO:      "cpop-badge--asistio",
  ATENDIDA:     "cpop-badge--atendida",
  CANCELADA:    "cpop-badge--cancelada",
  REPROGRAMADA: "cpop-badge--reprogramada",
};

function sumarMinutos(hora: string, mins: number): string {
  const [h, m] = hora.split(":").map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

const POPOVER_W = 270;
const POPOVER_H_EST = 420;

const CitaPanelModal = ({
  cita, posicion, onCerrar, onVerDetalle, onReprogramar, onEnSalaEspera, onEliminar, onDatosPaciente,
}: Props) => {
  const navigate = useNavigate();
  const popRef   = useRef<HTMLDivElement>(null);
  const [estadoAbierto, setEstadoAbierto] = useState(false);

  const paciente  = cita.pacienteId && typeof cita.pacienteId === "object" ? cita.pacienteId : null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const citaAny   = cita as any;
  const tipo      = citaAny.subtipoCita ?? citaAny.tipo ?? "Consulta";
  const horaFin   = sumarMinutos(cita.hora, 30);

  // Reglas de reprogramación: solo PENDIENTE y con al menos 24 h de anticipación.
  const fueraDePlazo    = horasHastaCitaISO(cita.fecha, cita.hora) < 24;
  const puedeReprogramar =
    cita.estado === "PENDIENTE" && !fueraDePlazo;
  const motivoDeshabilitado =
    cita.estado === "REPROGRAMADA"
      ? "Esta cita ya fue reprogramada y no admite una segunda reprogramación"
      : cita.estado !== "PENDIENTE"
      ? "Solo se pueden reprogramar citas en estado Pendiente"
      : fueraDePlazo
      ? "No se puede reprogramar: quedan menos de 24 h para la cita"
      : undefined;

  /* ── Calcular posición inteligente ── */
  const left = posicion.x + POPOVER_W > window.innerWidth
    ? posicion.x - POPOVER_W - 8
    : posicion.x + 8;
  const top = posicion.y + POPOVER_H_EST > window.innerHeight
    ? Math.max(8, window.innerHeight - POPOVER_H_EST - 8)
    : posicion.y;

  /* ── Cerrar con Escape y click fuera ── */
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onCerrar(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onCerrar]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) onCerrar();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onCerrar]);

  useEffect(() => { popRef.current?.focus(); }, []);

  const handleFicha = () => {
    if (paciente?._id) { onCerrar(); navigate(`/pacientes/${paciente._id}`); }
  };

  const handleDatosPaciente = () => {
    if (paciente?._id) { onCerrar(); onDatosPaciente(paciente._id); }
  };

  const handleWhatsApp = () => {
    if (!paciente?.telefono) return;
    const numero = paciente.telefono.replace(/\D/g, "");
    window.open(`https://wa.me/51${numero}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="cpop-card"
      ref={popRef}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      style={{ left, top }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── Estado actual + sub-menú de estados ── */}
      <div className="cpop-estado-section">
        <span className={`cpop-badge ${ESTADO_CLASS[cita.estado] ?? ""}`}>
          {ESTADO_LABEL[cita.estado] ?? cita.estado}
        </span>
        <button
          className={`cpop-estado-toggle${estadoAbierto ? " cpop-estado-toggle--open" : ""}`}
          onClick={() => setEstadoAbierto(v => !v)}
          title="Cambiar estado"
        >
          <ChevronDown size={14} />
        </button>
      </div>

      {/* Sub-menú de estados */}
      {estadoAbierto && (
        <div className="cpop-estados-submenu">
          <button
            className="cpop-estado-item"
            onClick={() => { onEnSalaEspera(cita._id); onCerrar(); }}
          >
            <ArmchairIcon size={15} className="cpop-estado-item-icon" />
            En sala de espera
          </button>
          <button
            className="cpop-estado-item"
            disabled={!puedeReprogramar}
            title={motivoDeshabilitado}
            onClick={() => { setEstadoAbierto(false); onReprogramar(cita); }}
          >
            <CalendarClock size={15} className="cpop-estado-item-icon" />
            Reprogramar
          </button>
        </div>
      )}

      <div className="cpop-divider" />

      {/* ── Tarjeta de cita — clickeable → CitaQuickModal ── */}
      <button className="cpop-cita-row" onClick={() => onVerDetalle(cita._id)}>
        <div className="cpop-cita-info">
          <span className="cpop-cita-nombre">
            {paciente ? `${paciente.nombres} ${paciente.apellidos}` : "—"}
          </span>
          <span className="cpop-cita-hora">{cita.hora} – {horaFin}</span>
          <span className="cpop-cita-motivo">Motivo: {tipo}</span>
        </div>
        <CalendarCheck size={16} className="cpop-cita-icon" />
      </button>

      <div className="cpop-divider" />

      {/* ── Menú de acciones ── */}
      <button className="cpop-menu-item" onClick={handleDatosPaciente}>
        <User size={16} className="cpop-menu-icon" />
        <span>Datos del paciente</span>
        <ChevronRight size={14} className="cpop-menu-arrow" />
      </button>

      <button className="cpop-menu-item" onClick={handleFicha}>
        <ClipboardList size={16} className="cpop-menu-icon" />
        <span>Ficha médica</span>
        <ChevronRight size={14} className="cpop-menu-arrow" />
      </button>

      {paciente?.telefono && (
        <button className="cpop-menu-item cpop-menu-item--whatsapp" onClick={handleWhatsApp}>
          <MessageCircle size={16} className="cpop-menu-icon" />
          <span>WhatsApp</span>
          <ChevronRight size={14} className="cpop-menu-arrow" />
        </button>
      )}

      <div className="cpop-divider" />

      <button
        className="cpop-menu-item cpop-menu-item--danger"
        onClick={() => { onCerrar(); onEliminar(cita._id); }}
      >
        <Trash2 size={16} className="cpop-menu-icon" />
        <span>Eliminar cita</span>
      </button>
    </div>
  );
};

export default CitaPanelModal;
