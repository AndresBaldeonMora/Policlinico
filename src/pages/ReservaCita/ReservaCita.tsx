import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

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
import { ReniecService } from "../../services/reniec.service";

import AgregarPacienteSimple from "./AgregarPacienteSimple";
import "./ReservaCita.css";

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

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

interface NotificationState {
  message: string;
  type: "success" | "error" | "";
  visible: boolean;
}

const PASOS_TOTALES = 7;
const DNI_LENGTH = 8;
const NOTIFICATION_DURATION = 2000;

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
] as const;

const PASOS_LABELS = [
  "Especialidad",
  "Médico",
  "Mes",
  "Día",
  "Hora",
  "Paciente",
  "Confirmar",
] as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const parseISODate = (
  iso: string
): { y: number; m: number; d: number } | null => {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) return null;
  return { y, m, d };
};

const esDNIValido = (dni: string): boolean => {
  return /^\d{8}$/.test(dni);
};

const generarMesesDisponibles = (mesesAdelante = 3): MesOption[] => {
  const meses: MesOption[] = [];
  const hoy = new Date();

  for (let i = 0; i < mesesAdelante; i++) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() + i, 1);
    meses.push({
      numero: fecha.getMonth(),
      nombre: nombresMeses[fecha.getMonth()],
      anio: fecha.getFullYear(),
    });
  }

  return meses;
};

