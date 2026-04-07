import { useEffect, useReducer, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./ListaCitas.css";
import { CitaApiService } from "../../services/cita.service";
import type { CitaProcesada } from "../../services/cita.service";
import { CalendarClock, Search, Calendar, Clock, User, Stethoscope } from "lucide-react";
import { DoctorApiService } from "../../services/doctor.service";
import {
  listaCitasReducer,
  initialState,
} from "./ListaCitasReducer";
import type { MesOption, HorarioPorDia } from "./ListaCitasReducer";
import ReprogramarModal from "./ReprogramarModal";

const normalizeString = (str: string): string =>
  str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const formatearFechaCompleta = (fecha: Date): string =>
  new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(fecha);

const obtenerNombreDia = (fecha: Date): string => {
  const nombre = new Intl.DateTimeFormat("es-PE", { weekday: "long" }).format(fecha);
  return nombre.charAt(0).toUpperCase() + nombre.slice(1);
};

const generarMeses = (): MesOption[] => {
  const nombresMeses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const hoy = new Date();
  return Array.from({ length: 3 }, (_, i) => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() + i, 1);
    return { numero: d.getMonth(), nombre: nombresMeses[d.getMonth()], anio: d.getFullYear() };
  });
};

const generarDiasDelMes = (mes: MesOption): number[] => {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const ultimoDia = new Date(mes.anio, mes.numero + 1, 0).getDate();
  const dias: number[] = [];
  for (let dia = 1; dia <= ultimoDia; dia++) {
    if (new Date(mes.anio, mes.numero, dia) >= hoy) dias.push(dia);
  }
  return dias;
};

interface NotificationProps { message: string; type: "success" | "error"; visible: boolean; }
const Notification = ({ message, type, visible }: NotificationProps) => {
  if (!visible) return null;
  return <div className={`notification ${type}`}>{message}</div>;
};

const ESTADO_CONFIG: Record<string, { class: string; label: string }> = {
  PENDIENTE:    { class: "badge-info",  label: "Pendiente" },
  REPROGRAMADA: { class: "badge-warning",     label: "Reprogramada" },
  ATENDIDA:     { class: "badge-success",  label: "Atendida" },
  CANCELADA:    { class: "badge-danger",   label: "Cancelada" },
};

