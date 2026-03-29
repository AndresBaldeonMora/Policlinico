import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Upload,
  Eye,
  X,
  FileText,
  ExternalLink,
  Search,
  Stethoscope,
  Mail,
  Phone,
} from "lucide-react";
import "../ListaCitas/ListaCitas.css";
import {
  DoctorApiService,
  type DoctorTransformado as DoctorBase,
} from "../../services/doctor.service";
import { useAuth } from "../../hooks/userAuth";

const normalizeString = (str: string): string =>
  (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

interface NotificationState {
  message: string;
  type: "success" | "error" | "";
  visible: boolean;
}

type Doctor = DoctorBase & { cmp?: string; cvUrl?: string };

const ListaMedicos = () => {
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const highlightRef = useRef<HTMLTableRowElement>(null);
  const [doctores, setDoctores] = useState<Doctor[]>([]);
  const [busqueda, setBusqueda] = useState(searchParams.get("buscar") || "");
  const [cargando, setCargando] = useState(true);
  const [notification, setNotification] = useState<NotificationState>({
    message: "",
    type: "",
    visible: false,
  });
  const [doctorCV, setDoctorCV] = useState<Doctor | null>(null);
  const [cvLocalUrls, setCvLocalUrls] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);
  const { user } = useAuth();
  const esAdmin = user?.rol === "ADMIN";

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type, visible: true });
    setTimeout(
      () => setNotification((prev) => ({ ...prev, visible: false })),
      2500,
    );
  };

  const cargarDoctores = async () => {
    try {
      setCargando(true);
      setDoctores((await DoctorApiService.listar()) as Doctor[]);
    } catch {
      showNotification("Error al cargar la lista de medicos.", "error");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDoctores();
  }, []);

  useEffect(() => {
    if (highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [highlightId, doctores]);
  useEffect(() => {
    return () => {
      Object.values(cvLocalUrls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [cvLocalUrls]);

  const doctoresFiltrados = doctores.filter((d) => {
    const filtro = normalizeString(busqueda);
    return (
      normalizeString(`${d.nombres} ${d.apellidos}`).includes(filtro) ||
      normalizeString(d.especialidad ?? "").includes(filtro) ||
      normalizeString(d.cmp ?? "").includes(filtro)
    );
  });

  const getCvUrl = (doctor: Doctor): string | null =>
    cvLocalUrls[doctor.id] || doctor.cvUrl || null;

  const handleVerCV = (doctor: Doctor) => {
    if (!getCvUrl(doctor)) {
      showNotification("Este medico no tiene CV registrado.", "error");
      return;
    }
    setDoctorCV(doctor);
  };

  const handleUploadClick = (doctorId: string) => {
    setUploadTargetId(doctorId);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTargetId) return;
    if (file.type !== "application/pdf") {
      showNotification("Solo se permiten archivos PDF.", "error");
      e.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showNotification("El archivo no debe superar 10 MB.", "error");
      e.target.value = "";
      return;
    }
    if (cvLocalUrls[uploadTargetId])
      URL.revokeObjectURL(cvLocalUrls[uploadTargetId]);
    setCvLocalUrls((prev) => ({
      ...prev,
      [uploadTargetId]: URL.createObjectURL(file),
    }));
    showNotification("CV cargado correctamente.", "success");
    e.target.value = "";
    setUploadTargetId(null);
  };

  const cvUrlSeleccionado = doctorCV ? getCvUrl(doctorCV) : null;

  return (
    <div className="lista-page">
      {notification.visible && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <div className="lista-page-header">
        <div>
          <h1>Directorio Medico</h1>
          <p className="lista-page-subtitle">
            {doctores.length} medicos registrados
          </p>
        </div>
      </div>

      <div className="lista-search-bar">
        <Search size={18} className="lista-search-icon" />
        <input
          type="text"
          placeholder="Buscar por nombre, especialidad o CMP..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="lista-search-input"
        />
      </div>

      {cargando ? (
        <div className="lista-loading">
          <div className="lista-loading-spinner" />
          <p>Cargando medicos...</p>
        </div>
      ) : (
        <div className="lista-table-card">
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th style={{ width: 240 }}>Doctor</th>
                  <th style={{ width: 150 }}>Especialidad</th>
                  <th style={{ width: 100 }}>CMP</th>
                  <th style={{ width: 200 }}>Contacto</th>
                  <th style={{ width: 140 }}>CV</th>
                </tr>
              </thead>
              <tbody>
                {doctoresFiltrados.length > 0 ? (
                  doctoresFiltrados.map((d) => (
                    <tr
                      key={d.id}
                      ref={highlightId === d.id ? highlightRef : undefined}
                      className={highlightId === d.id ? "tr-highlight" : ""}
                    >
                      <td>
                        <div className="td-person">
                          <div className="td-avatar td-avatar--doc">
                            <Stethoscope size={14} />
                          </div>
                          <div className="td-person-info">
                            <span className="td-person-name">
                              Dr. {d.nombres} {d.apellidos}
                            </span>
                            {d.cmp && (
                              <span className="td-person-meta">
                                CMP: {d.cmp}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="td-specialty">
                          {d.especialidad || "-"}
                        </span>
                      </td>
                      <td>
                        <span className="td-mono">{d.cmp || "-"}</span>
                      </td>
                      <td>
                        <div className="td-contact-stack">
                          {d.correo && (
                            <span className="td-contact">
                              <Mail size={12} /> {d.correo}
                            </span>
                          )}
                          {d.telefono && (
                            <span className="td-contact">
                              <Phone size={12} /> {d.telefono}
                            </span>
                          )}
                          {!d.correo && !d.telefono && (
                            <span className="td-muted">-</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="td-cv-actions">
                          {getCvUrl(d) ? (
                            <>
                              <button
                                type="button"
                                className="btn-action"
                                onClick={() => handleVerCV(d)}
                                title="Ver CV"
                              >
                                <Eye size={15} />
                              </button>
                              {esAdmin && (
                                <button
                                  type="button"
                                  className="btn-action btn-action--upload"
                                  onClick={() => handleUploadClick(d.id)}
                                  title="Cambiar CV"
                                >
                                  <Upload size={15} />
                                </button>
                              )}
                            </>
                          ) : esAdmin ? (
                            <button
                              type="button"
                              className="btn-action btn-action--upload"
                              onClick={() => handleUploadClick(d.id)}
                              title="Subir CV"
                            >
                              <Upload size={15} />
                            </button>
                          ) : (
                            <span className="td-muted">Sin CV</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="td-empty">
                      <Stethoscope size={32} className="td-empty-icon" />
                      <p>No se encontraron medicos.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {doctorCV && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDoctorCV(null);
          }}
        >
          <div className="modal-card-cv">
            <div className="modal-cv-header">
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <FileText size={20} />
                <h3>
                  CV de {doctorCV.nombres} {doctorCV.apellidos}
                </h3>
              </div>
              <button
                type="button"
                className="modal-cv-close"
                onClick={() => setDoctorCV(null)}
              >
                <X size={16} />
              </button>
            </div>
            {cvUrlSeleccionado ? (
              <iframe
                src={cvUrlSeleccionado}
                title="CV Medico"
                className="modal-cv-iframe"
                style={{ minHeight: "500px" }}
              />
            ) : (
              <p className="sin-resultados">
                No se encontro un archivo de CV para este medico.
              </p>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDoctorCV(null)}
              >
                Cerrar
              </button>
              {esAdmin && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleUploadClick(doctorCV.id)}
                >
                  <Upload size={15} /> Cambiar CV
                </button>
              )}
              {cvUrlSeleccionado && (
                <a
                  href={cvUrlSeleccionado}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  <ExternalLink size={15} /> Abrir en nueva pestana
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListaMedicos;
