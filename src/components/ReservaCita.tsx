// src/components/ReservaCita.tsx

import React, { useState } from 'react';

const ReservaCita = () => {
  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [medico, setMedico] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`Cita reservada para ${nombre} el ${fecha} a las ${hora} con el Dr. ${medico}`);
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Reservar Cita</h2>
      <form onSubmit={handleSubmit} className="w-50 mx-auto">
        <div className="mb-3">
          <label htmlFor="nombre" className="form-label">Nombre:</label>
          <input
            type="text"
            id="nombre"
            className="form-control"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="fecha" className="form-label">Fecha:</label>
          <input
            type="date"
            id="fecha"
            className="form-control"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="hora" className="form-label">Hora:</label>
          <input
            type="time"
            id="hora"
            className="form-control"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="medico" className="form-label">Médico:</label>
          <select
            id="medico"
            className="form-select"
            value={medico}
            onChange={(e) => setMedico(e.target.value)}
          >
            <option value="">Seleccionar médico</option>
            <option value="Juan Perez">Dr. Juan Perez</option>
            <option value="Maria Lopez">Dra. Maria Lopez</option>
            <option value="Carlos Gomez">Dr. Carlos Gomez</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary w-100">Reservar</button>
      </form>
    </div>
  );
};

export default ReservaCita;
