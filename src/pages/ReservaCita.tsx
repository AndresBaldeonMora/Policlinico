import { useState, useEffect } from "react";
import {
  PacienteApiService,
  type Paciente,
} from "../services/paciente.service";
import {
  EspecialidadApiService,
  type Especialidad,
} from "../services/especialidad.service";
import {
  DoctorApiService,
  type Doctor,
  type HorarioDisponible,
} from "../services/doctor.service";
import { CitaApiService } from "../services/cita.service";
import "./ReservaCita.css";

const ReservaCita = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Paso 1: Búsqueda de Paciente
  const [searchDNI, setSearchDNI] = useState("");
  const [pacientesFiltrados, setPacientesFiltrados] = useState<Paciente[]>([]);
  const [pacienteSeleccionado, setPacienteSeleccionado] =
    useState<Paciente | null>(null);
  const [showPacientesSuggestions, setShowPacientesSuggestions] =
    useState(false);
  const [todosLosPacientes, setTodosLosPacientes] = useState<Paciente[]>([]);

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

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
    const today = new Date().toISOString().split("T")[0];
    setFechaSeleccionada(today);
  }, []);

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

  // Buscar pacientes - Desde 4 dígitos
  const handleBuscarPaciente = (dni: string) => {
    setSearchDNI(dni);
    setError("");

    if (dni.length >= 4) {
      const filtrados = todosLosPacientes.filter((p) => p.dni.startsWith(dni));
      setPacientesFiltrados(filtrados);
      setShowPacientesSuggestions(true);
    } else {
      setPacientesFiltrados([]);
      setShowPacientesSuggestions(false);
      setPacienteSeleccionado(null);
    }
  };

  // Seleccionar paciente
  const handleSelectPaciente = (paciente: Paciente) => {
    setPacienteSeleccionado(paciente);
    setSearchDNI(paciente.dni);
    setShowPacientesSuggestions(false);
    setError("");
  };

  // Buscar especialidades
  const especialidadesFiltradas = especialidades.filter((esp) =>
    esp.nombre.toLowerCase().includes(searchEspecialidad.toLowerCase())
  );

  const handleSelectEspecialidad = async (especialidad: Especialidad) => {
    setEspecialidadSeleccionada(especialidad);
    setSearchEspecialidad(especialidad.nombre);
    setShowEspecialidadesSuggestions(false);
    console.log("Especialidad seleccionada:", especialidad); // Verifica el id
    await cargarDoctorPorEspecialidad(especialidad.id);
  };

  // Modificar esta función para usar la nueva ruta que devuelve los doctores por especialidad
  const cargarDoctorPorEspecialidad = async (especialidadId: string) => {
    try {
      setLoading(true);
      // Asegúrate de que se pasa el especialidadId en la URL correcta
      const doctores = await DoctorApiService.obtenerPorEspecialidad(
        especialidadId
      );

      // Verificar los doctores obtenidos en la consola
      console.log("Doctores obtenidos:", doctores);

      if (doctores.length > 0) {
        setDoctorSeleccionado(doctores[0]); // Asigna el primer doctor
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
      const data = await DoctorApiService.obtenerHorariosDisponibles(
        doctorId,
        fecha
      );
      setHorarios(data);
      setHoraSeleccionada("");
    } catch (err) {
      setError("Error al cargar horarios");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Cambiar fecha
  const handleFechaChange = (nuevaFecha: string) => {
    setFechaSeleccionada(nuevaFecha);
    if (doctorSeleccionado) {
      cargarHorarios(doctorSeleccionado.id, nuevaFecha);
    }
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
      setPacienteSeleccionado(null);
      setEspecialidadSeleccionada(null);
      setSearchEspecialidad("");
      setDoctorSeleccionado(null);
      setHoraSeleccionada("");
      setError("");
      setPacientesFiltrados([]);
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
                <div className="autocomplete-container">
                  <input
                    type="text"
                    id="dni"
                    value={searchDNI}
                    onChange={(e) => handleBuscarPaciente(e.target.value)}
                    onFocus={() =>
                      searchDNI.length >= 4 && setShowPacientesSuggestions(true)
                    }
                    placeholder="Ingrese al menos 4 dígitos"
                    maxLength={8}
                    disabled={loading}
                    className="input-search"
                  />

                  {showPacientesSuggestions &&
                    pacientesFiltrados.length > 0 && (
                      <div className="suggestions-list">
                        {pacientesFiltrados.map((paciente) => (
                          <div
                            key={paciente.id}
                            className="suggestion-item"
                            onClick={() => handleSelectPaciente(paciente)}
                          >
                            <div className="suggestion-dni">{paciente.dni}</div>
                            <div className="suggestion-nombre">
                              {paciente.nombres} {paciente.apellidos}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
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
                <input
                  type="date"
                  id="fecha"
                  value={fechaSeleccionada}
                  onChange={(e) => handleFechaChange(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  disabled={loading}
                  required
                  className="input-date"
                />
              </div>

              {horarios.length > 0 && (
                <div className="horarios-section">
                  <p className="horarios-title">Horarios Disponibles</p>
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
                    setPacienteSeleccionado(null);
                    setEspecialidadSeleccionada(null);
                    setSearchEspecialidad("");
                    setDoctorSeleccionado(null);
                    setHoraSeleccionada("");
                    setError("");
                    setPacientesFiltrados([]);
                  }}
                  disabled={loading}
                >
                  Cancelar
                </button>
              </div>
            )}
        </form>
      </div>
    </div>
  );
};

export default ReservaCita;
