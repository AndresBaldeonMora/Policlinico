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
import CalendarioMedico from "./pages/Calendario/CalendarioMedico";
import MedicoCitas from "./pages/MedicoCitas/MedicoCitas";

// Páginas del paciente
import PacienteDashboard from "./pages/PacienteDashboard/PacienteDashboard";
import HistorialCitasPaciente from "./pages/PacienteDashboard/HistorialCitasPaciente";
// Páginas del administrador
import AdminDashboard      from "./pages/AdminDash/AdminDashboard";
import GestionEspecialidades from "./pages/AdminDash/GestionEspecialidades";
import GestionDoctores       from "./pages/AdminDash/GestionDoctores";

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
                <ProtectedRoute roles={["RECEPCIONISTA", "administrador"]}>
                  <Historial />
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
                  <CalendarioMedico />
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
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Header />
        <main style={{ flex: 1, overflow: "auto" }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default App;
