import { useAuth } from "../../hooks/userAuth";

const PacienteDashboard = () => {
  const { user } = useAuth();

  return (
    <div
      style={{
        padding: "2rem",
        textAlign: "center",
        color: "var(--text-primary)",
      }}
    >
      <h2
        style={{
          fontSize: "2rem",
          marginBottom: "1rem",
          color: "var(--accent)",
        }}
      >
        ¡Hola, {user?.nombres || "Paciente"}!
      </h2>
      <p style={{ fontSize: "1.1rem", color: "var(--text-muted)" }}>
        Bienvenido a tu portal. Utiliza el menú lateral para reservar tus citas
        médicas o consultar el resultado de tus órdenes de
        laboratorio/imagenología.
      </p>
    </div>
  );
};

export default PacienteDashboard;
