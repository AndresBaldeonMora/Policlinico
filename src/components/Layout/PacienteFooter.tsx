import { MapPin, Phone } from "lucide-react";
import "./PacienteFooter.css";

const PacienteFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="paciente-footer">
      <div className="paciente-footer__content">
        <p className="paciente-footer__brand">
          Policlínico Parroquial San José
        </p>
        <div className="paciente-footer__info">
          <p className="paciente-footer__detail">
            <MapPin size={13} />
            Av. Los Próceres 1234, Lima
          </p>
          <p className="paciente-footer__detail">
            <Phone size={13} />
            (01) 555-0123
          </p>
          <p className="paciente-footer__copy">
            © {currentYear} — Todos los derechos reservados
          </p>
        </div>
      </div>
    </footer>
  );
};

export default PacienteFooter;
