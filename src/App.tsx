import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Header from "./components/Layout/Header";
import Sidebar from "./components/Layout/Sidebar";
import ReservaCita from "./pages/ReservaCita/ReservaCita";
import ListaCitas from "./pages/ListaCitas/ListaCitas";
import ListaMedicos from "./pages/ListaMedicos/ListaMedicos";
import ListaPacientes from "./pages/ListaPacientes/ListaPacientes";
import Login from "./pages/Login/Login";
import MedicoDashboard from "./pages/MedicoDashboard/MedicoDashboard";
import { AuthProvider } from "./context/AuthProvider";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import Calendario from "./pages/Calendario/Calendario";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

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
