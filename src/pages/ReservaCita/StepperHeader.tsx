// src/pages/ReservaCita/StepperHeader.tsx
import { Check } from "lucide-react";

const PASOS_LABELS = [
  "Especialidad","Medico","Mes","Dia","Hora","Paciente","Confirmar",
] as const;

interface StepperHeaderProps {
  pasoActual: number;
  irAlPaso: (paso: number) => void;
}

const StepperHeader = ({ pasoActual, irAlPaso }: StepperHeaderProps) => {
  const getIconoPaso = (paso: number): React.ReactNode =>
    paso < pasoActual ? <Check size={14} strokeWidth={3} /> : paso;

  return (
    <div className="stepper-header">
      {PASOS_LABELS.map((titulo, index) => {
        const numeroPaso = index + 1;
        const esActivo = numeroPaso === pasoActual;
        const esCompletado = numeroPaso < pasoActual;

        const inner = (
          <div className={`stepper-item ${esActivo ? "activo" : ""} ${esCompletado ? "completado" : ""}`}>
            <div className="stepper-circulo">{getIconoPaso(numeroPaso)}</div>
            <div className="stepper-titulo">{titulo}</div>
          </div>
        );

        if (esCompletado) {
          return (
            <div
              key={numeroPaso}
              className="stepper-item-wrapper clickable"
              role="button"
              tabIndex={0}
              onClick={() => irAlPaso(numeroPaso)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  irAlPaso(numeroPaso);
                }
              }}
            >
              {inner}
            </div>
          );
        }

        return (
          <div key={numeroPaso} className="stepper-item-wrapper">{inner}</div>
        );
      })}
    </div>
  );
};

export default StepperHeader;