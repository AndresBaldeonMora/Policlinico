import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { AuthService } from "../../services/auth.service";

interface Props {
  onCambioExitoso: () => void;
}

export default function CambiarPasswordModal({ onCambioExitoso }: Props) {
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNuevo, setPasswordNuevo] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showActual, setShowActual] = useState(false);
  const [showNuevo, setShowNuevo] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (passwordNuevo.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (passwordNuevo !== passwordConfirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (passwordActual === passwordNuevo) {
      setError("La nueva contraseña debe ser diferente a la actual.");
      return;
    }
    setCargando(true);
    try {
      await AuthService.cambiarPassword(passwordActual, passwordNuevo);
      onCambioExitoso();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? "Error al cambiar la contraseña.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 2000,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "var(--bg-card)", borderRadius: 14, padding: "32px 28px", width: 400,
        maxWidth: "92vw", boxShadow: "var(--shadow-xl)", border: "1px solid var(--border)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: "var(--primary-light, #eff6ff)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Lock size={18} style={{ color: "var(--primary)" }} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
              Cambiar contraseña
            </h2>
          </div>
        </div>
        <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
          Por seguridad, debes establecer una nueva contraseña antes de continuar.
        </p>

        {error && (
          <div style={{
            background: "var(--error-light, #fef2f2)", border: "1px solid var(--error, #dc2626)",
            borderRadius: 8, padding: "10px 14px", marginBottom: 16,
            fontSize: 13, color: "var(--error, #dc2626)",
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <PasswordField
            label="Contraseña actual"
            value={passwordActual}
            show={showActual}
            onToggle={() => setShowActual(v => !v)}
            onChange={setPasswordActual}
            disabled={cargando}
          />
          <PasswordField
            label="Nueva contraseña"
            value={passwordNuevo}
            show={showNuevo}
            onToggle={() => setShowNuevo(v => !v)}
            onChange={setPasswordNuevo}
            disabled={cargando}
          />
          <PasswordField
            label="Confirmar nueva contraseña"
            value={passwordConfirm}
            show={showConfirm}
            onToggle={() => setShowConfirm(v => !v)}
            onChange={setPasswordConfirm}
            disabled={cargando}
          />

          <button
            type="submit"
            disabled={cargando || !passwordActual || !passwordNuevo || !passwordConfirm}
            style={{
              marginTop: 4, padding: "11px 0", border: "none", borderRadius: 9,
              background: cargando || !passwordActual || !passwordNuevo || !passwordConfirm
                ? "var(--border)" : "var(--primary)",
              color: cargando || !passwordActual || !passwordNuevo || !passwordConfirm
                ? "var(--text-muted)" : "white",
              cursor: cargando || !passwordActual || !passwordNuevo || !passwordConfirm
                ? "not-allowed" : "pointer",
              fontSize: 14, fontWeight: 600,
            }}
          >
            {cargando ? "Guardando…" : "Establecer nueva contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}

interface PasswordFieldProps {
  label: string;
  value: string;
  show: boolean;
  onToggle: () => void;
  onChange: (v: string) => void;
  disabled: boolean;
}

function PasswordField({ label, value, show, onToggle, onChange, disabled }: PasswordFieldProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          style={{
            width: "100%", boxSizing: "border-box",
            padding: "10px 40px 10px 12px",
            border: "1px solid var(--border)", borderRadius: 8,
            fontSize: 13, background: "var(--bg-body)", color: "var(--text-primary)",
            outline: "none",
          }}
        />
        <button
          type="button"
          onClick={onToggle}
          tabIndex={-1}
          style={{
            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer",
            color: "var(--text-muted)", padding: 0, lineHeight: 1,
          }}
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
}
