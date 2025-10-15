import { useState, useEffect } from 'react';
import { PacienteApiService, type Paciente } from '../services/Paciente.service';
import { EspecialidadApiService, type Especialidad } from '../services/especialidad.service';
import { DoctorApiService, type Doctor, type HorarioDisponible } from '../services/doctor.service';
import { CitaApiService } from '../services/cita.service';
import './ReservaCita.css';

const ReservaCita = () => {
  const [paso, setPaso] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Paso 1: Búsqueda de Paciente
  const [searchDNI, setSearchDNI] = useState('');
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<Paciente | null>(null);

  // Paso 2: Especialidad
  const [searchEspecialidad, setSearchEspecialidad] = useState('');
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [especialidadSeleccionada, setEspecialidadSeleccionada] = useState<Especialidad | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Paso 3: Doctor y Horarios
  const [doctores, setDoctores] = useState<Doctor[]>([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState('');
  const [doctorSeleccionado, setDoctorSeleccionado] = useState<Doctor | null>(null);
  const [horarios, setHorarios] = useState<HorarioDisponible[]>([]);
  const [horaSeleccionada, setHoraSeleccionada] = useState('');

  // Cargar especialidades al montar
  useEffect(() => {
    cargarEspecialidades();
    const today = new Date().toISOString().split('T')[0];
    setFechaSeleccionada(today);
  }, []);

  // Cargar especialidades
  const cargarEspecialidades = async () => {
    try {
      setLoading(true);
      const data = await EspecialidadApiService.listar();
      setEspecialidades(data);
    } catch (err) {
      setError('Error al cargar especialidades');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Buscar paciente por DNI
  const buscarPaciente = async (dni: string) => {
    setSearchDNI(dni);
    setError('');

    if (dni.length < 8) {
      setPacienteSeleccionado(null);
      return;
    }

    try {
      setLoading(true);
      const paciente = await PacienteApiService.buscarPorDNI(dni);
      
      if (paciente) {
        setPacienteSeleccionado(paciente);
      } else {
        setError('Paciente no encontrado');
        setPacienteSeleccionado(null);
      }
    } catch (err) {
      setError('Error al buscar paciente');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar especialidades
  const especialidadesFiltradas = especialidades.filter(esp =>
    esp.nombre.toLowerCase().includes(searchEspecialidad.toLowerCase())
  );

  // Seleccionar especialidad
  const handleSelectEspecialidad = (especialidad: Especialidad) => {
    setEspecialidadSeleccionada(especialidad);
    setSearchEspecialidad(especialidad.nombre);
    setShowSuggestions(false);
    cargarDoctores(especialidad.id);
  };

  // Cargar doctores por especialidad
  const cargarDoctores = async (especialidadId: string) => {
    try {
      setLoading(true);
      const data = await DoctorApiService.obtenerPorEspecialidad(especialidadId);
      setDoctores(data);
      setDoctorSeleccionado(null);
      setHorarios([]);
    } catch (err) {
      setError('Error al cargar doctores');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar horarios disponibles
  const cargarHorarios = async (doctorId: string, fecha: string) => {
    try {
      setLoading(true);
      const data = await DoctorApiService.obtenerHorariosDisponibles(doctorId, fecha);
      setHorarios(data);
      setHoraSeleccionada('');
    } catch (err) {
      setError('Error al cargar horarios');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambio de doctor
  const handleSelectDoctor = (doctor: Doctor) => {
    setDoctorSeleccionado(doctor);
    cargarHorarios(doctor.id, fechaSeleccionada);
  };

  // Manejar cambio de fecha
  const handleFechaChange = (nuevaFecha: string) => {
    setFechaSeleccionada(nuevaFecha);
    if (doctorSeleccionado) {
      cargarHorarios(doctorSeleccionado.id, nuevaFecha);
    }
  };

  // Crear cita
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pacienteSeleccionado || !doctorSeleccionado || !horaSeleccionada || !fechaSeleccionada) {
      setError('Por favor completa todos los campos');
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

      alert('✅ Cita registrada exitosamente');
      // Reiniciar formulario
      setSearchDNI('');
      setPacienteSeleccionado(null);
      setEspecialidadSeleccionada(null);
      setSearchEspecialidad('');
      setDoctorSeleccionado(null);
      setHoraSeleccionada('');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear cita');
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
              <h3>Buscar Paciente</h3>
            </div>
            
            <div className="form-group">
              <label htmlFor="dni">DNI del Paciente</label>
              <input
                type="text"
                id="dni"
                value={searchDNI}
                onChange={(e) => buscarPaciente(e.target.value)}
                placeholder="Ingrese DNI (8 dígitos)"
                maxLength={8}
                disabled={loading}
                className="input-dni"
              />
              {pacienteSeleccionado && (
                <div className="paciente-info">
                  <span className="check-icon">✅</span>
                  <div>
                    <p className="paciente-nombre">{pacienteSeleccionado.nombre} {pacienteSeleccionado.apellido}</p>
                    <p className="paciente-dni">DNI: {pacienteSeleccionado.dni}</p>
                  </div>
                </div>
              )}
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
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Escriba para buscar..."
                    disabled={loading}
                    className="input-search"
                  />
                  {showSuggestions && searchEspecialidad && (
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
                {especialidadSeleccionada && !showSuggestions && (
                  <div className="selected-tag">
                    <span>🏥 {especialidadSeleccionada.nombre}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEspecialidadSeleccionada(null);
                        setSearchEspecialidad('');
                        setDoctores([]);
                        setDoctorSeleccionado(null);
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

          {/* PASO 3: Seleccionar Doctor y Horario */}
          {especialidadSeleccionada && (
            <div className="form-step">
              <div className="step-header">
                <span className="step-number">3</span>
                <h3>Doctor y Horario</h3>
              </div>

              <div className="form-group">
                <label htmlFor="fecha">Fecha de la Cita</label>
                <input
                  type="date"
                  id="fecha"
                  value={fechaSeleccionada}
                  onChange={(e) => handleFechaChange(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  disabled={loading}
                  required
                />
              </div>

              {doctores.length > 0 && (
                <div className="doctores-grid">
                  {doctores.map((doctor) => (
                    <div 
                      key={doctor.id} 
                      className={`doctor-card ${doctorSeleccionado?.id === doctor.id ? 'selected' : ''}`}
                      onClick={() => handleSelectDoctor(doctor)}
                    >
                      <div className="doctor-info">
                        <div className="doctor-avatar">👨‍⚕️</div>
                        <div>
                          <h4 className="doctor-nombre">{doctor.nombre} {doctor.apellido}</h4>
                          <p className="doctor-especialidad">{doctor.especialidad}</p>
                        </div>
                      </div>

                      {doctorSeleccionado?.id === doctor.id && horarios.length > 0 && (
                        <div className="horarios-grid">
                          {horarios.map((horario) => (
                            <button
                              key={horario.hora}
                              type="button"
                              className={`horario-btn ${horario.disponible ? '' : 'ocupado'} ${horaSeleccionada === horario.hora ? 'selected' : ''}`}
                              disabled={!horario.disponible}
                              onClick={() => horario.disponible && setHoraSeleccionada(horario.hora)}
                            >
                              {horario.hora}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Botones de acción */}
          {pacienteSeleccionado && especialidadSeleccionada && doctorSeleccionado && horaSeleccionada && (
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                ✅ Registrar Cita
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => window.location.href = '/'}
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