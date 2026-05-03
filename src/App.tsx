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
import Historial from "./pages/HistorialPaciente/Historial";
import ImprimirOrden from "./pages/Laboratorio/ImprimirOrden";
import MedicoDashboard from "./pages/MedicoDashboard/MedicoDashboard";
import MedicoCitas from "./pages/MedicoCitas/MedicoCitas";
import NotaSOAP from "./pages/NotaSOAP/NotaSOAP";
import MedicoListaPacientes from "./pages/MedicoListaPacientes/MedicoListaPacientes";
import HistoriaClinicaMedico from "./pages/HistoriaClinicaMedico/HistoriaClinicaMedico";

// Páginas del paciente
import PacienteDashboard from "./pages/PacienteDashboard/PacienteDashboard";
import HistorialCitasPaciente from "./pages/PacienteDashboard/HistorialCitasPaciente";
import PacienteOrdenes from "./pages/PacienteOrdenes/PacienteOrdenes";
import MiCuentaPerfil from "./pages/PacienteDashboard/MiCuenta/MiCuentaPerfil";

// Páginas del administrador
import AdminDashboard from "./pages/AdminDash/AdminDashboard";
import GestionEspecialidades from "./pages/AdminDash/GestionEspecialidades";
import GestionDoctores from "./pages/AdminDash/GestionDoctores";

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
              path="/medico/pacientes"
              element={
                <ProtectedRoute roles={["MEDICO"]}>
                  <MedicoListaPacientes />
                </ProtectedRoute>
              }
            />

            <Route
              path="/medico/pacientes/:pacienteId"
              element={
                <ProtectedRoute roles={["MEDICO"]}>
                  <HistoriaClinicaMedico />
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
