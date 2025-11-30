import "./MedicoDashboard.css";
import { useAuth } from "../../hooks/userAuth";

const MedicoDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="medico-dashboard">
      <header className="medico-hero">
        <div>
          <h1 className="medico-title">
            Panel Médico
          </h1>
          <p className="medico-subtitle">
            {user
              ? `Bienvenido(a), Dr(a). ${user.nombres} ${user.apellidos}`
              : "Bienvenido(a) al módulo médico del centro."}
          </p>
        </div>
        <div className="medico-hero-icon">👨‍⚕️</div>
      </header>

      <section className="medico-section">
        <h2 className="medico-section-title">Accesos rápidos</h2>
        <div className="medico-grid">
          <div className="medico-card">
            <div className="medico-card-icon">📅</div>
            <h3>Citas del día</h3>
            <p>
              Visualiza tus citas programadas del día desde el módulo de gestión
              de citas del sistema.
            </p>
          </div>

          <div className="medico-card">
            <div className="medico-card-icon">👤</div>
            <h3>Pacientes atendidos</h3>
            <p>
              Consulta rápidamente la información básica de los pacientes
              asociados a tus atenciones.
            </p>
          </div>

          <div className="medico-card">
            <div className="medico-card-icon">📝</div>
            <h3>Notas clínicas</h3>
            <p>
              Espacio reservado para registrar y consultar notas médicas en
              futuras iteraciones del sistema.
            </p>
          </div>
        </div>
      </section>

      <section className="medico-section">
        <h2 className="medico-section-title">Información</h2>
        <div className="medico-info">
          <p>
            Este panel está diseñado para que el personal médico tenga acceso
            rápido y ordenado a la información necesaria para sus consultas.
          </p>
          <p>
            La gestión administrativa (reservas, reprogramaciones, creación de
            pacientes) se realiza desde el módulo de Recepción.
          </p>
        </div>
      </section>
    </div>
  );
};

export default MedicoDashboard;
