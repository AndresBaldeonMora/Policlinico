import { useState, useEffect } from 'react';
import './ReservaCita.css';

interface Paciente {
  dni: string;
  nombre: string;
}

interface Doctor {
  id: string;
  nombre: string;
  especialidad: string;
  horarios: string[];
}

const ReservaCita = () => {
  const [paso, setPaso] = useState(1);
  const [searchDNI, setSearchDNI] = useState('');
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<Paciente | null>(null);
  const [especialidadSeleccionada, setEspecialidadSeleccionada] = useState('');
  const [searchEspecialidad, setSearchEspecialidad] = useState('');
  const [doctorSeleccionado, setDoctorSeleccionado] = useState<Doctor | null>(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState('');
  const [horaSeleccionada, setHoraSeleccionada] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Datos mock - En producción vendrán del backend
  const pacientesMock: Paciente[] = [
    { dni: '72345678', nombre: 'Juan Carlos Pérez Rodríguez' },
    { dni: '71234567', nombre: 'María Fernanda González Silva' },
    { dni: '70123456', nombre: 'Carlos Alberto Ruiz Martínez' },
    { dni: '73456789', nombre: 'Ana Patricia López Fernández' },
  ];

  const especialidades = [
    'Pediatría', 'Medicina Interna', 'Ginecología', 'Cardiología', 
    'Oftalmología', 'Medicina Física y Rehabilitación', 'Neumología', 
    'Reumatología', 'Radiología', 'Gastroenterología', 'Odontología', 
    'Endocrinología', 'Traumatología', 'Geriatría', 'Medicina Familiar', 
    'Ecografías', 'Otorrinolaringología', 'Urología'
  ];

  const doctoresMock: Doctor[] = [
    { 
      id: '1', 
      nombre: 'Dr. Roberto López Martínez', 
      especialidad: 'Cardiología',
      horarios: ['09:00', '09:30', '10:00', '10:30', '11:00']
    },
    { 
      id: '2', 
      nombre: 'Dra. Carmen García Ruiz', 
      especialidad: 'Cardiología',
      horarios: ['14:00', '14:30', '15:00', '15:30', '16:00']
    },
  ];

  // Buscar paciente por DNI
  const buscarPaciente = (dni: string) => {
    setSearchDNI(dni);
    if (dni.length >= 8) {
      const paciente = pacientesMock.find(p => p.dni === dni);
      if (paciente) {
        setPacienteSeleccionado(paciente);
      }
    } else {
      setPacienteSeleccionado(null);
    }
  };

  // Filtrar especialidades
  const especialidadesFiltradas = especialidades.filter(esp =>
    esp.toLowerCase().includes(searchEspecialidad.toLowerCase())
  );

  // Filtrar doctores por especialidad
  const doctoresDisponibles = doctoresMock.filter(
    doc => doc.especialidad === especialidadSeleccionada
  );

  // Generar horarios ocupados (mock)
  const horariosOcupados = ['10:00', '14:30'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Cita registrada:', {
      paciente: pacienteSeleccionado,
      especialidad: especialidadSeleccionada,
      doctor: doctorSeleccionado,
      fecha: fechaSeleccionada,
      hora: horaSeleccionada,
    });
    alert('✅ Cita registrada exitosamente');
  };

  // Establecer fecha actual por defecto
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setFechaSeleccionada(today);
  }, []);

  return (
    <div className="reserva-cita">
      <h1>Nueva Reserva de Cita</h1>

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
                required
                className="input-dni"
              />
              {pacienteSeleccionado && (
                <div className="paciente-info">
                  <span className="check-icon">✅</span>
                  <div>
                    <p className="paciente-nombre">{pacienteSeleccionado.nombre}</p>
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
                    className="input-search"
                  />
                  {showSuggestions && searchEspecialidad && (
                    <div className="suggestions-list">
                      {especialidadesFiltradas.length > 0 ? (
                        especialidadesFiltradas.map((esp) => (
                          <div
                            key={esp}
                            className="suggestion-item"
                            onClick={() => {
                              setEspecialidadSeleccionada(esp);
                              setSearchEspecialidad(esp);
                              setShowSuggestions(false);
                            }}
                          >
                            🏥 {esp}
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
                    <span>🏥 {especialidadSeleccionada}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEspecialidadSeleccionada('');
                        setSearchEspecialidad('');
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
                  onChange={(e) => setFechaSeleccionada(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="doctores-grid">
                {doctoresDisponibles.map((doctor) => (
                  <div key={doctor.id} className="doctor-card">
                    <div className="doctor-info">
                      <div className="doctor-avatar">👨‍⚕️</div>
                      <div>
                        <h4 className="doctor-nombre">{doctor.nombre}</h4>
                        <p className="doctor-especialidad">{doctor.especialidad}</p>
                      </div>
                    </div>

                    <div className="horarios-grid">
                      {doctor.horarios.map((hora) => {
                        const isOcupado = horariosOcupados.includes(hora);
                        const isSelected = doctorSeleccionado?.id === doctor.id && horaSeleccionada === hora;
                        
                        return (
                          <button
                            key={hora}
                            type="button"
                            className={`horario-btn ${isOcupado ? 'ocupado' : ''} ${isSelected ? 'selected' : ''}`}
                            disabled={isOcupado}
                            onClick={() => {
                              setDoctorSeleccionado(doctor);
                              setHoraSeleccionada(hora);
                            }}
                          >
                            {hora}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botones de acción */}
          {pacienteSeleccionado && especialidadSeleccionada && doctorSeleccionado && horaSeleccionada && (
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                ✅ Registrar Cita
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => window.location.href = '/'}
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