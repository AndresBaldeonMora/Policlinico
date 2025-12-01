// src/pages/ReservaCita/AgregarPacienteSimple.tsx
import { useEffect, useState } from "react";
import { PacienteApiService } from "../../services/paciente.service";
import api from "../../services/api";
import "./AgregarPacienteSimple.css";

interface AgregarPacienteSimpleProps {
  dniInicial: string;
  onPacienteCreado: (dni: string) => void;
  onCancelar: () => void;
}

interface ReniecResponse {
  success: boolean;
  data?: {
    dni: string;
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
  };
}

const AgregarPacienteSimple = ({
  dniInicial,
  onPacienteCreado,
  onCancelar,
}: AgregarPacienteSimpleProps) => {
  const [loading, setLoading] = useState(false);

  const [loadingReniec, setLoadingReniec] = useState(false);
  const [errorReniec, setErrorReniec] = useState("");

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

  // -------------------------
  // 🔍 AUTOCOMPLETE RENIEC
  // -------------------------
  useEffect(() => {
    const buscarReniec = async () => {
      if (!dniInicial || dniInicial.length !== 8) return;

      setLoadingReniec(true);
      setErrorReniec("");

      try {
        const res = await api.get<ReniecResponse>(`/reniec/${dniInicial}`);

        if (res.data.success && res.data.data) {
          const d = res.data.data;

          setFormData((prev) => ({
            ...prev,
            nombres: d.nombres ?? "",
            apellidos: `${d.apellidoPaterno ?? ""} ${
              d.apellidoMaterno ?? ""
            }`.trim(),
          }));
        } else {
          setErrorReniec("No se encontraron datos en RENIEC.");
        }
      } catch {
        setErrorReniec("No se pudo consultar RENIEC.");
      } finally {
        setLoadingReniec(false);
      }
    };

    buscarReniec();
  }, [dniInicial]);

  // -------------------------
  // 🔄 HANDLE CHANGE
  // -------------------------
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "telefono") {
      if (!/^\d*$/.test(value)) return;
      if (value.length > 15) return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  // -------------------------
  // 📧 Validación de email
  // -------------------------
  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // -------------------------
  // 🎂 Validación edad
  // -------------------------
  const validarEdad = (fechaStr: string) => {
    const fecha = new Date(fechaStr);
    if (Number.isNaN(fecha.getTime())) return false;

    const hoy = new Date();
    if (fecha > hoy) return false;

    let edad = hoy.getFullYear() - fecha.getFullYear();
    const m = hoy.getMonth() - fecha.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < fecha.getDate())) edad--;

    return edad >= 0 && edad <= 110;
  };

  // -------------------------
  // 💾 GUARDAR
  // -------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.nombres.trim() === "") {
      setError("Los nombres son obligatorios.");
      return;
    }

    if (formData.apellidos.trim() === "") {
      setError("Los apellidos son obligatorios.");
      return;
    }

    if (formData.telefono.trim().length < 6) {
      setError("Ingrese un teléfono válido.");
      return;
    }

    if (!isValidEmail(formData.correo.trim())) {
      setError("Ingrese un correo válido.");
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
      const msg =
        err instanceof Error ? err.message : "Error al registrar paciente.";
      setError(msg);
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
            className="close-btn-simple"
            onClick={onCancelar}
            disabled={loading}
          >
            ✕
          </button>
        </div>

        {error && <div className="error-message-simple">⚠️ {error}</div>}
        {errorReniec && (
          <div className="error-message-simple">🔎 {errorReniec}</div>
        )}

        <form onSubmit={handleSubmit} className="form-simple">
          <div className="form-group-simple">
            <label>DNI</label>
            <input
              type="text"
              value={formData.dni}
              disabled
              className="input-disabled-modal"
            />
            {loadingReniec && <small>Consultando RENIEC...</small>}
          </div>

          <div className="form-row-simple">
            <div className="form-group-simple">
              <label>Nombres *</label>
              <input
                name="nombres"
                value={formData.nombres}
                onChange={handleChange}
                disabled={loading}
                placeholder="Juan Carlos"
              />
            </div>

            <div className="form-group-simple">
              <label>Apellidos *</label>
              <input
                name="apellidos"
                value={formData.apellidos}
                onChange={handleChange}
                disabled={loading}
                placeholder="Pérez García"
              />
            </div>
          </div>

          <div className="form-row-simple">
            <div className="form-group-simple">
              <label>Teléfono *</label>
              <input
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                disabled={loading}
                placeholder="987654321"
              />
            </div>

            <div className="form-group-simple">
              <label>Correo *</label>
              <input
                name="correo"
                value={formData.correo}
                onChange={handleChange}
                disabled={loading}
                placeholder="correo@ejemplo.com"
              />
            </div>
          </div>

          <div className="form-group-simple">
            <label>Fecha de nacimiento *</label>
            <input
              type="date"
              name="fechaNacimiento"
              value={formData.fechaNacimiento}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="form-group-simple">
            <label>Dirección</label>
            <textarea
              name="direccion"
              rows={2}
              value={formData.direccion}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="buttons-simple">
            <button
              type="button"
              className="btn-cancelar-simple"
              onClick={onCancelar}
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
