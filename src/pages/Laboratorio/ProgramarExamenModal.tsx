import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, Clock, Calendar } from "lucide-react";
import { ExamenService } from "../../services/examen.service";
import type { ExamenLaboratorioImagen, TipoExamen } from "../../services/examen.service";
import "./ProgramarExamenModal.css";

// ─── helpers ──────────────────────────────────────────────────────────────────
const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const isoToDisplay = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const isoToBackend = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIAS_SEMANA = ["Lu","Ma","Mi","Ju","Vi","Sá","Do"];

// Laboratorio atiende toma de muestras de 7:00 a 11:00 a.m.
// Si ya pasaron las 11:00, el día de hoy ya no tiene cupos.
const LAB_HORA_CIERRE = 11; // 11:00 a.m.

const IMAGEN_TIPOS: TipoExamen[] = ["RADIOGRAFIA","ECOGRAFIA","TOMOGRAFIA","RESONANCIA","ELECTROCARDIOGRAMA"];

// Genera franjas horarias de 7:00 a 17:30 cada 30 min
function generarFranjas(): string[] {
  const slots: string[] = [];
  for (let h = 7; h < 18; h++) {
    slots.push(`${String(h).padStart(2,"0")}:00`);
    if (h < 17) slots.push(`${String(h).padStart(2,"0")}:30`);
  }
  return slots;
}

