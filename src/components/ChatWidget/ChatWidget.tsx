import { useEffect, useRef, useState } from "react";
import { MessageSquare, Send, X, Minimize2 } from "lucide-react";
import { ChatService, type MensajeChat } from "../../services/chat.service";
import { AuthService } from "../../services/auth.service";
import { getSocket } from "../../hooks/useSocket";
import { useAuth } from "../../hooks/userAuth";
import "./ChatWidget.css";

const formatHora = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });

export default function ChatWidget() {
  const { user } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const [minimizado, setMinimizado] = useState(false);
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(false);
  const [noLeidos, setNoLeidos] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const token = AuthService.getToken();

  const rol = (user as any)?.rol ?? "";
  const userId = (user as any)?.id ?? "";
  const pacienteId = (user as any)?.pacienteId ?? userId;

  const sala =
    rol === "RECEPCIONISTA"
      ? `staff-${userId}`
      : null;

  const tipo: "ADMIN_STAFF" | "ADMIN_PACIENTE" =
    rol === "RECEPCIONISTA" ? "ADMIN_STAFF" : "ADMIN_PACIENTE";

  // Cargar no leídos iniciales desde el servidor
  useEffect(() => {
    if (!sala) return;
    ChatService.noLeidos(sala).then(setNoLeidos).catch(() => {});
  }, [sala]);

  // Cargar historial al abrir
  useEffect(() => {
    if (!abierto || !sala) return;
    setCargando(true);
    ChatService.historial(sala)
      .then(msgs => { setMensajes(msgs); setCargando(false); })
      .catch(() => setCargando(false));
  }, [abierto, sala]);

  // Socket: unirse y escuchar mensajes nuevos
  useEffect(() => {
    if (!token || !sala) return;
    const socket = getSocket(token);
    socket.emit("join_room", sala);

    const onMsg = (msg: MensajeChat) => {
      if (msg.sala !== sala) return;
      if (abierto && !minimizado) {
        setMensajes(prev => [...prev, msg]);
        socket.emit("mark_read", sala);
      } else {
        setNoLeidos(prev => prev + 1);
      }
    };
    socket.on("new_message", onMsg);
    return () => { socket.off("new_message", onMsg); };
  }, [token, sala, abierto, minimizado]);

  // Marcar leídos y resetear badge al abrir
  useEffect(() => {
    if (abierto && !minimizado && token && sala) {
      getSocket(token).emit("mark_read", sala);
      setNoLeidos(0);
    }
  }, [abierto, minimizado, token, sala]);

  // Scroll automático
  useEffect(() => {
    if (abierto && !minimizado) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [mensajes, abierto, minimizado]);

  // Solo visible para Recepcionista y Paciente
  if (!sala) return null;

  const enviar = () => {
    const t = texto.trim();
    if (!t || !token) return;
    getSocket(token).emit("send_message", { sala, texto: t, tipo });
    setTexto("");
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); }
  };

  return (
    <div className="cw-root">
      {/* Panel de chat */}
      {abierto && (
        <div className={`cw-panel ${minimizado ? "cw-panel--mini" : ""}`}>
          <div
            className="cw-panel-header"
            onClick={minimizado ? () => setMinimizado(false) : undefined}
            style={minimizado ? { cursor: "pointer" } : undefined}
          >
            <div className="cw-panel-avatar">S</div>
            <div className="cw-panel-info">
              <div className="cw-panel-nombre">Soporte técnico</div>
              {!minimizado && <div className="cw-panel-sub">Policlínico San José</div>}
            </div>
            <div className="cw-panel-actions">
              {!minimizado && (
                <button className="cw-icon-btn" onClick={() => setMinimizado(true)} title="Minimizar">
                  <Minimize2 size={15} />
                </button>
              )}
              <button className="cw-icon-btn" onClick={() => setAbierto(false)} title="Cerrar">
                <X size={15} />
              </button>
            </div>
          </div>

          {!minimizado && (
            <>
              <div className="cw-mensajes">
                {cargando ? (
                  <div className="cw-loading"><div className="cw-spinner" /></div>
                ) : mensajes.length === 0 ? (
                  <div className="cw-empty">
                    <MessageSquare size={28} />
                    <p>¿Tienes alguna consulta? ¡Escríbenos!</p>
                  </div>
                ) : (
                  mensajes.map(m => {
                    const esMio = m.autorId === userId;
                    return (
                      <div key={m._id} className={`cw-burbuja-wrap ${esMio ? "cw-burbuja-wrap--mio" : ""}`}>
                        {!esMio && <div className="cw-burbuja-autor">{m.autorNombre}</div>}
                        <div className={`cw-burbuja ${esMio ? "cw-burbuja--mio" : "cw-burbuja--otro"}`}>
                          {m.texto}
                          <span className="cw-hora">{formatHora(m.creadoEn)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              <div className="cw-input-row">
                <textarea
                  className="cw-input"
                  placeholder="Escribe un mensaje…"
                  value={texto}
                  onChange={e => setTexto(e.target.value)}
                  onKeyDown={handleKey}
                  rows={1}
                />
                <button className="cw-send" onClick={enviar} disabled={!texto.trim()}>
                  <Send size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Botón flotante */}
      {!abierto && (
        <button className="cw-fab" onClick={() => { setAbierto(true); setMinimizado(false); }} title="Chat con administración">
          <MessageSquare size={22} />
          {noLeidos > 0 && (
            <span className="cw-fab-badge">{noLeidos > 99 ? "99+" : noLeidos}</span>
          )}
        </button>
      )}
    </div>
  );
}
