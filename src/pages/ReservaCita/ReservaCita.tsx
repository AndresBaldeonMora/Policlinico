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

// --- Interfaces ---
interface HorarioPorDia {
  fecha: string;
  fechaISO: string;
  diaNombre: string;
  diaNumero: number;
  horarios: HorarioDisponible[];
}

interface MesOption {
  numero: number;
  nombre: string;
  anio: number;
}

// --- Componente Header del Stepper ---
const StepperHeader = ({
  pasoActual,
  irAlPaso,
}: {
  pasoActual: number;
  irAlPaso: (paso: number) => void;
}) => {
  const pasos = [
    "Paciente",
    "Especialidad",
    "Médico",
    "Fecha y Hora",
    "Confirmar",
  ];

  const getIconoPaso = (paso: number) => {
    if (paso < pasoActual) return "✓";
    return paso;
  };

  return (
    <div className="stepper-header">
      {pasos.map((titulo, index) => {
        const numeroPaso = index + 1;
        const esActivo = numeroPaso === pasoActual;
        const esCompletado = numeroPaso < pasoActual;

        return (
          <div
            key={numeroPaso}
            className={`stepper-item-wrapper ${
              esCompletado ? "clickable" : ""
            }`}
            onClick={() => {
              if (esCompletado) irAlPaso(numeroPaso);
            }}
          >
            <div
              className={`stepper-item ${esActivo ? "activo" : ""} ${
                esCompletado ? "completado" : ""
              }`}
            >
              <div className="stepper-circulo">{getIconoPaso(numeroPaso)}</div>
              <div className="stepper-titulo">{titulo}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// --- Componente Principal ---
const ReservaCita = () => {
  // --- Estados del Componente ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pasoActual, setPasoActual] = useState(1);

  const [notification, setNotification] = useState({
    message: "",
    type: "",
    visible: false,
  });

  // Estados (Paso 1: Paciente)
  const [searchDNI, setSearchDNI] = useState("");
  const [pacienteEncontrado, setPacienteEncontrado] =
    useState<PacienteTransformado | null>(null);
  const [pacienteSeleccionado, setPacienteSeleccionado] =
    useState<PacienteTransformado | null>(null);
  const [todosLosPacientes, setTodosLosPacientes] = useState<
    PacienteTransformado[]
  >([]);
  const [mostrarNuevoPaciente, setMostrarNuevoPaciente] = useState(false);

  // Estados (Paso 2: Especialidad)
  const [searchEspecialidad, setSearchEspecialidad] = useState("");
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [especialidadSeleccionada, setEspecialidadSeleccionada] =
    useState<Especialidad | null>(null);
  const [showEspecialidadesSuggestions, setShowEspecialidadesSuggestions] =
    useState(false);

  // Estados (Paso 3: Doctor)
  const [doctoresDisponibles, setDoctoresDisponibles] = useState<Doctor[]>([]);
  const [doctorSeleccionado, setDoctorSeleccionado] = useState<Doctor | null>(
    null
  );

  // Estados (Paso 4: Fecha y Hora)
  const [mesesDisponibles, setMesesDisponibles] = useState<MesOption[]>([]);
  const [mesSeleccionado, setMesSeleccionado] = useState<MesOption | null>(
    null
  );
  const [diasDelMes, setDiasDelMes] = useState<number[]>([]);
  const [diaSeleccionado, setDiaSeleccionado] = useState<number | null>(null);
  const [horariosPorDia, setHorariosPorDia] = useState<HorarioPorDia[]>([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState("");
  const [horaSeleccionada, setHoraSeleccionada] = useState("");

  // --- Efectos ---
  useEffect(() => {
    cargarDatos();
    generarMesesDisponibles();
  }, []);

  // --- Funciones de Navegación ---
  const siguientePaso = () => {
    setError("");
    setPasoActual((p) => (p < 5 ? p + 1 : p));
  };

  const pasoAnterior = () => {
    setPasoActual((p) => (p > 1 ? p - 1 : p));
  };

  const irAlPaso = (paso: number) => {
    if (paso < pasoActual) {
      setPasoActual(paso);
    }
  };

  // --- Funciones y Handlers ---

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type, visible: true });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  const handleCancelarCita = () => {
    setSearchDNI("");
    setPacienteEncontrado(null);
    setPacienteSeleccionado(null);
    setEspecialidadSeleccionada(null);
    setSearchEspecialidad("");
    setDoctorSeleccionado(null);
    setDoctoresDisponibles([]);
    setMesSeleccionado(null);
    setDiaSeleccionado(null);
    setDiasDelMes([]);
    setHoraSeleccionada("");
    setFechaSeleccionada("");
    setHorariosPorDia([]);
    setError("");
    setPasoActual(1);
  };

  const generarMesesDisponibles = () => {
    const meses: MesOption[] = [];
    const hoy = new Date();
    const nombresMeses = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];

    for (let i = 0; i < 3; i++) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() + i, 1);
      meses.push({
        numero: fecha.getMonth(),
        nombre: nombresMeses[fecha.getMonth()],
        anio: fecha.getFullYear(),
      });
    }
    setMesesDisponibles(meses);
  };

  const generarDiasDelMes = (mes: MesOption) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const ultimoDia = new Date(mes.anio, mes.numero + 1, 0);
    const dias: number[] = [];

    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      const fecha = new Date(mes.anio, mes.numero, dia);
      if (fecha >= hoy) {
        dias.push(dia);
      }
    }
    return dias;
  };

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [pacientes, especialidadesData] = await Promise.all([
        PacienteApiService.listar(),
        EspecialidadApiService.listar(),
      ]);
      setTodosLosPacientes(pacientes);
      setEspecialidades(especialidadesData);
    } catch (err) {
      setError("Error al cargar datos iniciales");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuscarPaciente = (dni: string) => {
    if ((dni && !/^\d*$/.test(dni)) || dni.length > 8) return;

    setSearchDNI(dni);
    setError("");
    setPacienteEncontrado(null);
    setPacienteSeleccionado(null);

    if (dni.length === 8) {
      const paciente = todosLosPacientes.find((p) => p.dni === dni);
      setPacienteEncontrado(paciente || null);
    }
  };

  const handleSelectPaciente = (paciente: PacienteTransformado) => {
    setPacienteSeleccionado(paciente);
    setSearchDNI(paciente.dni);
    setError("");
  };

  const handlePacienteCreado = async (dni: string) => {
    setMostrarNuevoPaciente(false);
    await cargarDatos();
    const pacientes = await PacienteApiService.listar();
    setTodosLosPacientes(pacientes);
    const pacienteNuevo = pacientes.find((p) => p.dni === dni);
    if (pacienteNuevo) {
      setPacienteEncontrado(pacienteNuevo);
      setPacienteSeleccionado(pacienteNuevo);
      setSearchDNI(pacienteNuevo.dni);
    }
  };

  const especialidadesFiltradas = especialidades.filter((esp) =>
    esp.nombre.toLowerCase().includes(searchEspecialidad.toLowerCase())
  );

  const handleSelectEspecialidad = async (especialidad: Especialidad) => {
    setEspecialidadSeleccionada(especialidad);
    setSearchEspecialidad(especialidad.nombre);
    setShowEspecialidadesSuggestions(false);

    setDoctorSeleccionado(null);
    setDoctoresDisponibles([]);
    setFechaSeleccionada("");
    setHoraSeleccionada("");

    await cargarDoctoresPorEspecialidad(especialidad.id);
  };

  const cargarDoctoresPorEspecialidad = async (especialidadId: string) => {
    try {
      setLoading(true);
      const doctores = await DoctorApiService.obtenerPorEspecialidad(
        especialidadId
      );
      setDoctoresDisponibles(doctores);

      if (doctores.length === 0) {
        setError("No hay doctores disponibles para esta especialidad");
        setDoctorSeleccionado(null);
      } else if (doctores.length === 1) {
        setDoctorSeleccionado(doctores[0]);
      } else {
        setDoctorSeleccionado(null);
      }
    } catch (err) {
      setError("Error al cargar doctores");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDoctor = (doctor: Doctor) => {
    setDoctorSeleccionado(doctor);
    setMesSeleccionado(null);
    setDiaSeleccionado(null);
    setDiasDelMes([]);
    setHoraSeleccionada("");
    setFechaSeleccionada("");
    setHorariosPorDia([]);
  };

  const formatearFechaCompleta = (fecha: Date): string => {
    return new Intl.DateTimeFormat("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(fecha);
  };

  const obtenerNombreDia = (fecha: Date): string => {
    const nombre = new Intl.DateTimeFormat("es-PE", {
      weekday: "long",
    }).format(fecha);
    return nombre.charAt(0).toUpperCase() + nombre.slice(1);
  };

  const cargarHorariosPorDia = async (mes: MesOption, dia: number) => {
    if (!doctorSeleccionado) return;
    setLoading(true);
    try {
      const fecha = new Date(mes.anio, mes.numero, dia);
      const fechaISO = fecha.toISOString().split("T")[0];
      const horariosDelDia = await DoctorApiService.obtenerHorariosDisponibles(
        doctorSeleccionado.id,
        fechaISO
      );
      setHorariosPorDia([
        {
          fecha: formatearFechaCompleta(fecha),
          fechaISO,
          diaNombre: obtenerNombreDia(fecha),
          diaNumero: dia,
          horarios: horariosDelDia,
        },
      ]);
    } catch (err) {
      setError("Error al cargar horarios");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMesSeleccionado = (mes: MesOption) => {
    setMesSeleccionado(mes);
    setDiaSeleccionado(null);
    setHorariosPorDia([]);
    setHoraSeleccionada("");
    setFechaSeleccionada("");
    setDiasDelMes(generarDiasDelMes(mes));
  };

  const handleDiaSeleccionado = async (dia: number) => {
    if (!mesSeleccionado || !doctorSeleccionado) return;
    setDiaSeleccionado(dia);
    setHoraSeleccionada("");
    setFechaSeleccionada("");
    await cargarHorariosPorDia(mesSeleccionado, dia);
  };

  const seleccionarHorario = (fechaISO: string, hora: string) => {
    setFechaSeleccionada(fechaISO);
    setHoraSeleccionada(hora);
  };

  const formatearFechaResumen = (fechaISO: string) => {
    if (!fechaISO) return "";
    const [anio, mes, dia] = fechaISO.split("-");
    const fecha = new Date(Number(anio), Number(mes) - 1, Number(dia));
    const nombreDia = new Intl.DateTimeFormat("es-PE", {
      weekday: "long",
    }).format(fecha);
    return `${
      nombreDia.charAt(0).toUpperCase() + nombreDia.slice(1)
    } ${dia}/${mes}/${anio}`;
  };

  // Confirmar cita (antes era handleSubmit con onSubmit del form)
  const handleConfirmarCita = async () => {
    if (pasoActual !== 5) {
      setPasoActual(5);
      return;
    }

    if (
      !pacienteSeleccionado ||
      !doctorSeleccionado ||
      !horaSeleccionada ||
      !fechaSeleccionada
    ) {
      setError("Datos incompletos. Por favor, revise el resumen de la cita.");
      return;
    }

    try {
      setLoading(true);
      await CitaApiService.crear({
        pacienteId: pacienteSeleccionado.id,
        doctorId: doctorSeleccionado.id,
        fecha: fechaSeleccionada,
        hora: horaSeleccionada,
        // estado: 'PENDIENTE'
      });
      showNotification("✅ ¡Cita registrada exitosamente!", "success");
      handleCancelarCita();
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Ocurrió un error al crear la cita";
      showNotification(`⚠️ ${errorMessage}`, "error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- Renderizado por Pasos ---
  const renderPasoActual = () => {
    switch (pasoActual) {
      // PASO 1: PACIENTE
      case 1:
        return (
          <div className="form-step">
            <div className="step-header">
              <span className="step-number">1</span>
              <h3>Buscar Paciente</h3>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dni">DNI del Paciente</label>
                <input
                  type="text"
                  id="dni"
                  value={searchDNI}
                  onChange={(e) => handleBuscarPaciente(e.target.value)}
                  placeholder="Ingrese 8 dígitos"
                  maxLength={8}
                  disabled={loading || !!pacienteSeleccionado}
                  className={`input-search ${
                    pacienteSeleccionado ? "input-disabled" : ""
                  }`}
                />
                {pacienteEncontrado && !pacienteSeleccionado && (
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
                <label htmlFor="nombrePaciente">Nombre Completo</label>
                <input
                  type="text"
                  id="nombrePaciente"
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
        );

      // PASO 2: ESPECIALIDAD
      case 2:
        return (
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
                      setMesSeleccionado(null);
                      setDiaSeleccionado(null);
                      setHorariosPorDia([]);
                    }}
                    className="tag-close"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      // PASO 3: MÉDICO
      case 3:
        return (
          <div className="form-step">
            <div className="step-header">
              <span className="step-number">3</span>
              <h3>Médico Asignado</h3>
            </div>
            {loading && <p>Cargando doctores...</p>}
            {!loading && doctoresDisponibles.length === 0 && (
              <div className="no-horarios">
                <p>😔 No hay doctores disponibles para esta especialidad.</p>
              </div>
            )}
            <div className="doctor-lista-seleccion">
              {doctoresDisponibles.map((doctor) => (
                <div
                  key={doctor.id}
                  className={`doctor-asignado-selectable ${
                    doctorSeleccionado?.id === doctor.id ? "seleccionado" : ""
                  }`}
                  onClick={() => handleSelectDoctor(doctor)}
                >
                  <div className="doctor-avatar">👨‍⚕️</div>
                  <div className="doctor-info-text">
                    <h4>
                      {doctor.nombres} {doctor.apellidos}
                    </h4>
                    <p>{doctor.especialidad}</p>
                  </div>
                  {doctorSeleccionado?.id === doctor.id && (
                    <span className="doctor-check-mark">✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      // PASO 4: FECHA Y HORA
      case 4:
        return (
          <div className="form-step">
            <div className="step-header">
              <span className="step-number">4</span>
              <h3>Seleccionar Fecha y Hora</h3>
            </div>

            <div className="selector-mes">
              <label className="selector-label">Seleccionar Mes:</label>
              <div className="meses-lista">
                {mesesDisponibles.map((mes) => (
                  <button
                    key={`${mes.anio}-${mes.numero}`}
                    type="button"
                    className={`mes-btn ${
                      mesSeleccionado?.numero === mes.numero &&
                      mesSeleccionado?.anio === mes.anio
                        ? "activo"
                        : ""
                    }`}
                    onClick={() => handleMesSeleccionado(mes)}
                    disabled={loading}
                  >
                    {mes.nombre} {mes.anio}
                  </button>
                ))}
              </div>
            </div>

            {mesSeleccionado && diasDelMes.length > 0 && (
              <div className="selector-dia">
                <label className="selector-label">Seleccionar Día:</label>
                <div className="dias-lista-selector">
                  {diasDelMes.map((dia) => (
                    <button
                      key={dia}
                      type="button"
                      className={`dia-btn ${
                        diaSeleccionado === dia ? "activo" : ""
                      }`}
                      onClick={() => handleDiaSeleccionado(dia)}
                      disabled={loading}
                    >
                      {dia}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {diaSeleccionado && (
              <div className="horarios-contenedor">
                {loading && horariosPorDia.length === 0 ? (
                  <div className="horarios-loading">
                    <div className="spinner-small"></div>
                    <p>Cargando horarios...</p>
                  </div>
                ) : horariosPorDia.length > 0 &&
                  horariosPorDia[0].horarios.filter((h) => h.disponible)
                    .length > 0 ? (
                  <div className="dias-lista">
                    {horariosPorDia.map((dia) => (
                      <div key={dia.fechaISO} className="dia-grupo">
                        <div className="dia-header">
                          <span className="dia-nombre">{dia.diaNombre}</span>
                          <span className="dia-fecha">📅 {dia.fecha}</span>
                        </div>
                        <div className="horarios-horizontal">
                          {dia.horarios
                            .filter((h) => h.disponible)
                            .map((horario) => (
                              <label
                                key={horario.hora}
                                className={`horario-radio ${
                                  fechaSeleccionada === dia.fechaISO &&
                                  horaSeleccionada === horario.hora
                                    ? "seleccionado"
                                    : ""
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="horario"
                                  value={horario.hora}
                                  checked={
                                    fechaSeleccionada === dia.fechaISO &&
                                    horaSeleccionada === horario.hora
                                  }
                                  onChange={() =>
                                    seleccionarHorario(
                                      dia.fechaISO,
                                      horario.hora
                                    )
                                  }
                                />
                                <span className="horario-texto">
                                  {horario.hora} hs
                                </span>
                              </label>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-horarios">
                    <p>😔 No hay horarios disponibles para este día.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      // PASO 5: RESUMEN
      case 5:
        return (
          <div className="form-step step-resumen">
            <div className="step-header">
              <span className="step-number">5</span>
              <h3>Resumen de la Cita</h3>
            </div>
            <div className="resumen-grid">
              {/* Paciente */}
              <div className="resumen-item">
                <label>Paciente</label>
                <strong>
                  {pacienteSeleccionado
                    ? `${pacienteSeleccionado.nombres} ${pacienteSeleccionado.apellidos}`
                    : "N/A"}
                </strong>
                <span>DNI: {pacienteSeleccionado?.dni || "N/A"}</span>
              </div>

              {/* Médico */}
              <div className="resumen-item">
                <label>Médico</label>
                <strong>
                  {doctorSeleccionado
                    ? `${doctorSeleccionado.nombres} ${doctorSeleccionado.apellidos}`
                    : "N/A"}
                </strong>
                <span>
                  {especialidadSeleccionada?.nombre || "Especialidad N/A"}
                </span>
              </div>

              {/* Fecha y Hora */}
              <div className="resumen-item">
                <label>Fecha y Hora</label>
                <strong>{formatearFechaResumen(fechaSeleccionada)}</strong>
                <span>{horaSeleccionada} hs</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // --- Renderizado Principal ---
  return (
    <div className="reserva-cita">
      {notification.visible && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="reserva-cita-header">
        <h1>📅 Reservar Cita Médica</h1>
        <button
          onClick={handleCancelarCita}
          className="btn-close-form"
          title="Cancelar y Reiniciar"
        >
          ×
        </button>
      </div>

      <div className="card">
        <StepperHeader pasoActual={pasoActual} irAlPaso={irAlPaso} />

        {error && <div className="error-message">⚠️ {error}</div>}

        {/* Bloqueamos submit automático del form */}
        <form
          className="cita-form"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <div className="paso-content">{renderPasoActual()}</div>

          <div className="stepper-navigation">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={pasoAnterior}
              disabled={pasoActual === 1 || loading}
            >
              Anterior
            </button>

            {pasoActual < 5 ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={siguientePaso}
                disabled={
                  (pasoActual === 1 && !pacienteSeleccionado) ||
                  (pasoActual === 2 && !especialidadSeleccionada) ||
                  (pasoActual === 3 && !doctorSeleccionado) ||
                  (pasoActual === 4 &&
                    (!fechaSeleccionada || !horaSeleccionada)) ||
                  loading
                }
              >
                Siguiente
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary btn-confirmar"
                onClick={handleConfirmarCita}
                disabled={loading}
              >
                {loading ? "Registrando..." : "Confirmar Cita"}
              </button>
            )}
          </div>
        </form>
      </div>

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
