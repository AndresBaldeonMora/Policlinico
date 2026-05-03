import { useState, useCallback, useMemo } from "react";
import {
  User, Edit3, Save, X, Loader2, CheckCircle, AlertCircle, Camera,
  Phone, Mail, MapPin, Calendar, Users,
} from "lucide-react";
import { MiCuentaSeguridad } from "./MiCuentaSeguridad";
import { MiCuentaTerminos } from "./MiCuentaTerminos";
import "./MiCuenta.css";

/* ── Types ── */
export interface PacientePerfil {
  nombres: string;
  apellidos: string;
  dni: string;
  telefono: string;
  correo: string;
  fechaNacimiento: string;
  sexo: string;
  direccion: string;
  distrito: string;
  apoderadoNombre: string;
  apoderadoParentesco: string;
  apoderadoTelefono: string;
}

const PERFIL_VACIO: PacientePerfil = {
  nombres: "",
  apellidos: "",
  dni: "",
  telefono: "",
  correo: "",
  fechaNacimiento: "",
  sexo: "",
  direccion: "",
  distrito: "",
  apoderadoNombre: "",
  apoderadoParentesco: "",
  apoderadoTelefono: "",
};

type TabId = "perfil" | "seguridad" | "terminos";

const TABS: { id: TabId; label: string }[] = [
  { id: "perfil", label: "Perfil" },
  { id: "seguridad", label: "Seguridad" },
  { id: "terminos", label: "Términos" },
];

/* ── Props ── */
interface MiCuentaPerfilProps {
  pacienteId: string;
  initialData?: PacientePerfil;
  onGuardar?: (datos: PacientePerfil) => void;
}

