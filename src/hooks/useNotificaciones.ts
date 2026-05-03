import { useState, useEffect, useCallback } from "react";
import NotificacionService from "../services/notificacion.service";
import type { Notificacion } from "../types/notificacion.types";

interface UseNotificacionesReturn {
  notificaciones: Notificacion[];
  noLeidas: number;
  loading: boolean;
  error: string | null;
  marcarLeida: (id: string) => Promise<void>;
  marcarTodasLeidas: () => Promise<void>;
  eliminar: (id: string) => Promise<void>;
  refrescar: () => Promise<void>;
}

export function useNotificaciones(): UseNotificacionesReturn {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [noLeidas, setNoLeidas] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refrescar = useCallback(async () => {
    try {
      const data = await NotificacionService.listarNotificaciones("TODAS");
      setNotificaciones(data);
      const noLeidasCount = await NotificacionService.obtenerNoLeidas();
      setNoLeidas(noLeidasCount);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Error al cargar notificaciones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refrescar();
    const interval = setInterval(refrescar, 30000);
    return () => clearInterval(interval);
  }, [refrescar]);

  const marcarLeida = async (id: string) => {
    setNotificaciones(prev =>
      prev.map(n => (n.id === id ? { ...n, leida: true } : n))
    );
    setNoLeidas(prev => Math.max(0, prev - 1));
    try {
      await NotificacionService.marcarComoLeida(id);
    } catch (err) {
      refrescar(); // Revert on error
    }
  };

  const marcarTodasLeidas = async () => {
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
    setNoLeidas(0);
    try {
      await NotificacionService.marcarTodasLeidas();
    } catch (err) {
      refrescar(); // Revert on error
    }
  };

  const eliminar = async (id: string) => {
    setNotificaciones(prev => {
      const target = prev.find(n => n.id === id);
      if (target && !target.leida) {
        setNoLeidas(count => Math.max(0, count - 1));
      }
      return prev.filter(n => n.id !== id);
    });
    try {
      await NotificacionService.eliminar(id);
    } catch (err) {
      refrescar(); // Revert on error
    }
  };

  return {
    notificaciones,
    noLeidas,
    loading,
    error,
    marcarLeida,
    marcarTodasLeidas,
    eliminar,
    refrescar,
  };
}
