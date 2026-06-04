import type { FormEvent, KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/userAuth";
import { Mail, Lock, AlertCircle, ArrowRight, Eye, EyeOff } from "lucide-react";
import "./Login.css";

import doctor1 from "../../../assets/Doctor1.jpg";
import doctor2 from "../../../assets/Doctor2.jpg";
import doctor3 from "../../../assets/Doctor3.jpg";

const SLIDES = [doctor1, doctor2, doctor3];

const Login = () => {
  const { login, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const passRef = useRef<HTMLInputElement>(null);
  const [slideIdx, setSlideIdx] = useState(() => Math.floor(Math.random() * SLIDES.length));
  const [fadeIn, setFadeIn] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setSlideIdx(prev => (prev + 1) % SLIDES.length);
        setFadeIn(true);
      }, 500);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCorreoKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      passRef.current?.focus();
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const redirectMap: Record<string, string> = {
      MEDICO:         "/medico",
      RECEPCIONISTA:  "/",
      administrador:  "/admin",
      paciente:       "/paciente",
      cliente:        "/",
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
        {/* Imagen de fondo rotativa */}
        <img
          key={slideIdx}
          src={SLIDES[slideIdx]}
          alt="Policlínico"
          className={`login-slide-img ${fadeIn ? "login-slide-img--in" : "login-slide-img--out"}`}
        />

        {/* Indicadores de slide */}
        <div className="login-slide-dots">
          {SLIDES.map((_, i) => (
            <span key={i} className={`login-slide-dot ${i === slideIdx ? "login-slide-dot--active" : ""}`} />
          ))}
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
                <><span className="login-spinner" />Verificando…</>
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
