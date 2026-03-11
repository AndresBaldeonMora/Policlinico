// ============================================================
// ReprogramarModal.tsx
// Self-contained modal for the "reschedule appointment" flow.
// Props come from the parent; no local state needed here.
// ============================================================

import type { HorarioPorDia, MesOption, EditandoState } from "./listaCitasReducer";

// ── Helpers ──────────────────────────────────────────────────

const formatearFechaResumen = (fechaISO: string): string => {
  if (!fechaISO) return "";
  const [anio, mes, dia] = fechaISO.split("-");
  const fecha = new Date(Number(anio), Number(mes) - 1, Number(dia));
  const nombreDia = new Intl.DateTimeFormat("es-PE", { weekday: "long" }).format(fecha);
  return `${nombreDia.charAt(0).toUpperCase() + nombreDia.slice(1)} ${dia}/${mes}/${anio}`;
};

// ── Sub-component: Step indicator ───────────────────────────

interface StepperProps {
  pasoModal: 1 | 2;
}

const ModalStepper = ({ pasoModal }: StepperProps) => (
  <div className="modal-stepper">
    <div className={`modal-step ${pasoModal === 1 ? "activo" : ""} ${pasoModal > 1 ? "completado" : ""}`}>
      <span className="step-circle">1</span>
      <span className="step-label">Nueva fecha y hora</span>
    </div>
    <div className={`modal-step ${pasoModal === 2 ? "activo" : ""}`}>
      <span className="step-circle">2</span>
      <span className="step-label">Confirmar cambios</span>
    </div>
  </div>
);

// ── Sub-component: Month selector ───────────────────────────

interface MesSelectorProps {
  mesesDisponibles: MesOption[];
  mesSeleccionado: MesOption | null;
  onSelectMes: (mes: MesOption) => void;
}

const MesSelector = ({ mesesDisponibles, mesSeleccionado, onSelectMes }: MesSelectorProps) => (
  <div className="selector-mes">
    <span className="selector-label">Seleccionar Mes:</span>
    <div className="meses-lista">
      {mesesDisponibles.map((mes) => (
        <button
          key={`${mes.anio}-${mes.numero}`}
          type="button"
          className={`mes-btn ${
            mesSeleccionado?.numero === mes.numero && mesSeleccionado?.anio === mes.anio
              ? "activo"
              : ""
          }`}
          onClick={() => onSelectMes(mes)}
        >
          {mes.nombre} {mes.anio}
        </button>
      ))}
    </div>
  </div>
);

// ── Sub-component: Day selector ─────────────────────────────

interface DiaSelectorProps {
  diasDelMes: number[];
  diaSeleccionado: number | null;
  onSelectDia: (dia: number) => void;
}

const DiaSelector = ({ diasDelMes, diaSeleccionado, onSelectDia }: DiaSelectorProps) => (
  <div className="selector-dia">
    <span className="selector-label">Seleccionar Día:</span>
    <div className="dias-lista-selector">
      {diasDelMes.map((dia) => (
        <button
          key={dia}
          type="button"
          className={`dia-btn ${diaSeleccionado === dia ? "activo" : ""}`}
          onClick={() => onSelectDia(dia)}
        >
          {dia}
        </button>
      ))}
    </div>
  </div>
);

// ── Sub-component: Time-slot grid ────────────────────────────

interface HorariosSelectorProps {
  horariosPorDia: HorarioPorDia[];
  cargandoHorarios: boolean;
  horaSeleccionada: string;
  onSelectHora: (hora: string) => void;
}

