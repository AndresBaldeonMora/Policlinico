import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Calendar,
  CalendarPlus,
  ClipboardList,
  Stethoscope,
  Users,
  User,
  FileText,
  X,
  CornerDownLeft,
} from "lucide-react";
import { fmtEstado } from "../../utils/fecha.utils";
import { PacienteApiService } from "../../services/paciente.service";
import { CitaApiService } from "../../services/cita.service";
import { DoctorApiService } from "../../services/doctor.service";
import type { PacienteTransformado } from "../../services/paciente.service";
import type { CitaProcesada } from "../../services/cita.service";
import type { DoctorTransformado } from "../../services/doctor.service";
import "./SearchPalette.css";

interface SearchResult {
  id: string;
  type: "seccion" | "paciente" | "cita" | "doctor";
  title: string;
  subtitle: string;
  path: string;
  icon: typeof Search;
}

const SECCIONES: SearchResult[] = [
  { id: "sec-cal", type: "seccion", title: "Calendario", subtitle: "Vista principal de citas", path: "/", icon: Calendar },
  { id: "sec-res", type: "seccion", title: "Solicitar Cita", subtitle: "Agendar nueva cita", path: "/reserva-cita", icon: CalendarPlus },
  { id: "sec-lis", type: "seccion", title: "Gestion de Citas", subtitle: "Administrar citas existentes", path: "/lista-citas", icon: ClipboardList },
  { id: "sec-med", type: "seccion", title: "Medicos", subtitle: "Directorio de doctores", path: "/medicos", icon: Stethoscope },
  { id: "sec-pac", type: "seccion", title: "Pacientes", subtitle: "Listado de pacientes", path: "/pacientes", icon: Users },
];

const SearchPalette = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [cache, setCache] = useState<{
    pacientes: PacienteTransformado[];
    citas: CitaProcesada[];
    doctores: DoctorTransformado[];
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Load data once when opened
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setResults(SECCIONES);
    setSelectedIdx(0);
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 50);

    if (!cache) {
      setLoading(true);
      Promise.all([
        PacienteApiService.listar().catch(() => []),
        CitaApiService.listar().catch(() => []),
        DoctorApiService.listar().catch(() => []),
      ]).then(([pacientes, citas, doctores]) => {
        setCache({ pacientes, citas, doctores });
        setLoading(false);
      });
    }

    return () => clearTimeout(focusTimer);
  }, [open]);

  const search = useCallback(
    (q: string) => {
      const term = q.toLowerCase().trim();
      if (!term) {
        setResults(SECCIONES);
        setSelectedIdx(0);
        return;
      }

      const matched: SearchResult[] = [];

      // Sections
      SECCIONES.forEach((s) => {
        if (s.title.toLowerCase().includes(term) || s.subtitle.toLowerCase().includes(term)) {
          matched.push(s);
        }
      });

      if (cache) {
        // Patients
        cache.pacientes.forEach((p) => {
          const fullName = `${p.nombres} ${p.apellidos}`.toLowerCase();
          if (fullName.includes(term) || p.dni.includes(term) || p.telefono?.includes(term)) {
            matched.push({
              id: `pac-${p.id}`,
              type: "paciente",
              title: `${p.nombres} ${p.apellidos}`,
              subtitle: `DNI: ${p.dni} | Tel: ${p.telefono || "N/A"}`,
              path: `/pacientes?highlight=${p.id}`,
              icon: User,
            });
          }
        });

        // Doctors
        cache.doctores.forEach((d) => {
          const fullName = `${d.nombres} ${d.apellidos}`.toLowerCase();
          if (fullName.includes(term) || d.especialidad.toLowerCase().includes(term) || d.cmp?.includes(term)) {
            matched.push({
              id: `doc-${d.id}`,
              type: "doctor",
              title: `Dr. ${d.nombres} ${d.apellidos}`,
              subtitle: `${d.especialidad} | CMP: ${d.cmp || "N/A"}`,
              path: `/medicos?highlight=${d.id}`,
              icon: Stethoscope,
            });
          }
        });

        // Appointments
        cache.citas.forEach((c) => {
          const searchStr = `${c.paciente} ${c.doctor} ${c.dni} ${c.especialidad} ${c.fecha}`.toLowerCase();
          if (searchStr.includes(term)) {
            matched.push({
              id: `cita-${c._id}`,
              type: "cita",
              title: `Cita: ${c.paciente}`,
              subtitle: `${c.doctor} | ${c.fecha} ${c.hora} | ${fmtEstado(c.estado)}`,
              path: `/lista-citas?highlight=${c._id}`,
              icon: FileText,
            });
          }
        });
      }

      setResults(matched.slice(0, 12));
      setSelectedIdx(0);
    },
    [cache]
  );

  useEffect(() => {
    search(query);
  }, [query, search]);

  const handleSelect = (result: SearchResult) => {
    navigate(result.path);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIdx]) {
      e.preventDefault();
      handleSelect(results[selectedIdx]);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!open) return null;

  const grouped = {
    seccion: results.filter((r) => r.type === "seccion"),
    paciente: results.filter((r) => r.type === "paciente"),
    doctor: results.filter((r) => r.type === "doctor"),
    cita: results.filter((r) => r.type === "cita"),
  };

  const groupLabels: Record<string, string> = {
    seccion: "Secciones",
    paciente: "Pacientes",
    doctor: "Doctores",
    cita: "Citas",
  };

  let globalIdx = -1;

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-palette" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className="search-palette-header">
          <Search size={20} className="search-palette-icon" />
          <input
            ref={inputRef}
            type="text"
            className="search-palette-input"
            placeholder="Buscar pacientes, doctores, citas, secciones..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          <button className="search-palette-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="search-palette-body">
          {loading && <p className="search-palette-empty">Cargando datos…</p>}

          {!loading && results.length === 0 && (
            <p className="search-palette-empty">No se encontraron resultados para "{query}"</p>
          )}

          {!loading &&
            (["seccion", "paciente", "doctor", "cita"] as const).map((type) => {
              const items = grouped[type];
              if (items.length === 0) return null;
              return (
                <div key={type} className="search-palette-group">
                  <p className="search-palette-group-label">{groupLabels[type]}</p>
                  {items.map((item) => {
                    globalIdx++;
                    const idx = globalIdx;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        className={`search-palette-item${idx === selectedIdx ? " search-palette-item--active" : ""}`}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setSelectedIdx(idx)}
                      >
                        <div className={`search-palette-item-icon search-palette-item-icon--${type}`}>
                          <Icon size={16} />
                        </div>
                        <div className="search-palette-item-text">
                          <span className="search-palette-item-title">{item.title}</span>
                          <span className="search-palette-item-sub">{item.subtitle}</span>
                        </div>
                        {idx === selectedIdx && (
                          <span className="search-palette-enter">
                            <CornerDownLeft size={12} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
        </div>

        <div className="search-palette-footer">
          <span className="search-shortcut">ESC</span> cerrar
          <span className="search-shortcut-sep" />
          <span className="search-shortcut">&#8593;&#8595;</span> navegar
          <span className="search-shortcut-sep" />
          <span className="search-shortcut">ENTER</span> ir
        </div>
      </div>
    </div>
  );
};

export default SearchPalette;
