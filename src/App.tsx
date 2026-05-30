import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Header from "./components/Layout/Header";
import Sidebar from "./components/Layout/Sidebar";

import ReservaCita from "./pages/ReservaCita/ReservaCita";
import ListaCitas from "./pages/ListaCitas/ListaCitas";
import ListaMedicos from "./pages/ListaMedicos/ListaMedicos";
import ListaPacientes from "./pages/ListaPacientes/ListaPacientes";
import Calendario from "./pages/Calendario/Calendario";
import PerfilCita from "./pages/PerfilCita/PerfilCita";
import Login from "./pages/Login/Login";
import LaboratorioImagen from "./pages/Laboratorio/Laboratorio";
import ImprimirOrden from "./pages/Laboratorio/ImprimirOrden";
import MedicoDashboard from "./pages/MedicoDashboard/MedicoDashboard";
import MedicoCitas from "./pages/MedicoCitas/MedicoCitas";
import NotaSOAP from "./pages/NotaSOAP/NotaSOAP";
import HistoriaClinicaMedico from "./pages/HistoriaClinicaMedico/HistoriaClinicaMedico";
import InterconsultaDetalle from "./pages/InterconsultaDetalle/InterconsultaDetalle";

// Páginas del paciente
import PacienteDashboard from "./pages/PacienteDashboard/PacienteDashboard";
import HistorialCitasPaciente from "./pages/PacienteDashboard/HistorialCitasPaciente";
import DetalleCitaPaciente from "./pages/PacienteDashboard/DetalleCitaPaciente";
import PacienteOrdenes from "./pages/PacienteOrdenes/PacienteOrdenes";
import MiCuentaPerfil from "./pages/PacienteDashboard/MiCuenta/MiCuentaPerfil";

// Páginas del administrador
import AdminDashboard from "./pages/AdminDash/AdminDashboard";
import GestionEspecialidades from "./pages/AdminDash/GestionEspecialidades";
import GestionDoctores from "./pages/AdminDash/GestionDoctores";
import GestionUsuarios from "./pages/AdminDash/GestionUsuarios";
import VisorAuditoria from "./pages/AdminDash/VisorAuditoria";
import GestionMedicamentos from "./pages/AdminDash/GestionMedicamentos";

import { AuthProvider } from "./context/AuthProvider";
import { ThemeProvider } from "./context/ThemeContext";
import { ProtectedRoute } from "./routes/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
        <Routes>
          {/* ================== PUBLIC ================== */}
          <Route path="/login" element={<Login />} />

          {/* ================== PROTECTED ================== */}
          <Route element={<ProtectedLayout />}>
            <Route
              path="/"
              element={
                <ProtectedRoute roles={["RECEPCIONISTA"]}>
                  <Calendario />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reserva-cita"
              element={
                <ProtectedRoute roles={["RECEPCIONISTA"]}>
                  <ReservaCita />
                </ProtectedRoute>
              }
            />

            <Route
              path="/lista-citas"
              element={
                <ProtectedRoute roles={["RECEPCIONISTA"]}>
                  <ListaCitas />
                </ProtectedRoute>
              }
            />

            <Route
              path="/calendario"
              element={
                <ProtectedRoute roles={["RECEPCIONISTA"]}>
                  <Calendario />
                </ProtectedRoute>
              }
            />

            {/* RUTA PERFIL DE CITA */}
            <Route
              path="/citas/:citaId"
              element={
                <ProtectedRoute roles={["RECEPCIONISTA", "MEDICO"]}>
                  <PerfilCita />
                </ProtectedRoute>
              }
            />

            <Route
              path="/medicos"
              element={
                <ProtectedRoute roles={["RECEPCIONISTA"]}>
                  <ListaMedicos />
                </ProtectedRoute>
              }
            />

            <Route
              path="/pacientes"
              element={
                <ProtectedRoute roles={["RECEPCIONISTA", "MEDICO"]}>
                  <ListaPacientes />
                </ProtectedRoute>
              }
            />

            <Route
              path="/pacientes/:id"
              element={
                <ProtectedRoute roles={["RECEPCIONISTA", "MEDICO", "administrador"]}>
                  <HistoriaClinicaMedico />
                </ProtectedRoute>
              }
            />

            <Route
              path="/laboratorio-imagen"
              element={
                <ProtectedRoute roles={["RECEPCIONISTA"]}>
                  <LaboratorioImagen />
                </ProtectedRoute>
              }
            />

            <Route
              path="/ordenes/:id/imprimir"
              element={
                <ProtectedRoute roles={["RECEPCIONISTA", "MEDICO"]}>
                  <ImprimirOrden />
                </ProtectedRoute>
              }
            />

            <Route
              path="/medico"
              element={
                <ProtectedRoute roles={["MEDICO"]}>
                  <MedicoDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/medico/citas"
              element={
                <ProtectedRoute roles={["MEDICO"]}>
                  <MedicoCitas />
                </ProtectedRoute>
              }
            />

            <Route
              path="/medico/citas/:citaId/consulta"
              element={
                <ProtectedRoute roles={["MEDICO"]}>
                  <NotaSOAP />
                </ProtectedRoute>
              }
            />

            <Route
              path="/medico/interconsultas/:id"
              element={
                <ProtectedRoute roles={["MEDICO"]}>
                  <InterconsultaDetalle />
                </ProtectedRoute>
              }
            />

            <Route
              path="/paciente"
              element={
                <ProtectedRoute roles={["paciente"]}>
                  <PacienteDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/paciente/historial"
              element={
                <ProtectedRoute roles={["paciente"]}>
                  <HistorialCitasPaciente />
                </ProtectedRoute>
              }
            />

            <Route
              path="/paciente/citas"
              element={
                <ProtectedRoute roles={["paciente"]}>
                  <HistorialCitasPaciente />
                </ProtectedRoute>
              }
            />

            <Route
              path="/paciente/citas/:citaId"
              element={
                <ProtectedRoute roles={["paciente"]}>
                  <DetalleCitaPaciente />
                </ProtectedRoute>
              }
            />

            <Route
              path="/paciente/reservar"
              element={
                <ProtectedRoute roles={["paciente"]}>
                  <ReservaCita />
                </ProtectedRoute>
              }
            />

            <Route
              path="/paciente/ordenes"
              element={
                <ProtectedRoute roles={["paciente"]}>
                  <PacienteOrdenes />
                </ProtectedRoute>
              }
            />

            <Route
              path="/paciente/perfil"
              element={
                <ProtectedRoute roles={["paciente"]}>
                  <MiCuentaPerfil pacienteId="" />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={["administrador"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            /> 

            <Route
              path="/admin/doctores"
              element={
                <ProtectedRoute roles={["administrador"]}>
                  <GestionDoctores />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/pacientes"
              element={
                <ProtectedRoute roles={["administrador"]}>
                  <ListaPacientes puedeEliminar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/especialidades"
              element={
                <ProtectedRoute roles={["administrador"]}>
                  <GestionEspecialidades />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/usuarios"
              element={
                <ProtectedRoute roles={["administrador"]}>
                  <GestionUsuarios />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/medicamentos"
              element={
                <ProtectedRoute roles={["administrador"]}>
                  <GestionMedicamentos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/auditoria"
              element={
                <ProtectedRoute roles={["administrador"]}>
                  <VisorAuditoria />
                </ProtectedRoute>
              }
            />

          </Route>
        </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

function ProtectedLayout() {
  return (
    <div className="app">
      <Sidebar />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <Header />
        <main style={{ flex: 1, overflow: "auto" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default App;
