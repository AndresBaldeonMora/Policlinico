import { useState, useCallback, useMemo } from "react";
import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle, Check, X } from "lucide-react";
import { PacienteApiService } from "../../../services/paciente.service";
import "./MiCuenta.css";

/* ── Requisitos de contraseña ── */
interface Requisito {
  label: string;
  test: (v: string) => boolean;
}

const REQUISITOS: Requisito[] = [
  { label: "Mínimo 8 caracteres", test: (v) => v.length >= 8 },
  { label: "Al menos una mayúscula", test: (v) => /[A-Z]/.test(v) },
  { label: "Al menos una minúscula", test: (v) => /[a-z]/.test(v) },
  { label: "Al menos un número", test: (v) => /\d/.test(v) },
  { label: "Carácter especial (!@#$%^&*)", test: (v) => /[!@#$%^&*]/.test(v) },
];

/* ── Helpers ── */
function calcularFortaleza(password: string): number {
  if (!password) return 0;
  return REQUISITOS.filter((r) => r.test(password)).length;
}

function getFortalezaInfo(nivel: number): { label: string; color: string; percent: number } {
  if (nivel <= 1) return { label: "Muy débil", color: "var(--error)", percent: 20 };
  if (nivel === 2) return { label: "Débil", color: "var(--warning)", percent: 40 };
  if (nivel === 3) return { label: "Regular", color: "var(--warning)", percent: 60 };
  if (nivel === 4) return { label: "Fuerte", color: "var(--success)", percent: 80 };
  return { label: "Muy fuerte", color: "var(--primary)", percent: 100 };
}

/* ── Component ── */
const MiCuentaSeguridad = () => {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [showActual, setShowActual] = useState(false);
  const [showNueva, setShowNueva] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);

  /* Fortaleza */
  const fortaleza = useMemo(() => calcularFortaleza(nueva), [nueva]);
  const fortalezaInfo = useMemo(() => getFortalezaInfo(fortaleza), [fortaleza]);
  const requisitosStatus = useMemo(() => REQUISITOS.map((r) => ({ ...r, cumplido: r.test(nueva) })), [nueva]);

  /* Validaciones */
  const errores = useMemo(() => {
    const errs: string[] = [];
    if (nueva && nueva === actual) errs.push("La nueva contraseña no puede ser igual a la actual");
    if (confirmar && nueva !== confirmar) errs.push("Las contraseñas no coinciden");
    if (nueva && fortaleza < REQUISITOS.length) errs.push("La contraseña no cumple todos los requisitos");
    return errs;
  }, [actual, nueva, confirmar, fortaleza]);

  const puedeGuardar = actual.length > 0 && nueva.length > 0 && confirmar.length > 0 && errores.length === 0;

  /* Handlers */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!puedeGuardar) return;

      setGuardando(true);
      setMensaje(null);

      try {
        await PacienteApiService.cambiarPassword(actual, nueva, confirmar);
        setMensaje({ tipo: "exito", texto: "Contraseña actualizada correctamente" });
        setActual("");
        setNueva("");
        setConfirmar("");
      } catch (err: any) {
        setMensaje({ tipo: "error", texto: err?.message ?? "Error al cambiar la contraseña. Intenta de nuevo." });
      } finally {
        setGuardando(false);
      }
    },
    [puedeGuardar],
  );

  return (
    <div className="micuenta-seg">
      <h2 className="micuenta-seg__title">Cambiar contraseña</h2>
      <p className="micuenta-seg__desc">Actualiza tu contraseña para mantener tu cuenta segura.</p>

      {/* Mensaje de estado */}
      {mensaje && (
        <div className={`micuenta-seg__msg micuenta-seg__msg--${mensaje.tipo}`} role="alert" aria-live="polite">
          {mensaje.tipo === "exito" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{mensaje.texto}</span>
        </div>
      )}

      <form className="micuenta-seg__form" onSubmit={handleSubmit} noValidate>
        {/* Contraseña actual */}
        <div className="micuenta-seg__field">
          <label className="micuenta-seg__label" htmlFor="seg-actual">Contraseña actual</label>
          <div className="micuenta-seg__input-wrap">
            <input
              id="seg-actual"
              type={showActual ? "text" : "password"}
              className="micuenta-seg__input"
              value={actual}
              onChange={(e) => setActual(e.target.value)}
              placeholder="Ingresa tu contraseña actual"
              autoComplete="current-password"
            />
            <button
              type="button"
              className="micuenta-seg__eye"
              onClick={() => setShowActual((p) => !p)}
              aria-label={showActual ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showActual ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Contraseña nueva */}
        <div className="micuenta-seg__field">
          <label className="micuenta-seg__label" htmlFor="seg-nueva">Nueva contraseña</label>
          <div className="micuenta-seg__input-wrap">
            <input
              id="seg-nueva"
              type={showNueva ? "text" : "password"}
              className="micuenta-seg__input"
              value={nueva}
              onChange={(e) => setNueva(e.target.value)}
              placeholder="Ingresa tu nueva contraseña"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="micuenta-seg__eye"
              onClick={() => setShowNueva((p) => !p)}
              aria-label={showNueva ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showNueva ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Barra de fortaleza */}
          {nueva.length > 0 && (
            <div className="micuenta-seg__strength">
              <div className="micuenta-seg__strength-bar">
                <div
                  className="micuenta-seg__strength-fill"
                  style={{ width: `${fortalezaInfo.percent}%`, backgroundColor: fortalezaInfo.color }}
                />
              </div>
              <span className="micuenta-seg__strength-label" style={{ color: fortalezaInfo.color }}>
                {fortalezaInfo.label}
              </span>
            </div>
          )}

          {/* Requisitos */}
          {nueva.length > 0 && (
            <ul className="micuenta-seg__requisitos">
              {requisitosStatus.map((r) => (
                <li key={r.label} className={`micuenta-seg__req ${r.cumplido ? "micuenta-seg__req--ok" : ""}`}>
                  {r.cumplido ? <Check size={13} /> : <X size={13} />}
                  <span>{r.label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Confirmar contraseña */}
        <div className="micuenta-seg__field">
          <label className="micuenta-seg__label" htmlFor="seg-confirmar">Confirmar contraseña</label>
          <div className="micuenta-seg__input-wrap">
            <input
              id="seg-confirmar"
              type={showConfirmar ? "text" : "password"}
              className="micuenta-seg__input"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              placeholder="Repite tu nueva contraseña"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="micuenta-seg__eye"
              onClick={() => setShowConfirmar((p) => !p)}
              aria-label={showConfirmar ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showConfirmar ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {confirmar && nueva !== confirmar && (
            <p className="micuenta-seg__field-error">Las contraseñas no coinciden</p>
          )}
        </div>

        {/* Errores generales */}
        {nueva && nueva === actual && (
          <p className="micuenta-seg__field-error">La nueva contraseña no puede ser igual a la actual</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          className="btn btn-primary micuenta-seg__submit"
          disabled={!puedeGuardar || guardando}
        >
          {guardando && <Loader2 size={16} className="micuenta-seg__spinner" />}
          <span>{guardando ? "Cambiando..." : "Cambiar contraseña"}</span>
        </button>
      </form>
    </div>
  );
};

export { MiCuentaSeguridad };
export default MiCuentaSeguridad;
