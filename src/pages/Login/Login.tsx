import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/userAuth";
import { Mail, Lock, AlertCircle, ArrowRight, HeartPulse, Stethoscope, Pill, Shield, Activity, Heart } from "lucide-react";
import "./Login.css";

const FLOATING_ICONS = [
  { Icon: Stethoscope, x: 8, y: 15, delay: 0, size: 22 },
  { Icon: Heart, x: 85, y: 20, delay: 1.5, size: 18 },
  { Icon: Pill, x: 12, y: 70, delay: 3, size: 20 },
  { Icon: Shield, x: 90, y: 65, delay: 0.8, size: 19 },
  { Icon: Activity, x: 75, y: 85, delay: 2.2, size: 21 },
  { Icon: HeartPulse, x: 20, y: 88, delay: 4, size: 17 },
];

const Login = () => {
  const { login, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    navigate(user.rol === "MEDICO" ? "/medico" : "/", { replace: true });
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
      {/* Animated background */}
      <div className="login-bg">
        <div className="login-orb login-orb--1" />
        <div className="login-orb login-orb--2" />
        <div className="login-orb login-orb--3" />

        {/* ECG heartbeat line */}
        <svg className="login-ecg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path
            className="login-ecg-line"
            d="M0,60 L200,60 L220,60 L240,20 L260,100 L280,40 L300,80 L320,60 L500,60 L520,60 L540,15 L560,105 L580,35 L600,85 L620,60 L800,60 L820,60 L840,20 L860,100 L880,40 L900,80 L920,60 L1200,60"
            fill="none"
          />
        </svg>
        <svg className="login-ecg login-ecg--2" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path
            className="login-ecg-line login-ecg-line--2"
            d="M0,60 L200,60 L220,60 L240,20 L260,100 L280,40 L300,80 L320,60 L500,60 L520,60 L540,15 L560,105 L580,35 L600,85 L620,60 L800,60 L820,60 L840,20 L860,100 L880,40 L900,80 L920,60 L1200,60"
            fill="none"
          />
        </svg>

        {/* Floating medical icons */}
        {FLOATING_ICONS.map(({ Icon, x, y, delay, size }, i) => (
          <div
            key={i}
            className="login-float-icon"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              animationDelay: `${delay}s`,
            }}
          >
            <Icon size={size} />
          </div>
        ))}
      </div>

      <div className="login-card-wrapper">
        {/* Logo + Branding */}
        <div className="login-brand-top">
          <div className="login-logo-pulse">
            <HeartPulse size={28} strokeWidth={2} />
          </div>
          <h1 className="login-main-title">Policlinico</h1>
          <p className="login-main-sub">Sistema de Gestion Clinica</p>
        </div>

        {/* Card */}
        <div className="login-card">
          <div className="login-card-header">
            <h2>Iniciar Sesion</h2>
            <p>Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            <div className="login-field">
              <label className="login-label" htmlFor="correo">Correo</label>
              <div className="login-input-wrap">
                <span className="login-input-icon"><Mail size={16} /></span>
                <input id="correo" type="email" className="login-input"
                  value={correo} onChange={(e) => setCorreo(e.target.value)}
                  placeholder="usuario@clinica.com" autoComplete="email" disabled={cargando} />
              </div>
            </div>

            <div className="login-field">
              <label className="login-label" htmlFor="password">Contrasena</label>
              <div className="login-input-wrap">
                <span className="login-input-icon"><Lock size={16} /></span>
                <input id="password" type="password" className="login-input"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contrasena" autoComplete="current-password" disabled={cargando} />
              </div>
            </div>

            {error && (
              <div className="login-error" role="alert">
                <AlertCircle size={14} /> {error}
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
        </div>

        <p className="login-footer-text">Acceso exclusivo para personal autorizado</p>
      </div>
    </div>
  );
};

export default Login;
