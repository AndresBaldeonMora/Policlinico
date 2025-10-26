// src/pages/ReservaCita/AgregarPacienteSimple.tsx
import { useState } from "react";
import { PacienteApiService } from "../../services/paciente.service";
import "./AgregarPacienteSimple.css";

interface AgregarPacienteSimpleProps {
  dniInicial: string; // ⭐ Agregar esta línea
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
    dni: dniInicial, // ⭐ Usar el DNI recibido
    nombreCompleto: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Solo números para DNI, máximo 8 dígitos
    if (name === "dni") {
      if (value.length > 8 || (value && !/^\d*$/.test(value))) return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validaciones
    if (formData.dni.length !== 8) {
      setError("El DNI debe tener 8 dígitos");
      return;
    }

    if (!formData.nombreCompleto.trim()) {
      setError("El nombre completo es requerido");
      return;
    }

    // Separar nombre completo en nombres y apellidos
    const partes = formData.nombreCompleto.trim().split(" ");
    if (partes.length < 2) {
      setError("Ingrese nombre y apellido completo");
      return;
    }

    const nombres = partes.slice(0, Math.ceil(partes.length / 2)).join(" ");
    const apellidos = partes.slice(Math.ceil(partes.length / 2)).join(" ");

    try {
      setLoading(true);

      // Crear paciente con campos mínimos
      await PacienteApiService.crear({
        dni: formData.dni,
        nombres: nombres,
        apellidos: apellidos,
        fechaNacimiento: "2000-01-01", // Fecha dummy
        telefono: "000000000", // Teléfono dummy
        correo: "",
        direccion: "",
      });

      // Notificar al padre con los datos
      onPacienteCreado(formData.dni);

      // Limpiar formulario
      setFormData({ dni: "", nombreCompleto: "" });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al registrar paciente"
      );
      console.error(err);
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
              placeholder="12345678"
              maxLength={8}
              disabled={true} // ✅ SIEMPRE bloqueado
              className="input-disabled-modal"
            />
          </div>

          <div className="form-group-simple">
            <label htmlFor="nombreCompleto">
              Nombre Completo <span className="required">*</span>
            </label>
            <input
              autoFocus
              type="text"
              id="nombreCompleto"
              name="nombreCompleto"
              value={formData.nombreCompleto}
              onChange={handleChange}
              placeholder="Juan Carlos Pérez García"
              disabled={loading}
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
              disabled={
                loading ||
                formData.dni.length !== 8 ||
                !formData.nombreCompleto.trim()
              }
            >
              {loading ? "Guardando..." : "✓ Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AgregarPacienteSimple;
