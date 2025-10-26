import { useEffect, useState } from "react";
import {
  DoctorApiService,
  type DoctorTransformado,
} from "../services/doctor.service";
import "./ListaMedicos.css";

const ListaMedicos = () => {
  // ✅ Cambiado de Doctor[] → DoctorTransformado[]
  const [doctores, setDoctores] = useState<DoctorTransformado[]>([]);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    cargarDoctores();
  }, []);

  const cargarDoctores = async () => {
    try {
      const data = await DoctorApiService.listar();
      setDoctores(data); // ✅ Ahora coincide el tipo
    } catch (error) {
      console.error("❌ Error al cargar doctores:", error);
    }
  };

  const filtrados = doctores.filter((d) =>
    `${d.nombres} ${d.apellidos} ${d.correo}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  return (
    <div className="lista-medicos">
      <h1>👨‍⚕️ Lista de Médicos</h1>

      <div className="buscador-container">
        <input
          type="text"
          placeholder="Buscar médico por nombre o correo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="input-busqueda"
        />
      </div>

      <div className="card">
        <table className="tabla-medicos">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th>Especialidad</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length > 0 ? (
              filtrados.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    {doc.nombres} {doc.apellidos}
                  </td>
                  <td>{doc.correo}</td>
                  <td>{doc.telefono}</td>
                  <td>{doc.especialidad}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4}>No se encontraron médicos</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ListaMedicos;
