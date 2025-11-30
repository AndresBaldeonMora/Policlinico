import { useEffect, useState } from "react";
import "./ListaCitas.css";
import { CitaApiService } from "../services/cita.service";
import type { CitaProcesada } from "../services/cita.service";
import { CalendarClock } from "lucide-react";
import {
  DoctorApiService,
  type HorarioDisponible,
} from "../services/doctor.service";

const normalizeString = (str: string): string => {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

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

interface MesOption {
  numero: number;
  nombre: string;
  anio: number;
}

interface HorarioPorDia {
  fecha: string;
  fechaISO: string;
  diaNombre: string;
  diaNumero: number;
  horarios: HorarioDisponible[];
}

const ListaCitas = () => {
  const [citas, setCitas] = useState<CitaProcesada[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);

  const [notification, setNotification] = useState({
    message: "",
    type: "",
    visible: false,
  });

  const [editando, setEditando] = useState<{
    id: string;
    dni: string;
    paciente: string;
    especialidad: string;
    doctor: string;
    doctorId: string;
    fecha: string; // nueva fecha seleccionada
    hora: string; // nueva hora seleccionada
    fechaOriginal: string;
    horaOriginal: string;
  } | null>(null);

  // Paso dentro del modal: 1 = seleccionar nueva fecha/hora, 2 = resumen
  const [pasoModal, setPasoModal] = useState<1 | 2>(1);

  // Estados selector Mes/Día/Horarios
  const [mesesDisponibles, setMesesDisponibles] = useState<MesOption[]>([]);
  const [mesSeleccionado, setMesSeleccionado] = useState<MesOption | null>(
    null
  );
  const [diasDelMes, setDiasDelMes] = useState<number[]>([]);
  const [diaSeleccionado, setDiaSeleccionado] = useState<number | null>(null);
  const [horariosPorDia, setHorariosPorDia] = useState<HorarioPorDia[]>([]);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);

  // ================== Helpers de fecha ==================
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

  // ================== Notificación ==================
  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type, visible: true });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  // ================== Carga inicial ==================
  useEffect(() => {
    generarMesesDisponibles();
  }, []);

  useEffect(() => {
    cargarCitas();
  }, []);

  const cargarCitas = async () => {
    try {
      setCargando(true);
      const data = await CitaApiService.listar();
      setCitas(data);
    } catch (error) {
      console.error("❌ Error al cargar citas:", error);
      showNotification("Error al cargar la lista de citas.", "error");
    } finally {
      setCargando(false);
    }
  };

  // ================== Meses / Días ==================
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

  const handleMesSeleccionado = (mes: MesOption) => {
    setMesSeleccionado(mes);
    setDiaSeleccionado(null);
    setHorariosPorDia([]);
    setPasoModal(1); // siempre volvemos al paso 1 si cambia el mes

    if (editando) {
      setEditando({
        ...editando,
        fecha: "",
        hora: "",
      });
    }

    const dias = generarDiasDelMes(mes);
    setDiasDelMes(dias);
  };

  const handleDiaSeleccionado = async (dia: number) => {
    if (!mesSeleccionado || !editando) return;

    setDiaSeleccionado(dia);

    const fecha = new Date(mesSeleccionado.anio, mesSeleccionado.numero, dia);
    const fechaISO = fecha.toISOString().split("T")[0];

    setEditando({
      ...editando,
      fecha: fechaISO,
      hora: "",
    });

    await cargarHorariosPorDia(mesSeleccionado, dia);
  };

  const cargarHorariosPorDia = async (mes: MesOption, dia: number) => {
    if (!editando?.doctorId) return;

    setCargandoHorarios(true);

    try {
      const fecha = new Date(mes.anio, mes.numero, dia);
      const fechaISO = fecha.toISOString().split("T")[0];

      const horariosDelDia = await DoctorApiService.obtenerHorariosDisponibles(
        editando.doctorId,
        fechaISO
      );

      const horarioInfo: HorarioPorDia = {
        fecha: formatearFechaCompleta(fecha),
        fechaISO,
        diaNombre: obtenerNombreDia(fecha),
        diaNumero: dia,
        horarios: horariosDelDia,
      };

      setHorariosPorDia([horarioInfo]);
    } catch (err) {
      console.error("❌ Error al cargar horarios:", err);
      showNotification("Error al cargar horarios", "error");
    } finally {
      setCargandoHorarios(false);
    }
  };

  // ================== Filtro citas ==================
  const filtrarCitas = citas.filter((cita) => {
    const filtroNormalizado = normalizeString(busqueda);
    const dniNormalizado = normalizeString(cita.dni);
    const doctorNormalizado = normalizeString(cita.doctor);
    return (
      dniNormalizado.includes(filtroNormalizado) ||
      doctorNormalizado.includes(filtroNormalizado)
    );
  });

  // ================== Reprogramar ==================
  const onReprogramar = (cita: CitaProcesada) => {
    setEditando({
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
    });

    setPasoModal(1);
    setMesSeleccionado(null);
    setDiaSeleccionado(null);
    setDiasDelMes([]);
    setHorariosPorDia([]);
  };

  const cerrarModal = () => {
    setEditando(null);
    setPasoModal(1);
    setMesSeleccionado(null);
    setDiaSeleccionado(null);
    setDiasDelMes([]);
    setHorariosPorDia([]);
  };

  const irASegundoPaso = () => {
    if (!editando?.fecha || !editando?.hora) {
      showNotification(
        "Selecciona una nueva fecha y hora antes de continuar.",
        "error"
      );
      return;
    }
    setPasoModal(2);
  };

  const confirmarReprogramar = async () => {
    if (!editando?.fecha || !editando?.hora) {
      showNotification("Faltan datos para reprogramar la cita.", "error");
      return;
    }

    try {
      await CitaApiService.reprogramar(
        editando.id,
        editando.fecha,
        editando.hora
      );
      showNotification("Cita reprogramada correctamente.", "success");
      cerrarModal();
      cargarCitas();
    } catch (error: unknown) {
      let errorMessage = "Error desconocido al reprogramar cita.";
      if (error instanceof Error) {
        errorMessage = error.message || "Error al reprogramar cita.";
      }
      showNotification(errorMessage, "error");
      console.error(error);
    }
  };

  // ================== Render ==================
  return (
    <div className="lista-citas">
      <Notification
        message={notification.message}
        type={notification.type as "success" | "error"}
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

      {cargando ? (
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
                            cita.estado === "pendiente"
                              ? "badge-warning"
                              : cita.estado === "reprogramado"
                              ? "badge-info"
                              : "badge-success"
                          }`}
                        >
                          {cita.estado.charAt(0).toUpperCase() +
                            cita.estado.slice(1)}
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

      {/* ================== MODAL REPROGRAMAR ================== */}
      {editando && (
        <div className="modal-overlay">
          <div className="modal-card-reprogramar">
            <div className="modal-header-reprogramar">
              <h3>Reprogramar Cita</h3>
              <span className="modal-subtitle">
                {editando.paciente} · {editando.doctor} ·{" "}
                {editando.especialidad}
              </span>

              {/* Indicador de pasos */}
              <div className="modal-stepper">
                <div
                  className={`modal-step ${pasoModal === 1 ? "activo" : ""} ${
                    pasoModal > 1 ? "completado" : ""
                  }`}
                >
                  <span className="step-circle">1</span>
                  <span className="step-label">Nueva fecha y hora</span>
                </div>
                <div
                  className={`modal-step ${pasoModal === 2 ? "activo" : ""}`}
                >
                  <span className="step-circle">2</span>
                  <span className="step-label">Confirmar cambios</span>
                </div>
              </div>
            </div>

            <div className="modal-body">
              {pasoModal === 1 && (
                <>
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
                          >
                            {dia}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {diaSeleccionado && (
                    <div className="horarios-contenedor-modal">
                      {cargandoHorarios ? (
                        <div className="horarios-loading">
                          <div className="spinner-small"></div>
                          <p>Cargando horarios...</p>
                        </div>
                      ) : horariosPorDia.length > 0 &&
                        horariosPorDia[0].horarios.filter((h) => h.disponible)
                          .length > 0 ? (
                        <div className="dias-lista-modal">
                          {horariosPorDia.map((dia) => (
                            <div key={dia.fechaISO} className="dia-grupo-modal">
                              <div className="dia-header-modal">
                                <span className="dia-nombre">
                                  {dia.diaNombre}
                                </span>
                                <span className="dia-fecha">
                                  📅 {dia.fecha}
                                </span>
                              </div>

                              <div className="horarios-horizontal-modal">
                                {dia.horarios
                                  .filter((h) => h.disponible)
                                  .map((horario) => (
                                    <label
                                      key={horario.hora}
                                      className={`horario-radio-modal ${
                                        editando.hora === horario.hora
                                          ? "seleccionado"
                                          : ""
                                      }`}
                                    >
                                      <input
                                        type="radio"
                                        name="horario"
                                        value={horario.hora}
                                        checked={editando.hora === horario.hora}
                                        onChange={() =>
                                          setEditando({
                                            ...editando,
                                            hora: horario.hora,
                                          })
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
                </>
              )}

              {pasoModal === 2 && (
                <div className="modal-resumen-reprogramar">
                  <h4>Confirmar nueva programación</h4>
                  <div className="modal-resumen-grid">
                    <div className="modal-resumen-item">
                      <label>Paciente</label>
                      <strong>{editando.paciente}</strong>
                      <span>DNI: {editando.dni}</span>
                    </div>
                    <div className="modal-resumen-item">
                      <label>Médico</label>
                      <strong>{editando.doctor}</strong>
                      <span>{editando.especialidad}</span>
                    </div>
                    <div className="modal-resumen-item">
                      <label>Fecha y hora original</label>
                      <strong>{editando.fechaOriginal}</strong>
                      <span>{editando.horaOriginal} hs</span>
                    </div>
                    <div className="modal-resumen-item destacado">
                      <label>Nueva fecha y hora</label>
                      <strong>{formatearFechaResumen(editando.fecha)}</strong>
                      <span>{editando.hora} hs</span>
                    </div>
                  </div>
                  <p className="modal-resumen-note">
                    Revisa que la nueva fecha y hora sean correctas antes de
                    confirmar. Esta acción actualizará la cita del paciente.
                  </p>
                </div>
              )}
            </div>

            <div className="modal-actions">
              {pasoModal === 1 ? (
                <>
                  <button onClick={cerrarModal} className="btn btn-secondary">
                    Cancelar
                  </button>
                  <button
                    onClick={irASegundoPaso}
                    className="btn btn-primary btn-next"
                    disabled={!editando.fecha || !editando.hora}
                  >
                    Siguiente
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setPasoModal(1)}
                    className="btn btn-secondary btn-back"
                  >
                    Volver
                  </button>
                  <button
                    onClick={confirmarReprogramar}
                    className="btn btn-primary btn-confirmar"
                  >
                    Confirmar Reprogramación
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListaCitas;