function horaAMin(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

function franjaOcupada(
  slot: string,
  durMin: number,
  franjas: { inicio: string; fin: string }[]
): boolean {
  const slotIni = horaAMin(slot);
  const slotFin = slotIni + durMin;
  return franjas.some(f => {
    const fIni = horaAMin(new Date(f.inicio).toTimeString().slice(0,5));
    const fFin = horaAMin(new Date(f.fin).toTimeString().slice(0,5));
    return slotIni < fFin && slotFin > fIni;
  });
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  examen: ExamenLaboratorioImagen;
  onSeleccionar: (valor: string) => void; // "YYYY-MM-DD" lab | "YYYY-MM-DDTHH:mm" imagen
  onCerrar: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Modal de programación para LABORATORIO (calendario de disponibilidad diaria)
// ═══════════════════════════════════════════════════════════════════════════════
function CalendarioLab({ examen, onSeleccionar, onCerrar }: Props) {
  const hoy = new Date();
  const [anio, setAnio]       = useState(hoy.getFullYear());
  const [mes, setMes]         = useState(hoy.getMonth());
  const [ocupados, setOcupados] = useState<Record<string, number>>({});
  const [capacidad, setCapacidad] = useState(20);
  const [cargando, setCargando]   = useState(false);
  const [seleccionado, setSeleccionado] = useState("");

  useEffect(() => {
    const desde = `${anio}-${String(mes + 1).padStart(2,"0")}-01`;
    const ultimo = new Date(anio, mes + 1, 0).getDate();
    const hasta  = `${anio}-${String(mes + 1).padStart(2,"0")}-${String(ultimo).padStart(2,"0")}`;
    setCargando(true);
    ExamenService.obtenerDisponibilidadLab(desde, hasta)
      .then(r => {
        const map: Record<string, number> = {};
        r.data.forEach(d => { map[d.fecha] = d.ocupados; });
        setOcupados(map);
        setCapacidad(r.capacidadDiaria);
      })
      .finally(() => setCargando(false));
  }, [anio, mes]);

  const primero = new Date(anio, mes, 1).getDay(); // 0=dom
  const offsetLun = (primero === 0 ? 6 : primero - 1);
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const hoyISO_   = hoyISO();
  // Si ya pasó la hora de cierre del lab (11 AM), hoy también está bloqueado
  const horaActual = new Date().getHours();
  const hoyYaSinCupos = horaActual >= LAB_HORA_CIERRE;

  const celdas: (number | null)[] = [
    ...Array(offsetLun).fill(null),
    ...Array.from({ length: diasEnMes }, (_, i) => i + 1),
  ];

  const navPrev = () => {
    if (mes === 0) { setMes(11); setAnio(a => a - 1); }
    else setMes(m => m - 1);
  };
  const navNext = () => {
    if (mes === 11) { setMes(0); setAnio(a => a + 1); }
    else setMes(m => m + 1);
  };

  const getDiaISO = (d: number) =>
    `${anio}-${String(mes + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

  return (
    <div className="pem-overlay" onClick={e => { if (e.target === e.currentTarget) onCerrar(); }}>
      <div className="pem-card">
        <div className="pem-header">
          <div className="pem-header-info">
            <Calendar size={16} className="pem-icon" />
            <div>
              <h3>{examen.nombre}</h3>
              <p>Selecciona una fecha disponible</p>
            </div>
          </div>
          <button className="pem-close" onClick={onCerrar}><X size={16} /></button>
        </div>

        <div className="pem-body">
          {/* Navegación mes */}
          <div className="pem-nav-mes">
            <button className="pem-nav-btn" onClick={navPrev}><ChevronLeft size={16} /></button>
            <span className="pem-mes-label">{MESES[mes]} {anio}</span>
            <button className="pem-nav-btn" onClick={navNext}><ChevronRight size={16} /></button>
          </div>

          {/* Leyenda */}
          <div className="pem-leyenda">
            <span className="pem-leyenda-item pem-leyenda--libre">Disponible</span>
            <span className="pem-leyenda-item pem-leyenda--casi">Casi lleno</span>
            <span className="pem-leyenda-item pem-leyenda--lleno">Sin cupos</span>
          </div>

          {cargando ? (
            <div className="pem-loading"><div className="pem-spinner" /></div>
          ) : (
            <div className="pem-cal">
              {DIAS_SEMANA.map(d => <div key={d} className="pem-cal-hdr">{d}</div>)}
              {celdas.map((d, i) => {
                if (!d) return <div key={`e-${i}`} />;
                const iso = getDiaISO(d);
                const oc  = ocupados[iso] ?? 0;
                const pasado = iso < hoyISO_;
                const esHoy  = iso === hoyISO_;
                const lleno  = oc >= capacidad || (esHoy && hoyYaSinCupos);
                const casi   = !lleno && oc >= capacidad * 0.8;
                const activo = iso === seleccionado;
                const disabled = pasado || lleno;
                return (
                  <button
                    key={iso}
                    className={`pem-dia ${pasado ? "pem-dia--pasado" : ""} ${lleno ? "pem-dia--lleno" : ""} ${casi ? "pem-dia--casi" : ""} ${activo ? "pem-dia--activo" : ""}`}
                    disabled={disabled}
                    onClick={() => setSeleccionado(iso)}
                  >
                    {d}
                    {!pasado && !lleno && oc > 0 && (
                      <span className="pem-dia-cupos">{capacidad - oc}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {seleccionado && (
            <div className="pem-selec-info">
              Fecha seleccionada: <strong>{isoToDisplay(seleccionado)}</strong>
              &nbsp;· Cupos libres: <strong>{capacidad - (ocupados[seleccionado] ?? 0)}</strong>
            </div>
          )}
        </div>

        <div className="pem-footer">
          <button className="pem-btn pem-btn--ghost" onClick={onCerrar}>Cancelar</button>
          <button
            className="pem-btn pem-btn--primary"
            disabled={!seleccionado}
            onClick={() => { onSeleccionar(seleccionado); onCerrar(); }}
          >
            Confirmar fecha
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Modal de programación para IMAGENOLOGÍA (selector de horario)
// ═══════════════════════════════════════════════════════════════════════════════
function HorarioImagen({ examen, onSeleccionar, onCerrar }: Props) {
  const [fecha, setFecha]       = useState(hoyISO());
  const [ocupadas, setOcupadas] = useState<{ inicio: string; fin: string }[]>([]);
  const [cargando, setCargando] = useState(false);
  const [horaSelec, setHoraSelec] = useState("");
  const duracion = 30; // minutos por defecto

  useEffect(() => {
    if (!fecha) return;
    setCargando(true);
    setHoraSelec("");
    ExamenService.obtenerDisponibilidadImagen(isoToBackend(fecha), undefined, duracion)
      .then(r => setOcupadas(r.franjasOcupadas))
      .finally(() => setCargando(false));
  }, [fecha]);

  const franjas = generarFranjas();
  const hoyISO_ = hoyISO();
  const ahoraMin = new Date().getHours() * 60 + new Date().getMinutes();

  return (
    <div className="pem-overlay" onClick={e => { if (e.target === e.currentTarget) onCerrar(); }}>
      <div className="pem-card">
        <div className="pem-header">
          <div className="pem-header-info">
            <Clock size={16} className="pem-icon" />
            <div>
              <h3>{examen.nombre}</h3>
              <p>Selecciona fecha y horario disponible</p>
            </div>
          </div>
          <button className="pem-close" onClick={onCerrar}><X size={16} /></button>
        </div>

        <div className="pem-body">
          <div className="pem-field-group">
            <label className="pem-label">Fecha de la cita</label>
            <input
              type="date"
              className="pem-input"
              value={fecha}
              min={hoyISO()}
              onChange={e => setFecha(e.target.value)}
            />
          </div>

          <div className="pem-horarios-titulo">
            <Clock size={13} /> Horarios disponibles — {isoToDisplay(fecha)}
          </div>

          {cargando ? (
            <div className="pem-loading"><div className="pem-spinner" /></div>
          ) : (
            <div className="pem-horarios-grid">
              {franjas.map(slot => {
                const ocupado = franjaOcupada(slot, duracion, ocupadas);
                const pasado  = fecha === hoyISO_ && horaAMin(slot) <= ahoraMin;
                const disabled = ocupado || pasado;
                const activo   = slot === horaSelec;
                return (
                  <button
                    key={slot}
                    className={`pem-slot ${disabled ? "pem-slot--ocupado" : ""} ${activo ? "pem-slot--activo" : ""}`}
                    disabled={disabled}
                    onClick={() => setHoraSelec(slot)}
                  >
                    {slot}
                    {ocupado && <span className="pem-slot-lbl">Ocupado</span>}
                  </button>
                );
              })}
            </div>
          )}

          {horaSelec && (
            <div className="pem-selec-info">
              Cita: <strong>{isoToDisplay(fecha)} a las {horaSelec}</strong>
            </div>
          )}
        </div>

        <div className="pem-footer">
          <button className="pem-btn pem-btn--ghost" onClick={onCerrar}>Cancelar</button>
          <button
            className="pem-btn pem-btn--primary"
            disabled={!horaSelec}
            onClick={() => { onSeleccionar(`${fecha}T${horaSelec}`); onCerrar(); }}
          >
            Confirmar horario
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Export principal ─────────────────────────────────────────────────────────
export function ProgramarExamenModal({ examen, onSeleccionar, onCerrar }: Props) {
  const esImagen = IMAGEN_TIPOS.includes(examen.tipo);
  return esImagen
    ? <HorarioImagen examen={examen} onSeleccionar={onSeleccionar} onCerrar={onCerrar} />
    : <CalendarioLab examen={examen} onSeleccionar={onSeleccionar} onCerrar={onCerrar} />;
}
