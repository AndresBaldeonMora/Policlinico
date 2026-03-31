// src/utils/fecha.utils.ts

export const horaAMinutos = (hora: string): number => {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + (m ?? 0);
};

export const esHoy = (fechaISO: string): boolean => {
  const hoy = new Date();
  const [y, m, d] = fechaISO.split("-").map(Number);
  return (
    hoy.getFullYear() === y &&
    hoy.getMonth() + 1 === m &&
    hoy.getDate() === d
  );
};