import { useEffect, useState, useMemo, useReducer } from "react";
import { CalendarDays, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../../hooks/userAuth";
import { CitaApiService, type CitaHistorial } from "../../services/cita.service";
import { DoctorApiService } from "../../services/doctor.service";
import ItemCita from "./ItemCita";
import DetalleCita from "./DetalleCita";
import ReprogramarModal from "../ListaCitas/ReprogramarModal";
import {
  listaCitasReducer,
  initialState,
} from "../ListaCitas/ListaCitasReducer";
import type { MesOption, HorarioPorDia } from "../ListaCitas/ListaCitasReducer";
import "./HistorialCitas.css";

type Tab = "PROXIMAS" | "PASADAS";

const ESTADOS_PROXIMAS = new Set(["PENDIENTE", "REPROGRAMADA"]);

const POR_PAGINA = 5;

const generarMeses = (): MesOption[] => {
  const nombres = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const hoy = new Date();
  return Array.from({ length: 3 }, (_, i) => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() + i, 1);
    return { numero: d.getMonth(), nombre: nombres[d.getMonth()], anio: d.getFullYear() };
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

const formatearFechaCompleta = (fecha: Date): string =>
  new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(fecha);

const obtenerNombreDia = (fecha: Date): string => {
  const nombre = new Intl.DateTimeFormat("es-PE", { weekday: "long" }).format(fecha);
  return nombre.charAt(0).toUpperCase() + nombre.slice(1);
};

const HistorialCitasPaciente = () => {
  const { user } = useAuth();

  const [citas, setCitas]                       = useState<CitaHistorial[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState("");
  const [citaSeleccionada, setCitaSeleccionada] = useState<CitaHistorial | null>(null);
  const [busqueda, setBusqueda]                 = useState("");
  const [activeTab, setActiveTab]               = useState<Tab>("PROXIMAS");
  const [pagina, setPagina]                     = useState(1);
  const [notif, setNotif]                       = useState<{ msg: string; tipo: "success" | "error" } | null>(null);

  const [state, dispatch] = useReducer(listaCitasReducer, initialState);
  const { editando, pasoModal, mesesDisponibles, mesSeleccionado, diasDelMes, diaSeleccionado, horariosPorDia, cargandoHorarios } = state;

  const showNotif = (msg: string, tipo: "success" | "error") => {
    setNotif({ msg, tipo });
    setTimeout(() => setNotif(null), 3500);
  };

  useEffect(() => {
    if (!user?.correo) return;
    setLoading(true);
    setError("");
    CitaApiService.obtenerHistorialPaciente(user.correo)
      .then(setCitas)
      .catch((e) => setError(e?.message ?? "Error al cargar citas"))
      .finally(() => setLoading(false));
  }, [user?.correo]);

  useEffect(() => {
    dispatch({ type: "SET_MESES_DISPONIBLES", payload: generarMeses() });
  }, []);

  useEffect(() => {
    setPagina(1);
    setBusqueda("");
  }, [activeTab]);

  useEffect(() => { setPagina(1); }, [busqueda]);

  const citasFiltradas = useMemo(() => {
    const filtered = citas
      .filter((c) => {
        const estado = c.estado?.toUpperCase()?.trim() ?? "";
        return activeTab === "PROXIMAS"
          ? ESTADOS_PROXIMAS.has(estado)
          : !ESTADOS_PROXIMAS.has(estado);
      })
      .filter((c) => {
        if (!busqueda.trim()) return true;
        const q = busqueda.toLowerCase().trim();
        const fecha = new Date(c.fecha);
        const mes      = fecha.toLocaleDateString("es-PE", { month: "long",  timeZone: "UTC" }).toLowerCase();
        const mesCorto = fecha.toLocaleDateString("es-PE", { month: "short", timeZone: "UTC" }).toLowerCase();
        const anio     = fecha.getUTCFullYear().toString();
        return (
          (c.medico ?? "").toLowerCase().includes(q) ||
          (c.especialidad ?? "").toLowerCase().includes(q) ||
          mes.includes(q) ||
          mesCorto.includes(q) ||
          anio.includes(q)
        );
      });

    filtered.sort((a, b) => {
      const diff = new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
      return activeTab === "PROXIMAS" ? diff : -diff;
    });

    return filtered;
  }, [citas, activeTab, busqueda]);

  const totalPaginas = Math.max(1, Math.ceil(citasFiltradas.length / POR_PAGINA));
  const citasPagina  = citasFiltradas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  const tabStyle = (tab: Tab) => ({
    padding: "0.75rem 1.5rem",
    borderBottom: activeTab === tab ? "2px solid var(--primary)" : "2px solid transparent",
    color: activeTab === tab ? "var(--primary)" : "var(--text-secondary)",
    fontWeight: activeTab === tab ? "bold" : "normal" as const,
    background: "none",
    border: "none",
    borderBottomWidth: "2px",
    borderBottomStyle: "solid" as const,
    cursor: "pointer",
    fontSize: "1rem",
  });

  // ── Reprogramar handlers ──────────────────────────────────────
  const handleReprogramar = (cita: CitaHistorial) => {
    dispatch({
      type: "OPEN_MODAL",
      payload: {
        id: cita._id,
        dni: "",
        paciente: `${user?.nombres ?? ""} ${user?.apellidos ?? ""}`.trim() || "Paciente",
        especialidad: cita.especialidad,
        doctor: cita.medico,
        doctorId: cita.doctorId ?? "",
        fecha: "",
        hora: "",
        fechaOriginal: new Date(cita.fecha).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }),
        horaOriginal: cita.hora !== "—" ? cita.hora : "",
      },
    });
  };

  const handleSelectMes = (mes: MesOption) => {
    dispatch({ type: "SELECT_MES", payload: { mes, dias: generarDiasDelMes(mes) } });
  };

  const handleSelectDia = async (dia: number) => {
    if (!mesSeleccionado || !editando) return;
    const fecha = new Date(mesSeleccionado.anio, mesSeleccionado.numero, dia);
    const fechaISO = fecha.toISOString().split("T")[0];
    dispatch({ type: "SELECT_DIA", payload: { dia, fechaISO } });

    dispatch({ type: "SET_CARGANDO_HORARIOS", payload: true });
    try {
      const horarios = await DoctorApiService.obtenerHorariosDisponibles(editando.doctorId, fechaISO);
      const info: HorarioPorDia = {
        fecha: formatearFechaCompleta(fecha),
        fechaISO,
        diaNombre: obtenerNombreDia(fecha),
        diaNumero: dia,
        horarios,
      };
      dispatch({ type: "SET_HORARIOS_POR_DIA", payload: [info] });
    } catch {
      showNotif("Error al cargar horarios disponibles.", "error");
    } finally {
      dispatch({ type: "SET_CARGANDO_HORARIOS", payload: false });
    }
  };

  const handleSiguiente = () => {
    if (!editando?.fecha || !editando?.hora) {
      showNotif("Selecciona una nueva fecha y hora antes de continuar.", "error");
      return;
    }
    dispatch({ type: "SET_PASO_MODAL", payload: 2 });
  };

  const handleConfirmarReprogramar = async () => {
    if (!editando?.fecha || !editando?.hora) return;
    try {
      await CitaApiService.reprogramar(editando.id, editando.fecha, editando.hora);
      showNotif("Cita reprogramada correctamente.", "success");
      dispatch({ type: "CLOSE_MODAL" });
      // Recargar citas
      if (user?.correo) {
        CitaApiService.obtenerHistorialPaciente(user.correo).then(setCitas).catch(() => {});
      }
    } catch (err) {
      showNotif(err instanceof Error ? err.message : "Error al reprogramar.", "error");
    }
  };

  return (
    <div className="hc-container">
      {notif && (
        <div className={`notification ${notif.tipo}`} style={{ marginBottom: "0.75rem" }}>
          {notif.msg}
        </div>
      )}

      <div className="hc-header">
        <div className="hc-header-left">
          <div className="hc-header-icon">
            <CalendarDays size={20} />
          </div>
          <div>
            <h2 className="hc-title">Mis Citas</h2>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: "1.5rem" }}>
        <button onClick={() => setActiveTab("PROXIMAS")} style={tabStyle("PROXIMAS")}>
          Próximas
        </button>
        <button onClick={() => setActiveTab("PASADAS")} style={tabStyle("PASADAS")}>
          Anteriores
        </button>
      </div>

      {/* Búsqueda */}
      <div className="hc-controls" style={{ marginBottom: "1rem" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={16} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            type="text"
            className="hc-search"
            placeholder="Buscar por médico, especialidad, mes o año..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ paddingLeft: "2rem" }}
          />
        </div>
      </div>

      <div className="hc-list">
        {loading && (
          <div className="hc-state">
            <div className="spinner-small" />
            <p>Cargando citas...</p>
          </div>
        )}

        {!loading && error && (
          <div className="hc-state hc-state--error">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && citasFiltradas.length === 0 && (
          <div className="hc-state">
            <CalendarDays size={36} style={{ opacity: 0.25 }} />
            <p>
              {busqueda
                ? "No se encontraron citas con esa búsqueda."
                : activeTab === "PROXIMAS"
                  ? "No tienes citas próximas registradas."
                  : "No tienes citas anteriores registradas."}
            </p>
          </div>
        )}

        {!loading && !error &&
          citasPagina.map((cita) => (
            <ItemCita
              key={cita._id}
              cita={cita}
              onClick={() => setCitaSeleccionada(cita)}
              hideEstado={activeTab === "PROXIMAS"}
              onReprogramar={activeTab === "PROXIMAS" ? handleReprogramar : undefined}
            />
          ))}
      </div>

      {!loading && !error && totalPaginas > 1 && (
        <div className="hc-pagination">
          <button
            type="button"
            className="hc-page-btn"
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={pagina === 1}
            aria-label="Página anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="hc-page-info">
            Página {pagina} de {totalPaginas}
          </span>
          <button
            type="button"
            className="hc-page-btn"
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            disabled={pagina === totalPaginas}
            aria-label="Página siguiente"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {citaSeleccionada && (
        <DetalleCita
          cita={citaSeleccionada}
          onCerrar={() => setCitaSeleccionada(null)}
          hideEstado={activeTab === "PROXIMAS"}
        />
      )}

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
          onSiguiente={handleSiguiente}
          onVolver={() => dispatch({ type: "SET_PASO_MODAL", payload: 1 })}
          onCerrar={() => dispatch({ type: "CLOSE_MODAL" })}
          onConfirmar={handleConfirmarReprogramar}
        />
      )}
    </div>
  );
};

export default HistorialCitasPaciente;
