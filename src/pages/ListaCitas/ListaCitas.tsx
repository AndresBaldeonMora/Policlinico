// ============================================================
// ListaCitas.tsx  (refactored)
//
// Changes from original:
//  1. 12 useState calls → single useReducer (listaCitasReducer)
//  2. 583-line component → logic stays here, UI extracted to
//     ReprogramarModal + its internal sub-components
//  3. Stable keys used everywhere (no array-index keys)
// ============================================================

import { useEffect, useReducer, useState } from "react";
import "./ListaCitas.css";
import { CitaApiService } from "../../services/cita.service";
import type { CitaProcesada } from "../../services/cita.service";
import { CalendarClock } from "lucide-react";
import { DoctorApiService } from "../../services/doctor.service";
import {
  listaCitasReducer,
  initialState,
} from "./ListaCitasReducer";
import type { MesOption, HorarioPorDia } from "./ListaCitasReducer";
import ReprogramarModal from "./ReprogramarModal";

// ── Helpers ──────────────────────────────────────────────────

const normalizeString = (str: string): string =>
  str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const formatearFechaCompleta = (fecha: Date): string =>
  new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(fecha);

const obtenerNombreDia = (fecha: Date): string => {
  const nombre = new Intl.DateTimeFormat("es-PE", { weekday: "long" }).format(fecha);
  return nombre.charAt(0).toUpperCase() + nombre.slice(1);
};

const generarMeses = (): MesOption[] => {
  const nombresMeses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];
  const hoy = new Date();
  return Array.from({ length: 3 }, (_, i) => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() + i, 1);
    return { numero: d.getMonth(), nombre: nombresMeses[d.getMonth()], anio: d.getFullYear() };
  });
};

const generarDiasDelMes = (mes: MesOption): number[] => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const ultimoDia = new Date(mes.anio, mes.numero + 1, 0).getDate();
  const dias: number[] = [];
  for (let dia = 1; dia <= ultimoDia; dia++) {
    if (new Date(mes.anio, mes.numero, dia) >= hoy) dias.push(dia);
  }
  return dias;
};

// ── Notification banner (pure display) ───────────────────────

interface NotificationProps {
  message: string;
  type: "success" | "error";
  visible: boolean;
}

const Notification = ({ message, type, visible }: NotificationProps) => {
  if (!visible) return null;
  return (
    <div className={`notification ${type}`}>
      {type === "success" ? "✅ " : "❌ "}
      {message}
    </div>
  );
};

// ── Main component ───────────────────────────────────────────

