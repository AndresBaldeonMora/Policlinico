import { useState, useEffect } from "react";
import {
  PacienteApiService,
  type PacienteTransformado,
} from "../../services/paciente.service";
import {
  EspecialidadApiService,
  type Especialidad,
} from "../../services/especialidad.service";
import {
  DoctorApiService,
  type DoctorTransformado as Doctor,
  type HorarioDisponible,
} from "../../services/doctor.service";
import { CitaApiService } from "../../services/cita.service";
import AgregarPacienteSimple from "./AgregarPacienteSimple";
import "./ReservaCita.css";

const ReservaCita = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Paso 1: Búsqueda de Paciente
  const [searchDNI, setSearchDNI] = useState("");
  const [pacienteEncontrado, setPacienteEncontrado] =
    useState<PacienteTransformado | null>(null);
  const [pacienteSeleccionado, setPacienteSeleccionado] =
    useState<PacienteTransformado | null>(null);
  const [todosLosPacientes, setTodosLosPacientes] = useState<
    PacienteTransformado[]
  >([]);
  const [mostrarNuevoPaciente, setMostrarNuevoPaciente] = useState(false);

  // Paso 2: Especialidad
  const [searchEspecialidad, setSearchEspecialidad] = useState("");
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [especialidadSeleccionada, setEspecialidadSeleccionada] =
    useState<Especialidad | null>(null);
  const [showEspecialidadesSuggestions, setShowEspecialidadesSuggestions] =
    useState(false);

  // Paso 3: Doctor y Horarios
  const [doctorSeleccionado, setDoctorSeleccionado] = useState<Doctor | null>(
    null
  );
  const [fechaSeleccionada, setFechaSeleccionada] = useState("");
  const [horarios, setHorarios] = useState<HorarioDisponible[]>([]);
  const [horaSeleccionada, setHoraSeleccionada] = useState("");

  // ⭐ Calcular fecha mínima (hoy) y máxima (60 días después)
  const fechaMinima = new Date().toISOString().split("T")[0];
  const fechaMaxima = (() => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + 60); // 60 días = 2 meses
    return fecha.toISOString().split("T")[0];
  })();

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
    setFechaSeleccionada(fechaMinima);
  }, [fechaMinima]);

  // ⭐ Efecto para cargar horarios cuando cambia la fecha
  useEffect(() => {
    if (doctorSeleccionado && fechaSeleccionada) {
      cargarHorarios(doctorSeleccionado.id, fechaSeleccionada);
    }
  }, [fechaSeleccionada]); // Se ejecuta automáticamente al cambiar fecha

  // Cargar todos los datos
  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [pacientes, especialidades] = await Promise.all([
        PacienteApiService.listar(),
        EspecialidadApiService.listar(),
      ]);
      setTodosLosPacientes(pacientes);
      setEspecialidades(especialidades);
    } catch (err) {
      setError("Error al cargar datos");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Buscar paciente cuando DNI tiene 8 dígitos
  const handleBuscarPaciente = (dni: string) => {
    // Solo números
    if (dni && !/^\d*$/.test(dni)) return;
    if (dni.length > 8) return;

    setSearchDNI(dni);
    setError("");
    setPacienteEncontrado(null);
    setPacienteSeleccionado(null);

    // Solo buscar cuando tiene 8 dígitos completos
    if (dni.length === 8) {
      const paciente = todosLosPacientes.find((p) => p.dni === dni);
      setPacienteEncontrado(paciente || null);
    }
  };

  // Seleccionar paciente de la lista desplegada
  const handleSelectPaciente = (paciente: PacienteTransformado) => {
    setPacienteSeleccionado(paciente);
    setError("");
  };

  // Callback cuando se crea un nuevo paciente
  const handlePacienteCreado = async (dni: string) => {
    setMostrarNuevoPaciente(false);

    // Recargar lista de pacientes
    await cargarDatos();

    // Buscar el paciente recién creado
    setTimeout(async () => {
      const pacientes = await PacienteApiService.listar();
      setTodosLosPacientes(pacientes);

      const pacienteNuevo = pacientes.find((p) => p.dni === dni);

      if (pacienteNuevo) {
        setPacienteEncontrado(pacienteNuevo);
        setPacienteSeleccionado(pacienteNuevo);
      }
    }, 300);
  };

  // Buscar especialidades
  const especialidadesFiltradas = especialidades.filter((esp) =>
    esp.nombre.toLowerCase().includes(searchEspecialidad.toLowerCase())
  );

  const handleSelectEspecialidad = async (especialidad: Especialidad) => {
    setEspecialidadSeleccionada(especialidad);
    setSearchEspecialidad(especialidad.nombre);
    setShowEspecialidadesSuggestions(false);
    await cargarDoctorPorEspecialidad(especialidad.id);
  };

  const cargarDoctorPorEspecialidad = async (especialidadId: string) => {
    try {
      setLoading(true);
      const doctores = await DoctorApiService.obtenerPorEspecialidad(
        especialidadId
      );

      if (doctores.length > 0) {
        setDoctorSeleccionado(doctores[0]);
        await cargarHorarios(doctores[0].id, fechaSeleccionada);
      } else {
        setError("No hay doctores disponibles para esta especialidad");
        setDoctorSeleccionado(null);
      }
    } catch (err) {
      setError("Error al cargar doctor");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar horarios disponibles
  const cargarHorarios = async (doctorId: string, fecha: string) => {
    try {
      setLoading(true);
      setHoraSeleccionada(""); // ⭐ Limpiar hora seleccionada al cambiar fecha
      const data = await DoctorApiService.obtenerHorariosDisponibles(
        doctorId,
        fecha
      );
      setHorarios(data);
    } catch (err) {
      setError("Error al cargar horarios");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ⭐ Cambiar fecha - simplificado
  const handleFechaChange = (nuevaFecha: string) => {
    setFechaSeleccionada(nuevaFecha);
    // Los horarios se cargan automáticamente por el useEffect
  };

  // Crear cita
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !pacienteSeleccionado ||
      !doctorSeleccionado ||
      !horaSeleccionada ||
      !fechaSeleccionada
    ) {
      setError("Por favor completa todos los campos");
      return;
    }

    try {
      setLoading(true);
      await CitaApiService.crear({
        pacienteId: pacienteSeleccionado.id,
        doctorId: doctorSeleccionado.id,
        fecha: fechaSeleccionada,
        hora: horaSeleccionada,
      });

      alert("Cita registrada exitosamente");
      // Reiniciar formulario
      setSearchDNI("");
      setPacienteEncontrado(null);
      setPacienteSeleccionado(null);
      setEspecialidadSeleccionada(null);
      setSearchEspecialidad("");
      setDoctorSeleccionado(null);
      setHoraSeleccionada("");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear cita");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reserva-cita">
      <h1>Nueva Reserva de Cita</h1>

      {error && <div className="error-message">{error}</div>}
      {loading && <div className="loading-spinner">Cargando...</div>}

      <div className="card">
        <form onSubmit={handleSubmit} className="cita-form">
          {/* PASO 1: Buscar Paciente por DNI */}
          <div className="form-step">
            <div className="step-header">
              <span className="step-number">1</span>
              <h3>Datos del Paciente</h3>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dni">DNI del Paciente</label>
                <input
                  type="text"
                  id="dni"
                  value={searchDNI}
                  onChange={(e) => handleBuscarPaciente(e.target.value)}
                  placeholder="Ingrese DNI (8 dígitos)"
                  maxLength={8}
                  disabled={loading || !!pacienteSeleccionado} // ⭐ Bloqueado cuando hay paciente seleccionado
                  className={
                    pacienteSeleccionado ? "input-disabled" : "input-search"
                  }
                />

                {/* Lista desplegable cuando se encuentra el paciente */}
                {searchDNI.length === 8 &&
                  pacienteEncontrado &&
                  !pacienteSeleccionado && (
                    <div className="paciente-encontrado">
                      <div
                        className="paciente-item"
                        onClick={() => handleSelectPaciente(pacienteEncontrado)}
                      >
                        <span className="paciente-dni">
                          {pacienteEncontrado.dni}
                        </span>
                        <span className="paciente-separador">-</span>
                        <span className="paciente-nombre">
                          {pacienteEncontrado.nombres}{" "}
                          {pacienteEncontrado.apellidos}
                        </span>
                      </div>
                    </div>
                  )}

                {/* Botón Nuevo Paciente - solo si DNI completo y NO encontrado */}
                {searchDNI.length === 8 &&
                  !pacienteEncontrado &&
                  !pacienteSeleccionado && (
                    <button
                      type="button"
                      className="btn-nuevo-paciente"
                      onClick={() => setMostrarNuevoPaciente(true)}
                    >
                      ➕ Nuevo Paciente
                    </button>
                  )}
              </div>

              <div className="form-group">
                <label htmlFor="nombre-paciente">Nombre Completo</label>
                <input
                  type="text"
                  id="nombre-paciente"
                  value={
                    pacienteSeleccionado
                      ? `${pacienteSeleccionado.nombres} ${pacienteSeleccionado.apellidos}`
                      : ""
                  }
                  disabled
                  placeholder="Se completa automáticamente"
                  className="input-disabled"
                />
              </div>
            </div>
          </div>

          {/* PASO 2: Seleccionar Especialidad */}
          {pacienteSeleccionado && (
            <div className="form-step">
              <div className="step-header">
                <span className="step-number">2</span>
                <h3>Especialidad Médica</h3>
              </div>

              <div className="form-group">
                <label htmlFor="especialidad">Buscar Especialidad</label>
                <div className="autocomplete-container">
                  <input
                    type="text"
                    id="especialidad"
                    value={searchEspecialidad}
                    onChange={(e) => {
                      setSearchEspecialidad(e.target.value);
                      setShowEspecialidadesSuggestions(true);
                    }}
                    onFocus={() => setShowEspecialidadesSuggestions(true)}
                    placeholder="Escriba para buscar..."
                    disabled={loading}
                    className="input-search"
                  />

                  {showEspecialidadesSuggestions && searchEspecialidad && (
                    <div className="suggestions-list">
                      {especialidadesFiltradas.length > 0 ? (
                        especialidadesFiltradas.map((esp) => (
                          <div
                            key={esp.id}
                            className="suggestion-item"
                            onClick={() => handleSelectEspecialidad(esp)}
                          >
                            🏥 {esp.nombre}
                          </div>
                        ))
                      ) : (
                        <div className="suggestion-item no-results">
                          No se encontraron especialidades
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {especialidadSeleccionada && !showEspecialidadesSuggestions && (
                  <div className="selected-tag">
                    <span>🏥 {especialidadSeleccionada.nombre}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEspecialidadSeleccionada(null);
                        setSearchEspecialidad("");
                        setDoctorSeleccionado(null);
                        setHorarios([]);
                      }}
                      className="tag-close"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PASO 3: Mostrar Doctor Asignado */}
          {especialidadSeleccionada && doctorSeleccionado && (
            <div className="form-step">
              <div className="step-header">
                <span className="step-number">3</span>
                <h3>Médico Asignado</h3>
              </div>

              <div className="doctor-asignado">
                <div className="doctor-avatar">👨‍⚕️</div>
                <div className="doctor-info-text">
                  <h4>
                    {doctorSeleccionado.nombres} {doctorSeleccionado.apellidos}
                  </h4>
                  <p>{doctorSeleccionado.especialidad}</p>
                </div>
              </div>
            </div>
          )}

          {/* PASO 4: Seleccionar Fecha y Horario */}
          {doctorSeleccionado && (
            <div className="form-step">
              <div className="step-header">
                <span className="step-number">4</span>
                <h3>Fecha y Hora de la Cita</h3>
              </div>

              <div className="form-group">
                <label htmlFor="fecha">Fecha de la Cita</label>
                <div className="fecha-selector">
                  <input
                    type="date"
                    id="fecha"
                    value={fechaSeleccionada}
                    onChange={(e) => handleFechaChange(e.target.value)}
                    min={fechaMinima}
                    max={fechaMaxima}
                    disabled={loading}
                    required
                    className="input-date"
                  />
                  <small className="fecha-info">
                    📅 Disponible desde hoy hasta el{" "}
                    {new Date(fechaMaxima).toLocaleDateString("es-PE", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </small>
                </div>
              </div>

              {loading && horarios.length === 0 && (
                <div className="horarios-loading">
                  <div className="spinner-small"></div>
                  <p>Cargando horarios disponibles...</p>
                </div>
              )}

              {!loading && horarios.length > 0 && (
                <div className="horarios-section">
                  <p className="horarios-title">
                    Horarios Disponibles para el{" "}
                    {new Date(fechaSeleccionada).toLocaleDateString("es-PE", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </p>
                  <div className="horarios-grid">
                    {horarios.map((horario) => (
                      <button
                        key={horario.hora}
                        type="button"
                        className={`horario-btn ${
                          horario.disponible ? "disponible" : "ocupado"
                        } ${
                          horaSeleccionada === horario.hora ? "selected" : ""
                        }`}
                        disabled={!horario.disponible}
                        onClick={() =>
                          horario.disponible &&
                          setHoraSeleccionada(horario.hora)
                        }
                      >
                        {horario.hora}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!loading && horarios.length === 0 && doctorSeleccionado && (
                <div className="no-horarios">
                  <p>
                    ⚠️ No hay horarios disponibles para la fecha seleccionada
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Botones de acción */}
          {pacienteSeleccionado &&
            especialidadSeleccionada &&
            doctorSeleccionado &&
            horaSeleccionada && (
              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  Registrar Cita
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setSearchDNI("");
                    setPacienteEncontrado(null);
                    setPacienteSeleccionado(null);
                    setEspecialidadSeleccionada(null);
                    setSearchEspecialidad("");
                    setDoctorSeleccionado(null);
                    setHoraSeleccionada("");
                    setError("");
                  }}
                  disabled={loading}
                >
                  Cancelar
                </button>
              </div>
            )}
        </form>
      </div>

      {/* Modal de Nuevo Paciente con DNI pre-llenado */}
      {mostrarNuevoPaciente && (
        <AgregarPacienteSimple
          dniInicial={searchDNI}
          onPacienteCreado={handlePacienteCreado}
          onCancelar={() => setMostrarNuevoPaciente(false)}
        />
      )}
    </div>
  );
};

export default ReservaCita;
