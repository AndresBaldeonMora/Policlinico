import { useEffect, useReducer, useCallback } from "react";
import { useAuth } from "../../hooks/userAuth";
import { useSearchParams } from "react-router-dom";

import { PacienteApiService } from "../../services/paciente.service";
import { EspecialidadApiService } from "../../services/especialidad.service";
import { DoctorApiService } from "../../services/doctor.service";
import { CitaApiService } from "../../services/cita.service";
import { BloqueoService } from "../../services/bloqueo.service";

import { reservaReducer, initialState, generarMesesDisponibles, generarDiasDelMes } from "./reservaCitaReducer";
import type { MesOption, ReservaAction } from "./reservaCitaReducer";

import StepperHeader from "./StepperHeader";
import PasoEspecialidad from "./PasoEspecialidad";
import PasoDoctor from "./PasoDoctor";
import PasoMes from "./PasoMes";
import PasoDia from "./PasoDia";
import PasoHora from "./PasoHora";
import PasoPaciente from "./PasoPaciente";
import PasoResumen from "./PasoResumen";
import AgregarPacienteSimple from "./AgregarPacienteSimple";
import "./ReservaCita.css";

// ─── Constantes ───────────────────────────────────────────
const PASOS_TOTALES = 7;
const DNI_LENGTH = 8;
const NOTIFICATION_DURATION = 2000;

const parseISODate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) return null;
  return { y, m, d };
};

const nombresMeses = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
] as const;

// ─── Componente dispatcher de pasos ──────────────────────
interface PasoActualProps {
  state: ReturnType<typeof reservaReducer>;
  dispatch: React.Dispatch<ReservaAction>;
  handleBuscarPaciente: (dni: string) => void;
}

const PasoActual = ({ state, dispatch, handleBuscarPaciente }: PasoActualProps) => {
  switch (state.pasoActual) {
    case 1: return (
      <PasoEspecialidad
        searchEspecialidad={state.searchEspecialidad}
        especialidades={state.especialidades}
        especialidadSeleccionada={state.especialidadSeleccionada}
        showSuggestions={state.showEspecialidadesSuggestions}
        loading={state.loading}
        onSearchChange={(v) => dispatch({ type: "SET_SEARCH_ESPECIALIDAD", value: v })}
        onToggleSuggestions={(v) => dispatch({ type: "TOGGLE_SUGERENCIAS_ESPECIALIDAD", visible: v })}
        onSeleccionar={(esp) => dispatch({ type: "SELECCIONAR_ESPECIALIDAD", especialidad: esp })}
      />
    );
    case 2: return (
      <PasoDoctor
        doctoresDisponibles={state.doctoresDisponibles}
        doctorSeleccionado={state.doctorSeleccionado}
        especialidadSeleccionada={state.especialidadSeleccionada}
        onSeleccionar={(d) => dispatch({ type: "SELECCIONAR_DOCTOR", doctor: d })}
      />
    );
    case 3: return (
      <PasoMes
        mesesDisponibles={state.mesesDisponibles}
        mesSeleccionado={state.mesSeleccionado}
        onSeleccionar={(mes) => dispatch({ type: "SELECCIONAR_MES", mes, dias: generarDiasDelMes(mes) })}
      />
    );
    case 4: return (
      <PasoDia
        diasDelMes={state.diasDelMes}
        diaSeleccionado={state.diaSeleccionado}
        diasBloqueados={state.diasBloqueados}
        doctorNombre={state.doctorSeleccionado ? `Dr. ${state.doctorSeleccionado.nombres} ${state.doctorSeleccionado.apellidos}` : ""}
        onSeleccionar={(dia) => dispatch({ type: "SELECCIONAR_DIA", dia })}
      />
    );
    case 5: return (
      <PasoHora
        horariosPorDia={state.horariosPorDia}
        horaSeleccionada={state.horaSeleccionada}
        onSeleccionar={(hora, fechaISO) => dispatch({ type: "SELECCIONAR_HORA", hora, fechaISO })}
      />
    );
    case 6: return (
      <PasoPaciente
        searchDNI={state.searchDNI}
        pacienteEncontrado={state.pacienteEncontrado}
        pacienteSeleccionado={state.pacienteSeleccionado}
        onBuscar={handleBuscarPaciente}
        onSeleccionar={(p) => dispatch({ type: "SELECCIONAR_PACIENTE", paciente: p })}
        onNuevoPaciente={() => dispatch({ type: "TOGGLE_NUEVO_PACIENTE", visible: true })}
      />
    );
    case 7: return (
      <PasoResumen
        pacienteSeleccionado={state.pacienteSeleccionado}
        doctorSeleccionado={state.doctorSeleccionado}
        especialidadSeleccionada={state.especialidadSeleccionada}
        fechaSeleccionada={state.fechaSeleccionada}
        horaSeleccionada={state.horaSeleccionada}
      />
    );
    default: return null;
  }
};

