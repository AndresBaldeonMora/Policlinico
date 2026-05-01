import { lazy, Suspense } from "react";
import type { EspecialidadData } from "../types";
import { getEspecialidadLoader } from "./especialidades";

interface Props {
  especialidadNombre: string;
  data: EspecialidadData;
  setData: (d: EspecialidadData) => void;
  onPrev: () => void;
}

export default function SectionE({ especialidadNombre, data, setData, onPrev }: Props) {
  const loader = getEspecialidadLoader(especialidadNombre);

  if (!loader) {
    return (
      <div className="soap-content-inner">
        <p style={{ color: "var(--text-muted)", fontSize: 14, textAlign: "center", marginTop: 40 }}>
          No hay formulario especializado disponible para <strong>{especialidadNombre || "esta especialidad"}</strong>.
        </p>
        <div className="soap-nav-row" style={{ justifyContent: "flex-start", marginTop: 16 }}>
          <button className="soap-btn-secondary" onClick={onPrev}>← Volver al Plan</button>
        </div>
      </div>
    );
  }

  const Component = lazy(loader);

  return (
    <Suspense fallback={
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "var(--text-muted)", fontSize: 14 }}>
        Cargando formulario…
      </div>
    }>
      <Component data={data} setData={setData} onPrev={onPrev} />
    </Suspense>
  );
}
