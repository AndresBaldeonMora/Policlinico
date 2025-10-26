import { useEffect, useState } from "react";
import {
  PacienteApiService,
  type PacienteTransformado,
} from "../services/paciente.service";
import "./ListaPacientes.css";

const ListaPacientes = () => {
  const [pacientes, setPacientes] = useState<PacienteTransformado[]>([]);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    cargarPacientes();
  }, []);

  const cargarPacientes = async () => {
    try {
      const data = await PacienteApiService.listar();
      setPacientes(data);
    } catch (error) {
      console.error("❌ Error al cargar pacientes:", error);
    }
  };

  // 🔹 Calcular edad desde fecha de nacimiento
  const calcularEdad = (fechaNacimiento: string | undefined) => {
    if (!fechaNacimiento) return "—";
    const fechaNac = new Date(fechaNacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mes = hoy.getMonth() - fechaNac.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
      edad--;
    }
    return `${edad} años`;
  };

  const filtrados = pacientes.filter((p) =>
    `${p.nombres} ${p.apellidos} ${p.dni} ${p.correo}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  return (
    <div className="lista-pacientes">
      <h1>👥 Lista de Pacientes</h1>

      <div className="buscador-container">
        <input
          type="text"
          placeholder="Buscar paciente por nombre o DNI..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="input-busqueda"
        />
      </div>

      <div className="card">
        <table className="tabla-pacientes">
          <thead>
            <tr>
              <th>DNI</th>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Correo</th>
              <th>Edad</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length > 0 ? (
              filtrados.map((p) => (
                <tr key={p.id}>
                  <td>{p.dni}</td>
                  <td>
                    {p.nombres} {p.apellidos}
                  </td>
                  <td>{p.telefono || "—"}</td>
                  <td>{p.correo || "—"}</td>
                  <td>{calcularEdad(p.fechaNacimiento)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="sin-resultados">
                  No se encontraron pacientes
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ListaPacientes;