const ListaCitas = () => {
  // ── Reducer ──────────────────────────────────────────────
  const [state, dispatch] = useReducer(listaCitasReducer, initialState);
  const {
    notification,
    editando,
    pasoModal,
    mesesDisponibles,
    mesSeleccionado,
    diasDelMes,
    diaSeleccionado,
    horariosPorDia,
    cargandoHorarios,
  } = state;

  // citas/busqueda/cargandoLista are independent of the rescheduling workflow
  // so they stay as plain useState — no need to push them into the reducer.
  const [citasData, setCitasData] = useState<CitaProcesada[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargandoLista, setCargandoLista] = useState(true);

  // ── Notifications ─────────────────────────────────────────
  const showNotification = (message: string, type: "success" | "error") => {
    dispatch({ type: "SHOW_NOTIFICATION", payload: { message, type } });
    setTimeout(() => dispatch({ type: "HIDE_NOTIFICATION" }), 3000);
  };

  // ── Initialisation ────────────────────────────────────────
  useEffect(() => {
    dispatch({ type: "SET_MESES_DISPONIBLES", payload: generarMeses() });
    cargarCitas();
  }, []);                                        // eslint-disable-line react-hooks/exhaustive-deps

  const cargarCitas = async () => {
    try {
      setCargandoLista(true);
      const data = await CitaApiService.listar();
      setCitasData(data);
    } catch {
      showNotification("Error al cargar la lista de citas.", "error");
    } finally {
      setCargandoLista(false);
    }
  };

  // ── Month / day / slot handlers ───────────────────────────
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

  const cargarHorariosPorDia = async (
    dia: number,
    doctorId: string,
    fechaISO: string,
    fechaDate: Date
  ) => {
    dispatch({ type: "SET_CARGANDO_HORARIOS", payload: true });
    try {
      const horariosDelDia = await DoctorApiService.obtenerHorariosDisponibles(doctorId, fechaISO);
      const horarioInfo: HorarioPorDia = {
        fecha: formatearFechaCompleta(fechaDate),
        fechaISO,
        diaNombre: obtenerNombreDia(fechaDate),
        diaNumero: dia,
        horarios: horariosDelDia,
      };
      dispatch({ type: "SET_HORARIOS_POR_DIA", payload: [horarioInfo] });
    } catch {
      showNotification("Error al cargar horarios", "error");
    } finally {
      dispatch({ type: "SET_CARGANDO_HORARIOS", payload: false });
    }
  };

  // ── Modal lifecycle ───────────────────────────────────────
  const onReprogramar = (cita: CitaProcesada) => {
    dispatch({
      type: "OPEN_MODAL",
      payload: {
        id: cita._id,
        dni: cita.dni,
        paciente: cita.paciente,
        especialidad: cita.especialidad,
        doctor: cita.doctor,
        doctorId: cita.doctorId,
        fecha: "",
        hora: "",
        fechaOriginal: cita.fecha,
        horaOriginal: cita.hora,
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
      const msg = error instanceof Error ? error.message : "Error desconocido al reprogramar cita.";
      showNotification(msg, "error");
    }
  };

  // ── Filtered list ─────────────────────────────────────────
  const filtrarCitas = citasData.filter((cita) => {
    const f = normalizeString(busqueda);
    return (
      normalizeString(cita.dni).includes(f) ||
      normalizeString(cita.doctor).includes(f)
    );
  });

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="lista-citas">
      <Notification
        message={notification.message}
        type={notification.type}
        visible={notification.visible}
      />

      <h1>Lista de Citas Programadas</h1>

      <div className="buscador-container">
        <input
          type="text"
          placeholder="Buscar por DNI o Doctor..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="input-busqueda"
        />
      </div>

      {cargandoLista ? (
        <p className="texto-cargando">Cargando citas...</p>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="citas-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>DNI</th>
                  <th>Paciente</th>
                  <th>Doctor</th>
                  <th>Especialidad</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrarCitas.length > 0 ? (
                  filtrarCitas.map((cita) => (
                    <tr key={cita._id}>
                      <td>{cita.id}</td>
                      <td>{cita.dni}</td>
                      <td>{cita.paciente}</td>
                      <td>{cita.doctor}</td>
                      <td>{cita.especialidad}</td>
                      <td>{cita.fecha}</td>
                      <td>{cita.hora}</td>
                      <td>
                        <span
                          className={`badge ${
                            cita.estado === "PENDIENTE"
                              ? "badge-warning"
                              : cita.estado === "REPROGRAMADA"
                              ? "badge-info"
                              : "badge-success"
                          }`}
                        >
                          {cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1)}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-icon"
                          title="Reprogramar cita"
                          onClick={() => onReprogramar(cita)}
                        >
                          <CalendarClock size={20} strokeWidth={2} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="sin-resultados">
                      No se encontraron citas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modal (extracted component) ── */}
      {editando && (
        <ReprogramarModal
          editando={editando}
          pasoModal={pasoModal}
          mesesDisponibles={mesesDisponibles}
          mesSeleccionado={mesSeleccionado}
          diasDelMes={diasDelMes}
          diaSeleccionado={diaSeleccionado}
          horariosPorDia={horariosPorDia}
          cargandoHorarios={cargandoHorarios}
          onSelectMes={handleSelectMes}
          onSelectDia={handleSelectDia}
          onSelectHora={(hora) => dispatch({ type: "SET_HORA", payload: hora })}
          onSiguiente={irASegundoPaso}
          onVolver={() => dispatch({ type: "SET_PASO_MODAL", payload: 1 })}
          onCerrar={cerrarModal}
          onConfirmar={confirmarReprogramar}
        />
      )}
    </div>
  );
};

export default ListaCitas;