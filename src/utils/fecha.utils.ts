// src/utils/fecha.utils.ts

export const horaAMinutos = (hora: string): number => {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + (m ?? 0);
};

// Date object (local) → "YYYY-MM-DD"
export const toISODateLocal = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// "YYYY-MM-DD" → "DD/MM/YYYY"
export const isoADMY = (iso: string): string => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

// () → "YYYY-MM-DD" (hoy en zona local)
export const hoyISO = (): string => toISODateLocal(new Date());

// Verifica si un string ISO corresponde a hoy (zona local)
export const esHoy = (fechaISO: string): boolean => {
  const [y, m, d] = fechaISO.split("-").map(Number);
  const hoy = new Date();
  return (
    hoy.getFullYear() === y &&
    hoy.getMonth() + 1 === m &&
    hoy.getDate() === d
  );
};

// Extrae la parte "YYYY-MM-DD" de un ISO string de backend ("YYYY-MM-DDT...")
export const fechaISO = (isoBackend: string): string => isoBackend.split("T")[0];

// Date → Date (lunes de esa semana, hora 00:00:00 local)
export const obtenerInicioSemana = (d: Date): Date => {
  const inicio = new Date(d);
  const offset = (inicio.getDay() + 6) % 7;
  inicio.setDate(inicio.getDate() - offset);
  inicio.setHours(0, 0, 0, 0);
  return inicio;
};

// "YYYY-MM-DDT..." del backend → "viernes, 19 de abril de 2026" (con timeZone UTC)
export const formatearFechaLarga = (isoBackend: string): string =>
  new Date(isoBackend).toLocaleDateString("es-PE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

// "YYYY-MM-DDT..." del backend → "19/04/2026" (con timeZone UTC)
export const formatearFechaDMY = (isoBackend: string): string =>
  new Date(isoBackend).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });

// "EN_PROCESO" → "En Proceso" (reemplaza _ y capitaliza cada palabra)
export const fmtEstado = (estado?: string): string =>
  (estado ?? "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
