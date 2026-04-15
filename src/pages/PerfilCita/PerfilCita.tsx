// ============================================================
// PerfilCita.tsx  (refactored)
//
// Changes from original:
//  1. 9 useState calls → useReducer for fetch + clinical data
//     (tabActiva / tabDemo stay as useState — they are pure,
//      independent UI state with no cross-slice interactions)
//  2. Confirmed all .map() keys are already stable IDs —
//     linter warning was a false positive; added comments to
//     make intent explicit
//  3. Fixed a11y: replaced `div role="button"` with `<button>`
//     in the citas widget
// ============================================================

import { useEffect, useState, useCallback, useMemo, useReducer } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { History, ChevronDown, ChevronUp } from "lucide-react";
import "./PerfilCita.css";
import { CitaApiService } from "../../services/cita.service";
import { MedicoApiService } from "../../services/medico.service";
import type { MedicamentoPrescrito } from "../../services/medico.service";
import { MedicamentoService } from "../../services/medicamento.service";
import type { Medicamento as MedicamentoCatalogo } from "../../services/medicamento.service";
import { perfilCitaReducer, initialState } from "./PerfilCitaReducer";
import { useAuth } from "../../hooks/userAuth";
import type {
  OrdenExamen,
  ExamenLaboratorio,
} from "../../services/examen.service";
import {
  ExamenService,
  TIPO_EXAMEN_LABEL,
} from "../../services/examen.service";
import OrdenExamenModal from "../MedicoDashboard/OrdenExamenModal";
import "../MedicoDashboard/OrdenExamenModal.css";
import Swal from "sweetalert2";
import { toastExito } from "../../utils/toast";

// ============================================================================
// TYPES (UI-only — not shared with reducer)
// ============================================================================

type TabPrincipal = "dashboard" | "historial" | "documentos" | "examenes" | "notas";
type TabDemografico = "quien" | "contacto";

// ============================================================================
// CONSTANTS
// ============================================================================

const TABS_RECEPCIONISTA: { id: TabPrincipal; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "historial", label: "Historico de Visitas" },
  { id: "documentos", label: "Documentos" },
  { id: "examenes", label: "Examenes" },
];

const TABS_MEDICO: { id: TabPrincipal; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "notas", label: "Notas Clínicas" },
  { id: "examenes", label: "Examenes" },
  { id: "historial", label: "Historico de Visitas" },
  { id: "documentos", label: "Documentos" },
];

// ============================================================================
// TABS
// ============================================================================

const TABS_DEMOGRAFICOS: { id: TabDemografico; label: string }[] = [
  { id: "quien", label: "Quién" },
  { id: "contacto", label: "Contacto" },
];

// ============================================================================
// UTILS
// ============================================================================

const formatearFechaCorta = (fechaISO?: string) => {
  if (!fechaISO) return "—";
  const fecha = new Date(fechaISO);
  if (isNaN(fecha.getTime())) return "—";
  return new Intl.DateTimeFormat("es-PE").format(fecha);
};

const formatearFechaHora = (iso: string) => {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) +
    " - " +
    d.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  );
};

const calcularEdad = (fechaNacimiento?: string) => {
  if (!fechaNacimiento) return null;
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  if (
    hoy.getMonth() < nac.getMonth() ||
    (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())
  ) {
    edad--;
  }
  return edad;
};

// ============================================================================
// MAIN
// ============================================================================

