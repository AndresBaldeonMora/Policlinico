import { useEffect, useRef, useState, useCallback } from "react";
import { MessageSquare, Send, Users, Ticket } from "lucide-react";
import { ChatService, type MensajeChat, type ConversacionStaff } from "../../services/chat.service";
import { AuthService } from "../../services/auth.service";
import { getSocket } from "../../hooks/useSocket";
import { useAuth } from "../../hooks/userAuth";
import TicketsPage from "../Tickets/Tickets";
import "./Chat.css";

type TabAdmin = "staff" | "tickets";

const formatHora = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });

const formatFechaSep = (iso: string) =>
  new Date(iso).toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" });

// ─── Sub-componente: ventana de mensajes ──────────────────────────────────────
function VentanaChat({ sala, tipo, nombreContacto, userId }: {
  sala: string; tipo: "ADMIN_STAFF" | "ADMIN_PACIENTE" | "STAFF_ADMIN" | "PACIENTE_ADMIN";
  nombreContacto: string; userId: string;
}) {
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [texto, setTexto]       = useState("");
  const [cargando, setCargando] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const token = AuthService.getToken();

  const scrollBottom = () => bottomRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    if (!sala) return;
    setCargando(true);
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
      if (msg.sala === sala) {
        setMensajes(prev => [...prev, msg]);
      }
    };
    socket.on("new_message", onMsg);
    return () => { socket.off("new_message", onMsg); };
  }, [sala, token]);

  useEffect(() => { scrollBottom(); }, [mensajes]);

  const enviar = () => {
    const t = texto.trim();
    if (!t || !token) return;
    const socketTipo = sala.startsWith("staff-") ? "ADMIN_STAFF" : "ADMIN_PACIENTE";
    getSocket(token).emit("send_message", { sala, texto: t, tipo: socketTipo });
    setTexto("");
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); }
  };

  // Agrupar mensajes por fecha para separadores
  const grupos: { fecha: string; msgs: MensajeChat[] }[] = [];
  mensajes.forEach(m => {
    const f = new Date(m.creadoEn).toDateString();
    const ultimo = grupos[grupos.length - 1];
    if (!ultimo || ultimo.fecha !== f) grupos.push({ fecha: f, msgs: [m] });
    else ultimo.msgs.push(m);
  });

  return (
    <div className="chat-ventana">
      <div className="chat-ventana-header">
        <div className="chat-ventana-avatar">{nombreContacto.charAt(0).toUpperCase()}</div>
        <div>
          <div className="chat-ventana-nombre">{nombreContacto}</div>
          <div className="chat-ventana-sub">{sala.startsWith("staff-") ? "Recepcionista" : "Paciente"}</div>
        </div>
      </div>

      <div className="chat-mensajes">
        {cargando ? (
          <div className="chat-loading"><div className="chat-spinner" /></div>
        ) : mensajes.length === 0 ? (
          <div className="chat-empty">
            <MessageSquare size={32} />
            <p>Sin mensajes aún. ¡Inicia la conversación!</p>
          </div>
        ) : (
          grupos.map(({ fecha, msgs }) => (
            <div key={fecha}>
              <div className="chat-fecha-sep"><span>{formatFechaSep(msgs[0].creadoEn)}</span></div>
              {msgs.map(m => {
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
              })}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-row">
        <textarea
          className="chat-input"
          placeholder="Escribe un mensaje… (Enter para enviar)"
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
  );
}

// ─── Página principal de Chat (admin) ────────────────────────────────────────
export default function ChatAdmin() {
  const { user } = useAuth();
  const [tab, setTab]             = useState<TabAdmin>("staff");
  const [convStaff, setConvStaff] = useState<ConversacionStaff[]>([]);
  const [salaActiva, setSalaActiva] = useState<string | null>(null);
  const [nombreActivo, setNombreActivo] = useState("");
  const [cargando, setCargando]   = useState(true);

  const cargar = useCallback(async () => {
    try {
      const { staff } = await ChatService.conversaciones();
      setConvStaff(staff);
      // Seleccionar primera sala automáticamente
      if (!salaActiva) {
        const primera = staff[0];
        if (primera) { setSalaActiva(primera.sala); setNombreActivo(primera.nombre); }
      }
    } catch {
    } finally { setCargando(false); }
  }, [salaActiva]);

  useEffect(() => { cargar(); }, [cargar]);

  // Escuchar mensajes nuevos para actualizar badges
  useEffect(() => {
    const token = AuthService.getToken();
    if (!token) return;
    const socket = getSocket(token);
    socket.on("new_message", () => cargar());
    return () => { socket.off("new_message"); };
  }, [cargar]);

  const seleccionar = (sala: string, nombre: string) => {
    setSalaActiva(sala);
    setNombreActivo(nombre);
  };

  const listaActual = convStaff;
  const userId = (user as any)?.id ?? "";

  return (
    <div className="chat-page">
      {/* ── Panel izquierdo ── */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <MessageSquare size={18} />
          <h2>Mensajes</h2>
        </div>

        <div className="chat-tabs">
          <button className={`chat-tab ${tab === "staff" ? "active" : ""}`} onClick={() => { setTab("staff"); const p = convStaff[0]; if (p) seleccionar(p.sala, p.nombre); }}>
            <Users size={15} /> Recepción
          </button>
          <button className={`chat-tab ${tab === "tickets" ? "active" : ""}`} onClick={() => setTab("tickets")}>
            <Ticket size={15} /> Tickets
          </button>
        </div>

        <div className="chat-conv-list" style={tab === "tickets" ? { display: "none" } : undefined}>
          {cargando ? (
            <div className="chat-loading"><div className="chat-spinner" /></div>
          ) : listaActual.length === 0 ? (
            <div className="chat-conv-empty">
              {tab === "staff"
                ? "No hay recepcionistas registrados."
                : "Aún no hay conversaciones con pacientes."}
            </div>
          ) : (
            listaActual.map(c => (
              <div
                key={c.sala}
                className={`chat-conv-item ${salaActiva === c.sala ? "active" : ""}`}
                onClick={() => seleccionar(c.sala, c.nombre)}
              >
                <div className="chat-conv-avatar">{c.nombre.charAt(0).toUpperCase()}</div>
                <div className="chat-conv-info">
                  <div className="chat-conv-nombre">{c.nombre}</div>
                  <div className="chat-conv-ultimo">
                    {c.ultimo ? c.ultimo.texto.slice(0, 40) + (c.ultimo.texto.length > 40 ? "…" : "") : "Sin mensajes"}
                  </div>
                </div>
                {c.noLeidos > 0 && (
                  <span className="chat-badge">{c.noLeidos > 99 ? "99+" : c.noLeidos}</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Panel derecho ── */}
      <div className="chat-main">
        {tab === "tickets" ? (
          <div style={{ padding: "1.5rem", overflowY: "auto", height: "100%" }}>
            <TicketsPage />
          </div>
        ) : salaActiva ? (
          <VentanaChat
            sala={salaActiva}
            tipo="ADMIN_STAFF"
            nombreContacto={nombreActivo}
            userId={userId}
          />
        ) : (
          <div className="chat-placeholder">
            <MessageSquare size={40} />
            <p>Selecciona una conversación para comenzar</p>
          </div>
        )}
      </div>
    </div>
  );
}
