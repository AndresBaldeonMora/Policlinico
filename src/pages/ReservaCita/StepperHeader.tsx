// src/pages/ReservaCita/StepperHeader.tsx
import { Check } from "lucide-react";

interface StepperHeaderProps {
  pasoActual: number;
  irAlPaso: (paso: number) => void;
  esPaciente?: boolean;
}

const StepperHeader = ({
  pasoActual,
  irAlPaso,
  esPaciente,
}: StepperHeaderProps) => {
  const getIconoPaso = (pasoLogico: number, pasoVisual: number): React.ReactNode =>
    pasoLogico < pasoActual ? <Check size={14} strokeWidth={3} /> : pasoVisual;

  const pasosRender = esPaciente
    ? ["Especialidad", "Medico", "Mes", "Dia", "Hora", "Confirmar"]
    : ["Especialidad", "Medico", "Mes", "Dia", "Hora", "Paciente", "Confirmar"];

  return (
    <div className="stepper-header">
      {pasosRender.map((titulo, index) => {
        const numeroPasoVisual = index + 1;
        const pasoLogico =
          esPaciente && numeroPasoVisual === 6 ? 7 : numeroPasoVisual;

        const esActivo = pasoLogico === pasoActual;
        const esCompletado = pasoLogico < pasoActual;

        const inner = (
          <div
            className={`stepper-item ${esActivo ? "activo" : ""} ${esCompletado ? "completado" : ""}`}
          >
            <div className="stepper-circulo">{getIconoPaso(pasoLogico, numeroPasoVisual)}</div>
            <div className="stepper-titulo">{titulo}</div>
          </div>
        );

        if (esCompletado) {
          return (
            <div
              key={pasoLogico}
              className="stepper-item-wrapper clickable"
              role="button"
              tabIndex={0}
              onClick={() => irAlPaso(pasoLogico)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  irAlPaso(pasoLogico);
                }
              }}
            >
              {inner}
            </div>
          );
        }

        return (
          <div key={pasoLogico} className="stepper-item-wrapper">
            {inner}
          </div>
        );
      })}
    </div>
  );
};

export default StepperHeader;
