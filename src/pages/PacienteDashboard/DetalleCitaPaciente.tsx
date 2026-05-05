import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { CitaApiService } from "../../services/cita.service";
import DetalleCita from "./DetalleCita";
import type { DetalleCitaData } from "./DetalleCita";

const DetalleCitaPaciente = () => {
  const { citaId } = useParams<{ citaId: string }>();
  const navigate   = useNavigate();
  const [cita,    setCita]    = useState<DetalleCitaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!citaId) return;
    setLoading(true);
    CitaApiService.obtenerPorId(citaId)
      .then((raw) => {
        const doctor = raw.doctorId && typeof raw.doctorId === "object" ? raw.doctorId : null;
        const esp    = doctor?.especialidadId;
        setCita({
          _id:         raw._id,
          fecha:       raw.fecha,
          hora:        raw.hora,
          estado:      raw.estado,
          medico:      doctor ? `${doctor.nombres} ${doctor.apellidos}` : "—",
          especialidad: typeof esp === "object" && esp ? esp.nombre : "—",
        });
      })
      .catch(() => setError("No se pudo cargar el detalle de la cita."))
      .finally(() => setLoading(false));
  }, [citaId]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
        <Loader2 size={32} style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (error || !cita) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p style={{ color: "var(--error)" }}>{error || "Cita no encontrada."}</p>
        <button className="btn btn-secondary" style={{ marginTop: "1rem" }} onClick={() => navigate("/paciente/citas")}>
          <ArrowLeft size={16} /> Volver a mis citas
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem" }}>
      <button
        className="btn btn-secondary"
        style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
        onClick={() => navigate("/paciente/citas")}
      >
        <ArrowLeft size={16} /> Volver a mis citas
      </button>
      <DetalleCita cita={cita} onCerrar={() => navigate("/paciente/citas")} />
    </div>
  );
};

export default DetalleCitaPaciente;
