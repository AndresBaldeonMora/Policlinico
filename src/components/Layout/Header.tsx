import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header-content">
        <h1 className="header-title">🏥 Policlínico</h1>
        <nav className="header-nav">
          <Link to="/" className="nav-link">Dashboard</Link>
          <Link to="/reserva-cita" className="nav-link">Nueva Cita</Link>
          <Link to="/lista-citas" className="nav-link">Lista de Citas</Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;