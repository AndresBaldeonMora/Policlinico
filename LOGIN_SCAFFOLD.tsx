/**
 * SCAFFOLD RÁPIDO: LOGIN - Copia y pega para replicar al 100%
 * Versión: Variant B (Form izq 50% + Photo der 50%)
 *
 * INSTRUCCIONES:
 * 1. Copia este archivo como base para tu nueva página de login
 * 2. Reemplaza los nombres de clase si deseas (ej: "lv-" por otro prefijo)
 * 3. Copia el CSS de LOGIN_DESIGN_MAPPING.md
 * 4. Importa tus imágenes en SLIDES
 * 5. Adapta la lógica de login según tu API
 */

import type { FormEvent, KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/userAuth";
import {
  Mail, Lock, AlertCircle, ArrowRight, Eye, EyeOff,
  ShieldCheck, CheckCircle2, Check,
} from "lucide-react";
import "./Login.css"; // ← Copia el CSS de aquí

import doctor1 from "../../../assets/Doctor1.jpg";
import doctor2 from "../../../assets/Doctor2.jpg";
import doctor3 from "../../../assets/Doctor3.jpg";

// ═══════════════════════════════════════════════════════════
// 1. SLIDES - Edita estas imágenes
// ═══════════════════════════════════════════════════════════
const SLIDES = [doctor1, doctor2, doctor3];

// ═══════════════════════════════════════════════════════════
// 2. COMPONENTES AUXILIARES
// ═══════════════════════════════════════════════════════════

/**
 * CrossTile - Icono verde con cruz médica
 */
function CrossTile() {
  return (
    <div className="lv-tile">
      <span className="lv-cross-v" />
      <span className="lv-cross-h" />
    </div>
  );
}

/**
 * Lockup - Logo + Brand name (SIGEM)
 * @param light - Si es true, el texto es blanco (para usar en foto)
 */
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

// ═══════════════════════════════════════════════════════════
// 3. MAIN COMPONENT - LOGIN
// ═══════════════════════════════════════════════════════════

const Login = () => {
  // ─────────────────────────────────────────────────────────
  // 3.1 HOOKS & STATE
  // ─────────────────────────────────────────────────────────
  const { login, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Form inputs
  const [correo, setCorreo]     = useState("");
  const [password, setPassword] = useState("");

  // UI states
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [error, setError]       = useState("");

  // Refs
  const passRef = useRef<HTMLInputElement>(null);

  // Slideshow
  const [slideIdx, setSlideIdx] = useState(() => Math.floor(Math.random() * SLIDES.length));

  // ─────────────────────────────────────────────────────────
  // 3.2 EFFECT: Slideshow auto-rotation (cada 8 segundos)
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setSlideIdx(p => (p + 1) % SLIDES.length);
    }, 8000); // ← Cambiar 8000 si quieres otro intervalo
    return () => clearInterval(id);
  }, []);

  // ─────────────────────────────────────────────────────────
  // 3.3 EFFECT: Redirect after login
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const map: Record<string, string> = {
      MEDICO: "/medico",
      RECEPCIONISTA: "/",
      administrador: "/admin",
      paciente: "/paciente",
      cliente: "/",
    };
    navigate(map[user.rol] ?? "/", { replace: true });
  }, [isAuthenticated, user, navigate]);

  // ─────────────────────────────────────────────────────────
  // 3.4 HANDLERS
  // ─────────────────────────────────────────────────────────

  /**
   * Keyboard handler: Enter en email → focus password
   */
  const handleCorreoKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      passRef.current?.focus();
    }
  };

  /**
   * Form submit: validar y llamar a login
   */
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión.");
    } finally {
      setCargando(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  // 3.5 RENDER
  // ─────────────────────────────────────────────────────────

  return (
    <div className="login-page">

      {/* ════════════════════════════════════════════════
          LEFT PANEL - FORM (50% width, blanco)
          ════════════════════════════════════════════════ */}
      <div className="lv-panel-form">
        <div className="lv-form-inner">

          {/* 🏷️ Lockup (Logo + Brand) */}
          <Lockup />

          {/* 🎯 Heading (Título + Subtítulo) */}
          <div className="lv-head">
            <h1 className="lv-title">Bienvenido</h1>
            <p className="lv-subtitle">Ingresa tus credenciales para acceder al sistema</p>
          </div>

          {/* 📝 FORMULARIO */}
          <form className="lv-form" onSubmit={handleSubmit} noValidate>

            {/* 📧 CAMPO EMAIL */}
            <label className="lv-field">
              <span className="lv-label">Correo electrónico</span>
              <div className="lv-input-wrap">
                <span className="lv-input-icon">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  autoComplete="username"
                  placeholder="nombre@clinica.com"
                  value={correo}
                  onChange={e => setCorreo(e.target.value)}
                  onKeyDown={handleCorreoKey}
                  disabled={cargando}
                />
              </div>
            </label>

            {/* 🔐 CAMPO PASSWORD */}
            <label className="lv-field">
              <span className="lv-label">Contraseña</span>
              <div className="lv-input-wrap">
                <span className="lv-input-icon">
                  <Lock size={18} />
                </span>
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
                  type="button"
                  className="lv-eye"
                  aria-label={showPass ? "Ocultar" : "Mostrar"}
                  onClick={() => setShowPass(s => !s)}
                  disabled={cargando}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {/* ☑️ REMEMBER + FORGOT */}
            <div className="lv-row">
              <label className="lv-remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                />
                <span className="lv-check">
                  {remember && <Check size={11} strokeWidth={3} />}
                </span>
                Recordar sesión
              </label>
              <a
                className="lv-forgot"
                href="#"
                onClick={e => e.preventDefault()}
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            {/* ❌ ERROR ALERT */}
            {error && (
              <div className="lv-error" role="alert">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            {/* ✅ SUBMIT BUTTON */}
            <button
              type="submit"
              className={`lv-btn lv-btn--${cargando ? "loading" : "idle"}`}
              disabled={cargando}
            >
              {cargando ? (
                <>
                  <span className="lv-spin" />
                  Verificando…
                </>
              ) : (
                <>
                  Ingresar
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* 🔒 SECURITY NOTE */}
          <div className="lv-secure">
            <ShieldCheck size={14} />
            Conexión cifrada · Acceso exclusivo para personal autorizado
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          RIGHT PANEL - PHOTO + OVERLAY (50% width)
          ════════════════════════════════════════════════ */}
      <div className="lv-panel-photo">

        {/* 🖼️ SLIDESHOW - Rotating images */}
        {SLIDES.map((src, i) => (
          <img
            key={i}
            src={src}
            alt="Policlínico San José"
            className={`lv-slide-img ${i === slideIdx ? "lv-slide-img--in" : "lv-slide-img--out"}`}
          />
        ))}

        {/* 🌑 GRADIENT SCRIM - Oscurecimiento */}
        <div className="lv-brand-scrim" />

        {/* 🏷️ BRAND OVERLAY - Top + Bottom */}
        <div className="lv-brand-over">

          {/* Top: Lockup blanco */}
          <div className="lv-brand-top">
            <Lockup light />
          </div>

          {/* Bottom: Tagline + Features */}
          <div className="lv-brand-bottom">
            <h2 className="lv-brand-h">
              Cuidamos de cada paciente, todos los días.
            </h2>
            <div className="lv-brand-chips">
              <span>
                <ShieldCheck size={14} />
                Historia clínica protegida
              </span>
              <span>
                <CheckCircle2 size={14} />
                Certificación ISO 9001
              </span>
            </div>
          </div>
        </div>

        {/* 🔘 SLIDE INDICATORS - Dots */}
        <div className="lv-dots">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={`lv-dot${i === slideIdx ? " lv-dot--active" : ""}`}
            />
          ))}
        </div>
      </div>

    </div>
  );
};

