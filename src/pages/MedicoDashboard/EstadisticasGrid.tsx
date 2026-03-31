import { Calendar, Clock, CheckCircle, XCircle } from "lucide-react";
import type { ReactNode } from "react";

interface Estadisticas {
  citasHoy: number;
  pendientes: number;
  atendidas: number;
  canceladas: number;
}

interface Props {
  estadisticas: Estadisticas;
}

const STATS: { label: string; key: keyof Estadisticas; color: string; icon: ReactNode }[] = [
  { label: "Citas Hoy",   key: "citasHoy",   color: "blue",   icon: <Calendar size={20} /> },
  { label: "Pendientes",  key: "pendientes",  color: "yellow", icon: <Clock size={20} /> },
  { label: "Atendidas",   key: "atendidas",   color: "green",  icon: <CheckCircle size={20} /> },
  { label: "Canceladas",  key: "canceladas",  color: "red",    icon: <XCircle size={20} /> },
];

const EstadisticasGrid = ({ estadisticas }: Props) => (
  <div className="stats-grid">
    {STATS.map(({ label, key, color, icon }) => (
      <div key={key} className="stat-card">
        <div className="stat-card-content">
          <div className="stat-info">
            <p className="stat-label">{label}</p>
            <p className={`stat-value ${color}`}>{estadisticas[key]}</p>
          </div>
          <div className="stat-icon">{icon}</div>
        </div>
      </div>
    ))}
  </div>
);

export default EstadisticasGrid;
