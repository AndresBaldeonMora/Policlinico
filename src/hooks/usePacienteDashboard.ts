import { useState, useEffect } from "react";
import { CitaApiService } from "../services/cita.service";
import type { CitaProcesada } from "../services/cita.service";
import { ExamenService } from "../services/examen.service";
import type { OrdenExamen } from "../services/examen.service";
import type { CitaResumen, OrdenResumen } from "../components/PacienteComponents/types";

/**
 * The backend sends `tipoOrden` on OrdenExamen but the frontend
 * interface omits it. This extended type adds it safely.
 */
type OrdenExamenRaw = OrdenExamen & {
  tipoOrden?: "LABORATORIO" | "IMAGEN" | "MIXTA";
};

export interface DashboardData {
  proximaCita: CitaResumen | null;
  citasPendientes: number;
  proximaOrden: OrdenResumen | null;
  ordenesPendientes: number;
  loading: boolean;
  error: string | null;
}

const INITIAL_STATE: DashboardData = {
  proximaCita: null,
  citasPendientes: 0,
  proximaOrden: null,
  ordenesPendientes: 0,
  loading: true,
  error: null,
};

/* ── Fallback arrays (stable references) ── */
const CITAS_VACIO: CitaProcesada[] = [];
const ORDENES_VACIO: OrdenExamen[] = [];

/* ── Mapping helpers (static, outside hook) ── */

/**
 * Maps CitaProcesada → CitaResumen.
 * CitaProcesada.doctor is already a full name string from the backend.
 */
const mapCitaToResumen = (cita: CitaProcesada): CitaResumen => ({
  _id: cita._id,
  fecha: cita.fecha,
  hora: cita.hora,
  tipo: cita.tipo ?? "CONSULTA",
  estado: cita.estado,
  doctor: {
    nombres: cita.doctor ?? "",
    apellidos: "",
    especialidad: cita.especialidad || undefined,
  },
});

/**
 * Maps OrdenExamen → OrdenResumen.
 * Applies type guards for codigoOrden (optional), especialidadId (object|string),
 * and tipoOrden (not declared in frontend interface but sent by backend).
 */
const mapOrdenToResumen = (orden: OrdenExamen): OrdenResumen => {
  const raw = orden as OrdenExamenRaw;
  return {
    _id: orden._id,
    codigoOrden: orden.codigoOrden ?? "Sin código",
    tipoOrden: raw.tipoOrden ?? "LABORATORIO",
    estado: orden.estado,
    fechaCreacion: orden.createdAt ?? orden.fecha,
    especialidad:
      typeof orden.especialidadId === "object" && orden.especialidadId !== null
        ? orden.especialidadId.nombre
        : undefined,
    itemsCount: orden.items?.length ?? 0,
  };
};

/**
 * Custom hook that fetches and transforms all data for the patient dashboard.
 * Calls services in parallel via Promise.all. Each call has independent error
 * handling so one failure doesn't break the entire dashboard.
 */
export const usePacienteDashboard = (): DashboardData => {
  const [data, setData] = useState<DashboardData>(INITIAL_STATE);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      const [citas, ordenesPend, ordenesEnProceso] = await Promise.all([
        CitaApiService.listar().catch((): CitaProcesada[] => CITAS_VACIO),
        ExamenService.listarPorEstado("PENDIENTE").catch((): OrdenExamen[] => ORDENES_VACIO),
        ExamenService.listarPorEstado("EN_PROCESO").catch((): OrdenExamen[] => ORDENES_VACIO),
      ]);

      if (cancelled) return;

      // ── Citas: filter PENDIENTE, sort by date+hora, pick closest ──
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const citasPendientes = citas.filter((c) => c.estado === "PENDIENTE");
      const citasFuturas = citasPendientes
        .filter((c) => new Date(c.fecha) >= hoy)
        .sort((a, b) => {
          const diff = new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
          if (diff !== 0) return diff;
          return (a.hora ?? "").localeCompare(b.hora ?? "");
        });

      const proximaCita =
        citasFuturas.length > 0 ? mapCitaToResumen(citasFuturas[0]) : null;

      // ── Órdenes: combine PENDIENTE + EN_PROCESO, sort most recent first ──
      const todasOrdenes = [...ordenesPend, ...ordenesEnProceso];
      const ordenesSorted = [...todasOrdenes].sort((a, b) => {
        const dateA = new Date(a.createdAt ?? a.fecha).getTime();
        const dateB = new Date(b.createdAt ?? b.fecha).getTime();
        return dateB - dateA;
      });

      const proximaOrden =
        ordenesSorted.length > 0 ? mapOrdenToResumen(ordenesSorted[0]) : null;

      setData({
        proximaCita,
        citasPendientes: citasPendientes.length,
        proximaOrden,
        ordenesPendientes: todasOrdenes.length,
        loading: false,
        error: null,
      });
    };

    fetchData().catch((err) => {
      if (!cancelled) {
        setData((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : "Error al cargar datos",
        }));
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return data;
};
