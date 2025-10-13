import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="header-greeting">¡Hola, Miguel!</h1>
          <p className="header-subtitle">Sistema de gestión interna</p>
        </div>
        <div className="header-right">
          <button className="header-notification">
            <span className="notification-icon">🔔</span>
            <span className="notification-badge">3</span>
          </button>
          <div className="header-user">
            <div className="user-avatar">M</div>
            <div className="user-info">
              <p className="user-name">Miguel Admin</p>
              <p className="user-role">Recepcionista</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;