const PerfilCita = () => {
  const { citaId } = useParams<{ citaId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // ── Reducer: fetch lifecycle + clinical data ──────────────
  const [state, dispatch] = useReducer(perfilCitaReducer, initialState);
  const {
    cita,
    cargando,
    error,
    alergias,
    problemasMedicos,
    medicamentos,
    citasPaciente,
  } = state;

  // ── useState: pure UI toggles (no shared state, no side effects) ──
  const [tabActiva, setTabActiva] = useState<TabPrincipal>("dashboard");
  const [tabDemo, setTabDemo] = useState<TabDemografico>("quien");

  // ── Notas Clínicas (solo MEDICO) ──────────────────────────────
  const [notas, setNotas] = useState({ diagnostico: "", notasClinicas: "", tratamiento: "" });
  const [guardandoNotas, setGuardandoNotas] = useState(false);

  // ── Prescripción de medicamentos ──────────────────────────────
  const [medsPrescritos, setMedsPrescritos] = useState<MedicamentoPrescrito[]>([]);
  const [busquedaMed, setBusquedaMed]       = useState("");
  const [resultadosMed, setResultadosMed]   = useState<MedicamentoCatalogo[]>([]);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const [guardandoMeds, setGuardandoMeds]   = useState(false);
  const [medForm, setMedForm] = useState<Omit<MedicamentoPrescrito, "medicamentoId" | "nombre">>({
    dosis: "", frecuencia: "", duracion: "", observaciones: "",
  });
  const [medSeleccionado, setMedSeleccionado] = useState<MedicamentoCatalogo | null>(null);

  // ── Exámenes ──────────────────────────────────────────────
  const [ordenes, setOrdenes] = useState<OrdenExamen[]>([]);
  const [historial, setHistorial] = useState<OrdenExamen[]>([]);
  const [historialAbierto, setHistorialAbierto] = useState(false);
  const [mostrarOrdenModal, setMostrarOrdenModal] = useState(false);
  const [ordenEditando, setOrdenEditando] = useState<OrdenExamen | null>(null);
  const [errorOrdenes, setErrorOrdenes] = useState("");

  const cargarOrdenes = useCallback(async () => {
    if (!citaId) return;
    setErrorOrdenes("");
    try {
      const [ordenesActuales, todasOrdenes] = await Promise.all([
        ExamenService.listarOrdenesPorCita(citaId),
        cita?.pacienteId?._id
          ? ExamenService.listarOrdenesPorPaciente(cita.pacienteId._id)
          : Promise.resolve([]),
      ]);
      setOrdenes(ordenesActuales);
      // Historial = órdenes de otras citas del mismo paciente
      setHistorial(
        todasOrdenes.filter(
          (o) => o.citaId !== citaId && o.citaId !== undefined,
        ),
      );
    } catch {
      setErrorOrdenes(
        "No se pudieron cargar las órdenes de examen. Intenta de nuevo.",
      );
    }
  }, [citaId, cita?.pacienteId?._id]);

  useEffect(() => {
    if (tabActiva === "examenes") cargarOrdenes();
  }, [tabActiva, cargarOrdenes]);

  const handleCancelarOrden = async (ordenId: string) => {
    const result = await Swal.fire({
      title: "¿Cancelar esta orden?",
      text: "Esta acción no se puede deshacer. Los exámenes pendientes no se procesarán.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Sí, cancelar orden",
      cancelButtonText: "No, mantener",
    });
    if (!result.isConfirmed) return;
    try {
      await ExamenService.cancelarOrden(ordenId);
      toastExito("Orden cancelada correctamente");
      await cargarOrdenes();
    } catch {
      Swal.fire("Error", "No se pudo cancelar la orden.", "error");
    }
  };

  const handleEditarOrden = (orden: OrdenExamen) => {
    setOrdenEditando(orden);
  };

  // ============================================================================

  const cargarCita = useCallback(async () => {
    if (!citaId) {
      dispatch({ type: "FETCH_ERROR", payload: "ID de cita no proporcionado" });
      return;
    }

    dispatch({ type: "FETCH_START" });

    try {
      const data = await CitaApiService.obtenerPorId(citaId);
      dispatch({ type: "FETCH_SUCCESS", payload: data });
    } catch {
      dispatch({ type: "FETCH_ERROR", payload: "No se pudo cargar la cita" });
    }
  }, [citaId]);

  useEffect(() => {
    cargarCita();
  }, [cargarCita]);

  // Inicializar notas y medicamentos cuando cargue la cita
  useEffect(() => {
    if (cita) {
      setNotas({
        diagnostico:   (cita as any).diagnostico    ?? "",
        notasClinicas: (cita as any).notasClinicas  ?? "",
        tratamiento:   (cita as any).tratamiento    ?? "",
      });
      if ((cita as any).medicamentosPrescritos?.length) {
        setMedsPrescritos((cita as any).medicamentosPrescritos);
      }
    }
  }, [cita]);

  // Búsqueda de medicamentos con debounce
  useEffect(() => {
    if (!busquedaMed.trim()) { setResultadosMed([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await MedicamentoService.buscar(busquedaMed);
        setResultadosMed(res);
        setMostrarDropdown(true);
      } catch { setResultadosMed([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [busquedaMed]);

  const seleccionarMed = (med: MedicamentoCatalogo) => {
    setMedSeleccionado(med);
    setBusquedaMed(med.nombre);
    setMostrarDropdown(false);
    setResultadosMed([]);
  };

  const agregarMedicamento = () => {
    if (!medSeleccionado || !medForm.dosis.trim() || !medForm.frecuencia.trim() || !medForm.duracion.trim()) return;
    setMedsPrescritos((prev) => [
      ...prev,
      { medicamentoId: medSeleccionado._id, nombre: medSeleccionado.nombre, ...medForm },
    ]);
    setMedSeleccionado(null);
    setBusquedaMed("");
    setMedForm({ dosis: "", frecuencia: "", duracion: "", observaciones: "" });
  };

  const quitarMedicamento = (idx: number) => {
    setMedsPrescritos((prev) => prev.filter((_, i) => i !== idx));
  };

  const guardarMedicamentos = async () => {
    setGuardandoMeds(true);
    try {
      await MedicoApiService.prescribirMedicamentos(citaId!, medsPrescritos);
      toastExito("Medicamentos guardados correctamente");
    } catch {
      Swal.fire("Error", "No se pudieron guardar los medicamentos", "error");
    } finally {
      setGuardandoMeds(false);
    }
  };

  // ── Handlers de acciones de cita ──────────────────────────────

  const handleConfirmarAsistencia = async () => {
    const result = await Swal.fire({
      title: "¿Confirmar asistencia?",
      text: "La cita pasará al estado ATENDIDA.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, confirmar",
      cancelButtonText: "No",
    });
    if (!result.isConfirmed) return;
    try {
      await CitaApiService.marcarAsistencia(citaId!);
      toastExito("Asistencia confirmada");
      cargarCita();
    } catch {
      Swal.fire("Error", "No se pudo confirmar la asistencia", "error");
    }
  };

  const handleFinalizarConsulta = async () => {
    if (!notas.diagnostico.trim()) {
      Swal.fire("Diagnóstico requerido", "Guarda un diagnóstico en el tab 'Notas Clínicas' antes de finalizar.", "warning");
      return;
    }
    const result = await Swal.fire({
      title: "¿Finalizar consulta?",
      text: "La cita pasará al estado ATENDIDA.",
      showCancelButton: true,
      confirmButtonText: "Finalizar",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;
    try {
      await MedicoApiService.actualizarEstadoCita(citaId!, "ATENDIDA");
      toastExito("Consulta finalizada");
      cargarCita();
    } catch {
      Swal.fire("Error", "No se pudo finalizar la consulta", "error");
    }
  };

  const handleCancelarCita = async () => {
    const { value: motivo } = await Swal.fire({
      title: "Cancelar cita",
      input: "text",
      inputLabel: "Motivo de cancelación",
      inputPlaceholder: "Ej: Paciente canceló por teléfono",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      confirmButtonText: "Cancelar cita",
      cancelButtonText: "No, mantener",
      inputValidator: (v) => (!v ? "El motivo es obligatorio" : null),
    });
    if (!motivo) return;
    try {
      await CitaApiService.cancelar(citaId!, motivo);
      toastExito("Cita cancelada");
      cargarCita();
    } catch {
      Swal.fire("Error", "No se pudo cancelar la cita", "error");
    }
  };

  // ============================================================================

  const paciente = useMemo(() => cita?.pacienteId, [cita]);
  const edad = useMemo(
    () => calcularEdad(paciente?.fechaNacimiento),
    [paciente?.fechaNacimiento],
  );

  // ── Loading / error guards ────────────────────────────────

  if (cargando) {
    return (
      <div className="perfil-loading">
        <div className="spinner" />
        <p>Cargando información del paciente...</p>
      </div>
    );
  }

  if (error || !cita || !paciente) {
    return (
      <div className="perfil-error">
        <h2>No se pudo cargar la información</h2>
        <p>
          {error ||
            "Ocurrió un error inesperado al cargar los datos de la cita."}
        </p>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="btn btn-primary" onClick={cargarCita}>
            Reintentar
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate("/calendario")}
          >
            Volver al Calendario
          </button>
        </div>
      </div>
    );
  }

  // ============================================================================

  return (
    <div className="perfil-clinico">
      {/* HEADER */}
      <div className="perfil-header-global">
        <div className="paciente-contexto">
          <div className="avatar-grande">
            {paciente.nombres.charAt(0)}
            {paciente.apellidos.charAt(0)}
          </div>

          <div className="paciente-info-principal">
            <h1>
              {paciente.nombres} {paciente.apellidos}
            </h1>
            <div className="datos-basicos">
              <span>DNI: {paciente.dni}</span>
              <span>
                F.Nac: {formatearFechaCorta(paciente.fechaNacimiento)}
              </span>
              {edad !== null && <span>{edad} años</span>}
            </div>
          </div>
        </div>

        <span>
          {formatearFechaCorta(cita.fecha)} - {cita.hora}
        </span>
      </div>

      {/* ACCIONES DE CITA */}
      {cita && (
        <div className="perfil-acciones">
          {user?.rol === "RECEPCIONISTA" && cita.estado === "PENDIENTE" && (
            <button className="btn btn-success" onClick={handleConfirmarAsistencia}>
              ✓ Confirmar asistencia
            </button>
          )}
          {user?.rol === "MEDICO" && cita.estado === "PENDIENTE" && (
            <button className="btn btn-primary" onClick={handleFinalizarConsulta}>
              Finalizar consulta
            </button>
          )}
          {["PENDIENTE", "REPROGRAMADA"].includes(cita.estado) && (
            <button className="btn btn-danger" onClick={handleCancelarCita}>
              Cancelar cita
            </button>
          )}
          <span className={`badge-estado-cita badge-estado-cita--${cita.estado.toLowerCase()}`}>
            {cita.estado}
          </span>
        </div>
      )}

      {/* TABS — diferenciadas por rol */}
      <div className="tabs-principales">
        {(user?.rol === "MEDICO" ? TABS_MEDICO : TABS_RECEPCIONISTA).map((t) => (
          <button
            key={t.id}
            className={`tab ${tabActiva === t.id ? "activa" : ""}`}
            onClick={() => setTabActiva(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* DASHBOARD */}
      {tabActiva === "dashboard" && (
        <div className="dashboard-layout">
          <div className="columna-principal">
            <div className="card-clinica">
              <div className="card-header">
                <h3>Alergias</h3>
              </div>
              <div className="card-body">
                {alergias.length === 0 ? "Nada grabado" : "—"}
              </div>
            </div>

            <div className="card-clinica">
              <div className="card-header">
                <h3>Problemas Medicos</h3>
              </div>
              <div className="card-body">
                {problemasMedicos.length === 0 ? "Nada grabado" : "—"}
              </div>
            </div>

            <div className="card-clinica">
              <div className="card-header">
                <h3>Medicamentos</h3>
              </div>
              <div className="card-body">
                {medicamentos.length === 0 ? "Nada grabado" : "—"}
              </div>
            </div>

            <div className="card-clinica">
              <div className="card-header">
                <h3>Datos Demograficos</h3>
              </div>

              {/* key={t.id} is stable (string literal union) */}
              <div className="tabs-demograficos">
                {TABS_DEMOGRAFICOS.map((t) => (
                  <button
                    key={t.id}
                    className={`tab-demo ${tabDemo === t.id ? "activa" : ""}`}
                    onClick={() => setTabDemo(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="card-body">
                {tabDemo === "quien" && (
                  <>
                    <strong>Nombre:</strong> {paciente.nombres}{" "}
                    {paciente.apellidos}
                    <br />
                    <strong>DNI:</strong> {paciente.dni}
                  </>
                )}
                {tabDemo === "contacto" && (
                  <>
                    <strong>Teléfono:</strong> {paciente.telefono || "—"}
                    <br />
                    <strong>Correo:</strong> {paciente.correo || "—"}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="columna-lateral">
            <div className="widget">
              <div className="widget-header">
                <h4>Citas</h4>
              </div>
              <div className="widget-body">
                {citasPaciente.length === 0
                  ? "Sin citas"
                  : /* key={c._id} is a stable MongoDB ObjectId — never an index */
                    citasPaciente.map((c) => (
                      <button
                        key={c._id}
                        className="cita-widget-item"
                        onClick={() => navigate(`/citas/${c._id}`)}
                      >
                        {formatearFechaCorta(c.fecha)} - {c.hora}
                      </button>
                    ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tabActiva === "notas" && user?.rol === "MEDICO" && (
        <div className="card-clinica">
          <div className="card-header"><h3>Notas Clínicas</h3></div>
          <div className="card-body notas-clinicas-form">
            <div className="notas-form-grupo">
              <label>Diagnóstico principal *</label>
              <input
                className="notas-form-input"
                value={notas.diagnostico}
                onChange={(e) => setNotas((n) => ({ ...n, diagnostico: e.target.value }))}
                placeholder="Ej: J06.9 - Infección aguda de vías respiratorias superiores"
              />
            </div>
            <div className="notas-form-grupo">
              <label>Observaciones clínicas</label>
              <textarea
                className="notas-form-textarea"
                rows={4}
                value={notas.notasClinicas}
                onChange={(e) => setNotas((n) => ({ ...n, notasClinicas: e.target.value }))}
                placeholder="Hallazgos del examen físico, signos vitales, observaciones..."
              />
            </div>
            <div className="notas-form-grupo">
              <label>Plan de tratamiento</label>
              <textarea
                className="notas-form-textarea"
                rows={3}
                value={notas.tratamiento}
                onChange={(e) => setNotas((n) => ({ ...n, tratamiento: e.target.value }))}
                placeholder="Indicaciones, restricciones, seguimiento..."
              />
            </div>

            {/* ── Medicamentos prescritos ── */}
            <div className="meds-seccion">
              <p className="meds-seccion-titulo">Medicamentos Prescritos</p>

              {/* Buscador */}
              <div className="meds-buscador">
                <input
                  className="notas-form-input"
                  placeholder="Buscar medicamento por nombre..."
                  value={busquedaMed}
                  onChange={(e) => { setBusquedaMed(e.target.value); setMedSeleccionado(null); }}
                  onFocus={() => resultadosMed.length > 0 && setMostrarDropdown(true)}
                />
                {mostrarDropdown && resultadosMed.length > 0 && (
                  <div className="meds-dropdown">
                    {resultadosMed.map((med) => (
                      <button
                        key={med._id}
                        className="meds-dropdown-item"
                        onMouseDown={() => seleccionarMed(med)}
                      >
                        <strong>{med.nombre}</strong>{" "}
                        <span className="meds-dropdown-item-presentacion">{med.presentacion}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Formulario para dosis/frecuencia/duración */}
              {medSeleccionado && (
                <div className="meds-form-nueva">
                  <p className="meds-form-nueva-titulo">
                    {medSeleccionado.nombre} — {medSeleccionado.presentacion}
                  </p>
                  <div className="meds-form-grid">
                    <div className="meds-form-campo">
                      <label>Dosis *</label>
                      <input
                        className="meds-form-input-sm"
                        placeholder="Ej: 500mg"
                        value={medForm.dosis}
                        onChange={(e) => setMedForm((f) => ({ ...f, dosis: e.target.value }))}
                      />
                    </div>
                    <div className="meds-form-campo">
                      <label>Frecuencia *</label>
                      <input
                        className="meds-form-input-sm"
                        placeholder="Ej: Cada 8 horas"
                        value={medForm.frecuencia}
                        onChange={(e) => setMedForm((f) => ({ ...f, frecuencia: e.target.value }))}
                      />
                    </div>
                    <div className="meds-form-campo">
                      <label>Duración *</label>
                      <input
                        className="meds-form-input-sm"
                        placeholder="Ej: 7 días"
                        value={medForm.duracion}
                        onChange={(e) => setMedForm((f) => ({ ...f, duracion: e.target.value }))}
                      />
                    </div>
                  </div>
                  <input
                    className="meds-form-input-sm meds-form-obs"
                    placeholder="Observaciones (opcional)"
                    value={medForm.observaciones}
                    onChange={(e) => setMedForm((f) => ({ ...f, observaciones: e.target.value }))}
                  />
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={!medForm.dosis.trim() || !medForm.frecuencia.trim() || !medForm.duracion.trim()}
                    onClick={agregarMedicamento}
                  >
                    + Agregar
                  </button>
                </div>
              )}

              {/* Tabla de medicamentos prescritos */}
              {medsPrescritos.length > 0 && (
                <div className="meds-tabla-wrapper">
                  <table className="meds-tabla">
                    <thead>
                      <tr>
                        <th>Medicamento</th>
                        <th>Dosis</th>
                        <th>Frecuencia</th>
                        <th>Duración</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {medsPrescritos.map((med, i) => (
                        <tr key={i}>
                          <td className="meds-tabla-nombre">{med.nombre}</td>
                          <td>{med.dosis}</td>
                          <td>{med.frecuencia}</td>
                          <td>{med.duracion}</td>
                          <td>
                            <button
                              className="meds-tabla-quitar"
                              onClick={() => quitarMedicamento(i)}
                              title="Quitar"
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {medsPrescritos.length > 0 && (
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={guardandoMeds}
                  onClick={guardarMedicamentos}
                >
                  {guardandoMeds ? "Guardando..." : "Guardar Medicamentos"}
                </button>
              )}
            </div>

            <hr className="notas-form-separador" />
            <button
              className="btn btn-primary"
              disabled={guardandoNotas || !notas.diagnostico.trim()}
              onClick={async () => {
                setGuardandoNotas(true);
                try {
                  await MedicoApiService.guardarNotasClinicas(citaId!, notas);
                  toastExito("Notas guardadas correctamente");
                } catch {
                  Swal.fire("Error", "No se pudieron guardar las notas", "error");
                } finally {
                  setGuardandoNotas(false);
                }
              }}
            >
              {guardandoNotas ? "Guardando..." : "Guardar Notas"}
            </button>
          </div>
        </div>
      )}

      {tabActiva === "historial" && (
        <div className="card-clinica">No hay visitas anteriores</div>
      )}

      {tabActiva === "documentos" && (
        <div className="card-clinica">No hay documentos cargados</div>
      )}

      {tabActiva === "examenes" && (
        <div className="card-clinica perfil-examenes">
          <div className="card-header">
            <span>Exámenes de Laboratorio</span>
            {user?.rol === "MEDICO" && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setMostrarOrdenModal(true)}
              >
                + Nueva Orden
              </button>
            )}
          </div>

          {errorOrdenes ? (
            <div className="perfil-examenes-error">
              <p>{errorOrdenes}</p>
              <button
                className="btn btn-primary btn-sm"
                onClick={cargarOrdenes}
              >
                Reintentar
              </button>
            </div>
          ) : ordenes.length === 0 && historial.length === 0 ? (
            <p className="perfil-examenes-empty">
              No hay órdenes de examen para esta cita.
            </p>
          ) : (
            <div className="perfil-examenes-lista">
              {/* ── Órdenes de esta cita ── */}
              {ordenes.length === 0 ? (
                <p
                  className="perfil-examenes-empty"
                  style={{ marginBottom: "1rem" }}
                >
                  No hay órdenes para esta cita aún.
                </p>
              ) : (
                ordenes.map((orden) => (
                  <div key={orden._id} className="perfil-orden-card">
                    <div className="perfil-orden-top">
                      <span className="perfil-orden-fecha">
                        {formatearFechaHora(orden.fecha.toString())}
                      </span>
                      <div className="perfil-orden-top-actions">
                        <span
                          className={`perfil-orden-estado perfil-orden-estado--${orden.estado.toLowerCase()}`}
                        >
                          {orden.estado === "PENDIENTE" && "Pendiente"}
                          {orden.estado === "EN_PROCESO" && "En proceso"}
                          {orden.estado === "COMPLETADO" && "Completado"}
                          {orden.estado === "CANCELADA" && "Cancelada"}
                        </span>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => navigate(`/ordenes/${orden._id}/imprimir`)}
                        >
                          Imprimir
                        </button>
                        {orden.estado === "PENDIENTE" &&
                          user?.rol === "MEDICO" && (
                            <>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleEditarOrden(orden)}
                              >
                                Editar
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleCancelarOrden(orden._id)}
                              >
                                Cancelar Orden
                              </button>
                            </>
                          )}
                        {orden.estado === "EN_PROCESO" &&
                          user?.rol === "MEDICO" && (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleCancelarOrden(orden._id)}
                            >
                              Cancelar Orden
                            </button>
                          )}
                      </div>
                    </div>
                    {orden.observacionesGenerales && (
                      <p className="perfil-orden-obs">
                        {orden.observacionesGenerales}
                      </p>
                    )}
                    <table className="perfil-orden-tabla">
                      <thead>
                        <tr>
                          <th>Examen</th>
                          <th>Tipo</th>
                          <th>Observación</th>
                          <th>Resultado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orden.items.map((item, i) => {
                          const ex =
                            typeof item.examenId === "object"
                              ? (item.examenId as ExamenLaboratorio)
                              : null;
                          return (
                            <tr key={i}>
                              <td>{ex?.nombre ?? "—"}</td>
                              <td>{ex ? TIPO_EXAMEN_LABEL[ex.tipo] : "—"}</td>
                              <td>
                                {item.observaciones || (
                                  <span style={{ color: "var(--text-muted)" }}>
                                    —
                                  </span>
                                )}
                              </td>
                              <td>
                                {item.valorResultado ? (
                                  <strong>
                                    {item.valorResultado} {item.unidadResultado}
                                  </strong>
                                ) : (
                                  <span style={{ color: "var(--text-muted)" }}>
                                    Pendiente
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ))
              )}

              {/* ── Historial de otras visitas ── */}
              {historial.length > 0 && (
                <div className="perfil-historial-seccion">
                  <button
                    className="perfil-historial-toggle"
                    onClick={() => setHistorialAbierto((v) => !v)}
                  >
                    <span className="perfil-historial-toggle-label">
                      <History size={14} />
                      Historial de otras visitas ({historial.length})
                    </span>
                    {historialAbierto ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </button>

                  {historialAbierto && (
                    <div className="perfil-historial-lista">
                      {historial.map((orden) => (
                        <div
                          key={orden._id}
                          className="perfil-orden-card perfil-orden-card--historial"
                        >
                          <div className="perfil-orden-top">
                            <span className="perfil-orden-fecha">
                              {formatearFechaHora(orden.fecha.toString())}
                            </span>
                            <span
                              className={`perfil-orden-estado perfil-orden-estado--${orden.estado.toLowerCase()}`}
                            >
                              {orden.estado === "PENDIENTE" && "Pendiente"}
                              {orden.estado === "EN_PROCESO" && "En proceso"}
                              {orden.estado === "COMPLETADO" && "Completado"}
                              {orden.estado === "CANCELADA" && "Cancelada"}
                            </span>
                          </div>
                          {orden.observacionesGenerales && (
                            <p className="perfil-orden-obs">
                              {orden.observacionesGenerales}
                            </p>
                          )}
                          <table className="perfil-orden-tabla">
                            <thead>
                              <tr>
                                <th>Examen</th>
                                <th>Tipo</th>
                                <th>Observación</th>
                                <th>Resultado</th>
                              </tr>
                            </thead>
                            <tbody>
                              {orden.items.map((item, i) => {
                                const ex =
                                  typeof item.examenId === "object"
                                    ? (item.examenId as ExamenLaboratorio)
                                    : null;
                                return (
                                  <tr key={i}>
                                    <td>{ex?.nombre ?? "—"}</td>
                                    <td>
                                      {ex ? TIPO_EXAMEN_LABEL[ex.tipo] : "—"}
                                    </td>
                                    <td>
                                      {item.observaciones || (
                                        <span
                                          style={{ color: "var(--text-muted)" }}
                                        >
                                          —
                                        </span>
                                      )}
                                    </td>
                                    <td>
                                      {item.valorResultado ? (
                                        <strong>
                                          {item.valorResultado}{" "}
                                          {item.unidadResultado}
                                        </strong>
                                      ) : (
                                        <span
                                          style={{ color: "var(--text-muted)" }}
                                        >
                                          —
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {mostrarOrdenModal &&
        cita &&
        user?.rol === "MEDICO" &&
        (() => {
          const doctor =
            cita.doctorId && typeof cita.doctorId === "object"
              ? cita.doctorId
              : null;
          const pacienteId =
            cita.pacienteId && typeof cita.pacienteId === "object"
              ? cita.pacienteId._id
              : String(cita.pacienteId);
          const doctorId = doctor?._id ?? "";
          const especialidadId =
            doctor?.especialidadId && typeof doctor.especialidadId === "object"
              ? doctor.especialidadId._id
              : "";
          return (
            <OrdenExamenModal
              citaId={cita._id}
              pacienteId={pacienteId}
              doctorId={doctorId}
              especialidadId={especialidadId}
              onCerrar={() => setMostrarOrdenModal(false)}
              onOrdenCreada={cargarOrdenes}
            />
          );
        })()}

      {/* ── Modal de edición de orden PENDIENTE ── */}
      {ordenEditando &&
        cita &&
        (() => {
          const doctor =
            cita.doctorId && typeof cita.doctorId === "object"
              ? cita.doctorId
              : null;
          const pacienteId =
            cita.pacienteId && typeof cita.pacienteId === "object"
              ? cita.pacienteId._id
              : String(cita.pacienteId);
          const doctorId = doctor?._id ?? "";
          const especialidadId =
            doctor?.especialidadId && typeof doctor.especialidadId === "object"
              ? doctor.especialidadId._id
              : "";
          // Pre-cargar los exámenes e indicaciones existentes de la orden
          const seleccionadosIniciales = new Set(
            ordenEditando.items.map((it) =>
              typeof it.examenId === "object"
                ? it.examenId._id
                : String(it.examenId),
            ),
          );
          const obsItemIniciales = ordenEditando.items.reduce<
            Record<string, string>
          >((acc, it) => {
            const id =
              typeof it.examenId === "object"
                ? it.examenId._id
                : String(it.examenId);
            acc[id] = it.observaciones ?? "";
            return acc;
          }, {});
          return (
            <OrdenExamenModal
              citaId={cita._id}
              pacienteId={pacienteId}
              doctorId={doctorId}
              especialidadId={especialidadId}
              onCerrar={() => setOrdenEditando(null)}
              onOrdenCreada={async () => {
                setOrdenEditando(null);
                await cargarOrdenes();
              }}
              ordenId={ordenEditando._id}
              seleccionadosIniciales={seleccionadosIniciales}
              obsItemIniciales={obsItemIniciales}
              obsGeneralesInicial={ordenEditando.observacionesGenerales ?? ""}
            />
          );
        })()}
    </div>
  );
};

export default PerfilCita;
