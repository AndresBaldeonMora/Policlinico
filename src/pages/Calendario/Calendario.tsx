import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CitaApiService } from "../../services/cita.service";
import { DoctorApiService } from "../../services/doctor.service";
import type { CitaTransformada } from "../../services/cita.service";
import type { DoctorTransformado } from "../../services/doctor.service";
import MiniCalendario from "./MiniCalendario";
import "./Calendario.css";

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

type Vista = "dia" | "semana" | "mes";

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;
const VISTAS: readonly Vista[] = ["dia", "semana", "mes"] as const;
const DOCTOR_TODOS_ID = "ALL";

const HORA_INICIO = 8; // 8:00 AM
const HORA_FIN = 17; // 5:00 PM
const INTERVALO_MINUTOS = 15;
const DIAS_POR_SEMANA = 7;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Genera array de horas laborales en formato HH:MM
 */
const generarHorasLaborales = (): string[] => {
  const totalMinutos = (HORA_FIN - HORA_INICIO) * 60;
  const totalIntervalos = Math.ceil(totalMinutos / INTERVALO_MINUTOS);

  return Array.from({ length: totalIntervalos }, (_, i) => {
    const minutosDesdeInicio = HORA_INICIO * 60 + i * INTERVALO_MINUTOS;
    const horas = Math.floor(minutosDesdeInicio / 60);
    const minutos = minutosDesdeInicio % 60;
    return `${horas.toString().padStart(2, "0")}:${minutos
      .toString()
      .padStart(2, "0")}`;
  });
};

const HORAS_LABORALES = generarHorasLaborales();

/**
 * Convierte Date a formato ISO YYYY-MM-DD
 */
const toISODateLocal = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/**
 * Obtiene el inicio de la semana (Lunes)
 */
const obtenerInicioSemana = (d: Date): Date => {
  const inicio = new Date(d);
  const offset = (inicio.getDay() + 6) % 7; // Lunes = 0
  inicio.setDate(inicio.getDate() - offset);
  inicio.setHours(0, 0, 0, 0);
  return inicio;
};

/**
 * Compara dos fechas por día (ignora hora)
 */
const esMismoDia = (d1: Date, d2: Date): boolean => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

/**
 * Valida si una fecha es válida
 */
