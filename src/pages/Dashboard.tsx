import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <h1>Dashboard - Sistema de Reservas</h1>
      
      <div className="dashboard-cards">
        <div className="card stat-card">
          <h3>Citas de Hoy</h3>
          <p className="stat-number">12</p>
        </div>
        
        <div className="card stat-card">
          <h3>Doctores Disponibles</h3>
          <p className="stat-number">8</p>
        </div>
        
        <div className="card stat-card">
          <h3>Citas Pendientes</h3>
          <p className="stat-number">25</p>
        </div>
      </div>

      <div className="card">
        <h2>Próximas Citas</h2>
        <p className="text-muted">Funcionalidad próximamente...</p>
      </div>
    </div>
  );
};

export default Dashboard;