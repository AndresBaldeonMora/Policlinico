import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './pages/Dashboard';
import ReservaCita from './pages/ReservaCita';
import ListaCitas from './pages/ListaCitas';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Header />
          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/reserva-cita" element={<ReservaCita />} />
              <Route path="/lista-citas" element={<ListaCitas />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;