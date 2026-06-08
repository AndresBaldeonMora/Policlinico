import { useState, useEffect } from "react";
import { PacienteApiService } from "../services/paciente.service";
import type { OrdenExamen } from "../services/examen.service";
import type { CitaResumen, OrdenResumen } from "../components/types";

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
const ORDENES_VACIO: OrdenExamen[] = [];

const mapCitaRawToResumen = (cita: any): CitaResumen => {
  const doctor = (cita.doctorId && typeof cita.doctorId === "object") ? cita.doctorId : {};
  const esp    = doctor.especialidadId;
  return {
    _id:    String(cita._id ?? cita.id ?? ""),
    fecha:  cita.fecha,
    hora:   cita.hora ?? "—",
    tipo:   cita.tipo ?? "CONSULTA",
    estado: cita.estado,
    doctor: {
      nombres:    doctor.nombres ?? "",
      apellidos:  doctor.apellidos ?? "",
      especialidad: typeof esp === "object" ? esp?.nombre : undefined,
    },
  };
};

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
      const [resCitas, resOrdenesPend, resOrdenesProc] = await Promise.all([
        PacienteApiService.obtenerMisCitas().catch(() => ({ data: [] })),
        PacienteApiService.obtenerMisOrdenes({ estado: "PENDIENTE" }).catch(() => ({ data: [] })),
        PacienteApiService.obtenerMisOrdenes({ estado: "EN_PROCESO" }).catch(() => ({ data: [] })),
      ]);

      if (cancelled) return;

      const citas: any[]  = resCitas?.data ?? [];
      const ordenesPend: OrdenExamen[] = resOrdenesPend?.data ?? ORDENES_VACIO;
      const ordenesEnProceso: OrdenExamen[] = resOrdenesProc?.data ?? ORDENES_VACIO;

      // ── Citas: filtrar PENDIENTE y futuras, ordenar por fecha ──
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const citasPendientes = citas.filter((c: any) => c.estado === "PENDIENTE");
      const citasFuturas = citasPendientes
        .filter((c: any) => new Date(c.fecha) >= hoy)
        .sort((a: any, b: any) => {
          const diff = new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
          if (diff !== 0) return diff;
          return (a.hora ?? "").localeCompare(b.hora ?? "");
        });

      const proximaCita =
        citasFuturas.length > 0 ? mapCitaRawToResumen(citasFuturas[0]) : null;

      // ── Órdenes: combinar PENDIENTE + EN_PROCESO ──
      const todasOrdenes = [...ordenesPend, ...ordenesEnProceso];
      const tiempoOrden = (o: OrdenExamen): number => {
        const t = new Date(o.createdAt ?? o.fecha ?? "").getTime();
        return Number.isNaN(t) ? 0 : t;
      };
      const ordenesSorted = [...todasOrdenes].sort(
        (a, b) => tiempoOrden(b) - tiempoOrden(a)
      );

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
