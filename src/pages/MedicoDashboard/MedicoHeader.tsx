import { Mail, BadgeCheck, Calendar, Clock, CheckCircle, XCircle } from "lucide-react";
import type { MedicoPerfil } from "../../services/medico.service";

interface Estadisticas {
  citasHoy: number;
  pendientes: number;
  atendidas: number;
  canceladas: number;
}

interface Props {
  perfil: MedicoPerfil;
  estadisticas: Estadisticas;
}

const STATS = [
  { label: "Citas hoy", key: "citasHoy" as const, icon: <Calendar size={16} />, clase: "stat-chip--info" },
  { label: "Pendientes", key: "pendientes" as const, icon: <Clock size={16} />, clase: "stat-chip--warning" },
  { label: "Atendidas", key: "atendidas" as const, icon: <CheckCircle size={16} />, clase: "stat-chip--success" },
  { label: "Canceladas", key: "canceladas" as const, icon: <XCircle size={16} />, clase: "stat-chip--danger" },
];

const MedicoHeader = ({ perfil, estadisticas }: Props) => (
  <div className="medico-hero">
    <div className="medico-hero-top">
      <div className="medico-hero-profile">
        <div className="medico-hero-avatar">
          {perfil.nombres.charAt(0)}{perfil.apellidos.charAt(0)}
        </div>
        <div className="medico-hero-info">
          <h1>Dr. {perfil.nombres} {perfil.apellidos}</h1>
          <div className="medico-hero-tags">
            <span className="medico-hero-tag medico-hero-tag--primary">{perfil.especialidadId.nombre}</span>
            {perfil.cmp && <span className="medico-hero-tag medico-hero-tag--muted"><BadgeCheck size={12} /> CMP {perfil.cmp}</span>}
            <span className="medico-hero-tag medico-hero-tag--muted"><Mail size={12} /> {perfil.correo}</span>
          </div>
        </div>
      </div>
    </div>
    <div className="medico-hero-stats">
      {STATS.map(({ label, key, icon, clase }) => (
        <div key={key} className={`stat-chip ${clase}`}>
          <div className="stat-chip-icon">{icon}</div>
          <div className="stat-chip-data">
            <span className="stat-chip-value">{estadisticas[key]}</span>
            <span className="stat-chip-label">{label}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default MedicoHeader;
