import { ChevronLeft, ChevronRight } from "lucide-react";
import "./MiniCalendario.css";

interface MiniCalendarioProps {
  fecha: Date;
  onChange: (fecha: Date) => void;
}

const dias = ["L", "M", "X", "J", "V", "S", "D"];

const MiniCalendario = ({ fecha, onChange }: MiniCalendarioProps) => {
  const year = fecha.getFullYear();
  const month = fecha.getMonth();

  const inicioMes = new Date(year, month, 1);
  const finMes = new Date(year, month + 1, 0);
  const offset = (inicioMes.getDay() + 6) % 7;

  const diasMes: (number | null)[] = [];
  for (let i = 0; i < offset; i++) diasMes.push(null);
  for (let d = 1; d <= finMes.getDate(); d++) diasMes.push(d);

  const cambiarMes = (delta: number) => {
    const nueva = new Date(fecha);
    nueva.setMonth(nueva.getMonth() + delta);
    onChange(nueva);
  };

  return (
    <div className="mini-cal">
      {/* HEADER CON FLECHAS */}
      <div className="mini-cal-header">
        <button onClick={() => cambiarMes(-1)}><ChevronLeft size={14} /></button>

        <span>
          {fecha.toLocaleDateString("es-PE", {
            month: "long",
            year: "numeric",
          })}
        </span>

        <button onClick={() => cambiarMes(1)}><ChevronRight size={14} /></button>
      </div>

      {/* GRID */}
      <div className="mini-cal-grid">
        {dias.map((d) => (
          <div key={d} className="mini-cal-dia-header">
            {d}
          </div>
        ))}

        {diasMes.map((d, i) =>
          d ? (
            <div
              key={`day-${d}`}
              className={`mini-cal-dia ${
                d === fecha.getDate() ? "activo" : ""
              }`}
              role="button"
              tabIndex={0}
              onClick={() => onChange(new Date(year, month, d))}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onChange(new Date(year, month, d));
                }
              }}
            >
              {d}
            </div>
          ) : (
            <div key={`pad-${dias[i]}`} />
          )
        )}
      </div>
    </div>
  );
};

export default MiniCalendario;
