import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ExamenService, type OrdenExamen, type ExamenLaboratorioImagen, TIPO_EXAMEN_LABEL } from "../../services/examen.service";
import "./ImprimirOrden.css";

const formatFechaLarga = (iso: string) =>
  new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit", month: "long", year: "numeric", timeZone: "UTC",
  });

const ImprimirOrden = () => {
  const { id } = useParams<{ id: string }>();
  const [orden, setOrden] = useState<OrdenExamen | null>(null);
  const [policlinico, setPoliclinico] = useState({ nombre: "", direccion: "", telefono: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    ExamenService.obtenerParaImprimir(id)
      .then((data) => {
        setOrden(data.orden);
        setPoliclinico(data.policlinico);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="imprimir-loading">Cargando orden…</div>;
  if (!orden) return <div className="imprimir-loading">Orden no encontrada</div>;

  const paciente = orden.pacienteId;
  const doctor = orden.doctorId as any;

  return (
    <div className="imprimir-page">
      <div className="imprimir-contenido">
        {/* Encabezado */}
        <div className="imprimir-header">
          <div>
            <h1 className="imprimir-titulo">{policlinico.nombre}</h1>
            <p className="imprimir-subtitulo">{policlinico.direccion}</p>
            {policlinico.telefono && <p className="imprimir-subtitulo">Tel: {policlinico.telefono}</p>}
          </div>
          <div className="imprimir-orden-info">
            <span className="imprimir-codigo">{orden.codigoOrden || "—"}</span>
            <span>Emisión: {formatFechaLarga(orden.fecha)}</span>
            {orden.fechaVencimiento && (
              <span>Vencimiento: {formatFechaLarga(orden.fechaVencimiento)}</span>
            )}
          </div>
        </div>

        <hr className="imprimir-divider" />

        {/* Datos del paciente */}
        <div className="imprimir-seccion">
          <h3>Datos del Paciente</h3>
          <div className="imprimir-grid">
            <div><strong>Nombre:</strong> {paciente.nombres} {paciente.apellidos}</div>
            <div><strong>DNI:</strong> {paciente.dni}</div>
            {paciente.fechaNacimiento && (
              <div><strong>Fecha Nac.:</strong> {formatFechaLarga(paciente.fechaNacimiento)}</div>
            )}
            {paciente.sexo && (
              <div><strong>Sexo:</strong> {paciente.sexo === "M" ? "Masculino" : "Femenino"}</div>
            )}
          </div>
        </div>

        {/* Datos del médico */}
        <div className="imprimir-seccion">
          <h3>Médico Solicitante</h3>
          <div className="imprimir-grid">
            <div><strong>Nombre:</strong> Dr. {doctor.nombres} {doctor.apellidos}</div>
            {doctor.cmp && <div><strong>CMP:</strong> {doctor.cmp}</div>}
            {doctor.especialidadId?.nombre && (
              <div><strong>Especialidad:</strong> {doctor.especialidadId.nombre}</div>
            )}
          </div>
        </div>

        {/* Diagnóstico presuntivo — NTS 139-MINSA */}
        {orden.diagnosticoPresuntivo && (
          <div className="imprimir-seccion">
            <h3>Diagnóstico Presuntivo</h3>
            <p>{orden.diagnosticoPresuntivo}</p>
          </div>
        )}

        {/* Tabla de exámenes */}
        <div className="imprimir-seccion">
          <h3>Exámenes Solicitados</h3>
          <table className="imprimir-tabla">
            <thead>
              <tr>
                <th>#</th>
                <th>Examen</th>
                <th>Tipo</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {orden.items.map((item, i) => {
                const ex = typeof item.examenId === "object" ? (item.examenId as ExamenLaboratorioImagen) : null;
                const itemKey = (item as { _id?: string })._id ?? ex?._id ?? `imp-${i}`;
                return (
                  <tr key={itemKey}>
                    <td>{i + 1}</td>
                    <td>{ex?.nombre ?? "—"}</td>
                    <td>{ex ? TIPO_EXAMEN_LABEL[ex.tipo] : "—"}</td>
                    <td>{item.observaciones || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Observaciones */}
        {orden.observacionesGenerales && (
          <div className="imprimir-seccion">
            <h3>Observaciones Generales</h3>
            <p>{orden.observacionesGenerales}</p>
          </div>
        )}

        {/* Pie de página */}
        <div className="imprimir-footer">
          <div className="imprimir-firma">
            <div className="imprimir-firma-linea" />
            <p>Firma y sello del médico</p>
          </div>
          <p className="imprimir-vigencia">
            Válido por 30 días desde la fecha de emisión
          </p>
        </div>
      </div>

      {/* Botón imprimir (solo en pantalla) */}
      <div className="imprimir-acciones no-print">
        <button className="lab-btn lab-btn--primary" onClick={() => window.print()}>
          Imprimir
        </button>
        <button className="lab-btn lab-btn--cancel" onClick={() => window.close()}>
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default ImprimirOrden;
