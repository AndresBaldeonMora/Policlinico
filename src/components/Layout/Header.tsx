import { useAuth } from "../../hooks/userAuth";
import "./Header.css";

const Header = () => {
  const { user } = useAuth();

  // Obtener primera letra del nombre para el avatar
  const avatarLetter = user?.nombres?.charAt(0).toUpperCase() || "U";

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="header-greeting">
            ¡Hola, {user?.nombres || "Usuario"}!
          </h1>
          <p className="header-subtitle">Sistema de gestión interna</p>
        </div>
        <div className="header-right">
          <button className="header-notification">
            <span className="notification-icon">🔔</span>
            <span className="notification-badge">3</span>
          </button>
          <div className="header-user">
            <div className="user-avatar">{avatarLetter}</div>
            <div className="user-info">
              <p className="user-name">
                {user ? `${user.nombres} ${user.apellidos}` : "Usuario"}
              </p>
              <p className="user-role">{user?.rol || "Sin rol"}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