const generarDiasDelMes = (mes: MesOption): number[] => {
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

// ============================================================================
// STEPPER COMPONENT
// ============================================================================

interface StepperHeaderProps {
  pasoActual: number;
  irAlPaso: (paso: number) => void;
}

const StepperHeader = ({ pasoActual, irAlPaso }: StepperHeaderProps) => {
  const getIconoPaso = (paso: number): string | number => {
    return paso < pasoActual ? "✓" : paso;
  };

  return (
    <div className="stepper-header">
      {PASOS_LABELS.map((titulo, index) => {
        const numeroPaso = index + 1;
        const esActivo = numeroPaso === pasoActual;
        const esCompletado = numeroPaso < pasoActual;

        return (
          <div
            key={numeroPaso}
            className={`stepper-item-wrapper ${
              esCompletado ? "clickable" : ""
            }`}
            onClick={() => esCompletado && irAlPaso(numeroPaso)}
            role={esCompletado ? "button" : undefined}
            tabIndex={esCompletado ? 0 : undefined}
            onKeyDown={(e) => {
              if (esCompletado && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                irAlPaso(numeroPaso);
              }
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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ReservaCita = () => {
  // State: Loading & Errors
  const [loading, setLoading] = useState(false);
  const [reniecLoading, setReniecLoading] = useState(false);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState<NotificationState>({
    message: "",
    type: "",
    visible: false,
  });

  // State: Navigation
  const [pasoActual, setPasoActual] = useState(1);

  // State: Paciente
  const [searchDNI, setSearchDNI] = useState("");
  const [pacienteEncontrado, setPacienteEncontrado] =
    useState<PacienteTransformado | null>(null);
  const [pacienteSeleccionado, setPacienteSeleccionado] =
    useState<PacienteTransformado | null>(null);
  const [todosLosPacientes, setTodosLosPacientes] = useState<
    PacienteTransformado[]
  >([]);
  const [mostrarNuevoPaciente, setMostrarNuevoPaciente] = useState(false);

  // State: Especialidad
  const [searchEspecialidad, setSearchEspecialidad] = useState("");
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [especialidadSeleccionada, setEspecialidadSeleccionada] =
    useState<Especialidad | null>(null);
  const [showEspecialidadesSuggestions, setShowEspecialidadesSuggestions] =
    useState(false);

  // State: Doctor
  const [todosLosDoctores, setTodosLosDoctores] = useState<Doctor[]>([]);
  const [doctoresDisponibles, setDoctoresDisponibles] = useState<Doctor[]>([]);
  const [doctorSeleccionado, setDoctorSeleccionado] = useState<Doctor | null>(
    null
  );

  // State: Fecha y Hora
  const [mesesDisponibles, setMesesDisponibles] = useState<MesOption[]>([]);
  const [mesSeleccionado, setMesSeleccionado] = useState<MesOption | null>(
    null
  );
  const [diasDelMes, setDiasDelMes] = useState<number[]>([]);
  const [diaSeleccionado, setDiaSeleccionado] = useState<number | null>(null);
  const [horariosPorDia, setHorariosPorDia] = useState<HorarioPorDia[]>([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState("");
  const [horaSeleccionada, setHoraSeleccionada] = useState("");

  // URL Params
  const [searchParams] = useSearchParams();
  const fechaParam = searchParams.get("fecha") || "";
  const doctorIdParam = searchParams.get("doctorId") || "";

  const prefillHasFecha = useMemo(
    () => !!parseISODate(fechaParam),
    [fechaParam]
  );
  const prefillHasDoctor = useMemo(() => !!doctorIdParam, [doctorIdParam]);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const [pacientes, especialidadesData, doctoresData] = await Promise.all([
        PacienteApiService.listar(),
        EspecialidadApiService.listar(),
        DoctorApiService.listar(),
      ]);

      setTodosLosPacientes(pacientes);
      setEspecialidades(especialidadesData);
      setTodosLosDoctores(doctoresData);
    } catch (err) {
      console.error("Error cargando datos:", err);
      setError("Error de conexión al cargar datos.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    cargarDatos();
    setMesesDisponibles(generarMesesDisponibles());
  }, [cargarDatos]);

  // ============================================================================
  // URL PREFILL LOGIC
  // ============================================================================

  // Prefill fecha from URL
  useEffect(() => {
    if (!prefillHasFecha) return;

    const parsed = parseISODate(fechaParam);
    if (!parsed) return;

    const mesOpt: MesOption = {
      numero: parsed.m - 1,
      nombre: nombresMeses[parsed.m - 1],
      anio: parsed.y,
    };

    setMesSeleccionado(mesOpt);
    setDiasDelMes(generarDiasDelMes(mesOpt));
    setDiaSeleccionado(parsed.d);
    setFechaSeleccionada(fechaParam);

    setPasoActual((prev) => Math.max(prev, 4));
  }, [fechaParam, prefillHasFecha]);

  // Prefill doctor from URL
  useEffect(() => {
    if (!prefillHasDoctor || todosLosDoctores.length === 0) return;

    const doctor = todosLosDoctores.find((d) => d.id === doctorIdParam);
    if (!doctor) return;

    setDoctorSeleccionado(doctor);

    if (especialidades.length > 0) {
      const esp = especialidades.find((e) => e.nombre === doctor.especialidad);
      if (esp) {
        setEspecialidadSeleccionada(esp);
        setSearchEspecialidad(esp.nombre);
      }
    }

    setPasoActual((prev) => Math.max(prev, prefillHasFecha ? 5 : 2));
  }, [
    doctorIdParam,
    prefillHasDoctor,
    todosLosDoctores,
    especialidades,
    prefillHasFecha,
  ]);

  // ============================================================================
  // ESPECIALIDAD & DOCTOR LOGIC
  // ============================================================================

  useEffect(() => {
    if (!especialidadSeleccionada) {
      setDoctoresDisponibles([]);
      setDoctorSeleccionado(null);
      return;
    }

    const filtrados = todosLosDoctores.filter(
      (doc) => doc.especialidad === especialidadSeleccionada.nombre
    );

    setDoctoresDisponibles(filtrados);

    // Reset doctor if not in filtered list
    setDoctorSeleccionado((prev) => {
      if (!prev) return null;
      return filtrados.some((d) => d.id === prev.id) ? prev : null;
    });
  }, [especialidadSeleccionada, todosLosDoctores]);

  // ============================================================================
  // HORARIOS LOGIC
  // ============================================================================

  useEffect(() => {
    const obtenerHorarios = async () => {
      if (!diaSeleccionado || !mesSeleccionado || !doctorSeleccionado) {
        setHorariosPorDia([]);
        return;
      }

      const anio = mesSeleccionado.anio;
      const mesStr = String(mesSeleccionado.numero + 1).padStart(2, "0");
      const diaStr = String(diaSeleccionado).padStart(2, "0");
      const fechaISO = `${anio}-${mesStr}-${diaStr}`;

      try {
        const horariosData = await DoctorApiService.obtenerHorariosDisponibles(
          doctorSeleccionado.id,
          fechaISO
        );

        const fechaObj = new Date(
          anio,
          mesSeleccionado.numero,
          diaSeleccionado
        );

        setHorariosPorDia([
          {
            fecha: fechaObj.toLocaleDateString(),
            fechaISO,
            diaNombre: fechaObj.toLocaleDateString("es-ES", {
              weekday: "long",
            }),
            diaNumero: diaSeleccionado,
            horarios: horariosData,
          },
        ]);

        if (!horaSeleccionada && !prefillHasFecha) {
          setFechaSeleccionada(fechaISO);
        }
      } catch (err) {
        console.error("Error obteniendo horarios:", err);
        setHorariosPorDia([]);
      }
    };

    obtenerHorarios();

    // Reset hora when día/mes/doctor changes (unless prefilled)
    if (!prefillHasFecha) {
      setHoraSeleccionada("");
      setFechaSeleccionada("");
    }
  }, [
    diaSeleccionado,
    mesSeleccionado,
    doctorSeleccionado,
    horaSeleccionada,
    prefillHasFecha,
  ]);

  // ============================================================================
  // PACIENTE HANDLERS
  // ============================================================================

  const handleBuscarPaciente = useCallback(
    async (dni: string) => {
      // Validar input
      if (dni && !/^\d*$/.test(dni)) return;
      if (dni.length > DNI_LENGTH) return;

      setSearchDNI(dni);
      setError("");
      setPacienteEncontrado(null);
      setPacienteSeleccionado(null);

      if (!esDNIValido(dni)) return;

      // Buscar en pacientes locales primero
      const pacienteLocal = todosLosPacientes.find((p) => p.dni === dni);
      if (pacienteLocal) {
        setPacienteEncontrado(pacienteLocal);
        return;
      }

      // Buscar en RENIEC
      try {
        setReniecLoading(true);
        const dataReniec = await ReniecService.buscarPorDNI(dni);

        const pacienteReniec: PacienteTransformado = {
          _id: "temp_reniec",
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
      } catch (err) {
        console.error("Error buscando en RENIEC:", err);
        setPacienteEncontrado(null);
      } finally {
        setReniecLoading(false);
      }
    },
    [todosLosPacientes]
  );

  const handleSelectPaciente = useCallback((paciente: PacienteTransformado) => {
    setPacienteSeleccionado(paciente);
    setSearchDNI(paciente.dni);
    setError("");
  }, []);

  const handlePacienteCreado = useCallback(async (dni: string) => {
    setMostrarNuevoPaciente(false);

    const pacientes = await PacienteApiService.listar();
    setTodosLosPacientes(pacientes);

    const pacienteNuevo = pacientes.find((p) => p.dni === dni);
    if (pacienteNuevo) {
      setPacienteEncontrado(pacienteNuevo);
      setPacienteSeleccionado(pacienteNuevo);
      setSearchDNI(pacienteNuevo.dni);
    }
  }, []);

  // ============================================================================
  // NAVIGATION HANDLERS
  // ============================================================================

  const siguientePaso = useCallback(() => {
    setError("");
    setPasoActual((prev) => Math.min(prev + 1, PASOS_TOTALES));
  }, []);

  const pasoAnterior = useCallback(() => {
    setPasoActual((prev) => Math.max(prev - 1, 1));
  }, []);

  const irAlPaso = useCallback(
    (paso: number) => {
      if (paso < pasoActual) {
        setPasoActual(paso);
      }
    },
    [pasoActual]
  );

  // ============================================================================
  // CONFIRM & CANCEL HANDLERS
  // ============================================================================

  const handleConfirmarCita = useCallback(async () => {
    if (pasoActual !== PASOS_TOTALES) {
      setPasoActual(PASOS_TOTALES);
      return;
    }

    if (
      !pacienteSeleccionado ||
      !doctorSeleccionado ||
      !horaSeleccionada ||
      !fechaSeleccionada
    ) {
      setError("Datos incompletos para confirmar la cita.");
      return;
    }

    try {
      setLoading(true);

      let pacienteIdFinal = pacienteSeleccionado.id;

      // Crear paciente si es de RENIEC
      if (pacienteIdFinal === "temp_reniec") {
        const nuevoPaciente = await PacienteApiService.crear({
          dni: pacienteSeleccionado.dni,
          nombres: pacienteSeleccionado.nombres,
          apellidos: pacienteSeleccionado.apellidos,
          telefono: "",
          correo: "",
          direccion: "",
          fechaNacimiento: "",
        });

        pacienteIdFinal = nuevoPaciente.id;
      }

      await CitaApiService.crear({
        pacienteId: pacienteIdFinal,
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
      }, NOTIFICATION_DURATION);
    } catch (err) {
      const mensaje =
        err instanceof Error ? err.message : "Error al crear la cita";
      setError(mensaje);
      console.error("Error confirmando cita:", err);
    } finally {
      setLoading(false);
    }
  }, [
    pasoActual,
    pacienteSeleccionado,
    doctorSeleccionado,
    horaSeleccionada,
    fechaSeleccionada,
  ]);

  const handleCancelarCita = useCallback(() => {
    // Reset all states
    setSearchDNI("");
    setPacienteEncontrado(null);
    setPacienteSeleccionado(null);
    setEspecialidadSeleccionada(null);
    setSearchEspecialidad("");
    setShowEspecialidadesSuggestions(false);
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
  }, []);

  // ============================================================================
  // VALIDATION HELPERS
  // ============================================================================

  const isPasoValido = useCallback(
    (paso: number): boolean => {
      switch (paso) {
        case 1:
          return !!especialidadSeleccionada;
        case 2:
          return !!doctorSeleccionado;
        case 3:
          return !!mesSeleccionado;
        case 4:
          return !!diaSeleccionado;
        case 5:
          return !!fechaSeleccionada && !!horaSeleccionada;
        case 6:
          return !!pacienteSeleccionado;
        default:
          return true;
      }
    },
    [
      especialidadSeleccionada,
      doctorSeleccionado,
      mesSeleccionado,
      diaSeleccionado,
      fechaSeleccionada,
      horaSeleccionada,
      pacienteSeleccionado,
    ]
  );

  // ============================================================================
  // RENDER STEPS
  // ============================================================================

  const renderPasoActual = () => {
    switch (pasoActual) {
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
                    aria-label="Deseleccionar especialidad"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>
        );

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
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setDoctorSeleccionado(doctor);
                      }
                    }}
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
                  key={`${mes.anio}-${mes.numero}`}
                  type="button"
                  className={`mes-btn ${
                    mesSeleccionado?.numero === mes.numero &&
                    mesSeleccionado?.anio === mes.anio
                      ? "activo"
                      : ""
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
                  type="button"
                  className={`dia-btn ${diaSeleccionado === d ? "activo" : ""}`}
                  onClick={() => setDiaSeleccionado(d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        );

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
                            checked={h.hora === horaSeleccionada}
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
                  maxLength={DNI_LENGTH}
                  placeholder="Ingrese los 8 dígitos..."
                  disabled={reniecLoading}
                />
                {reniecLoading && <div className="search-icon-spinner">⌛</div>}
              </div>

              {pacienteEncontrado && !pacienteSeleccionado && (
                <div
                  className="paciente-result-card"
                  onClick={() => handleSelectPaciente(pacienteEncontrado)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelectPaciente(pacienteEncontrado);
                    }
                  }}
                >
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

              {esDNIValido(searchDNI) &&
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
                style={{ borderColor: pacienteSeleccionado ? "#86efac" : "" }}
              />
            </div>
          </div>
        );

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

      default:
        return null;
    }
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

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
          aria-label="Cancelar y reiniciar formulario"
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

            {pasoActual < PASOS_TOTALES ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={siguientePaso}
                disabled={!isPasoValido(pasoActual)}
              >
                Siguiente
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmarCita}
                disabled={loading}
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
