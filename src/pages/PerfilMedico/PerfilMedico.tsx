import { useEffect, useRef, useState } from "react";
import { Camera, User, Mail, Phone, Award, Stethoscope } from "lucide-react";
import Swal from "sweetalert2";
import { toastExito, toastError } from "../../utils/toast";
import { MedicoApiService, type MedicoPerfil } from "../../services/medico.service";
import "./PerfilMedico.css";

const BACKEND_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3000/api").replace(/\/api$/, "");
const resolverAvatar = (avatar?: string) => (avatar ? `${BACKEND_URL}${avatar}` : undefined);

export default function PerfilMedico() {
  const [perfil, setPerfil] = useState<MedicoPerfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const fotoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    MedicoApiService.obtenerMiPerfil()
      .then(setPerfil)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleFotoClick = () => fotoRef.current?.click();

  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !perfil) return;
    e.target.value = "";
    setSubiendo(true);
    try {
      const { avatarUrl } = await MedicoApiService.subirAvatar(file);
      setPerfil(prev => prev ? { ...prev, avatar: avatarUrl } : prev);
      toastExito("Foto actualizada");
    } catch (err: any) {
      toastError(err?.response?.data?.message ?? err?.message ?? "Error al subir foto");
    } finally {
      setSubiendo(false);
    }
  };

  if (loading) return (
    <div className="perfil-loading">Cargando perfil…</div>
  );

  if (!perfil) return (
    <div className="perfil-loading">No se pudo cargar el perfil.</div>
  );

  const iniciales = `${perfil.nombres[0] ?? ""}${perfil.apellidos[0] ?? ""}`.toUpperCase();
  const avatarSrc = resolverAvatar(perfil.avatar);

  return (
    <div className="perfil-page">
      <div className="perfil-card">
        {/* Avatar */}
        <div className="perfil-avatar-section">
          <div className="perfil-avatar-wrap">
            {avatarSrc
              ? <img src={avatarSrc} alt={`${perfil.nombres} ${perfil.apellidos}`} className="perfil-avatar-img" />
              : <div className="perfil-avatar-initials">{iniciales}</div>
            }
            <button
              className="perfil-avatar-btn"
              onClick={handleFotoClick}
              disabled={subiendo}
              title="Cambiar foto"
            >
              <Camera size={16} />
            </button>
          </div>
          <input
            ref={fotoRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: "none" }}
            onChange={handleFotoChange}
          />
          <div className="perfil-nombre">{perfil.nombres} {perfil.apellidos}</div>
          <div className="perfil-especialidad">{perfil.especialidadId.nombre}</div>
        </div>

        {/* Datos */}
        <div className="perfil-datos">
          <h3 className="perfil-section-title">Información personal</h3>

          <div className="perfil-campo">
            <div className="perfil-campo-icon"><User size={16} /></div>
            <div>
              <div className="perfil-campo-label">Nombre completo</div>
              <div className="perfil-campo-valor">{perfil.nombres} {perfil.apellidos}</div>
            </div>
          </div>

          <div className="perfil-campo">
            <div className="perfil-campo-icon"><Mail size={16} /></div>
            <div>
              <div className="perfil-campo-label">Correo electrónico</div>
              <div className="perfil-campo-valor">{perfil.correo || "—"}</div>
            </div>
          </div>

          <div className="perfil-campo">
            <div className="perfil-campo-icon"><Phone size={16} /></div>
            <div>
              <div className="perfil-campo-label">Teléfono</div>
              <div className="perfil-campo-valor">{perfil.telefono || "—"}</div>
            </div>
          </div>

          <div className="perfil-campo">
            <div className="perfil-campo-icon"><Stethoscope size={16} /></div>
            <div>
              <div className="perfil-campo-label">Especialidad</div>
              <div className="perfil-campo-valor">{perfil.especialidadId.nombre}</div>
            </div>
          </div>

          {perfil.cmp && (
            <div className="perfil-campo">
              <div className="perfil-campo-icon"><Award size={16} /></div>
              <div>
                <div className="perfil-campo-label">CMP</div>
                <div className="perfil-campo-valor">{perfil.cmp}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
