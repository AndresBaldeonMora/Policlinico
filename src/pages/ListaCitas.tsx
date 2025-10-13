import './ListaCitas.css';

const ListaCitas = () => {
  // Datos mock temporales
  const citas = [
    {
      id: 1,
      paciente: 'Juan Pérez',
      doctor: 'Dr. López',
      fecha: '2025-10-15',
      hora: '10:00',
      estado: 'Confirmada',
    },
    {
      id: 2,
      paciente: 'María González',
      doctor: 'Dra. Martínez',
      fecha: '2025-10-15',
      hora: '11:30',
      estado: 'Pendiente',
    },
    {
      id: 3,
      paciente: 'Carlos Ruiz',
      doctor: 'Dr. García',
      fecha: '2025-10-16',
      hora: '09:00',
      estado: 'Confirmada',
    },
  ];

  return (
    <div className="lista-citas">
      <h1>Lista de Citas Programadas</h1>

      <div className="card">
        <div className="table-container">
          <table className="citas-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Paciente</th>
                <th>Doctor</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {citas.map((cita) => (
                <tr key={cita.id}>
                  <td>{cita.id}</td>
                  <td>{cita.paciente}</td>
                  <td>{cita.doctor}</td>
                  <td>{cita.fecha}</td>
                  <td>{cita.hora}</td>
                  <td>
                    <span className={`badge ${cita.estado === 'Confirmada' ? 'badge-success' : 'badge-warning'}`}>
                      {cita.estado}
                    </span>
                  </td>
                  <td>
                    <button className="btn-icon" title="Ver">👁️</button>
                    <button className="btn-icon" title="Editar">✏️</button>
                    <button className="btn-icon" title="Cancelar">❌</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ListaCitas;