/* ── Component ── */
const MiCuentaPerfil = ({ pacienteId, initialData, onGuardar }: MiCuentaPerfilProps) => {
  const [tab, setTab] = useState<TabId>("perfil");
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);
  const [datos, setDatos] = useState<PacientePerfil>(initialData ?? PERFIL_VACIO);
  const [datosOriginal, setDatosOriginal] = useState<PacientePerfil>(initialData ?? PERFIL_VACIO);

  /* Supress unused var warning */
  void pacienteId;

  const iniciales = useMemo(() => {
    const n = datos.nombres?.trim().charAt(0) ?? "";
    const a = datos.apellidos?.trim().charAt(0) ?? "";
    return (n + a).toUpperCase() || "PA";
  }, [datos.nombres, datos.apellidos]);

  /* Handlers */
  const handleChange = useCallback((campo: keyof PacientePerfil, valor: string) => {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
  }, []);

  const handleEditar = useCallback(() => {
    setEditando(true);
    setMensaje(null);
  }, []);

  const handleCancelar = useCallback(() => {
    setDatos(datosOriginal);
    setEditando(false);
    setMensaje(null);
  }, [datosOriginal]);

  const handleGuardar = useCallback(async () => {
    setGuardando(true);
    setMensaje(null);

    try {
      // Simular PUT /api/paciente/me
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setDatosOriginal(datos);
      setEditando(false);
      setMensaje({ tipo: "exito", texto: "Perfil actualizado correctamente" });
      onGuardar?.(datos);
    } catch {
      setMensaje({ tipo: "error", texto: "Error al guardar los cambios. Intenta de nuevo." });
    } finally {
      setGuardando(false);
    }
  }, [datos, onGuardar]);

  const handleTabChange = useCallback((t: TabId) => {
    setTab(t);
    setMensaje(null);
  }, []);

  /* ── Render field ── */
  const renderField = useCallback(
    (label: string, campo: keyof PacientePerfil, opts?: {
      icon?: React.ReactNode;
      type?: string;
      disabled?: boolean;
      placeholder?: string;
      options?: { value: string; label: string }[];
    }) => {
      const valor = datos[campo];
      const isDisabled = opts?.disabled || !editando;

      if (!editando) {
        return (
          <div className="micuenta-perfil__field">
            <span className="micuenta-perfil__field-label">
              {opts?.icon}
              {label}
            </span>
            <span className={`micuenta-perfil__field-value ${!valor ? "micuenta-perfil__field-value--empty" : ""}`}>
              {valor || "No registrado"}
            </span>
          </div>
        );
      }

      return (
        <div className="micuenta-perfil__field">
          <label className="micuenta-perfil__field-label" htmlFor={`perfil-${campo}`}>
            {opts?.icon}
            {label}
          </label>
          {opts?.options ? (
            <select
              id={`perfil-${campo}`}
              className="micuenta-perfil__select"
              value={valor}
              onChange={(e) => handleChange(campo, e.target.value)}
              disabled={isDisabled}
            >
              <option value="">Seleccionar</option>
              {opts.options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ) : (
            <input
              id={`perfil-${campo}`}
              type={opts?.type ?? "text"}
              className={`micuenta-perfil__input ${isDisabled ? "micuenta-perfil__input--disabled" : ""}`}
              value={valor}
              onChange={(e) => handleChange(campo, e.target.value)}
              disabled={isDisabled}
              placeholder={opts?.placeholder}
            />
          )}
        </div>
      );
    },
    [datos, editando, handleChange],
  );

  return (
    <div className="micuenta">
      {/* Tabs */}
      <div className="micuenta__tabs" role="tablist" aria-label="Secciones de Mi Cuenta">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`micuenta__tab ${tab === t.id ? "micuenta__tab--active" : ""}`}
            onClick={() => handleTabChange(t.id)}
            role="tab"
            aria-selected={tab === t.id}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Perfil ── */}
      {tab === "perfil" && (
        <div className="micuenta-perfil">
          {/* Avatar */}
          <div className="micuenta-perfil__avatar-section">
            <div className="micuenta-perfil__avatar">
              <span className="micuenta-perfil__avatar-text">{iniciales}</span>
              {editando && (
                <button
                  className="micuenta-perfil__avatar-edit"
                  aria-label="Cambiar foto de perfil"
                  type="button"
                >
                  <Camera size={14} />
                </button>
              )}
            </div>
            <div className="micuenta-perfil__avatar-info">
              <h2 className="micuenta-perfil__name">
                {datos.nombres || datos.apellidos
                  ? `${datos.nombres} ${datos.apellidos}`.trim()
                  : "Paciente"}
              </h2>
              <p className="micuenta-perfil__dni-label">DNI: {datos.dni || "—"}</p>
            </div>

            {!editando && (
              <button className="btn btn-secondary micuenta-perfil__edit-btn" onClick={handleEditar}>
                <Edit3 size={15} />
                <span>Editar</span>
              </button>
            )}
          </div>

          {/* Mensaje de estado */}
          {mensaje && (
            <div className={`micuenta-perfil__msg micuenta-perfil__msg--${mensaje.tipo}`} role="alert" aria-live="polite">
              {mensaje.tipo === "exito" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              <span>{mensaje.texto}</span>
            </div>
          )}

          {/* Formulario */}
          <div className="micuenta-perfil__form">
            <h3 className="micuenta-perfil__section-title">
              <User size={16} />
              Información personal
            </h3>
            <div className="micuenta-perfil__grid">
              {renderField("Nombres", "nombres", { placeholder: "Ej: Juan Carlos" })}
              {renderField("Apellidos", "apellidos", { placeholder: "Ej: Pérez García" })}
              {renderField("DNI", "dni", { disabled: true })}
              {renderField("Sexo", "sexo", {
                options: [
                  { value: "M", label: "Masculino" },
                  { value: "F", label: "Femenino" },
                ],
              })}
              {renderField("Fecha de nacimiento", "fechaNacimiento", {
                icon: <Calendar size={14} />,
                type: "date",
              })}
            </div>

            <h3 className="micuenta-perfil__section-title">
              <Phone size={16} />
              Contacto
            </h3>
            <div className="micuenta-perfil__grid">
              {renderField("Teléfono", "telefono", {
                icon: <Phone size={14} />,
                type: "tel",
                placeholder: "Ej: 987654321",
              })}
              {renderField("Correo electrónico", "correo", {
                icon: <Mail size={14} />,
                type: "email",
                placeholder: "Ej: correo@mail.com",
              })}
            </div>

            <h3 className="micuenta-perfil__section-title">
              <MapPin size={16} />
              Dirección
            </h3>
            <div className="micuenta-perfil__grid">
              {renderField("Dirección", "direccion", {
                icon: <MapPin size={14} />,
                placeholder: "Ej: Av. Los Olivos 123",
              })}
              {renderField("Distrito", "distrito", { placeholder: "Ej: San Isidro" })}
            </div>

            <h3 className="micuenta-perfil__section-title">
              <Users size={16} />
              Apoderado
              <span className="micuenta-perfil__section-hint">(solo menores de edad)</span>
            </h3>
            <div className="micuenta-perfil__grid">
              {renderField("Nombre del apoderado", "apoderadoNombre", { placeholder: "Nombre completo" })}
              {renderField("Parentesco", "apoderadoParentesco", { placeholder: "Ej: Madre, Padre" })}
              {renderField("Teléfono del apoderado", "apoderadoTelefono", {
                type: "tel",
                placeholder: "Ej: 987654321",
              })}
            </div>
          </div>

          {/* Botones de acción */}
          {editando && (
            <div className="micuenta-perfil__actions">
              <button
                className="btn btn-secondary"
                onClick={handleCancelar}
                disabled={guardando}
              >
                <X size={15} />
                <span>Cancelar</span>
              </button>
              <button
                className="btn btn-primary"
                onClick={handleGuardar}
                disabled={guardando}
              >
                {guardando ? <Loader2 size={15} className="micuenta-perfil__spinner" /> : <Save size={15} />}
                <span>{guardando ? "Guardando..." : "Guardar cambios"}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Seguridad ── */}
      {tab === "seguridad" && <MiCuentaSeguridad />}

      {/* ── Tab: Términos ── */}
      {tab === "terminos" && <MiCuentaTerminos />}
    </div>
  );
};

export { MiCuentaPerfil };

export default MiCuentaPerfil;
