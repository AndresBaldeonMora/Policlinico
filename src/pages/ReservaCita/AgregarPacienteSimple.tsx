// src/pages/ReservaCita/AgregarPacienteSimple.tsx
import { useState } from "react";
import { PacienteApiService } from "../../services/paciente.service";
import "./AgregarPacienteSimple.css";

interface AgregarPacienteSimpleProps {
  dniInicial: string;
  onPacienteCreado: (dni: string) => void;
  onCancelar: () => void;
}

const AgregarPacienteSimple = ({
  dniInicial,
  onPacienteCreado,
  onCancelar,
}: AgregarPacienteSimpleProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    dni: dniInicial,
    nombres: "",
    apellidos: "",
    telefono: "",
    correo: "",
    fechaNacimiento: "",
    direccion: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "dni") {
      // Está deshabilitado, pero por si acaso
      if (value.length > 8 || (value && !/^\d*$/.test(value))) return;
    }

    if (name === "telefono") {
      // Solo números, máx 9–15 (ajustable)
      if (value && !/^\d*$/.test(value)) return;
      if (value.length > 15) return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const isValidEmail = (email: string) => {
    if (!email) return false;
    // Validación sencilla
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validarEdad = (fechaStr: string) => {
    if (!fechaStr) return false;
    const fecha = new Date(fechaStr);
    if (Number.isNaN(fecha.getTime())) return false;

    const hoy = new Date();
    if (fecha > hoy) return false;

    let edad = hoy.getFullYear() - fecha.getFullYear();
    const m = hoy.getMonth() - fecha.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < fecha.getDate())) {
      edad--;
    }

    return edad >= 0 && edad <= 110;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 🧾 Validaciones
    if (formData.dni.length !== 8) {
      setError("El DNI debe tener 8 dígitos.");
      return;
    }

    if (!formData.nombres.trim()) {
      setError("Los nombres son obligatorios.");
      return;
    }

    if (!formData.apellidos.trim()) {
      setError("Los apellidos son obligatorios.");
      return;
    }

    if (!formData.telefono.trim()) {
      setError("El teléfono es obligatorio.");
      return;
    }

    if (formData.telefono.trim().length < 6) {
      setError("Ingrese un teléfono válido.");
      return;
    }

    if (!formData.correo.trim()) {
      setError("El correo es obligatorio.");
      return;
    }

    if (!isValidEmail(formData.correo.trim())) {
      setError("Ingrese un correo electrónico válido.");
      return;
    }

    if (!formData.fechaNacimiento) {
      setError("La fecha de nacimiento es obligatoria.");
      return;
    }

    if (!validarEdad(formData.fechaNacimiento)) {
      setError("Ingrese una fecha de nacimiento válida.");
      return;
    }

    try {
      setLoading(true);

      await PacienteApiService.crear({
        dni: formData.dni,
        nombres: formData.nombres.trim(),
        apellidos: formData.apellidos.trim(),
        telefono: formData.telefono.trim(),
        correo: formData.correo.trim(),
        direccion: formData.direccion.trim(),
        fechaNacimiento: formData.fechaNacimiento,
      });

      onPacienteCreado(formData.dni);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Error al registrar paciente. Intente nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay-simple" onClick={onCancelar}>
      <div
        className="modal-content-simple"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-simple">
          <h3>👤 Nuevo Paciente</h3>
          <button
            type="button"
            className="close-btn-simple"
            onClick={onCancelar}
            disabled={loading}
          >
            ✕
          </button>
        </div>

        {error && <div className="error-message-simple">⚠️ {error}</div>}

        <form onSubmit={handleSubmit} className="form-simple">
          {/* DNI (bloqueado porque viene del flujo de búsqueda) */}
          <div className="form-group-simple">
            <label htmlFor="dni">
              DNI <span className="required">*</span>
            </label>
            <input
              type="text"
              id="dni"
              name="dni"
              value={formData.dni}
              onChange={handleChange}
              maxLength={8}
              disabled
              className="input-disabled-modal"
            />
          </div>

          {/* Nombres y Apellidos */}
          <div className="form-row-simple">
            <div className="form-group-simple">
              <label htmlFor="nombres">
                Nombres <span className="required">*</span>
              </label>
              <input
                type="text"
                id="nombres"
                name="nombres"
                value={formData.nombres}
                onChange={handleChange}
                placeholder="Juan Carlos"
                disabled={loading}
              />
            </div>

            <div className="form-group-simple">
              <label htmlFor="apellidos">
                Apellidos <span className="required">*</span>
              </label>
              <input
                type="text"
                id="apellidos"
                name="apellidos"
                value={formData.apellidos}
                onChange={handleChange}
                placeholder="Pérez García"
                disabled={loading}
              />
            </div>
          </div>

          {/* Teléfono y Correo */}
          <div className="form-row-simple">
            <div className="form-group-simple">
              <label htmlFor="telefono">
                Teléfono / Celular <span className="required">*</span>
              </label>
              <input
                type="text"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="987654321"
                disabled={loading}
              />
            </div>

            <div className="form-group-simple">
              <label htmlFor="correo">
                Correo electrónico <span className="required">*</span>
              </label>
              <input
                type="email"
                id="correo"
                name="correo"
                value={formData.correo}
                onChange={handleChange}
                placeholder="correo@ejemplo.com"
                disabled={loading}
              />
            </div>
          </div>

          {/* Fecha de nacimiento */}
          <div className="form-group-simple">
            <label htmlFor="fechaNacimiento">
              Fecha de nacimiento <span className="required">*</span>
            </label>
            <input
              type="date"
              id="fechaNacimiento"
              name="fechaNacimiento"
              value={formData.fechaNacimiento}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          {/* Dirección (opcional) */}
          <div className="form-group-simple">
            <label htmlFor="direccion">Dirección (opcional)</label>
            <textarea
              id="direccion"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              placeholder="Calle, número, referencia..."
              rows={2}
              disabled={loading}
              className="textarea-simple"
            />
          </div>

          <div className="buttons-simple">
            <button
              type="button"
              className="btn-cancelar-simple"
              onClick={onCancelar}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-guardar-simple"
              disabled={loading}
            >
              {loading ? "Guardando..." : "✓ Guardar y usar en la cita"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AgregarPacienteSimple;
