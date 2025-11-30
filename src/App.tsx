import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Header from "./components/Layout/Header";
import Sidebar from "./components/Layout/Sidebar";
import Dashboard from "./pages/Dashboard";
import ReservaCita from "./pages/ReservaCita/ReservaCita";
import ListaCitas from "./pages/ListaCitas";
import ListaMedicos from "./pages/ListaMedicos";
import ListaPacientes from "./pages/ListaPacientes";
import Login from "./pages/Login/Login";
import MedicoDashboard from "./pages/MedicoDashboard/MedicoDashboard";
import { AuthProvider } from "./context/AuthProvider"; // 👈 IMPORT CORRECTO
import { ProtectedRoute } from "./routes/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Login sin layout */}
          <Route path="/login" element={<Login />} />

          {/* Rutas protegidas con layout (Sidebar + Header) */}
          <Route element={<ProtectedLayout />}>
            {/* Panel Recepcionista */}
            <Route
              path="/"
              element={
                <ProtectedRoute roles={["RECEPCIONISTA"]}>
                  <Dashboard />
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
                <ProtectedRoute roles={["RECEPCIONISTA"]}>
                  <ListaPacientes />
                </ProtectedRoute>
              }
            />

            {/* Panel Médico */}
            <Route
              path="/medico"
              element={
                <ProtectedRoute roles={["MEDICO"]}>
                  <MedicoDashboard />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

/* ========= Layout general protegido ========= */
/* Envuelve solo las rutas autenticadas y usa <Outlet /> */
function ProtectedLayout() {
  return (
    <div className="app">
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Header />
        <main style={{ flex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default App;
