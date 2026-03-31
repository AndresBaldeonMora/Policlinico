import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Vista } from "./types";

const VISTAS: readonly Vista[] = ["dia", "semana", "mes"];

interface Props {
  titulo: string;
  vista: Vista;
  onCambiarFecha: (delta: number) => void;
  onCambiarVista: (v: Vista) => void;
}

const CalendarioTopbar = ({ titulo, vista, onCambiarFecha, onCambiarVista }: Props) => (
  <div className="calendario-topbar">

    <div className="calendario-topbar-nav">
      <button onClick={() => onCambiarFecha(-1)} aria-label="Período anterior"><ChevronLeft size={16} /></button>
      <h2>{titulo}</h2>
      <button onClick={() => onCambiarFecha(1)} aria-label="Período siguiente"><ChevronRight size={16} /></button>
    </div>

    <div className="vista-selector" role="group" aria-label="Selector de vista">
      {VISTAS.map((v) => (
        <button
          key={v}
          className={vista === v ? "active" : ""}
          onClick={() => onCambiarVista(v)}
          aria-pressed={vista === v}
          aria-label={`Vista ${v}`}
        >
          {v.charAt(0).toUpperCase() + v.slice(1)}
        </button>
      ))}
    </div>

  </div>
);

export default CalendarioTopbar;