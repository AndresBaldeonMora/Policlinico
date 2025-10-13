import { useState } from 'react';
import './ReservaCita.css';

const ReservaCita = () => {
  const [formData, setFormData] = useState({
    paciente: '',
    doctor: '',
    fecha: '',
    hora: '',
    motivo: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Datos de cita:', formData);
    alert('Cita registrada (simulación)');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="reserva-cita">
      <h1>Nueva Reserva de Cita</h1>
      
      <div className="card">
        <form onSubmit={handleSubmit} className="cita-form">
          <div className="form-group">
            <label htmlFor="paciente">Nombre del Paciente</label>
            <input
              type="text"
              id="paciente"
              name="paciente"
              value={formData.paciente}
              onChange={handleChange}
              required
              placeholder="Ingrese nombre completo"
            />
          </div>

          <div className="form-group">
            <label htmlFor="doctor">Doctor</label>
            <select
              id="doctor"
              name="doctor"
              value={formData.doctor}
              onChange={handleChange}
              required
            >
              <option value="">Seleccione un doctor</option>
              <option value="dr-lopez">Dr. López - Medicina General</option>
              <option value="dra-martinez">Dra. Martínez - Pediatría</option>
              <option value="dr-garcia">Dr. García - Cardiología</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fecha">Fecha</label>
              <input
                type="date"
                id="fecha"
                name="fecha"
                value={formData.fecha}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="hora">Hora</label>
              <input
                type="time"
                id="hora"
                name="hora"
                value={formData.hora}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="motivo">Motivo de Consulta</label>
            <textarea
              id="motivo"
              name="motivo"
              value={formData.motivo}
              onChange={handleChange}
              rows={4}
              placeholder="Describa brevemente el motivo de la consulta"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Registrar Cita
            </button>
            <button type="button" className="btn btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReservaCita;