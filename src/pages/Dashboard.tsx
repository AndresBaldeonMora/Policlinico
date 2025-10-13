import './Dashboard.css';

const Dashboard = () => {
  const quickActions = [
    { 
      title: 'Solicitar citas', 
      icon: '📅', 
      color: '#e0f2fe',
      iconColor: '#0284c7',
      link: '/reserva-cita'
    },
    { 
      title: 'Gestión de citas', 
      icon: '📋', 
      color: '#f3e8ff',
      iconColor: '#9333ea',
      link: '/lista-citas'
    },
    { 
      title: 'Médicos', 
      icon: '👨‍⚕️', 
      color: '#fef3c7',
      iconColor: '#d97706',
      link: '/doctores'
    },
    { 
      title: 'Pacientes', 
      icon: '👥', 
      color: '#dcfce7',
      iconColor: '#16a34a',
      link: '/pacientes'
    },
  ];

  const todayStats = [
    {
      label: 'Citas de Hoy',
      value: '24',
      icon: '📅',
      color: '#3b82f6',
      bgColor: '#dbeafe'
    },
    {
      label: 'Pendientes',
      value: '8',
      icon: '⏳',
      color: '#f59e0b',
      bgColor: '#fef3c7'
    },
    {
      label: 'Completadas',
      value: '16',
      icon: '✅',
      color: '#10b981',
      bgColor: '#d1fae5'
    },
    {
      label: 'Médicos Activos',
      value: '12',
      icon: '👨‍⚕️',
      color: '#8b5cf6',
      bgColor: '#ede9fe'
    }
  ];

  const recentAppointments = [
    {
      id: 1,
      paciente: 'Juan Carlos Pérez',
      dni: '72345678',
      doctor: 'Dr. López Martínez',
      especialidad: 'Medicina General',
      hora: '10:00 AM',
      estado: 'Confirmada'
    },
    {
      id: 2,
      paciente: 'María González Silva',
      dni: '71234567',
      doctor: 'Dra. Martínez Ruiz',
      especialidad: 'Pediatría',
      hora: '11:30 AM',
      estado: 'En espera'
    },
    {
      id: 3,
      paciente: 'Carlos Rodríguez Díaz',
      dni: '70123456',
      doctor: 'Dr. García Soto',
      especialidad: 'Cardiología',
      hora: '02:00 PM',
      estado: 'Confirmada'
    },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-hero">
        <div className="hero-content">
          <div className="hero-text">
            <h2 className="hero-title">Panel de Control - Gestión de Citas</h2>
            <p className="hero-subtitle">Administra citas, pacientes y médicos de forma eficiente</p>
          </div>
          <div className="hero-image">
            <div className="hero-illustration">
              <span style={{ fontSize: '5rem' }}>🏥</span>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas del día */}
      <section className="stats-section">
        <h2 className="section-title">Resumen del Día</h2>
        <div className="stats-grid">
          {todayStats.map((stat, index) => (
            <div key={index} className="stat-card" style={{ borderLeftColor: stat.color }}>
              <div className="stat-icon" style={{ backgroundColor: stat.bgColor, color: stat.color }}>
                {stat.icon}
              </div>
              <div className="stat-info">
                <p className="stat-label">{stat.label}</p>
                <h3 className="stat-value">{stat.value}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Acciones rápidas */}
      <section className="quick-actions-section">
        <h2 className="section-title">¿Qué deseas hacer?</h2>
        <div className="quick-actions">
          {quickActions.map((action, index) => (
            <div 
              key={index} 
              className="action-card"
              style={{ backgroundColor: action.color }}
              onClick={() => window.location.href = action.link}
            >
              <div 
                className="action-icon"
                style={{ color: action.iconColor }}
              >
                {action.icon}
              </div>
              <p className="action-title" style={{ color: action.iconColor }}>
                {action.title}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Citas recientes */}
      <section className="appointments-section">
        <div className="section-header">
          <h2 className="section-title">Citas Programadas Hoy</h2>
          <a href="/lista-citas" className="link-all">ver todas</a>
        </div>

        <div className="appointments-list">
          {recentAppointments.map((appointment) => (
            <div key={appointment.id} className="appointment-card">
              <div className="appointment-time-badge">
                <span className="time-icon">⏰</span>
                <span className="time-text">{appointment.hora}</span>
              </div>
              <div className="appointment-details">
                <h3 className="appointment-patient">
                  {appointment.paciente}
                  <span className="patient-dni">DNI: {appointment.dni}</span>
                </h3>
                <p className="appointment-doctor">👨‍⚕️ {appointment.doctor}</p>
                <p className="appointment-specialty">🏥 {appointment.especialidad}</p>
              </div>
              <div className="appointment-meta">
                <span className={`appointment-status ${appointment.estado.toLowerCase().replace(' ', '-')}`}>
                  {appointment.estado}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;