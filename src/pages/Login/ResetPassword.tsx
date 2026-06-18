import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Check, X } from "lucide-react";
import { AuthService } from "../../services/auth.service";

const REQUISITOS = [
  { label: "Mínimo 8 caracteres",          test: (v: string) => v.length >= 8 },
  { label: "Al menos una mayúscula",        test: (v: string) => /[A-Z]/.test(v) },
  { label: "Al menos una minúscula",        test: (v: string) => /[a-z]/.test(v) },
  { label: "Al menos un número",            test: (v: string) => /\d/.test(v) },
  { label: "Carácter especial (!@#$%^&*)", test: (v: string) => /[!@#$%^&*]/.test(v) },
];

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword]   = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [showConf, setShowConf]   = useState(false);
  const [estado, setEstado]       = useState<"idle" | "cargando" | "exito" | "error">("idle");
  const [errorMsg, setErrorMsg]   = useState("");

  useEffect(() => {
    if (!token) navigate("/login", { replace: true });
  }, [token, navigate]);

  const cumplidos = REQUISITOS.filter(r => r.test(password));
  const valido = cumplidos.length === REQUISITOS.length && password === confirmar;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valido) return;
    setEstado("cargando");
    setErrorMsg("");
    try {
      await AuthService.resetPassword(token, password);
      setEstado("exito");
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message ?? err?.message ?? "Error al restablecer la contraseña.");
      setEstado("error");
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg-body)", padding: 20,
    }}>
      <div style={{
        background: "var(--bg-card)", borderRadius: "var(--radius-lg)",
        padding: "40px 36px", width: 440, maxWidth: "100%",
        boxShadow: "var(--shadow-xl)", border: "1px solid var(--border)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{
            width: 44, height: 44, borderRadius: "var(--radius-md)",
            background: "var(--primary-lighter)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Lock size={20} style={{ color: "var(--primary)" }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
              Nueva contraseña
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>
              Policlínico Parroquial San José
            </p>
          </div>
        </div>

        {estado === "exito" ? (
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <CheckCircle2 size={52} style={{ color: "var(--success)", marginBottom: 16 }} />
            <h2 style={{ margin: "0 0 10px", fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
              ¡Contraseña restablecida!
            </h2>
            <p style={{ margin: "0 0 24px", fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Tu contraseña fue actualizada correctamente. Ya puedes iniciar sesión con tu nueva contraseña.
            </p>
            <button
              onClick={() => navigate("/login")}
              style={{
                padding: "11px 32px", background: "var(--primary)", color: "var(--text-inverse)",
                border: "none", borderRadius: "var(--radius-md)", cursor: "pointer",
                fontSize: 14, fontWeight: 600,
              }}
            >
              Ir al inicio de sesión
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {estado === "error" && (
              <div style={{
                background: "var(--error-bg)", border: "1px solid var(--error)",
                borderRadius: "var(--radius-sm)", padding: "10px 14px",
                fontSize: 13, color: "var(--error)",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <AlertCircle size={15} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Nueva contraseña */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>
                Nueva contraseña
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoFocus
                  disabled={estado === "cargando"}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    padding: "10px 40px 10px 14px", border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)", fontSize: 14, outline: "none",
                    color: "var(--text-primary)", background: "var(--bg-body)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{
                    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)",
                  }}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {password.length > 0 && (
                <ul style={{ margin: "4px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 3 }}>
                  {REQUISITOS.map(r => {
                    const ok = r.test(password);
                    return (
                      <li key={r.label} style={{
                        display: "flex", alignItems: "center", gap: 6,
                        fontSize: 12, color: ok ? "var(--success)" : "var(--text-muted)",
                      }}>
                        {ok ? <Check size={12} /> : <X size={12} />}
                        {r.label}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Confirmar */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>
                Confirmar contraseña
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showConf ? "text" : "password"}
                  value={confirmar}
                  onChange={e => setConfirmar(e.target.value)}
                  disabled={estado === "cargando"}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    padding: "10px 40px 10px 14px", border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)", fontSize: 14, outline: "none",
                    color: "var(--text-primary)", background: "var(--bg-body)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConf(v => !v)}
                  style={{
                    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)",
                  }}
                >
                  {showConf ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {confirmar && password !== confirmar && (
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--error)" }}>
                  Las contraseñas no coinciden
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!valido || estado === "cargando"}
              style={{
                marginTop: 4, padding: "11px 0", border: "none",
                borderRadius: "var(--radius-md)",
                background: !valido || estado === "cargando" ? "var(--border)" : "var(--primary)",
                color: !valido || estado === "cargando" ? "var(--text-muted)" : "var(--text-inverse)",
                cursor: !valido || estado === "cargando" ? "not-allowed" : "pointer",
                fontSize: 14, fontWeight: 600,
              }}
            >
              {estado === "cargando" ? "Guardando…" : "Establecer nueva contraseña"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
