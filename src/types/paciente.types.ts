export interface PacientePerfil {
  nombres: string;
  apellidos: string;
  dni: string;
  telefono: string;
  correo: string;
  fechaNacimiento: Date;
  sexo: "M" | "F";
  direccion: string;
  distrito: string;
  apoderadoNombre?: string;
  apoderadoParentesco?: string;
  apoderadoTelefono?: string;
  avatar?: string;
}
