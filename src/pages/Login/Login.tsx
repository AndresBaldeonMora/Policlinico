import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/userAuth";
import "./Login.css";

const Login = () => {
  const { login, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  // Redirige automáticamente cuando el usuario queda autenticado
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (user.rol === "MEDICO") {
      navigate("/medico", { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

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
      // La redirección la maneja el useEffect de arriba
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-bg-circle login-bg-circle--1" />
        <div className="login-bg-circle login-bg-circle--2" />
        <div className="login-bg-circle login-bg-circle--3" />
      </div>

      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="14" fill="#0ea5e9" />
              <path d="M24 10v28M10 24h28" stroke="white" strokeWidth="5" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="login-title">Centro Médico<br />San José</h1>
          <p className="login-subtitle">Sistema de gestión clínica</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <div className="login-field">
            <label className="login-label" htmlFor="correo">Correo institucional</label>
            <div className="login-input-wrap">
              <span className="login-input-icon">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </span>
              <input
                id="correo"
                type="email"
                className="login-input"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="usuario@clinica.com"
                autoComplete="email"
                disabled={cargando}
              />
            </div>
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="password">Contraseña</label>
            <div className="login-input-wrap">
              <span className="login-input-icon">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </span>
              <input
                id="password"
                type="password"
                className="login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={cargando}
              />
            </div>
          </div>

          {error && (
            <div className="login-error" role="alert">
              <svg viewBox="0 0 20 20" fill="currentColor" className="login-error-icon">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <button type="submit" className="login-button" disabled={cargando}>
            {cargando ? (<><span className="login-spinner" />Ingresando...</>) : "Ingresar al sistema"}
          </button>
        </form>

        <div className="login-footer">
          <span>Acceso exclusivo para personal autorizado</span>
        </div>
      </div>
    </div>
  );
};

export default Login;