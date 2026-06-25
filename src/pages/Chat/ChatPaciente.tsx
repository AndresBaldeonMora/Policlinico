import { useEffect, useRef, useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { ChatService, type MensajeChat } from "../../services/chat.service";
import { AuthService } from "../../services/auth.service";
import { getSocket } from "../../hooks/useSocket";
import { useAuth } from "../../hooks/userAuth";
import "./Chat.css";

const formatHora = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });

export default function ChatPaciente() {
  const { user } = useAuth();
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [texto, setTexto]       = useState("");
  const [cargando, setCargando] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  // pacienteId viene en el JWT como `pacienteId` o en el user del context
  const pacienteId = (user as any)?.pacienteId ?? (user as any)?.id ?? "";
  const sala = `paciente-${pacienteId}`;
  const userId = (user as any)?.id ?? "";
  const token = AuthService.getToken();

  useEffect(() => {
    if (!sala) return;
    ChatService.historial(sala)
      .then(msgs => { setMensajes(msgs); setCargando(false); })
      .catch(() => setCargando(false));
  }, [sala]);

  useEffect(() => {
    if (!token || !sala) return;
    const socket = getSocket(token);
    socket.emit("join_room", sala);
    socket.emit("mark_read", sala);
    const onMsg = (msg: MensajeChat) => {
      if (msg.sala === sala) setMensajes(prev => [...prev, msg]);
    };
    socket.on("new_message", onMsg);
    return () => { socket.off("new_message", onMsg); };
  }, [sala, token]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [mensajes]);

  const enviar = () => {
    const t = texto.trim();
    if (!t || !token) return;
    getSocket(token).emit("send_message", { sala, texto: t, tipo: "ADMIN_PACIENTE" });
    setTexto("");
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); }
  };

  return (
    <div className="chat-page" style={{ height: "calc(100vh - 64px)" }}>
      <div className="chat-ventana" style={{ flex: 1 }}>
        <div className="chat-ventana-header">
          <div className="chat-ventana-avatar">A</div>
          <div>
            <div className="chat-ventana-nombre">Administración</div>
            <div className="chat-ventana-sub">Policlínico San José</div>
          </div>
        </div>

        <div className="chat-mensajes">
          {cargando ? (
            <div className="chat-loading"><div className="chat-spinner" /></div>
          ) : mensajes.length === 0 ? (
            <div className="chat-empty">
              <MessageSquare size={32} />
              <p>Puedes escribirnos cualquier consulta o duda. ¡Estamos para ayudarte!</p>
            </div>
          ) : (
            mensajes.map(m => {
              const esMio = m.autorId === userId;
              return (
                <div key={m._id} className={`chat-burbuja-wrap ${esMio ? "chat-burbuja-wrap--mio" : ""}`}>
                  {!esMio && <div className="chat-burbuja-autor">{m.autorNombre}</div>}
                  <div className={`chat-burbuja ${esMio ? "chat-burbuja--mio" : "chat-burbuja--otro"}`}>
                    {m.texto}
                    <span className="chat-hora">{formatHora(m.creadoEn)}</span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <div className="chat-input-row">
          <textarea
            className="chat-input"
            placeholder="Escribe tu mensaje… (Enter para enviar)"
            value={texto}
            onChange={e => setTexto(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
          />
          <button className="chat-send" onClick={enviar} disabled={!texto.trim()}>
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
