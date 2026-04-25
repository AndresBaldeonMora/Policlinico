import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { CardModuloProps } from "./types";
import "./CardModulo.css";

const CardModulo = ({ titulo, descripcion, icono, ruta, color, badge }: CardModuloProps) => {
  const navigate = useNavigate();

  const handleClick = useCallback(() => {
    navigate(ruta);
  }, [navigate, ruta]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        navigate(ruta);
      }
    },
    [navigate, ruta],
  );

  const className = color
    ? "card-modulo card-modulo--stripe"
    : "card-modulo";

  const stripeStyle = color
    ? { borderTopColor: color } as const
    : undefined;

  return (
    <div
      className={className}
      style={stripeStyle}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Ir a ${titulo}`}
    >
      {badge !== undefined && badge > 0 && (
        <span className="card-modulo__badge" aria-label={`${badge} pendientes`}>
          {badge}
        </span>
      )}
      <div className="card-modulo__icon">{icono}</div>
      <p className="card-modulo__titulo">{titulo}</p>
      <p className="card-modulo__descripcion">{descripcion}</p>
    </div>
  );
};

export { CardModulo };
export default CardModulo;