export default Login;

// ═══════════════════════════════════════════════════════════
// CUSTOMIZACIÓN RÁPIDA
// ═══════════════════════════════════════════════════════════
/*
  1. CAMBIAR IMÁGENES:
     - Reemplaza doctor1, doctor2, doctor3 imports
     - Edita SLIDES array

  2. CAMBIAR TEXTOS:
     - "Bienvenido" → tu título
     - "Ingresa tus credenciales..." → tu subtítulo
     - "Correo electrónico", "Contraseña" → tus labels
     - "Cuidamos de cada paciente..." → tu tagline
     - Features en lv-brand-chips

  3. CAMBIAR COLORES:
     - Edit LOGIN.css (variables en secciones de color)
     - Primary: #10b981 (verde emerald)
     - Cambiar por tu color en:
       * .lv-tile background gradient
       * .lv-input-wrap input:focus border-color
       * .lv-btn background gradient
       * Etc.

  4. CAMBIAR INTERVALO SLIDESHOW:
     - Línea: setInterval(() => {...}, 8000)
     - Cambiar 8000 por millisegundos deseados
     - Ej: 5000 = 5 segundos

  5. CAMBIAR ROLES & REDIRECTS:
     - Editar objeto "map" en useEffect de redirect
     - MEDICO: "/medico" → tu ruta
     - Etc.

  6. CAMBIAR ANIMACIONES:
     - Editar @keyframes en CSS
     - lvFormIn: entrada del form
     - lvShake: error shake
     - lvSpin: loading spinner
     - Etc.
*/
