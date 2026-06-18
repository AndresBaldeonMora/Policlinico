import { useState } from "react";
import { Mail, X, CheckCircle2, AlertCircle } from "lucide-react";
import { AuthService } from "../../services/auth.service";

interface Props {
  onClose: () => void;
}

export default function ForgotPasswordModal({ onClose }: Props) {
  const [correo, setCorreo] = useState("");
  const [estado, setEstado] = useState<"idle" | "cargando" | "exito" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correo) return;
    setEstado("cargando");
    setErrorMsg("");
    try {
      await AuthService.forgotPassword(correo.trim().toLowerCase());
      setEstado("exito");
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message ?? err?.message ?? "Error al enviar el correo.");
      setEstado("error");
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 3000,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "var(--bg-card)", borderRadius: "var(--radius-lg)",
        padding: "32px 28px", width: 420, maxWidth: "92vw",
        boxShadow: "var(--shadow-xl)", position: "relative",
        border: "1px solid var(--border)",
      }}>
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 14, right: 14,
            background: "none", border: "none", cursor: "pointer",
            color: "var(--text-muted)", padding: 4,
          }}
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>

        {estado === "exito" ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <CheckCircle2 size={48} style={{ color: "var(--success)", marginBottom: 12 }} />
            <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
              Revisa tu correo
            </h2>
            <p style={{ margin: "0 0 20px", fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Si el correo <strong>{correo}</strong> está registrado, recibirás las instrucciones
              para restablecer tu contraseña. El enlace es válido por <strong>1 hora</strong>.
            </p>
            <button
              onClick={onClose}
              style={{
                padding: "10px 28px", background: "var(--primary)", color: "var(--text-inverse)",
                border: "none", borderRadius: "var(--radius-md)", cursor: "pointer",
                fontSize: 14, fontWeight: 600,
              }}
            >
              Entendido
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "var(--radius-md)",
                background: "var(--primary-lighter)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Mail size={18} style={{ color: "var(--primary)" }} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
                  ¿Olvidaste tu contraseña?
                </h2>
                <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>
                  Te enviaremos un enlace para restablecerla
                </p>
              </div>
            </div>

            {estado === "error" && (
              <div style={{
                background: "var(--error-bg)", border: "1px solid var(--error)",
                borderRadius: "var(--radius-sm)", padding: "10px 14px", marginBottom: 16,
                fontSize: 13, color: "var(--error)", display: "flex", alignItems: "center", gap: 8,
              }}>
                <AlertCircle size={15} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={correo}
                  onChange={e => setCorreo(e.target.value)}
                  placeholder="nombre@clinica.com"
                  autoFocus
                  disabled={estado === "cargando"}
                  style={{
                    padding: "10px 14px", border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)", fontSize: 14, outline: "none",
                    color: "var(--text-primary)", background: "var(--bg-body)",
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={!correo || estado === "cargando"}
                style={{
                  padding: "11px 0", border: "none", borderRadius: "var(--radius-md)",
                  background: !correo || estado === "cargando" ? "var(--border)" : "var(--primary)",
                  color: !correo || estado === "cargando" ? "var(--text-muted)" : "var(--text-inverse)",
                  cursor: !correo || estado === "cargando" ? "not-allowed" : "pointer",
                  fontSize: 14, fontWeight: 600,
                }}
              >
                {estado === "cargando" ? "Enviando…" : "Enviar instrucciones"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