const ListaCitas = () => {
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const highlightRef = useRef<HTMLTableRowElement>(null);
  const [state, dispatch] = useReducer(listaCitasReducer, initialState);
  const { notification, editando, pasoModal, mesesDisponibles, mesSeleccionado, diasDelMes, diaSeleccionado, horariosPorDia, cargandoHorarios } = state;

  const [citasData, setCitasData] = useState<CitaProcesada[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargandoLista, setCargandoLista] = useState(true);

  const showNotification = (message: string, type: "success" | "error") => {
    dispatch({ type: "SHOW_NOTIFICATION", payload: { message, type } });
    setTimeout(() => dispatch({ type: "HIDE_NOTIFICATION" }), 3000);
  };

  useEffect(() => {
    dispatch({ type: "SET_MESES_DISPONIBLES", payload: generarMeses() });
    cargarCitas();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightId, citasData]);

  const cargarCitas = async () => {
    try {
      setCargandoLista(true);
      setCitasData(await CitaApiService.listar());
    } catch {
      showNotification("Error al cargar la lista de citas.", "error");
    } finally {
      setCargandoLista(false);
    }
  };

  const handleSelectMes = (mes: MesOption) => {
    dispatch({ type: "SELECT_MES", payload: { mes, dias: generarDiasDelMes(mes) } });
  };

  const handleSelectDia = async (dia: number) => {
    if (!mesSeleccionado || !editando) return;
    const fecha = new Date(mesSeleccionado.anio, mesSeleccionado.numero, dia);
    const fechaISO = fecha.toISOString().split("T")[0];
    dispatch({ type: "SELECT_DIA", payload: { dia, fechaISO } });
    await cargarHorariosPorDia(dia, editando.doctorId, fechaISO, fecha);
  };

  const cargarHorariosPorDia = async (dia: number, doctorId: string, fechaISO: string, fechaDate: Date) => {
    dispatch({ type: "SET_CARGANDO_HORARIOS", payload: true });
    try {
      const horariosDelDia = await DoctorApiService.obtenerHorariosDisponibles(doctorId, fechaISO);
      const horarioInfo: HorarioPorDia = {
        fecha: formatearFechaCompleta(fechaDate), fechaISO,
        diaNombre: obtenerNombreDia(fechaDate), diaNumero: dia, horarios: horariosDelDia,
      };
      dispatch({ type: "SET_HORARIOS_POR_DIA", payload: [horarioInfo] });
    } catch {
      showNotification("Error al cargar horarios", "error");
    } finally {
      dispatch({ type: "SET_CARGANDO_HORARIOS", payload: false });
    }
  };

  const onReprogramar = (cita: CitaProcesada) => {
    dispatch({
      type: "OPEN_MODAL",
      payload: {
        id: cita._id, dni: cita.dni, paciente: cita.paciente, especialidad: cita.especialidad,
        doctor: cita.doctor, doctorId: cita.doctorId, fecha: "", hora: "",
        fechaOriginal: cita.fecha, horaOriginal: cita.hora,
      },
    });
  };

  const cerrarModal = () => dispatch({ type: "CLOSE_MODAL" });

  const irASegundoPaso = () => {
    if (!editando?.fecha || !editando?.hora) {
      showNotification("Selecciona una nueva fecha y hora antes de continuar.", "error");
      return;
    }
    dispatch({ type: "SET_PASO_MODAL", payload: 2 });
  };

  const confirmarReprogramar = async () => {
    if (!editando?.fecha || !editando?.hora) {
      showNotification("Faltan datos para reprogramar la cita.", "error");
      return;
    }
    try {
      await CitaApiService.reprogramar(editando.id, editando.fecha, editando.hora);
      showNotification("Cita reprogramada correctamente.", "success");
      cerrarModal();
      cargarCitas();
    } catch (error: unknown) {
      showNotification(error instanceof Error ? error.message : "Error desconocido al reprogramar cita.", "error");
    }
  };

  const filtrarCitas = citasData.filter((cita) => {
    const f = normalizeString(busqueda);
    return normalizeString(cita.dni).includes(f) || normalizeString(cita.doctor).includes(f) || normalizeString(cita.paciente).includes(f);
  });

  return (
    <div className="lista-page">
      <Notification message={notification.message} type={notification.type} visible={notification.visible} />

      <div className="lista-page-header">
        <div>
          <h1>Gestion de Citas</h1>
          <p className="lista-page-subtitle">{citasData.length} citas programadas</p>
        </div>
      </div>

      <div className="lista-search-bar">
        <Search size={18} className="lista-search-icon" />
        <input
          type="text"
          placeholder="Buscar por DNI, paciente o doctor..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="lista-search-input"
        />
        {busqueda && (
          <span className="lista-search-count">{filtrarCitas.length} resultado{filtrarCitas.length !== 1 ? "s" : ""}</span>
        )}
      </div>

      {cargandoLista ? (
        <div className="lista-loading">
          <div className="lista-loading-spinner" />
          <p>Cargando citas...</p>
        </div>
      ) : (
        <div className="lista-table-card">
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>#</th>
                  <th style={{ width: 220 }}>Paciente</th>
                  <th style={{ width: 200 }}>Doctor</th>
                  <th style={{ width: 130 }}>Especialidad</th>
                  <th style={{ width: 140 }}>Fecha / Hora</th>
                  <th style={{ width: 120 }}>Estado</th>
                  <th style={{ width: 70 }}>Accion</th>
                </tr>
              </thead>
              <tbody>
                {filtrarCitas.length > 0 ? (
                  filtrarCitas.map((cita) => {
                    const estadoInfo = ESTADO_CONFIG[cita.estado] || { class: "badge-warning", label: cita.estado };
                    const inicialPaciente = cita.paciente.charAt(0).toUpperCase();
                    return (
                      <tr
                        key={cita._id}
                        ref={highlightId === cita._id ? highlightRef : undefined}
                        className={highlightId === cita._id ? "tr-highlight" : ""}
                      >
                        <td className="td-id">{cita.id}</td>
                        <td>
                          <div className="td-person">
                            <div className="td-avatar">{inicialPaciente}</div>
                            <div className="td-person-info">
                              <span className="td-person-name">{cita.paciente}</span>
                              <span className="td-person-meta">DNI: {cita.dni}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="td-person">
                            <div className="td-avatar td-avatar--doc"><Stethoscope size={14} /></div>
                            <span className="td-person-name">{cita.doctor}</span>
                          </div>
                        </td>
                        <td><span className="td-specialty">{cita.especialidad}</span></td>
                        <td>
                          <div className="td-datetime">
                            <span className="td-date"><Calendar size={13} /> {cita.fecha}</span>
                            <span className="td-time"><Clock size={13} /> {cita.hora}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`modern-badge ${estadoInfo.class}`}>
                            <span className="modern-badge-dot" />
                            {estadoInfo.label}
                          </span>
                        </td>
                        <td>
                          {cita.estado !== "REPROGRAMADA" && (
                            <button className="btn-action" title="Reprogramar cita" onClick={() => onReprogramar(cita)}>
                              <CalendarClock size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="td-empty">
                      <User size={32} className="td-empty-icon" />
                      <p>No se encontraron citas</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editando && (
        <ReprogramarModal
          editando={editando} pasoModal={pasoModal} mesesDisponibles={mesesDisponibles}
          mesSeleccionado={mesSeleccionado} diasDelMes={diasDelMes} diaSeleccionado={diaSeleccionado}
          horariosPorDia={horariosPorDia} cargandoHorarios={cargandoHorarios}
          onSelectMes={handleSelectMes} onSelectDia={handleSelectDia}
          onSelectHora={(hora) => dispatch({ type: "SET_HORA", payload: hora })}
          onSiguiente={irASegundoPaso} onVolver={() => dispatch({ type: "SET_PASO_MODAL", payload: 1 })}
          onCerrar={cerrarModal} onConfirmar={confirmarReprogramar}
        />
      )}
    </div>
  );
};

export default ListaCitas;
