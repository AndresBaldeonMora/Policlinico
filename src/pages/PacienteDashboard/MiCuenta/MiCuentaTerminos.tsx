import { useState, useEffect } from "react";
import { Loader2, AlertCircle, FileText } from "lucide-react";
import "./MiCuenta.css";

/* ── Component ── */
const MiCuentaTerminos = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contenido, setContenido] = useState<string | null>(null);
  const [version, setVersion] = useState("1.0");
  const [fechaActualizacion, setFechaActualizacion] = useState("");

  /* Simular carga de términos */
  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const cargarTerminos = async () => {
      setLoading(true);
      setError(null);

      try {
        // Simular GET /api/paciente/terminos
        await new Promise<void>((resolve) => {
          timeoutId = setTimeout(() => resolve(), 1200);
        });

        if (cancelled) return;

        setContenido(`
1. ACEPTACIÓN DE TÉRMINOS

Al registrarse y utilizar los servicios del Policlínico, usted acepta estar sujeto a estos Términos y Condiciones de Uso. Si no está de acuerdo con alguno de los términos aquí establecidos, le solicitamos no utilizar nuestros servicios digitales.

2. DESCRIPCIÓN DEL SERVICIO

El portal del paciente permite gestionar citas médicas, consultar historial clínico, revisar resultados de exámenes de laboratorio e imagen, y comunicarse con el equipo médico. Estos servicios están diseñados para facilitar la atención médica y no sustituyen la consulta presencial.

3. PRIVACIDAD Y PROTECCIÓN DE DATOS

Sus datos personales y médicos son tratados conforme a la Ley N° 29733, Ley de Protección de Datos Personales del Perú. La información almacenada incluye datos de identificación, historial clínico, diagnósticos, tratamientos y resultados de exámenes. Esta información es confidencial y solo será accesible por personal autorizado.

4. RESPONSABILIDADES DEL USUARIO

El usuario se compromete a proporcionar información veraz y actualizada, mantener la confidencialidad de sus credenciales de acceso, notificar cualquier uso no autorizado de su cuenta, y no utilizar el sistema para fines distintos a los establecidos.

5. CITAS MÉDICAS

Las citas pueden ser reservadas, modificadas o canceladas a través del portal. La cancelación debe realizarse con al menos 24 horas de anticipación. La inasistencia reiterada sin justificación puede resultar en restricciones temporales del servicio.

6. RESULTADOS DE EXÁMENES

Los resultados de laboratorio e imagen estarán disponibles en el portal una vez procesados. Los tiempos de entrega varían según el tipo de examen. Los resultados no constituyen un diagnóstico definitivo y deben ser interpretados por su médico tratante.

7. LIMITACIÓN DE RESPONSABILIDAD

El Policlínico no se hace responsable por interrupciones del servicio debido a mantenimiento programado, fallas técnicas fuera de nuestro control, o uso indebido del sistema por parte del usuario.

8. MODIFICACIONES

Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios serán notificados a través del portal y entrarán en vigencia desde su publicación.

9. JURISDICCIÓN

Estos términos se rigen por las leyes de la República del Perú. Cualquier controversia será resuelta en los tribunales competentes de Lima.
        `.trim());
        setVersion("2.1");
        setFechaActualizacion(
          new Date().toLocaleDateString("es-PE", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
        );
      } catch {
        if (!cancelled) {
          setError("No se pudieron cargar los términos y condiciones. Intenta de nuevo más tarde.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    cargarTerminos();
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="micuenta-term">
        <div className="micuenta-term__loading">
          <Loader2 size={32} className="micuenta-term__spinner" />
          <p className="micuenta-term__loading-text">Cargando términos y condiciones…</p>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="micuenta-term">
        <div className="micuenta-term__error" role="alert">
          <AlertCircle size={24} />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  /* ── Content ── */
  return (
    <div className="micuenta-term">
      <div className="micuenta-term__header">
        <FileText size={20} className="micuenta-term__header-icon" />
        <h2 className="micuenta-term__title">Términos y Condiciones</h2>
      </div>

      <div className="micuenta-term__scroll" tabIndex={0} aria-label="Contenido de términos y condiciones">
        <div className="micuenta-term__content">
          {contenido?.split("\n\n").map((parrafo, i) => {
            // Detectar títulos de sección (ej: "1. ACEPTACIÓN...")
            const esTitulo = /^\d+\.\s+[A-ZÁÉÍÓÚÑ\s]+$/.test(parrafo.trim());
            const parrafoKey = `parrafo-${i}-${parrafo.slice(0, 20)}`;
            return esTitulo ? (
              <h3 key={parrafoKey} className="micuenta-term__section-title">{parrafo}</h3>
            ) : (
              <p key={parrafoKey} className="micuenta-term__paragraph">{parrafo}</p>
            );
          })}
        </div>
      </div>

      <div className="micuenta-term__footer">
        <span className="micuenta-term__version">Versión {version}</span>
        <span className="micuenta-term__date">Última actualización: {fechaActualizacion}</span>
      </div>
    </div>
  );
};

export { MiCuentaTerminos };
export default MiCuentaTerminos;
