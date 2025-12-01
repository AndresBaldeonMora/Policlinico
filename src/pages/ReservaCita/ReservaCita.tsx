import { useState, useEffect } from "react";
// SERVICIOS
import {
  PacienteApiService,
  type PacienteTransformado,
} from "../../services/paciente.service";
import {
  EspecialidadApiService,
  type Especialidad,
} from "../../services/especialidad.service";
import {
  DoctorApiService, // <--- Asegúrate de exportar esto en doctor.service
  type DoctorTransformado as Doctor,
  type HorarioDisponible,
} from "../../services/doctor.service";
import { CitaApiService } from "../../services/cita.service";
import { ReniecService } from "../../services/reniec.service"; // <--- Importamos el servicio

// COMPONENTES Y ESTILOS
import AgregarPacienteSimple from "./AgregarPacienteSimple";
import "./ReservaCita.css";

// ===============================
// INTERFACES AUXILIARES
// ===============================
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

// ===============================
// STEPPER HEADER
// ===============================
const StepperHeader = ({
  pasoActual,
  irAlPaso,
}: {
  pasoActual: number;
  irAlPaso: (paso: number) => void;
}) => {
  const pasos = [
    "Especialidad",
    "Médico",
    "Mes",
    "Día",
    "Hora",
    "Paciente",
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

// ===============================
// COMPONENTE PRINCIPAL
// ===============================
const ReservaCita = () => {
  const [loading, setLoading] = useState(false);
  const [reniecLoading, setReniecLoading] = useState(false); // Loading específico para DNI
  const [error, setError] = useState("");
  const [pasoActual, setPasoActual] = useState(1);

  const [notification, setNotification] = useState({
    message: "",
    type: "",
    visible: false,
  });

  // PACIENTE
  const [searchDNI, setSearchDNI] = useState("");
  const [pacienteEncontrado, setPacienteEncontrado] =
    useState<PacienteTransformado | null>(null);
  const [pacienteSeleccionado, setPacienteSeleccionado] =
    useState<PacienteTransformado | null>(null);

  const [todosLosPacientes, setTodosLosPacientes] = useState<
    PacienteTransformado[]
  >([]);
  const [mostrarNuevoPaciente, setMostrarNuevoPaciente] = useState(false);

  // ESPECIALIDADES
  const [searchEspecialidad, setSearchEspecialidad] = useState("");
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [especialidadSeleccionada, setEspecialidadSeleccionada] =
    useState<Especialidad | null>(null);
  const [showEspecialidadesSuggestions, setShowEspecialidadesSuggestions] =
    useState(false);

  // DOCTOR
  const [todosLosDoctores, setTodosLosDoctores] = useState<Doctor[]>([]); // Lista maestra
  const [doctoresDisponibles, setDoctoresDisponibles] = useState<Doctor[]>([]); // Lista filtrada
  const [doctorSeleccionado, setDoctorSeleccionado] = useState<Doctor | null>(
    null
  );

  // FECHAS
  const [mesesDisponibles, setMesesDisponibles] = useState<MesOption[]>([]);
  const [mesSeleccionado, setMesSeleccionado] = useState<MesOption | null>(
    null
  );
  const [diasDelMes, setDiasDelMes] = useState<number[]>([]);
  const [diaSeleccionado, setDiaSeleccionado] = useState<number | null>(null);
  const [horariosPorDia, setHorariosPorDia] = useState<HorarioPorDia[]>([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState("");
  const [horaSeleccionada, setHoraSeleccionada] = useState("");

  // ===============================
  // INICIO
  // ===============================
  useEffect(() => {
    cargarDatos();
    generarMesesDisponibles();
  }, []);

  // ===============================
  // FILTRADO DE DOCTORES (CORRECCIÓN)
  // ===============================
  useEffect(() => {
    if (especialidadSeleccionada) {
      // Filtramos la lista maestra basándonos en la especialidad seleccionada
      // Asumiendo que doctor.especialidad es el nombre (string) o compara IDs si tienes doctor.especialidadId
      const filtrados = todosLosDoctores.filter(
        (doc) =>
          // Opción A: Si doctor.especialidad es un string
          doc.especialidad === especialidadSeleccionada.nombre
        // Opción B: Si tienes IDs, sería: doc.especialidadId === especialidadSeleccionada.id
      );

      setDoctoresDisponibles(filtrados);
      setDoctorSeleccionado(null); // Reseteamos selección si cambia la especialidad
    } else {
      setDoctoresDisponibles([]);
    }
  }, [especialidadSeleccionada, todosLosDoctores]);

  // =====================================================================
  // CONSULTAR PACIENTE (BD + RENIEC SERVICE)
  // =====================================================================
  const handleBuscarPaciente = async (dni: string) => {
    // Validación básica de entrada
    if ((dni && !/^\d*$/.test(dni)) || dni.length > 8) return;

    setSearchDNI(dni);
    setError("");
    setPacienteEncontrado(null);
    setPacienteSeleccionado(null);

    if (dni.length === 8) {
      // 1. Buscar en BD Local
      const pacienteLocal = todosLosPacientes.find((p) => p.dni === dni);
      if (pacienteLocal) {
        setPacienteEncontrado(pacienteLocal);
        return;
      }

      // 2. Buscar en RENIEC (Si no está en local)
      try {
        setReniecLoading(true);
        const dataReniec = await ReniecService.buscarPorDNI(dni);

        // Transformar data de Reniec a formato PacienteTransformado para la UI
        const pacienteReniec: PacienteTransformado = {
          _id: "temp_reniec", // ID temporal
          id: "temp_reniec",
          dni: dataReniec.dni,
          nombres: dataReniec.nombres,
          apellidos: `${dataReniec.apellidoPaterno} ${dataReniec.apellidoMaterno}`,
          telefono: "",
          correo: "",
          direccion: "",
          fechaNacimiento: "",
        };

        setPacienteEncontrado(pacienteReniec);
      } catch (err: unknown) {
        // Extraemos el mensaje de forma segura
        const mensaje =
          err instanceof Error ? err.message : "Error desconocido";

        console.warn("DNI no encontrado en Reniec:", mensaje);
        setPacienteEncontrado(null);
      } finally {
        setReniecLoading(false);
      }
    }
  };

  const handleSelectPaciente = (paciente: PacienteTransformado) => {
    setPacienteSeleccionado(paciente);
    setSearchDNI(paciente.dni);
    setError("");
  };

  const handlePacienteCreado = async (dni: string) => {
    setMostrarNuevoPaciente(false);
    await cargarDatos(); // Recargar lista completa

    // Buscar el recién creado en la lista actualizada (esto podría optimizarse retornándolo desde el modal)
    const pacientes = await PacienteApiService.listar();
    setTodosLosPacientes(pacientes);

    const pacienteNuevo = pacientes.find((p) => p.dni === dni);
    if (pacienteNuevo) {
      setPacienteEncontrado(pacienteNuevo);
      setPacienteSeleccionado(pacienteNuevo);
      setSearchDNI(pacienteNuevo.dni);
    }
  };

  // ===============================
  // CARGA INICIAL
  // ===============================
  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [pacientes, especialidadesData, doctoresData] = await Promise.all([
        PacienteApiService.listar(),
        EspecialidadApiService.listar(),
        DoctorApiService.listar(), // <--- Cargamos todos los doctores aquí
      ]);
      setTodosLosPacientes(pacientes);
      setEspecialidades(especialidadesData);
      setTodosLosDoctores(doctoresData); // Guardamos en la lista maestra
    } catch (e) {
      console.error("Error cargando datos iniciales", e);
      setError("Error de conexión al cargar datos.");
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // STEPS
  // ===============================
  const siguientePaso = () => {
    setError("");
    setPasoActual((p) => (p < 7 ? p + 1 : p));
  };

  const pasoAnterior = () => setPasoActual((p) => (p > 1 ? p - 1 : p));

  const irAlPaso = (paso: number) => {
    if (paso < pasoActual) setPasoActual(paso);
  };

  // ===============================
  // FECHAS Y HORARIOS
  // ===============================
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
      if (fecha >= hoy) dias.push(dia);
    }

    return dias;
  };

  useEffect(() => {
    const obtenerHorarios = async () => {
      // Solo buscamos si tenemos todos los datos necesarios
      if (diaSeleccionado && mesSeleccionado && doctorSeleccionado) {
        // 1. Construir fecha formato ISO (YYYY-MM-DD) para el Backend
        const fechaObj = new Date(
          mesSeleccionado.anio,
          mesSeleccionado.numero,
          diaSeleccionado
        );

        // Ajuste para formatear YYYY-MM-DD correctamente
        const anio = fechaObj.getFullYear();
        const mesStr = String(fechaObj.getMonth() + 1).padStart(2, "0");
        const diaStr = String(fechaObj.getDate()).padStart(2, "0");
        const fechaISO = `${anio}-${mesStr}-${diaStr}`;

        try {
          // 2. LLAMADA A TU SERVICIO REAL
          const horariosData =
            await DoctorApiService.obtenerHorariosDisponibles(
              doctorSeleccionado.id,
              fechaISO
            );

          // 3. Guardar en el estado
          setHorariosPorDia([
            {
              fecha: fechaObj.toLocaleDateString(),
              fechaISO: fechaISO,
              diaNombre: fechaObj.toLocaleDateString("es-ES", {
                weekday: "long",
              }),
              diaNumero: diaSeleccionado,
              horarios: horariosData,
            },
          ]);
        } catch (error) {
          console.error("Error cargando horarios", error);
          setHorariosPorDia([]);
        }
      }
    };

    obtenerHorarios();

    // Limpiamos la selección de hora previa si el usuario cambia de día
    setHoraSeleccionada("");
    setFechaSeleccionada("");
  }, [diaSeleccionado, mesSeleccionado, doctorSeleccionado]);

  // ===============================
  // CONFIRMAR CITA (CORREGIDO)
  // ===============================
  const handleConfirmarCita = async () => {
    if (pasoActual !== 7) {
      setPasoActual(7);
      return;
    }

    if (
      !pacienteSeleccionado ||
      !doctorSeleccionado ||
      !horaSeleccionada ||
      !fechaSeleccionada
    ) {
      setError("Datos incompletos.");
      return;
    }

    try {
      setLoading(true);

      let pacienteIdFinal = pacienteSeleccionado.id;

      // 🚨 PASO CRÍTICO: Si el paciente viene de RENIEC (ID temporal),
      // primero debemos guardarlo en la Base de Datos para obtener un ID real.
      if (pacienteIdFinal === "temp_reniec") {
        try {
          // Registramos al paciente con los datos que tenemos de RENIEC
          const nuevoPaciente = await PacienteApiService.crear({
            dni: pacienteSeleccionado.dni,
            nombres: pacienteSeleccionado.nombres,
            apellidos: pacienteSeleccionado.apellidos,
            // Llenamos con vacíos los datos que no trae RENIEC
            telefono: "",
            correo: "",
            direccion: "",
            fechaNacimiento: "",
          });

          // Actualizamos el ID con el que nos devuelve la base de datos
          pacienteIdFinal = nuevoPaciente.id;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Error desconocido";
          throw new Error(`Error al registrar el paciente nuevo: ${msg}`);
        }
      }

      // Ahora sí creamos la cita con un ID válido (ObjectId)
      await CitaApiService.crear({
        pacienteId: pacienteIdFinal, // <--- Usamos el ID real (ya sea el existente o el nuevo)
        doctorId: doctorSeleccionado.id,
        fecha: fechaSeleccionada,
        hora: horaSeleccionada,
      });

      setNotification({
        message: "Cita registrada exitosamente",
        type: "success",
        visible: true,
      });

      setTimeout(() => {
        setNotification((prev) => ({ ...prev, visible: false }));
        handleCancelarCita();
      }, 2000);
    } catch (e: unknown) {
      const mensaje = e instanceof Error ? e.message : "Error al crear la cita";
      setError(mensaje);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelarCita = () => {
    setSearchDNI("");
    setPacienteEncontrado(null);
    setPacienteSeleccionado(null);
    setEspecialidadSeleccionada(null);
    setSearchEspecialidad("");
    setDoctorSeleccionado(null);
    setDoctoresDisponibles([]); // Se limpiará solo por el useEffect de especialidad, pero por seguridad
    setMesSeleccionado(null);
    setDiaSeleccionado(null);
    setDiasDelMes([]);
    setHoraSeleccionada("");
    setFechaSeleccionada("");
    setHorariosPorDia([]);
    setError("");
    setPasoActual(1);
  };

  // ============================================================
  // =============== RENDER PRINCIPAL ===========================
  // ============================================================
  const renderPasoActual = () => {
    switch (pasoActual) {
      // ================= PASO 1 =================
      case 1:
        return (
          <div className="form-step">
            <div className="step-header">
              <span className="step-number">1</span>
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

                {showEspecialidadesSuggestions &&
                  searchEspecialidad &&
                  especialidades.filter((e) =>
                    e.nombre
                      .toLowerCase()
                      .includes(searchEspecialidad.toLowerCase())
                  ).length > 0 && (
                    <div className="suggestions-list">
                      {especialidades
                        .filter((esp) =>
                          esp.nombre
                            .toLowerCase()
                            .includes(searchEspecialidad.toLowerCase())
                        )
                        .map((esp) => (
                          <div
                            key={esp.id}
                            className="suggestion-item"
                            onClick={() => {
                              setEspecialidadSeleccionada(esp);
                              setSearchEspecialidad(esp.nombre);
                              setShowEspecialidadesSuggestions(false);
                              //   setDoctorSeleccionado(null); // Esto ahora lo maneja el useEffect
                            }}
                          >
                            🏥 {esp.nombre}
                          </div>
                        ))}
                    </div>
                  )}
              </div>

              {especialidadSeleccionada && (
                <div className="selected-tag">
                  <span>🏥 {especialidadSeleccionada.nombre}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEspecialidadSeleccionada(null);
                      setSearchEspecialidad("");
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

      // ================= PASO 2 =================
      case 2:
        return (
          <div className="form-step">
            <div className="step-header">
              <span className="step-number">2</span>
              <h3>Médico Asignado</h3>
            </div>

            {doctoresDisponibles.length === 0 ? (
              <div className="empty-state">
                <p>
                  No hay médicos disponibles para la especialidad{" "}
                  <b>{especialidadSeleccionada?.nombre}</b>.
                </p>
              </div>
            ) : (
              <div className="doctor-lista-seleccion">
                {doctoresDisponibles.map((doctor) => (
                  <div
                    key={doctor.id}
                    className={`doctor-asignado-selectable ${
                      doctorSeleccionado?.id === doctor.id ? "seleccionado" : ""
                    }`}
                    onClick={() => setDoctorSeleccionado(doctor)}
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
            )}
          </div>
        );

      // ================= PASO 3 =================
      case 3:
        return (
          <div className="form-step">
            <div className="step-header">
              <span className="step-number">3</span>
              <h3>Seleccionar Mes</h3>
            </div>

            <div className="selector-mes">
              {mesesDisponibles.map((mes) => (
                <button
                  key={mes.numero}
                  type="button"
                  className={`mes-btn ${
                    mesSeleccionado?.numero === mes.numero ? "activo" : ""
                  }`}
                  onClick={() => {
                    setMesSeleccionado(mes);
                    setDiasDelMes(generarDiasDelMes(mes));
                    setDiaSeleccionado(null);
                  }}
                >
                  {mes.nombre}
                </button>
              ))}
            </div>
          </div>
        );

      // ================= PASO 4 =================
      case 4:
        return (
          <div className="form-step">
            <div className="step-header">
              <span className="step-number">4</span>
              <h3>Seleccionar Día</h3>
            </div>

            <div className="selector-dia">
              {diasDelMes.map((d) => (
                <button
                  key={d}
                  className={`dia-btn ${diaSeleccionado === d ? "activo" : ""}`}
                  onClick={() => setDiaSeleccionado(d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        );

      // ================= PASO 5 =================
      case 5:
        return (
          <div className="form-step">
            <div className="step-header">
              <span className="step-number">5</span>
              <h3>Seleccionar Hora</h3>
            </div>

            <div className="horarios-contenedor">
              {horariosPorDia.map((dia) => (
                <div key={dia.fechaISO} className="dia-grupo">
                  <div className="horarios-horizontal">
                    {dia.horarios
                      .filter((h) => h.disponible)
                      .map((h) => (
                        <label
                          key={h.hora}
                          className={`horario-radio ${
                            h.hora === horaSeleccionada ? "seleccionado" : ""
                          }`}
                        >
                          <input
                            type="radio"
                            name="horario"
                            value={h.hora}
                            onChange={() => {
                              setHoraSeleccionada(h.hora);
                              setFechaSeleccionada(dia.fechaISO);
                            }}
                          />
                          <span>{h.hora} hs</span>
                        </label>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      // ================= PASO 6 (DISEÑO MEJORADO) =================
      case 6:
        return (
          <div className="form-step">
            <div className="step-header">
              <span className="step-number">6</span>
              <h3>Buscar Paciente</h3>
            </div>

            <div className="form-group">
              <label htmlFor="dni">DNI del Paciente</label>

              <div className="search-input-wrapper">
                <input
                  type="text"
                  id="dni"
                  value={searchDNI}
                  onChange={(e) => handleBuscarPaciente(e.target.value)}
                  maxLength={8}
                  placeholder="Ingrese los 8 dígitos..."
                  disabled={reniecLoading}
                />
                {reniecLoading && <div className="search-icon-spinner">⌛</div>}
              </div>

              {/* === TARJETA DE RESULTADO === */}
              {pacienteEncontrado && !pacienteSeleccionado && (
                <div
                  className="paciente-result-card"
                  onClick={() => handleSelectPaciente(pacienteEncontrado)}
                >
                  {/* Avatar con inicial */}
                  <div className="paciente-avatar-placeholder">
                    {pacienteEncontrado.nombres.charAt(0)}
                  </div>

                  <div className="paciente-info">
                    <span className="paciente-nombre">
                      {pacienteEncontrado.nombres}{" "}
                      {pacienteEncontrado.apellidos}
                    </span>
                    <div className="paciente-meta">
                      <span>DNI: {pacienteEncontrado.dni}</span>
                      {pacienteEncontrado.id === "temp_reniec" ? (
                        <span className="badge-reniec">Reniec</span>
                      ) : (
                        <span className="badge-bd">Registrado</span>
                      )}
                    </div>
                  </div>

                  {/* Icono de flecha o check sutil a la derecha */}
                  <div
                    style={{
                      marginLeft: "auto",
                      color: "#16a34a",
                      fontSize: "1.2rem",
                    }}
                  >
                    👉
                  </div>
                </div>
              )}

              {/* === ESTADO NO ENCONTRADO === */}
              {searchDNI.length === 8 &&
                !reniecLoading &&
                !pacienteEncontrado &&
                !pacienteSeleccionado && (
                  <div className="not-found-container">
                    <p className="not-found-text">
                      No encontramos resultados para este DNI.
                    </p>
                    <button
                      type="button"
                      onClick={() => setMostrarNuevoPaciente(true)}
                      className="btn-nuevo-paciente"
                    >
                      ➕ Registrar Nuevo Paciente
                    </button>
                  </div>
                )}
            </div>

            {/* Input "Nombre Completo" (Solo visible si ya seleccionamos, para confirmar visualmente) */}
            <div className="form-group" style={{ marginTop: "1.5rem" }}>
              <label>Paciente Seleccionado</label>
              <input
                type="text"
                disabled
                placeholder="Busque un DNI arriba..."
                value={
                  pacienteSeleccionado
                    ? `${pacienteSeleccionado.nombres} ${pacienteSeleccionado.apellidos}`
                    : ""
                }
                className="input-disabled"
                style={{
                  // Si ya seleccionó, ponemos borde verde para indicar éxito
                  borderColor: pacienteSeleccionado ? "#86efac" : "",
                }}
              />
            </div>
          </div>
        );

      // ================= PASO 7 =================
      case 7:
        return (
          <div className="form-step step-resumen">
            <div className="step-header">
              <span className="step-number">7</span>
              <h3>Resumen de la Cita</h3>
            </div>

            <div className="resumen-grid">
              <div className="resumen-item">
                <label>Paciente</label>
                <strong>
                  {pacienteSeleccionado
                    ? `${pacienteSeleccionado.nombres} ${pacienteSeleccionado.apellidos}`
                    : ""}
                </strong>
                <span>DNI: {pacienteSeleccionado?.dni}</span>
              </div>

              <div className="resumen-item">
                <label>Médico</label>
                <strong>
                  {doctorSeleccionado
                    ? `${doctorSeleccionado.nombres} ${doctorSeleccionado.apellidos}`
                    : ""}
                </strong>
                <span>Especialidad: {especialidadSeleccionada?.nombre}</span>
              </div>

              <div className="resumen-item">
                <label>Fecha y Hora</label>
                <strong>{fechaSeleccionada}</strong>
                <span>{horaSeleccionada} hs</span>
              </div>
            </div>
          </div>
        );
    }
  };

  // ============================================================
  // UI PRINCIPAL
  // ============================================================
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

        {error && <div className="error-message">{error}</div>}

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

            {pasoActual < 7 ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={siguientePaso}
                disabled={
                  (pasoActual === 1 && !especialidadSeleccionada) ||
                  (pasoActual === 2 && !doctorSeleccionado) ||
                  (pasoActual === 3 && !mesSeleccionado) ||
                  (pasoActual === 4 && !diaSeleccionado) ||
                  (pasoActual === 5 &&
                    (!fechaSeleccionada || !horaSeleccionada)) ||
                  (pasoActual === 6 && !pacienteSeleccionado)
                }
              >
                Siguiente
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmarCita}
              >
                Confirmar Cita
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
