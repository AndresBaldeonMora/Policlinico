import React, { useState, useCallback, useMemo } from "react";
import { Loader2, CheckCircle, AlertCircle, FileText, Send, AlertTriangle } from "lucide-react";
import { ReclamacionApiService } from "../../../services/reclamacion.service";
import "./MiCuenta.css";

const MiCuentaReclamaciones = () => {
  const [tipo, setTipo] = useState<"QUEJA" | "RECLAMO">("RECLAMO");
  const [descripcion, setDescripcion] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);

  const fechaActual = useMemo(() => {
    return new Date().toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }, []);

  const descripcionValida = useMemo(() => {
    return descripcion.trim().length >= 10;
  }, [descripcion]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!descripcionValida || cargando) return;

      setCargando(true);
      setMensaje(null);

      try {
        const res = await ReclamacionApiService.registrar({
          tipo,
          descripcion: descripcion.trim(),
        });
        setMensaje({
          tipo: "exito",
          texto: `Su ${tipo === "QUEJA" ? "queja" : "reclamo"} ha sido registrado exitosamente con el código ${res.codigo}. Se ha enviado un correo electrónico de confirmación.`,
        });
        setDescripcion("");
      } catch (err: any) {
        setMensaje({
          tipo: "error",
          texto: err?.message || "Ocurrió un error al registrar la reclamación. Intente de nuevo.",
        });
      } finally {
        setCargando(false);
      }
    },
    [tipo, descripcion, descripcionValida, cargando]
  );

  return (
    <div className="micuenta-term">
      <div className="micuenta-term__header">
        <FileText size={20} className="micuenta-term__header-icon" />
        <h2 className="micuenta-term__title">Libro de Reclamaciones Virtual</h2>
      </div>

      <p className="micuenta-term__paragraph" style={{ marginBottom: "1.5rem" }}>
        Conforme a lo establecido en el Código de Protección al Consumidor (Ley N° 29571), ponemos a su disposición nuestro Libro de Reclamaciones Virtual para registrar quejas o reclamos sobre los servicios brindados.
      </p>

      {/* Mensaje de estado */}
      {mensaje && (
        <div
          className={`micuenta-perfil__msg micuenta-perfil__msg--${mensaje.tipo === "exito" ? "exito" : "error"}`}
          style={{ marginBottom: "1.5rem" }}
          role="alert"
          aria-live="polite"
        >
          {mensaje.tipo === "exito" ? <CheckCircle size={20} style={{ flexShrink: 0 }} /> : <AlertCircle size={20} style={{ flexShrink: 0 }} />}
          <span>{mensaje.texto}</span>
        </div>
      )}

      <form className="micuenta-seg__form" style={{ maxWidth: "100%" }} onSubmit={handleSubmit} noValidate>
        {/* Tipo de disconformidad */}
        <div className="micuenta-perfil__field">
          <label className="micuenta-perfil__field-label">Tipo de disconformidad</label>
          <select
            className="micuenta-perfil__select"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as "QUEJA" | "RECLAMO")}
            disabled={cargando}
          >
            <option value="RECLAMO">Reclamo</option>
            <option value="QUEJA">Queja</option>
          </select>
        </div>

        {/* Explicación de la diferencia */}
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            background: "var(--bg-muted)",
            padding: "1rem",
            borderRadius: "var(--radius-md)",
            fontSize: "0.82rem",
            color: "var(--text-secondary)",
            borderLeft: "4px solid var(--primary)",
            lineHeight: "1.5",
          }}
        >
          <AlertTriangle size={18} style={{ flexShrink: 0, color: "var(--primary)" }} />
          <div>
            {tipo === "RECLAMO" ? (
              <p style={{ margin: 0 }}>
                <strong>Reclamo:</strong> Disconformidad relacionada directamente con los servicios médicos recibidos o la facturación del policlínico.
              </p>
            ) : (
              <p style={{ margin: 0 }}>
                <strong>Queja:</strong> Malestar o descontento respecto a la atención al cliente, tiempos de espera, infraestructura o trato recibido (no relacionado con el acto médico).
              </p>
            )}
          </div>
        </div>

        {/* Fecha (Automática) */}
        <div className="micuenta-perfil__field">
          <label className="micuenta-perfil__field-label">Fecha de Registro</label>
          <input
            type="text"
            className="micuenta-perfil__input micuenta-perfil__input--disabled"
            value={fechaActual}
            disabled
          />
        </div>

        {/* Descripción */}
        <div className="micuenta-perfil__field">
          <label className="micuenta-perfil__field-label" htmlFor="desc-reclamacion">
            Detalle del Hecho / Descripción
          </label>
          <textarea
            id="desc-reclamacion"
            className="micuenta-perfil__input"
            rows={6}
            placeholder="Describa de forma detallada, clara y verídica los hechos ocurridos..."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            disabled={cargando}
            style={{ resize: "vertical", minHeight: "120px", fontFamily: "inherit" }}
          />
          {descripcion.trim() && descripcion.trim().length < 10 && (
            <p className="micuenta-seg__field-error" style={{ marginTop: "0.2rem" }}>
              La descripción debe tener al menos 10 caracteres.
            </p>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
            <span>Mínimo 10 caracteres</span>
            <span>{descripcion.length} caracteres</span>
          </div>
        </div>

        {/* Botón de Enviar */}
        <button
          type="submit"
          className="btn btn-primary"
          style={{ alignSelf: "flex-start", marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
          disabled={!descripcionValida || cargando}
        >
          {cargando ? <Loader2 size={16} className="micuenta-perfil__spinner" /> : <Send size={15} />}
          <span>{cargando ? "Enviando..." : "Enviar Reclamación"}</span>
        </button>
      </form>
    </div>
  );
};

export { MiCuentaReclamaciones };
export default MiCuentaReclamaciones;
