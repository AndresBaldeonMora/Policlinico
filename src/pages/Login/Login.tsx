import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/userAuth";
import "./Login.css";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!correo || !password) {
      setError("Ingresa tu correo y contraseña.");
      return;
    }

    setCargando(true);

    try {
      await login(correo, password);

      const rawUser = localStorage.getItem("user");
      if (rawUser) {
        const user = JSON.parse(rawUser);
        if (user.rol === "MEDICO") {
          navigate("/medico", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Error al iniciar sesión.");
      } else {
        setError("Error al iniciar sesión.");
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">🏥</div>
          <h1>Centro Médico San José</h1>
          <p>Módulo de acceso para personal autorizado.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Correo institucional
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="usuario@clinica.com"
              autoComplete="email"
            />
          </label>

          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </label>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-button" disabled={cargando}>
            {cargando ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <div className="login-footer">
          <span>Recepción y Médicos</span>
          <span className="dot">•</span>
          <span>Acceso interno</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