const HorariosSelector = ({
  horariosPorDia,
  cargandoHorarios,
  horaSeleccionada,
  onSelectHora,
}: HorariosSelectorProps) => {
  if (cargandoHorarios) {
    return (
      <div className="horarios-loading">
        <div className="spinner-small" />
        <p>Cargando horarios...</p>
      </div>
    );
  }

  const hayDisponibles =
    horariosPorDia.length > 0 &&
    horariosPorDia[0].horarios.some((h) => h.disponible);

  if (!hayDisponibles) {
    return (
      <div className="no-horarios">
        <p>😔 No hay horarios disponibles para este día.</p>
      </div>
    );
  }

  return (
    <div className="horarios-contenedor-modal">
      <div className="dias-lista-modal">
        {horariosPorDia.map((dia) => (
          <div key={dia.fechaISO} className="dia-grupo-modal">
            <div className="dia-header-modal">
              <span className="dia-nombre">{dia.diaNombre}</span>
              <span className="dia-fecha">📅 {dia.fecha}</span>
            </div>

            <div className="horarios-horizontal-modal">
              {dia.horarios
                .filter((h) => h.disponible)
                .map((horario) => (
                  <label
                    key={horario.hora}
                    className={`horario-radio-modal ${
                      horaSeleccionada === horario.hora ? "seleccionado" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="horario"
                      value={horario.hora}
                      checked={horaSeleccionada === horario.hora}
                      onChange={() => onSelectHora(horario.hora)}
                    />
                    <span className="horario-texto">{horario.hora} hs</span>
                  </label>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Sub-component: Confirmation summary ─────────────────────

interface ResumenProps {
  editando: EditandoState;
}

const ConfirmacionResumen = ({ editando }: ResumenProps) => (
  <div className="modal-resumen-reprogramar">
    <h4>Confirmar nueva programación</h4>
    <div className="modal-resumen-grid">
      <div className="modal-resumen-item">
        <span>Paciente</span>
        <strong>{editando.paciente}</strong>
        <span>DNI: {editando.dni}</span>
      </div>
      <div className="modal-resumen-item">
        <span>Médico</span>
        <strong>{editando.doctor}</strong>
        <span>{editando.especialidad}</span>
      </div>
      <div className="modal-resumen-item">
        <span>Fecha y hora original</span>
        <strong>{editando.fechaOriginal}</strong>
        <span>{editando.horaOriginal} hs</span>
      </div>
      <div className="modal-resumen-item destacado">
        <span>Nueva fecha y hora</span>
        <strong>{formatearFechaResumen(editando.fecha)}</strong>
        <span>{editando.hora} hs</span>
      </div>
    </div>
    <p className="modal-resumen-note">
      Revisa que la nueva fecha y hora sean correctas antes de confirmar. Esta
      acción actualizará la cita del paciente.
    </p>
  </div>
);

// ── Main export ──────────────────────────────────────────────

export interface ReprogramarModalProps {
  editando: EditandoState;
  pasoModal: 1 | 2;
  mesesDisponibles: MesOption[];
  mesSeleccionado: MesOption | null;
  diasDelMes: number[];
  diaSeleccionado: number | null;
  horariosPorDia: HorarioPorDia[];
  cargandoHorarios: boolean;

  onSelectMes: (mes: MesOption) => void;
  onSelectDia: (dia: number) => void;
  onSelectHora: (hora: string) => void;
  onSiguiente: () => void;
  onVolver: () => void;
  onCerrar: () => void;
  onConfirmar: () => void;
}

const ReprogramarModal = ({
  editando,
  pasoModal,
  mesesDisponibles,
  mesSeleccionado,
  diasDelMes,
  diaSeleccionado,
  horariosPorDia,
  cargandoHorarios,
  onSelectMes,
  onSelectDia,
  onSelectHora,
  onSiguiente,
  onVolver,
  onCerrar,
  onConfirmar,
}: ReprogramarModalProps) => {
  return (
    <div className="modal-overlay">
      <div className="modal-card-reprogramar">
        {/* Header */}
        <div className="modal-header-reprogramar">
          <h3>Reprogramar Cita</h3>
          <span className="modal-subtitle">
            {editando.paciente} · {editando.doctor} · {editando.especialidad}
          </span>
          <ModalStepper pasoModal={pasoModal} />
        </div>

        {/* Body */}
        <div className="modal-body">
          {pasoModal === 1 && (
            <>
              <MesSelector
                mesesDisponibles={mesesDisponibles}
                mesSeleccionado={mesSeleccionado}
                onSelectMes={onSelectMes}
              />

              {mesSeleccionado && diasDelMes.length > 0 && (
                <DiaSelector
                  diasDelMes={diasDelMes}
                  diaSeleccionado={diaSeleccionado}
                  onSelectDia={onSelectDia}
                />
              )}

              {diaSeleccionado && (
                <HorariosSelector
                  horariosPorDia={horariosPorDia}
                  cargandoHorarios={cargandoHorarios}
                  horaSeleccionada={editando.hora}
                  onSelectHora={onSelectHora}
                />
              )}
            </>
          )}

          {pasoModal === 2 && <ConfirmacionResumen editando={editando} />}
        </div>

        {/* Footer actions */}
        <div className="modal-actions">
          {pasoModal === 1 ? (
            <>
              <button onClick={onCerrar} className="btn btn-secondary">
                Cancelar
              </button>
              <button
                onClick={onSiguiente}
                className="btn btn-primary btn-next"
                disabled={!editando.fecha || !editando.hora}
              >
                Siguiente
              </button>
            </>
          ) : (
            <>
              <button onClick={onVolver} className="btn btn-secondary btn-back">
                Volver
              </button>
              <button
                onClick={onConfirmar}
                className="btn btn-primary btn-confirmar"
              >
                Confirmar Reprogramación
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReprogramarModal;