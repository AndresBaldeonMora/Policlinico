import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CitaApiService } from "../../services/cita.service";
import { DoctorApiService } from "../../services/doctor.service";
import type { CitaTransformada } from "../../services/cita.service";
import type { DoctorTransformado } from "../../services/doctor.service";
import MiniCalendario from "./MiniCalendario";
import CalendarioTopbar from "./CalendarioTopBar";
import DoctoresPanel from "./DoctoresPanel";
import VistaMes from "./VistaMes";
import VistaSemana from "./VistaSemana";
import VistaDia from "./VistaDia";
import "./Calendario.css";


type Vista = "dia" | "semana" | "mes";

const DOCTOR_TODOS_ID = "ALL";
const HORA_INICIO = 8;
const HORA_FIN = 17;
const INTERVALO_MINUTOS = 15;
const DIAS_POR_SEMANA = 7;

const toISODateLocal = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const obtenerInicioSemana = (d: Date): Date => {
  const inicio = new Date(d);
  const offset = (inicio.getDay() + 6) % 7;
  inicio.setDate(inicio.getDate() - offset);
  inicio.setHours(0, 0, 0, 0);
  return inicio;
};

const HORAS_LABORALES = (() => {
  const totalMinutos = (HORA_FIN - HORA_INICIO) * 60;
  return Array.from({ length: Math.ceil(totalMinutos / INTERVALO_MINUTOS) }, (_, i) => {
    const mins = HORA_INICIO * 60 + i * INTERVALO_MINUTOS;
    return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
  });
})();

const Calendario = () => {
  const [vista, setVista] = useState<Vista>("mes");
  const [fecha, setFecha] = useState<Date>(new Date());
  const [citas, setCitas] = useState<CitaTransformada[]>([]);
  const [doctores, setDoctores] = useState<DoctorTransformado[]>([]);
  const [doctorId, setDoctorId] = useState<string>(DOCTOR_TODOS_ID);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // ── Data loading ───────────────────────────────────────
  const cargarDoctores = useCallback(async () => {
    try {
      setDoctores(await DoctorApiService.listar());
    } catch {
      setDoctores([]);
    }
  }, []);

  const cargarCitas = useCallback(async () => {
    try {
      setLoading(true);
      setCitas(await CitaApiService.obtenerCalendario(toISODateLocal(fecha), vista, doctorId));
    } catch {
      setCitas([]);
    } finally {
      setLoading(false);
    }
  }, [fecha, vista, doctorId]);

  useEffect(() => { cargarDoctores(); }, [cargarDoctores]);
  useEffect(() => { cargarCitas(); }, [cargarCitas]);

  // ── Handlers ───────────────────────────────────────────
  const cambiarFecha = useCallback((delta: number) => {
    setFecha((prev) => {
      const nueva = new Date(prev);
      if (vista === "mes") nueva.setMonth(nueva.getMonth() + delta);
      else if (vista === "semana") nueva.setDate(nueva.getDate() + delta * DIAS_POR_SEMANA);
      else nueva.setDate(nueva.getDate() + delta);
      return nueva;
    });
  }, [vista]);

  const irAReserva = useCallback((fechaISO: string, doctorIdArg?: string) => {
    const params = new URLSearchParams({ fecha: fechaISO });
    if (doctorIdArg && doctorIdArg !== DOCTOR_TODOS_ID) params.set("doctorId", doctorIdArg);
    navigate(`/reservar-cita?${params.toString()}`);
  }, [navigate]);

  const irADetalleCita = useCallback((e: React.MouseEvent | React.KeyboardEvent, citaId: string) => {
    e.stopPropagation();
    navigate(`/citas/${citaId}`);
  }, [navigate]);

  // ── Computed ───────────────────────────────────────────
  // ✅ JUSTIFICADO: itera el mes entero para construir array de Dates
const diasDelMes = useMemo(() => {
  const anio = fecha.getFullYear();
  const mes = fecha.getMonth();
  const inicio = new Date(anio, mes, 1);
  const fin = new Date(anio, mes + 1, 0);
  const dias: Date[] = [];
  const offset = (inicio.getDay() + 6) % 7;
  for (let i = 0; i < offset; i++) dias.push(new Date(NaN));
  for (let d = 1; d <= fin.getDate(); d++) dias.push(new Date(anio, mes, d));
  return dias;
}, [fecha]); // ✅ fecha como dependencia directa

  // ✅ JUSTIFICADO: cálculo de offset de semana
  const inicioSemana = useMemo(() => obtenerInicioSemana(fecha), [fecha]);

  // ❌ ELIMINADOS los useMemo triviales:
  // doctorSeleccionado → derivado directo
  const doctorSeleccionado = doctorId === DOCTOR_TODOS_ID
    ? null
    : doctores.find((d) => d.id === doctorId);

  // tituloCalendario → derivado directo
  const tituloCalendario = (() => {
    if (vista === "mes") return fecha.toLocaleDateString("es-PE", { month: "long", year: "numeric" });
    if (vista === "dia") return fecha.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const inicio = obtenerInicioSemana(fecha);
    const fin = new Date(inicio);
    fin.setDate(inicio.getDate() + 6);
    return `${inicio.toLocaleDateString("es-PE")} – ${fin.toLocaleDateString("es-PE")}`;
  })();

  return (
    <div className="calendario-container">
      <div className="calendario-layout">
        <div className="calendario-left">
          <MiniCalendario fecha={fecha} onChange={setFecha} />
          <DoctoresPanel doctores={doctores} doctorId={doctorId} onSeleccionar={setDoctorId} />
        </div>

        <div className="calendario-main">
          <CalendarioTopbar
            titulo={tituloCalendario}
            vista={vista}
            onCambiarFecha={cambiarFecha}
            onCambiarVista={setVista}
          />

          {doctorSeleccionado && (
            <div className="doctor-bar">
              Calendario de: {doctorSeleccionado.apellidos}, {doctorSeleccionado.nombres}
            </div>
          )}

          {loading && <div className="loading-indicator">Cargando citas...</div>}

          {!loading && (
            <>
              {vista === "mes" && (
                <VistaMes
                  diasDelMes={diasDelMes}
                  citas={citas}
                  doctorId={doctorId}
                  onReservar={irAReserva}
                  onVerCita={irADetalleCita}
                />
              )}
              {vista === "semana" && (
                <VistaSemana
                  inicioSemana={inicioSemana}
                  horas={HORAS_LABORALES}
                  citas={citas}
                  doctorId={doctorId}
                  onReservar={irAReserva}
                  onVerCita={irADetalleCita}
                />
              )}
              {vista === "dia" && (
                <VistaDia
                  fecha={fecha}
                  horas={HORAS_LABORALES}
                  citas={citas}
                  doctorId={doctorId}
                  onReservar={irAReserva}
                  onVerCita={irADetalleCita}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calendario;