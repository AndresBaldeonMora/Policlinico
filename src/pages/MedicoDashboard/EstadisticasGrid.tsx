interface Estadisticas {
  citasHoy: number;
  pendientes: number;
  atendidas: number;
  canceladas: number;
}

interface Props {
  estadisticas: Estadisticas;
}

const STATS = [
  { label: "Citas Hoy",   key: "citasHoy",   color: "blue",   icon: "📅" },
  { label: "Pendientes",  key: "pendientes",  color: "yellow", icon: "⏳" },
  { label: "Atendidas",   key: "atendidas",   color: "green",  icon: "✅" },
  { label: "Canceladas",  key: "canceladas",  color: "red",    icon: "❌" },
] as const;

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