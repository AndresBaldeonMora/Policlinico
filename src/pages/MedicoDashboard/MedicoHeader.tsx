import type { MedicoPerfil } from "../../services/medico.service";

interface Props {
  perfil: MedicoPerfil;
}

const MedicoHeader = ({ perfil }: Props) => (
  <div className="medico-header">
    <div className="medico-header-content">
      <div className="medico-header-left">
        <div className="medico-avatar">👨‍⚕️</div>
        <div className="medico-info">
          <h1>Dr. {perfil.nombres} {perfil.apellidos}</h1>
          <p className="especialidad">{perfil.especialidadId.nombre}</p>
          {perfil.cmp && <p className="cmp">CMP: {perfil.cmp}</p>}
        </div>
      </div>
      <div className="medico-header-right">
        <p className="label">Correo</p>
        <p className="value">{perfil.correo}</p>
      </div>
    </div>
  </div>
);

export default MedicoHeader;