// ─── Componente principal ─────────────────────────────────
const ReservaCita = () => {
  const { user } = useAuth();
  const esPaciente = user?.rol === "paciente";

  const [state, dispatch] = useReducer(reservaReducer, initialState);
  const [searchParams] = useSearchParams();
  const fechaParam = searchParams.get("fecha") || "";
  const doctorIdParam = searchParams.get("doctorId") || "";
  const prefillHasFecha = !!parseISODate(fechaParam);
  const prefillHasDoctor = !!doctorIdParam;

  // ── Carga inicial ─────────────────────────────────────
  const cargarDatos = useCallback(async () => {
    dispatch({ type: "CARGA_INICIO" });
    try {
      const [pacientes, especialidades, doctores] = await Promise.all([
        PacienteApiService.listar(),
        EspecialidadApiService.listar(),
        DoctorApiService.listar(),
      ]);
      dispatch({ type: "CARGA_EXITO", pacientes, especialidades, doctores, meses: generarMesesDisponibles() });

      if (esPaciente && user?.correo) {
        const pacienteLocal = pacientes.find(p => p.correo?.toLowerCase() === user.correo.toLowerCase());
        if (pacienteLocal && pacienteLocal.id) {
          dispatch({ type: "SELECCIONAR_PACIENTE", paciente: pacienteLocal });
        } else if (pacienteLocal) {
          dispatch({ type: "CARGA_ERROR", message: "Tu usuario no está vinculado a un paciente válido (ID faltante). Contacta a recepción." });
        } else {
          dispatch({ type: "CARGA_ERROR", message: "No se encontró un paciente registrado con tu correo. Contacta a recepción." });
        }
      }
    } catch {
      dispatch({ type: "CARGA_ERROR", message: "Error de conexión al cargar datos." });
    }
  }, [esPaciente, user?.correo]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  // ── Prefill fecha desde URL ───────────────────────────
  useEffect(() => {
    if (!prefillHasFecha) return;
    const parsed = parseISODate(fechaParam);
    if (!parsed) return;

    const mes: MesOption = {
      numero: parsed.m - 1,
      nombre: nombresMeses[parsed.m - 1],
      anio: parsed.y,
    };

    dispatch({ type: "PREFILL_FECHA", mes, dias: generarDiasDelMes(mes), dia: parsed.d, fechaISO: fechaParam });
  }, [fechaParam, prefillHasFecha]);

  // ── Prefill doctor desde URL ──────────────────────────
  useEffect(() => {
    if (!prefillHasDoctor || state.todosLosDoctores.length === 0) return;
    const doctor = state.todosLosDoctores.find((d) => d.id === doctorIdParam);
    if (!doctor) return;
    const especialidad = state.especialidades.find((e) => e.nombre === doctor.especialidad);
    dispatch({ type: "PREFILL_DOCTOR", doctor, especialidad });
  }, [doctorIdParam, prefillHasDoctor, state.todosLosDoctores, state.especialidades]);

  // ── Doctores disponibles por especialidad ─────────────
  useEffect(() => {
    if (!state.especialidadSeleccionada) {
      dispatch({ type: "SET_DOCTORES_DISPONIBLES", doctores: [] });
      return;
    }
    const filtrados = state.todosLosDoctores.filter(
      (d) => d.especialidad === state.especialidadSeleccionada!.nombre
    );
    dispatch({ type: "SET_DOCTORES_DISPONIBLES", doctores: filtrados });
  }, [state.especialidadSeleccionada, state.todosLosDoctores]);

  // ── Horarios ──────────────────────────────────────────
  const { diaSeleccionado, mesSeleccionado, doctorSeleccionado } = state;

  useEffect(() => {
    const obtenerHorarios = async () => {
      if (!diaSeleccionado || !mesSeleccionado || !doctorSeleccionado) {
        dispatch({ type: "SET_HORARIOS", horarios: [] });
        return;
      }

      const mesStr = String(mesSeleccionado.numero + 1).padStart(2, "0");
      const diaStr = String(diaSeleccionado).padStart(2, "0");
      const fechaISO = `${mesSeleccionado.anio}-${mesStr}-${diaStr}`;

      try {
        const horariosData = await DoctorApiService.obtenerHorariosDisponibles(doctorSeleccionado.id, fechaISO);
        const fechaObj = new Date(mesSeleccionado.anio, mesSeleccionado.numero, diaSeleccionado);
        const nombreDia = fechaObj.toLocaleDateString("es-PE", { weekday: "long" });

        dispatch({
          type: "SET_HORARIOS",
          horarios: [{
            fecha: fechaObj.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" }),
            fechaISO,
            diaNombre: nombreDia.charAt(0).toUpperCase() + nombreDia.slice(1),
            diaNumero: diaSeleccionado,
            horarios: horariosData,
          }],
        });

        if (!prefillHasFecha) dispatch({ type: "RESET_HORA" });
      } catch {
        dispatch({ type: "SET_HORARIOS", horarios: [] });
      }
    };

    obtenerHorarios();
  }, [diaSeleccionado, mesSeleccionado, doctorSeleccionado, prefillHasFecha]);

  // ── Bloqueos por mes ──────────────────────────────────
  useEffect(() => {
    const cargarBloqueos = async () => {
      if (!mesSeleccionado || !doctorSeleccionado) {
        dispatch({ type: "SET_DIAS_BLOQUEADOS", dias: [] });
        return;
      }
      try {
        const bloqueos = await BloqueoService.listar({
          doctorId: doctorSeleccionado.id,
          mes: mesSeleccionado.numero + 1,
          anio: mesSeleccionado.anio,
        });
        const diasBloqueados = bloqueos.map((b) => {
          const f = new Date(b.fecha);
          return f.getUTCDate();
        });
        dispatch({ type: "SET_DIAS_BLOQUEADOS", dias: diasBloqueados });
      } catch {
        dispatch({ type: "SET_DIAS_BLOQUEADOS", dias: [] });
      }
    };
    cargarBloqueos();
  }, [mesSeleccionado, doctorSeleccionado]);

  // ── Paciente handlers ─────────────────────────────────
  const handleBuscarPaciente = useCallback(async (dni: string) => {
    if (dni && !/^\d*$/.test(dni)) return;
    if (dni.length > DNI_LENGTH) return;


    dispatch({ type: "SET_SEARCH_DNI", value: dni });
    if (!/^\d{8}$/.test(dni)) return;


    const local = state.todosLosPacientes.find((p) => p.dni === dni);
    if (local) { dispatch({ type: "SET_PACIENTE_ENCONTRADO", paciente: local });
      } else {
    dispatch({ type: "SET_PACIENTE_ENCONTRADO", paciente: null });
}
  }, [state.todosLosPacientes]);

  const handlePacienteCreado = useCallback(async (dni: string) => {
    dispatch({ type: "TOGGLE_NUEVO_PACIENTE", visible: false });
    const pacientes = await PacienteApiService.listar();
    dispatch({ type: "SET_TODOS_PACIENTES", pacientes });
    const nuevo = pacientes.find((p) => p.dni === dni);
    if (nuevo) {
      dispatch({ type: "SET_PACIENTE_ENCONTRADO", paciente: nuevo });
      dispatch({ type: "SELECCIONAR_PACIENTE", paciente: nuevo });
    }
  }, []);

  // ── Confirmar cita ────────────────────────────────────
  const handleConfirmarCita = useCallback(async () => {
    const { pasoActual, pacienteSeleccionado, doctorSeleccionado, horaSeleccionada, fechaSeleccionada } = state;


    if (pasoActual !== PASOS_TOTALES) {
      dispatch({ type: "IR_PASO", paso: PASOS_TOTALES });
      return;
    }
    if (!pacienteSeleccionado || !doctorSeleccionado || !horaSeleccionada || !fechaSeleccionada) {
      dispatch({ type: "SET_ERROR", message: "Datos incompletos para confirmar la cita." });
      return;
    }

    dispatch({ type: "CONFIRMAR_INICIO" });
    try {

      await CitaApiService.crear({
        pacienteId: pacienteSeleccionado.id,
        doctorId: doctorSeleccionado.id,
        fecha: fechaSeleccionada,
        hora: horaSeleccionada,
      });

      dispatch({ type: "CONFIRMAR_EXITO" });
      setTimeout(() => {
        dispatch({ type: "HIDE_NOTIFICATION" });
        dispatch({ type: "RESET" });
      }, NOTIFICATION_DURATION);
    } catch (err) {
      dispatch({ type: "CONFIRMAR_ERROR", message: err instanceof Error ? err.message : "Error al crear la cita" });
    }
  }, [state]);

  // ── Validación ────────────────────────────────────────
  const isPasoValido = (paso: number): boolean => {
    const { especialidadSeleccionada, doctorSeleccionado, mesSeleccionado, diaSeleccionado, fechaSeleccionada, horaSeleccionada, pacienteSeleccionado } = state;
    switch (paso) {
      case 1: return !!especialidadSeleccionada;
      case 2: return !!doctorSeleccionado;
      case 3: return !!mesSeleccionado;
      case 4: return !!diaSeleccionado;
      case 5: return !!fechaSeleccionada && !!horaSeleccionada;
      case 6: return !!pacienteSeleccionado;
      default: return true;
    }
  };

  // ── Main render ───────────────────────────────────────
  return (
    <div className="reserva-cita">
      {state.notification.visible && (
        <div className={`notification ${state.notification.type}`}>
          {state.notification.message}
        </div>
      )}

      <div className="reserva-cita-header">
        <h1>📅 Reservar Cita Médica</h1>
        <button
          onClick={() => dispatch({ type: "RESET" })}
          className="btn-close-form"
          title="Cancelar y Reiniciar"
          aria-label="Cancelar y reiniciar formulario"
        >
          ×
        </button>
      </div>

      <div className="card">
        <StepperHeader
          pasoActual={state.pasoActual}
          esPaciente={esPaciente}
          irAlPaso={(paso: number) => { if (paso < state.pasoActual) dispatch({ type: "IR_PASO", paso }); }}
        />

        {state.error && <div className="error-message">{state.error}</div>}

        <div className="cita-form">
          <div className="paso-content">
            <PasoActual   // ✅ componente real, no función inline
              state={state}
              dispatch={dispatch}
              handleBuscarPaciente={handleBuscarPaciente}
            />
          </div>

          <div className="stepper-navigation">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                const prev = (esPaciente && state.pasoActual === 7) ? 5 : state.pasoActual - 1;
                dispatch({ type: "IR_PASO", paso: Math.max(prev, 1) });
              }}
              disabled={state.pasoActual === 1 || state.loading}
            >
              Anterior
            </button>

            {state.pasoActual < PASOS_TOTALES ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const next = (esPaciente && state.pasoActual === 5) ? 7 : state.pasoActual + 1;
                  dispatch({ type: "IR_PASO", paso: Math.min(next, PASOS_TOTALES) });
                }}
                disabled={!isPasoValido(state.pasoActual)}
              >
                Siguiente
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmarCita}
                disabled={state.loading}
              >
                Confirmar Cita
              </button>
            )}
          </div>
        </div>
      </div>

      {state.mostrarNuevoPaciente && (
        <AgregarPacienteSimple
          dniInicial={state.searchDNI}
          onPacienteCreado={handlePacienteCreado}
          onCancelar={() => dispatch({ type: "TOGGLE_NUEVO_PACIENTE", visible: false })}
        />
      )}
    </div>
  );
};
export default ReservaCita;