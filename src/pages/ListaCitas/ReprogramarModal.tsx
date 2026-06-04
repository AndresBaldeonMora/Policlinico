import { useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, Clock, X } from "lucide-react";
import type { HorarioPorDia, MesOption, EditandoState } from "./ListaCitasReducer";
import "./ReprogramarModal.css";

// ── Constantes ──────────────────────────────────────────────

const NOMBRES_MES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const DIAS_SEMANA = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];

const pad2 = (n: number) => String(n).padStart(2, "0");
const toISO = (anio: number, mes: number, dia: number) =>
  `${anio}-${pad2(mes + 1)}-${pad2(dia)}`;

const formatearFechaResumen = (fechaISO: string): string => {
  if (!fechaISO) return "";
  const [anio, mes, dia] = fechaISO.split("-").map(Number);
  const fecha = new Date(anio, mes - 1, dia);
  const nombreDia = new Intl.DateTimeFormat("es-PE", { weekday: "long" }).format(fecha);
  return `${nombreDia.charAt(0).toUpperCase() + nombreDia.slice(1)} ${pad2(dia)}/${pad2(mes)}/${anio}`;
};

// ── Stepper ─────────────────────────────────────────────────

const Stepper = ({ pasoModal }: { pasoModal: 1 | 2 }) => (
  <div className="rep-stepper">
    <div className={`rep-step ${pasoModal === 1 ? "rep-step--activo" : "rep-step--completado"}`}>
      <span className="rep-step__circle">1</span>
      <span className="rep-step__label">Fecha y hora</span>
    </div>
    <span className="rep-step__separator" />
    <div className={`rep-step ${pasoModal === 2 ? "rep-step--activo" : ""}`}>
      <span className="rep-step__circle">2</span>
      <span className="rep-step__label">Confirmar</span>
    </div>
  </div>
);

// ── Calendario ──────────────────────────────────────────────

interface CalendarioProps {
  mesesDisponibles: MesOption[];
  fechaSeleccionada: string;
  onSelectFecha: (fechaISO: string) => void;
}

