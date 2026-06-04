import { useState } from "react";
import { Copy, Check, X, KeyRound, Mail, AlertTriangle } from "lucide-react";
import type { CredencialesPortal } from "../../services/paciente.service";
import "./CredencialesModal.css";

interface Props {
  paciente: { nombres: string; apellidos: string };
  credenciales: CredencialesPortal;
  onCerrar: () => void;
}

const CredencialesModal = ({ paciente, credenciales, onCerrar }: Props) => {
  const [copiado, setCopiado] = useState<"correo" | "password" | "ambos" | null>(null);

  const copiar = async (texto: string, tipo: "correo" | "password" | "ambos") => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(tipo);
      setTimeout(() => setCopiado(null), 2000);
    } catch {
      // ignorar
    }
  };

  const textoCompleto =
    `Acceso al portal del paciente\n` +
    `Nombre:     ${paciente.nombres} ${paciente.apellidos}\n` +
    `Correo:     ${credenciales.correo}\n` +
    `Contraseña: ${credenciales.passwordTemporal}`;

  return (
    <div className="cred-overlay" role="presentation">
      <div className="cred-modal">
        <div className="cred-header">
          <div className="cred-header-icon"><KeyRound size={20} /></div>
          <div className="cred-header-text">
            <h2>Cuenta de portal creada</h2>
            <p>Entrega estas credenciales al paciente</p>
          </div>
          <button className="cred-close" onClick={onCerrar}><X size={18} /></button>
        </div>

        <div className="cred-body">
          <div className="cred-paciente">
            <span className="cred-label-mini">Paciente</span>
            <strong>{paciente.nombres} {paciente.apellidos}</strong>
          </div>

          <div className="cred-field">
            <label className="cred-label"><Mail size={14} /> Correo</label>
            <div className="cred-input-wrap">
              <input className="cred-input" value={credenciales.correo} readOnly />
              <button
                type="button"
                className="cred-copy-btn"
                onClick={() => copiar(credenciales.correo, "correo")}
                title="Copiar correo"
              >
                {copiado === "correo" ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          <div className="cred-field">
            <label className="cred-label"><KeyRound size={14} /> Contraseña temporal</label>
            <div className="cred-input-wrap">
              <input className="cred-input cred-input--password" value={credenciales.passwordTemporal} readOnly />
              <button
                type="button"
                className="cred-copy-btn"
                onClick={() => copiar(credenciales.passwordTemporal, "password")}
                title="Copiar contraseña"
              >
                {copiado === "password" ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          <div className="cred-warning">
            <AlertTriangle size={14} />
            <span>
              Esta contraseña se muestra <strong>una sola vez</strong>. Cópiala o entrégasela al
              paciente antes de cerrar.
            </span>
          </div>
        </div>

        <div className="cred-footer">
          <button
            type="button"
            className="cred-btn cred-btn--secondary"
            onClick={() => copiar(textoCompleto, "ambos")}
          >
            {copiado === "ambos" ? <><Check size={16} /> Copiado</> : <><Copy size={16} /> Copiar todo</>}
          </button>
          <button type="button" className="cred-btn cred-btn--primary" onClick={onCerrar}>
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};

export default CredencialesModal;