const esFechaValida = (d: Date): boolean => {
  return !isNaN(d.getTime());
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const Calendario = () => {
  // State
  const [vista, setVista] = useState<Vista>("mes");
  const [fecha, setFecha] = useState<Date>(new Date());
  const [citas, setCitas] = useState<CitaTransformada[]>([]);
  const [doctores, setDoctores] = useState<DoctorTransformado[]>([]);
  const [doctorId, setDoctorId] = useState<string>(DOCTOR_TODOS_ID);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const cargarDoctores = useCallback(async () => {
    try {
      const data = await DoctorApiService.listar();
      setDoctores(data);
    } catch (error) {
      console.error("Error cargando doctores:", error);
      setDoctores([]);
    }
  }, []);

  const cargarCitas = useCallback(async () => {
    try {
      setLoading(true);
      const fechaStr = toISODateLocal(fecha);
      const data = await CitaApiService.obtenerCalendario(
        fechaStr,
        vista,
        doctorId
      );
      setCitas(data);
    } catch (error) {
      console.error("Error cargando citas:", error);
      setCitas([]);
    } finally {
      setLoading(false);
    }
  }, [fecha, vista, doctorId]);

  useEffect(() => {
    cargarDoctores();
  }, [cargarDoctores]);

  useEffect(() => {
    cargarCitas();
  }, [cargarCitas]);

  // ============================================================================
  // NAVIGATION HANDLERS
  // ============================================================================

  const cambiarFecha = useCallback(
    (delta: number) => {
      setFecha((prevFecha) => {
        const nuevaFecha = new Date(prevFecha);

        switch (vista) {
          case "mes":
            nuevaFecha.setMonth(nuevaFecha.getMonth() + delta);
            break;
          case "semana":
            nuevaFecha.setDate(nuevaFecha.getDate() + delta * DIAS_POR_SEMANA);
            break;
          case "dia":
            nuevaFecha.setDate(nuevaFecha.getDate() + delta);
            break;
        }

        return nuevaFecha;
      });
    },
    [vista]
  );

  const irAReserva = useCallback(
    (fechaISO: string, doctorIdArg?: string) => {
      const params = new URLSearchParams();
      params.set("fecha", fechaISO);

      if (doctorIdArg && doctorIdArg !== DOCTOR_TODOS_ID) {
        params.set("doctorId", doctorIdArg);
      }

      navigate(`/reservar-cita?${params.toString()}`);
    },
    [navigate]
  );

  const irADetalleCita = useCallback(
    (e: React.MouseEvent | React.KeyboardEvent, citaId: string) => {
      e.stopPropagation();
      navigate(`/citas/${citaId}`);
    },
    [navigate]
  );

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const doctorSeleccionado = useMemo(
    () =>
      doctorId === DOCTOR_TODOS_ID
        ? null
        : doctores.find((d) => d.id === doctorId),
    [doctorId, doctores]
  );

  const tituloCalendario = useMemo(() => {
    if (vista === "mes") {
      return fecha.toLocaleDateString("es-PE", {
        month: "long",
        year: "numeric",
      });
    }

    if (vista === "dia") {
      return fecha.toLocaleDateString("es-PE", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }

    // Vista semana
    const inicio = obtenerInicioSemana(fecha);
    const fin = new Date(inicio);
    fin.setDate(inicio.getDate() + 6);

    return `${inicio.toLocaleDateString("es-PE")} – ${fin.toLocaleDateString(
      "es-PE"
    )}`;
  }, [vista, fecha]);

  const diasDelMes = useMemo(() => {
    const inicio = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
    const fin = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
    const dias: Date[] = [];

    // Días vacíos antes del primer día del mes
    const offset = (inicio.getDay() + 6) % 7;
    for (let i = 0; i < offset; i++) {
      dias.push(new Date(NaN)); // Fecha inválida para días vacíos
    }

    // Días del mes
    for (let d = 1; d <= fin.getDate(); d++) {
      dias.push(new Date(fecha.getFullYear(), fecha.getMonth(), d));
    }

    return dias;
  }, [fecha.getFullYear(), fecha.getMonth()]);

  const inicioSemana = useMemo(() => obtenerInicioSemana(fecha), [fecha]);

  // ============================================================================
  // CITA FILTERING HELPERS
  // ============================================================================

  const obtenerCitasPorFecha = useCallback(
    (d: Date): CitaTransformada[] => {
      return citas.filter((c) => {
        const fechaCita = new Date(c.fecha);
        return esMismoDia(fechaCita, d);
      });
    },
    [citas]
  );

  const obtenerCitaPorHora = useCallback(
    (d: Date, hora: string): CitaTransformada | undefined => {
      return citas.find((c) => {
        const fechaCita = new Date(c.fecha);
        return esMismoDia(fechaCita, d) && c.hora === hora;
      });
    },
    [citas]
  );

  // ============================================================================
  // RENDER: VISTA MES
  // ============================================================================

  const renderMes = useCallback(
    () => (
      <div className="calendario-grid">
        {DIAS_SEMANA.map((dia) => (
          <div key={dia} className="calendario-col-header">
            {dia}
          </div>
        ))}

        {diasDelMes.map((dia, index) => {
          const esValido = esFechaValida(dia);
          const citasDelDia = esValido ? obtenerCitasPorFecha(dia) : [];
          const fechaISO = esValido ? toISODateLocal(dia) : "";

          return (
            <div
              key={index}
              className={`calendario-celda ${esValido ? "clickable" : ""}`}
              onClick={() => {
                if (esValido) {
                  const doctorParam =
                    doctorId !== DOCTOR_TODOS_ID ? doctorId : undefined;
                  irAReserva(fechaISO, doctorParam);
                }
              }}
              role={esValido ? "button" : undefined}
              tabIndex={esValido ? 0 : undefined}
              aria-label={
                esValido ? `Agregar cita para ${fechaISO}` : undefined
              }
              onKeyDown={(e) => {
                if (esValido && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  const doctorParam =
                    doctorId !== DOCTOR_TODOS_ID ? doctorId : undefined;
                  irAReserva(fechaISO, doctorParam);
                }
              }}
            >
              {esValido && (
                <>
                  <span className="dia-numero">{dia.getDate()}</span>

                  {citasDelDia.map((cita) => (
                    <div
                      key={cita._id}
                      className="cita-chip clickable"
                      onClick={(e) => irADetalleCita(e, cita._id)}
                      role="button"
                      tabIndex={0}
                      aria-label={`Ver cita de ${
                        cita.pacienteId?.nombres || "Sin paciente"
                      } a las ${cita.hora}`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          irADetalleCita(e, cita._id);
                        }
                      }}
                    >
                      {cita.hora} {cita.pacienteId?.nombres ?? "Sin paciente"}
                    </div>
                  ))}
                </>
              )}
            </div>
          );
        })}
      </div>
    ),
    [diasDelMes, obtenerCitasPorFecha, doctorId, irAReserva, irADetalleCita]
  );

  // ============================================================================
  // RENDER: VISTA SEMANA
  // ============================================================================

  const renderSemana = useCallback(
    () => (
      <div className="agenda-semana">
        <div className="agenda-header">
          <div className="agenda-hora-header">Hora</div>
          {Array.from({ length: DIAS_POR_SEMANA }).map((_, i) => {
            const dia = new Date(inicioSemana);
            dia.setDate(inicioSemana.getDate() + i);

            return (
              <div key={i} className="agenda-dia-header">
                {DIAS_SEMANA[i]} {dia.getDate()}
              </div>
            );
          })}
        </div>

        {HORAS_LABORALES.map((hora) => (
          <div key={hora} className="agenda-row">
            <div className="agenda-hora">{hora}</div>

            {Array.from({ length: DIAS_POR_SEMANA }).map((_, i) => {
              const dia = new Date(inicioSemana);
              dia.setDate(inicioSemana.getDate() + i);
              const cita = obtenerCitaPorHora(dia, hora);
              const fechaISO = toISODateLocal(dia);

              return (
                <div
                  key={i}
                  className="agenda-celda clickable"
                  onClick={() => {
                    const doctorParam =
                      doctorId !== DOCTOR_TODOS_ID ? doctorId : undefined;
                    irAReserva(fechaISO, doctorParam);
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Agregar cita ${
                    DIAS_SEMANA[i]
                  } ${dia.getDate()} a las ${hora}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      const doctorParam =
                        doctorId !== DOCTOR_TODOS_ID ? doctorId : undefined;
                      irAReserva(fechaISO, doctorParam);
                    }
                  }}
                >
                  {cita?.pacienteId && (
                    <div
                      className="agenda-cita clickable"
                      onClick={(e) => irADetalleCita(e, cita._id)}
                      role="button"
                      tabIndex={0}
                      aria-label={`Ver cita de ${cita.pacienteId.nombres}`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          irADetalleCita(e, cita._id);
                        }
                      }}
                    >
                      {cita.pacienteId.nombres}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    ),
    [inicioSemana, obtenerCitaPorHora, doctorId, irAReserva, irADetalleCita]
  );

  // ============================================================================
  // RENDER: VISTA DÍA
  // ============================================================================

  const renderDia = useCallback(
    () => (
      <div className="agenda-dia">
        {HORAS_LABORALES.map((hora) => {
          const cita = obtenerCitaPorHora(fecha, hora);
          const fechaISO = toISODateLocal(fecha);

          return (
            <div key={hora} className="agenda-linea">
              <div className="agenda-hora">{hora}</div>
              <div
                className="agenda-celda clickable"
                onClick={() => {
                  const doctorParam =
                    doctorId !== DOCTOR_TODOS_ID ? doctorId : undefined;
                  irAReserva(fechaISO, doctorParam);
                }}
                role="button"
                tabIndex={0}
                aria-label={`Agregar cita a las ${hora}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    const doctorParam =
                      doctorId !== DOCTOR_TODOS_ID ? doctorId : undefined;
                    irAReserva(fechaISO, doctorParam);
                  }
                }}
              >
                {cita?.pacienteId && (
                  <div
                    className="agenda-cita clickable"
                    onClick={(e) => irADetalleCita(e, cita._id)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Ver cita de ${cita.pacienteId.nombres} ${cita.pacienteId.apellidos}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        irADetalleCita(e, cita._id);
                      }
                    }}
                  >
                    {cita.pacienteId.nombres} {cita.pacienteId.apellidos}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    ),
    [fecha, obtenerCitaPorHora, doctorId, irAReserva, irADetalleCita]
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="calendario-container">
      <div className="calendario-layout">
        {/* Panel Izquierdo */}
        <div className="calendario-left">
          <MiniCalendario fecha={fecha} onChange={setFecha} />

          <div className="doctores-panel">
            <h4>Doctores</h4>

            <div className="doctores-lista">
              <div
                className={`doctor-item ${
                  doctorId === DOCTOR_TODOS_ID ? "activo" : ""
                }`}
                onClick={() => setDoctorId(DOCTOR_TODOS_ID)}
                role="button"
                tabIndex={0}
                aria-label="Ver todos los doctores"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setDoctorId(DOCTOR_TODOS_ID);
                  }
                }}
              >
                Todos los doctores
              </div>

              {doctores.map((doctor) => (
                <div
                  key={doctor.id}
                  className={`doctor-item ${
                    doctorId === doctor.id ? "activo" : ""
                  }`}
                  onClick={() => setDoctorId(doctor.id)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Ver calendario de ${doctor.apellidos}, ${doctor.nombres}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setDoctorId(doctor.id);
                    }
                  }}
                >
                  {doctor.apellidos}, {doctor.nombres}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Panel Principal */}
        <div className="calendario-main">
          <div className="calendario-topbar">
            <button
              onClick={() => cambiarFecha(-1)}
              aria-label="Período anterior"
            >
              ◀
            </button>
            <h2>{tituloCalendario}</h2>
            <button
              onClick={() => cambiarFecha(1)}
              aria-label="Período siguiente"
            >
              ▶
            </button>

            <div
              className="vista-selector"
              role="group"
              aria-label="Selector de vista"
            >
              {VISTAS.map((v) => (
                <button
                  key={v}
                  className={vista === v ? "active" : ""}
                  onClick={() => setVista(v)}
                  aria-pressed={vista === v}
                  aria-label={`Vista ${v}`}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {doctorSeleccionado && (
            <div className="doctor-bar">
              Calendario de: {doctorSeleccionado.apellidos},{" "}
              {doctorSeleccionado.nombres}
            </div>
          )}

          {loading && (
            <div className="loading-indicator">Cargando citas...</div>
          )}

          {!loading && (
            <>
              {vista === "mes" && renderMes()}
              {vista === "semana" && renderSemana()}
              {vista === "dia" && renderDia()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calendario;