const CalendarioMes = ({ mesesDisponibles, fechaSeleccionada, onSelectFecha }: CalendarioProps) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const primerMes = mesesDisponibles[0];
  const ultimoMes = mesesDisponibles[mesesDisponibles.length - 1];

  const inicialVisible = (() => {
    if (fechaSeleccionada) {
      const [y, m] = fechaSeleccionada.split("-").map(Number);
      return { anio: y, mes: m - 1 };
    }
    if (primerMes) return { anio: primerMes.anio, mes: primerMes.numero };
    return { anio: hoy.getFullYear(), mes: hoy.getMonth() };
  })();

  const [visible, setVisible] = useState(inicialVisible);

  const idx = (anio: number, mes: number) => anio * 12 + mes;
  const minIdx = primerMes ? idx(primerMes.anio, primerMes.numero) : -Infinity;
  const maxIdx = ultimoMes ? idx(ultimoMes.anio, ultimoMes.numero) : Infinity;
  const visibleIdx = idx(visible.anio, visible.mes);

  const puedeRetroceder = visibleIdx > minIdx;
  const puedeAvanzar = visibleIdx < maxIdx;

  const cambiarMes = (delta: number) => {
    const d = new Date(visible.anio, visible.mes + delta, 1);
    setVisible({ anio: d.getFullYear(), mes: d.getMonth() });
  };

  // Lunes-first: getDay() devuelve 0=Dom..6=Sab. Conversión a 0=Lu..6=Do
  const primerDiaSemana = (new Date(visible.anio, visible.mes, 1).getDay() + 6) % 7;
  const diasEnMes = new Date(visible.anio, visible.mes + 1, 0).getDate();

  const celdas: Array<{ tipo: "vacia" } | { tipo: "dia"; dia: number }> = [
    ...Array.from({ length: primerDiaSemana }, () => ({ tipo: "vacia" as const })),
    ...Array.from({ length: diasEnMes }, (_, i) => ({ tipo: "dia" as const, dia: i + 1 })),
  ];

  return (
    <div className="rep-cal">
      <div className="rep-cal__nav">
        <button
          type="button"
          className="rep-cal__nav-btn"
          onClick={() => cambiarMes(-1)}
          disabled={!puedeRetroceder}
          aria-label="Mes anterior"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="rep-cal__titulo">
          {NOMBRES_MES[visible.mes]} {visible.anio}
        </span>
        <button
          type="button"
          className="rep-cal__nav-btn"
          onClick={() => cambiarMes(1)}
          disabled={!puedeAvanzar}
          aria-label="Mes siguiente"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="rep-cal__semana">
        {DIAS_SEMANA.map((d) => (
          <span key={d} className="rep-cal__semana-dia">{d}</span>
        ))}
      </div>

      <div className="rep-cal__grid">
        {celdas.map((c, i) => {
          if (c.tipo === "vacia") {
            return <span key={`e${i}`} className="rep-cal__celda rep-cal__celda--vacia" />;
          }
          const fecha = new Date(visible.anio, visible.mes, c.dia);
          const iso = toISO(visible.anio, visible.mes, c.dia);
          const deshabilitado = fecha < hoy;
          const seleccionado = iso === fechaSeleccionada;
          const esHoy = fecha.getTime() === hoy.getTime();

          const classes = [
            "rep-cal__celda",
            seleccionado ? "rep-cal__celda--sel" : "",
            esHoy && !seleccionado ? "rep-cal__celda--hoy" : "",
            deshabilitado ? "rep-cal__celda--off" : "",
          ].filter(Boolean).join(" ");

          return (
            <button
              key={iso}
              type="button"
              className={classes}
              disabled={deshabilitado}
              onClick={() => onSelectFecha(iso)}
            >
              {c.dia}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ── Horarios disponibles ────────────────────────────────────

interface HorariosProps {
  horariosPorDia: HorarioPorDia[];
  cargando: boolean;
  fechaSeleccionada: string;
  horaSeleccionada: string;
  onSelectHora: (hora: string) => void;
}

const HorariosPanel = ({
  horariosPorDia,
  cargando,
  fechaSeleccionada,
  horaSeleccionada,
  onSelectHora,
}: HorariosProps) => {
  if (!fechaSeleccionada) {
    return (
      <div className="rep-slots rep-slots--placeholder">
        <CalendarDays size={28} />
        <p>Selecciona un día en el calendario para ver los horarios disponibles.</p>
      </div>
    );
  }

  if (cargando) {
    return (
      <div className="rep-slots rep-slots--placeholder">
        <div className="spinner-small" />
        <p>Cargando horarios…</p>
      </div>
    );
  }

  const dia = horariosPorDia[0];
  const disponibles = dia ? dia.horarios.filter((h) => h.disponible) : [];

  return (
    <div className="rep-slots">
      <div className="rep-slots__header">
        <Clock size={14} />
        <span>
          Horarios — <strong>{dia?.diaNombre} {dia?.fecha}</strong>
        </span>
      </div>
      {disponibles.length === 0 ? (
        <p className="rep-slots__vacio">No hay horarios disponibles para este día.</p>
      ) : (
        <div className="rep-slots__grid">
          {disponibles.map((h) => (
            <button
              key={h.hora}
              type="button"
              className={`rep-slot${horaSeleccionada === h.hora ? " rep-slot--sel" : ""}`}
              onClick={() => onSelectHora(h.hora)}
            >
              {h.hora}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Confirmación ────────────────────────────────────────────

const ConfirmacionResumen = ({ editando }: { editando: EditandoState }) => (
  <div className="rep-confirm">
    <h4 className="rep-confirm__titulo">Revisa los cambios antes de confirmar</h4>
    <div className="rep-confirm__grid">
      <div className="rep-confirm__item">
        <span className="rep-confirm__label">Paciente</span>
        <strong>{editando.paciente}</strong>
        {editando.dni && <span className="rep-confirm__sub">DNI: {editando.dni}</span>}
      </div>
      <div className="rep-confirm__item">
        <span className="rep-confirm__label">Médico</span>
        <strong>{editando.doctor}</strong>
        <span className="rep-confirm__sub">{editando.especialidad}</span>
      </div>
      <div className="rep-confirm__item rep-confirm__item--antes">
        <span className="rep-confirm__label">Fecha y hora original</span>
        <strong>{editando.fechaOriginal}</strong>
        <span className="rep-confirm__sub">{editando.horaOriginal} hs</span>
      </div>
      <div className="rep-confirm__item rep-confirm__item--despues">
        <span className="rep-confirm__label">Nueva fecha y hora</span>
        <strong>{formatearFechaResumen(editando.fecha)}</strong>
        <span className="rep-confirm__sub">{editando.hora} hs</span>
      </div>
    </div>
  </div>
);

// ── Modal principal ─────────────────────────────────────────

export interface ReprogramarModalProps {
  editando: EditandoState;
  pasoModal: 1 | 2;
  mesesDisponibles: MesOption[];
  horariosPorDia: HorarioPorDia[];
  cargandoHorarios: boolean;
  onSelectFecha: (fechaISO: string) => void;
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
  horariosPorDia,
  cargandoHorarios,
  onSelectFecha,
  onSelectHora,
  onSiguiente,
  onVolver,
  onCerrar,
  onConfirmar,
}: ReprogramarModalProps) => {
  return (
    <div className="rep-overlay" role="presentation">
      <div
        className="rep-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rep-titulo"
      >
        <header className="rep-header">
          <div className="rep-header__top">
            <div>
              <h3 id="rep-titulo" className="rep-header__titulo">Reprogramar cita</h3>
              <p className="rep-header__sub">
                {editando.doctor} · {editando.especialidad}
              </p>
            </div>
            <button
              type="button"
              className="rep-header__close"
              onClick={onCerrar}
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>
          <Stepper pasoModal={pasoModal} />
        </header>

        <div className="rep-body">
          {pasoModal === 1 ? (
            <div className="rep-paso1">
              <CalendarioMes
                mesesDisponibles={mesesDisponibles}
                fechaSeleccionada={editando.fecha}
                onSelectFecha={onSelectFecha}
              />
              <HorariosPanel
                horariosPorDia={horariosPorDia}
                cargando={cargandoHorarios}
                fechaSeleccionada={editando.fecha}
                horaSeleccionada={editando.hora}
                onSelectHora={onSelectHora}
              />
            </div>
          ) : (
            <ConfirmacionResumen editando={editando} />
          )}
        </div>

        <footer className="rep-footer">
          {pasoModal === 1 ? (
            <>
              <button type="button" className="rep-btn rep-btn--secondary" onClick={onCerrar}>
                Cancelar
              </button>
              <button
                type="button"
                className="rep-btn rep-btn--primary"
                onClick={onSiguiente}
                disabled={!editando.fecha || !editando.hora}
              >
                Siguiente
              </button>
            </>
          ) : (
            <>
              <button type="button" className="rep-btn rep-btn--secondary" onClick={onVolver}>
                Volver
              </button>
              <button type="button" className="rep-btn rep-btn--primary" onClick={onConfirmar}>
                Confirmar reprogramación
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
};

export default ReprogramarModal;
