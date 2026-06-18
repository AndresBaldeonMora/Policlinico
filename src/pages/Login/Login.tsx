import type { FormEvent, KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/userAuth";
import ForgotPasswordModal from "./ForgotPasswordModal";
import {
  Mail, Lock, AlertCircle, ArrowRight, Eye, EyeOff,
  ShieldCheck, CheckCircle2, Check,
} from "lucide-react";
import "./Login.css";

import doctor1 from "../../../assets/Doctor1.jpg";
import doctor2 from "../../../assets/Doctor2.jpg";
import doctor3 from "../../../assets/Doctor3.jpg";

const SLIDES = [doctor1, doctor2, doctor3];

/* ── Medical-cross tile ── */
function CrossTile() {
  return (
    <div className="lv-tile">
      <span className="lv-cross-v" />
      <span className="lv-cross-h" />
    </div>
  );
}

/* ── Brand lockup: tile + SIGEM + sub ── */
function Lockup({ light = false }: { light?: boolean }) {
  return (
    <div className={`lv-lockup${light ? " lv-lockup--light" : ""}`}>
      <CrossTile />
      <div className="lv-lockup-txt">
        <span className="lv-lockup-name">SIGEM</span>
        <span className="lv-lockup-sub">Policlínico San José</span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   LOGIN PAGE — Variant B
   Form (tinted, izq) · Foto + brand overlay (der)
════════════════════════════════════════════ */
const Login = () => {
  const { login, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [correo, setCorreo]     = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [error, setError]       = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const passRef  = useRef<HTMLInputElement>(null);
  const [slideIdx, setSlideIdx] = useState(() => Math.floor(Math.random() * SLIDES.length));

  /* slideshow — todas las imágenes están en el DOM (precargadas), solo cambia la activa */
  useEffect(() => {
    const id = setInterval(() => {
      setSlideIdx(p => (p + 1) % SLIDES.length);
    }, 8000);
    return () => clearInterval(id);
  }, []);

  /* redirect after login */
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const map: Record<string, string> = {
      MEDICO: "/medico", RECEPCIONISTA: "/", administrador: "/admin",
      paciente: "/paciente", cliente: "/",
    };
    navigate(map[user.rol] ?? "/", { replace: true });
  }, [isAuthenticated, user, navigate]);

  const handleCorreoKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.preventDefault(); passRef.current?.focus(); }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!correo || !password) { setError("Ingresa tu correo y contraseña."); return; }
    setCargando(true);
    try {
      await login(correo, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
    <div className="login-page">

      {/* ── LEFT: form panel (tinted) ── */}
      <div className="lv-panel-form">
        <div className="lv-form-inner">

          <Lockup />

          <div className="lv-head">
            <h1 className="lv-title">Bienvenido</h1>
            <p className="lv-subtitle">Ingresa tus credenciales para acceder al sistema</p>
          </div>

          <form className="lv-form" onSubmit={handleSubmit} noValidate>

            {/* Correo */}
            <label className="lv-field">
              <span className="lv-label">Correo electrónico</span>
              <div className="lv-input-wrap">
                <span className="lv-input-icon"><Mail size={18} /></span>
                <input
                  type="email" autoComplete="username"
                  placeholder="nombre@clinica.com"
                  value={correo}
                  onChange={e => setCorreo(e.target.value)}
                  onKeyDown={handleCorreoKey}
                  disabled={cargando}
                />
              </div>
            </label>

            {/* Contraseña */}
            <label className="lv-field">
              <span className="lv-label">Contraseña</span>
              <div className="lv-input-wrap">
                <span className="lv-input-icon"><Lock size={18} /></span>
                <input
                  ref={passRef}
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={cargando}
                />
                <button
                  type="button" className="lv-eye"
                  aria-label={showPass ? "Ocultar" : "Mostrar"}
                  onClick={() => setShowPass(s => !s)}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {/* Remember + forgot */}
            <div className="lv-row">
              <label className="lv-remember">
                <input
                  type="checkbox" checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                />
                <span className="lv-check">{remember && <Check size={11} strokeWidth={3} />}</span>
                Recordar sesión
              </label>
              <button
                type="button"
                className="lv-forgot"
                onClick={() => setShowForgot(true)}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="lv-error" role="alert">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button type="submit" className={`lv-btn lv-btn--${cargando ? "loading" : "idle"}`} disabled={cargando}>
              {cargando
                ? <><span className="lv-spin" /> Verificando…</>
                : <>Ingresar <ArrowRight size={16} /></>
              }
            </button>
          </form>

          <div className="lv-secure">
            <ShieldCheck size={14} />
            Conexión cifrada · Acceso exclusivo para personal autorizado
          </div>
        </div>
      </div>

      {/* ── RIGHT: photo + brand overlay ── */}
      <div className="lv-panel-photo">
        {SLIDES.map((src, i) => (
          <img
            key={i}
            src={src}
            alt="Policlínico San José"
            className={`lv-slide-img ${i === slideIdx ? "lv-slide-img--in" : "lv-slide-img--out"}`}
          />
        ))}

        {/* gradient scrim */}
        <div className="lv-brand-scrim" />

        {/* brand overlay */}
        <div className="lv-brand-over">
          <div className="lv-brand-top">
            <Lockup light />
          </div>
          <div className="lv-brand-bottom">
            <h2 className="lv-brand-h">Cuidamos de cada paciente, todos los días.</h2>
            <div className="lv-brand-chips">
              <span><ShieldCheck size={14} /> Historia clínica protegida</span>
              <span><CheckCircle2 size={14} /> Certificación ISO 9001</span>
            </div>
          </div>
        </div>

        {/* slide dots */}
        <div className="lv-dots">
          {SLIDES.map((_, i) => (
            <span key={i} className={`lv-dot${i === slideIdx ? " lv-dot--active" : ""}`} />
          ))}
        </div>
      </div>

    </div>

    {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
    </>
  );
};

export default Login;
