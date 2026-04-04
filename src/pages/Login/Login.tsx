import type { FormEvent, KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/userAuth";
import { Mail, Lock, AlertCircle, ArrowRight, Eye, EyeOff } from "lucide-react";
import "./Login.css";

const Login = () => {
  const { login, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const passRef = useRef<HTMLInputElement>(null);

  const handleCorreoKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      passRef.current?.focus();
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const redirectMap: Record<string, string> = {
    MEDICO:        "/medico",
    ADMINISTRADOR: "/admin",
    RECEPCIONISTA: "/",
  };

  const destination = redirectMap[user.rol] ?? "/";
  navigate(destination, { replace: true });
    // navigate(user.rol === "MEDICO" ? "/medico" : "/", { replace: true });
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!correo || !password) { setError("Ingresa tu correo y contrasena."); return; }
    setCargando(true);
    try {
      await login(correo, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesion.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-page">
      {/* Left panel - visual */}
      <div className="login-panel-left">
        <div className="login-panel-bg">
          <div className="login-grid-pattern" />
          <div className="login-glow login-glow--1" />
          <div className="login-glow login-glow--2" />
        </div>

        <div className="login-panel-content">
          <div className="login-illustration">
            <svg viewBox="0 0 200 200" className="login-svg-art">
              {/* Cross / medical */}
              <rect x="85" y="40" width="30" height="120" rx="15" fill="rgba(255,255,255,0.15)" />
              <rect x="40" y="85" width="120" height="30" rx="15" fill="rgba(255,255,255,0.15)" />
              {/* Pulse line */}
              <polyline
                points="20,120 60,120 72,90 84,150 96,100 108,130 120,120 180,120"
                fill="none"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="login-pulse-line"
              />
              {/* Circles */}
              <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <circle cx="100" cy="100" r="60" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            </svg>
          </div>

          <h2 className="login-panel-title">Sistema de Gestion Clinica</h2>
          <p className="login-panel-desc">
            Administra citas, pacientes y personal medico de manera eficiente y segura.
          </p>

          <div className="login-panel-features">
            <div className="login-feature">
              <span className="login-feature-dot" />
              Gestion de citas en tiempo real
            </div>
            <div className="login-feature">
              <span className="login-feature-dot" />
              Historial clinico de pacientes
            </div>
            <div className="login-feature">
              <span className="login-feature-dot" />
              Panel de control por especialidad
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="login-panel-right">
        <div className="login-form-container">
          <div className="login-form-header">
            <h1>Bienvenido</h1>
            <p>Ingresa tus credenciales para acceder al sistema</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            <div className="login-field">
              <label className="login-label" htmlFor="correo">Correo electronico</label>
              <div className="login-input-wrap">
                <span className="login-input-icon"><Mail size={18} /></span>
                <input
                  id="correo"
                  type="email"
                  className="login-input"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  onKeyDown={handleCorreoKey}
                  placeholder="correo@clinica.com"
                  autoComplete="email"
                  disabled={cargando}
                />
              </div>
            </div>

            <div className="login-field">
              <label className="login-label" htmlFor="password">Contrasena</label>
              <div className="login-input-wrap">
                <span className="login-input-icon"><Lock size={18} /></span>
                <input
                  ref={passRef}
                  id="password"
                  type="password"
                  className="login-input login-input--pass"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contrasena"
                  autoComplete="current-password"
                  disabled={cargando}
                />
                {showPass && password && (
                  <span className="login-pass-preview">{password}</span>
                )}
                <button
                  type="button"
                  className="login-toggle-pass"
                  onMouseDown={() => setShowPass(true)}
                  onMouseUp={() => setShowPass(false)}
                  onMouseLeave={() => setShowPass(false)}
                  onTouchStart={() => setShowPass(true)}
                  onTouchEnd={() => setShowPass(false)}
                  tabIndex={-1}
                  aria-label="Mostrar contrasena"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="login-error" role="alert">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="login-button" disabled={cargando}>
              {cargando ? (
                <><span className="login-spinner" />Verificando...</>
              ) : (
                <>Ingresar <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p className="login-footer-text">Acceso exclusivo para personal autorizado</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
