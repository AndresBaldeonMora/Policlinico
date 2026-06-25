import React, { useState, useCallback } from "react";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { ReclamacionApiService, type RegistrarReclamacionPayload } from "../../../services/reclamacion.service";
import "./MiCuenta.css";
import "./Reclamaciones.css";

type TipoDoc = "DNI" | "CE" | "PASAPORTE" | "RUC";

const AREAS = [
  "Admisión y Recepción",
  "Consulta Externa",
  "Emergencias",
  "Laboratorio",
  "Imagenología",
  "Farmacia",
  "Facturación y Caja",
  "Administración",
  "Enfermería",
  "Otro",
];

const SERVICIOS: Record<string, string[]> = {
  "Admisión y Recepción": ["Registro de pacientes", "Citas médicas", "Orientación al usuario"],
  "Consulta Externa": ["Medicina General", "Pediatría", "Ginecología", "Cardiología", "Neurología", "Traumatología", "Dermatología", "Oftalmología", "Otorrinolaringología", "Urología"],
  "Emergencias": ["Atención de urgencias", "Triaje", "Sala de observación"],
  "Laboratorio": ["Análisis clínicos", "Toma de muestras", "Entrega de resultados"],
  "Imagenología": ["Radiografías", "Ecografías", "Tomografías", "Resonancias"],
  "Farmacia": ["Dispensación de medicamentos", "Información farmacéutica"],
  "Facturación y Caja": ["Cobros", "Facturas", "Seguros"],
  "Administración": ["Recursos Humanos", "Gestión de quejas", "Información general"],
  "Enfermería": ["Procedimientos de enfermería", "Vacunación", "Curaciones"],
  "Otro": ["Otro servicio"],
};

const ESTABLECIMIENTO = "Policlínico San José";
const DIRECCION = "Av. Principal s/n, Lima, Perú";

interface IdentificacionFields {
  tipoDoc: TipoDoc;
  nroDoc: string;
  nombre: string;
  email: string;
  domicilio: string;
  telefono: string;
}

const emptyIdentificacion = (): IdentificacionFields => ({
  tipoDoc: "DNI", nroDoc: "", nombre: "", email: "", domicilio: "", telefono: "",
});

const MiCuentaReclamaciones = () => {
  const [usuario, setUsuario] = useState<IdentificacionFields>(emptyIdentificacion());
  const [tercero, setTercero] = useState<IdentificacionFields>(emptyIdentificacion());
  const [presentadoPorTercero, setPresentadoPorTercero] = useState(false);
  const tipo: "QUEJA" | "RECLAMO" = "RECLAMO";
  const [area, setArea] = useState("");
  const [servicio, setServicio] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [autorizaNotificacion, setAutorizaNotificacion] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);

  const ahora = new Date();
  const fechaStr = ahora.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
  const horaStr  = ahora.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });


  const handleUsuario = (field: keyof IdentificacionFields, val: string) =>
    setUsuario(prev => ({ ...prev, [field]: val }));

  const handleTercero = (field: keyof IdentificacionFields, val: string) =>
    setTercero(prev => ({ ...prev, [field]: val }));

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!area || descripcion.trim().length < 10 || cargando) return;

    setCargando(true);
    setMensaje(null);

    const payload: RegistrarReclamacionPayload = {
      tipo,
      descripcion: descripcion.trim(),
      tipoDocIdentificado:   usuario.tipoDoc,
      nroDocIdentificado:    usuario.nroDoc,
      nombreIdentificado:    usuario.nombre,
      emailIdentificado:     usuario.email,
      domicilioIdentificado: usuario.domicilio,
      telefonoIdentificado:  usuario.telefono,
      presentadoPorTercero,
      tercero: presentadoPorTercero ? {
        tipoDoc:  tercero.tipoDoc,
        nroDoc:   tercero.nroDoc,
        nombre:   tercero.nombre,
        email:    tercero.email || undefined,
        domicilio:tercero.domicilio || undefined,
        telefono: tercero.telefono || undefined,
      } : undefined,
      area,
      servicio: servicio || undefined,
      autorizaNotificacion,
    };

    try {
      const res = await ReclamacionApiService.registrar(payload);
      setMensaje({
        tipo: "exito",
        texto: `Su ${tipo === "QUEJA" ? "queja" : "reclamo"} ha sido registrado con el código ${res.codigo}. Se le enviará confirmación al correo consignado.`,
      });
      setDescripcion("");
      setArea("");
      setServicio("");
    } catch (err: any) {
      setMensaje({
        tipo: "error",
        texto: err?.message || "Ocurrió un error al registrar. Intente de nuevo.",
      });
    } finally {
      setCargando(false);
    }
  }, [tipo, descripcion, area, servicio, usuario, tercero, presentadoPorTercero, autorizaNotificacion, cargando]);

  return (
    <div className="recl-root">
      {/* ── Cabecera ────────────────────────────────── */}
      <div className="recl-header-grid">
        <div className="recl-header-info">
          <div className="recl-field-row">
            <div className="recl-field-block">
              <span className="recl-label">ESTABLECIMIENTO DE SALUD</span>
              <span className="recl-value">{ESTABLECIMIENTO}</span>
            </div>
          </div>
          <div className="recl-field-row">
            <div className="recl-field-block">
              <span className="recl-label">DIRECCIÓN</span>
              <span className="recl-value recl-value--muted">{DIRECCION}</span>
            </div>
          </div>
          <div className="recl-field-row recl-field-row--2col">
            <div className="recl-field-block">
              <span className="recl-label">FECHA</span>
              <span className="recl-value recl-value--muted">{fechaStr}</span>
            </div>
            <div className="recl-field-block">
              <span className="recl-label">HORA</span>
              <span className="recl-value recl-value--muted">{horaStr}</span>
            </div>
          </div>
        </div>
        <div className="recl-header-title">
          <p className="recl-header-title__text">HOJA DE RECLAMACIÓN EN SALUD</p>
        </div>
      </div>

      {/* ── Mensaje de estado ────────────────────────── */}
      {mensaje && (
        <div className={`recl-alert recl-alert--${mensaje.tipo}`} role="alert">
          {mensaje.tipo === "exito"
            ? <CheckCircle size={18} />
            : <AlertCircle size={18} />}
          <span>{mensaje.texto}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* ── Sección 1 ─────────────────────────────── */}
        <div className="recl-section-bar">
          <span className="recl-section-num">1.</span>
          IDENTIFICACIÓN DEL USUARIO O TERCERO LEGITIMADO
        </div>
        <div className="recl-section-body">
          <div className="recl-row recl-row--split">
            <div className="recl-field-block">
              <span className="recl-label">DOCUMENTO DE IDENTIDAD *</span>
              <div className="recl-radio-group">
                {(["DNI", "CE", "PASAPORTE", "RUC"] as TipoDoc[]).map(td => (
                  <label key={td} className="recl-radio-label">
                    <input type="radio" name="tipoDoc1" value={td}
                      checked={usuario.tipoDoc === td}
                      onChange={() => handleUsuario("tipoDoc", td)} />
                    {td}
                  </label>
                ))}
              </div>
            </div>
            <div className="recl-field-block">
              <label className="recl-label" htmlFor="nroDoc1">N° DOCUMENTO *</label>
              <input id="nroDoc1" className="recl-input" value={usuario.nroDoc}
                onChange={e => handleUsuario("nroDoc", e.target.value)}
                placeholder="Número de documento" />
            </div>
          </div>

          <div className="recl-row recl-row--split">
            <div className="recl-field-block">
              <label className="recl-label" htmlFor="nombre1">NOMBRE O RAZÓN SOCIAL *</label>
              <input id="nombre1" className="recl-input" value={usuario.nombre}
                onChange={e => handleUsuario("nombre", e.target.value)}
                placeholder="Nombre completo" />
            </div>
            <div className="recl-field-block">
              <label className="recl-label" htmlFor="email1">E-MAIL</label>
              <input id="email1" type="email" className="recl-input" value={usuario.email}
                onChange={e => handleUsuario("email", e.target.value)}
                placeholder="correo@ejemplo.com" />
            </div>
          </div>

          <div className="recl-row recl-row--split">
            <div className="recl-field-block">
              <label className="recl-label" htmlFor="dom1">DOMICILIO *</label>
              <input id="dom1" className="recl-input" value={usuario.domicilio}
                onChange={e => handleUsuario("domicilio", e.target.value)}
                placeholder="Dirección completa" />
            </div>
            <div className="recl-field-block">
              <label className="recl-label" htmlFor="tel1">TELÉFONO *</label>
              <input id="tel1" className="recl-input" value={usuario.telefono}
                onChange={e => handleUsuario("telefono", e.target.value)}
                placeholder="Número de contacto" />
            </div>
          </div>
        </div>

        {/* ── Sección 2 ─────────────────────────────── */}
        <div className="recl-section-bar">
          <span className="recl-section-num">2.</span>
          IDENTIFICACIÓN DE QUIEN PRESENTA EL RECLAMO
          <span className="recl-section-note">(En caso de ser el usuario afectado no es necesario su llenado)</span>
        </div>
        <div className="recl-section-body">
          <label className="recl-checkbox-label">
            <input type="checkbox" checked={presentadoPorTercero}
              onChange={e => setPresentadoPorTercero(e.target.checked)} />
            El reclamo es presentado por un tercero distinto al usuario afectado
          </label>

          {presentadoPorTercero && (
            <>
              <div className="recl-row recl-row--split" style={{ marginTop: "1rem" }}>
                <div className="recl-field-block">
                  <span className="recl-label">DOCUMENTO DE IDENTIDAD *</span>
                  <div className="recl-radio-group">
                    {(["DNI", "CE", "PASAPORTE", "RUC"] as TipoDoc[]).map(td => (
                      <label key={td} className="recl-radio-label">
                        <input type="radio" name="tipoDoc2" value={td}
                          checked={tercero.tipoDoc === td}
                          onChange={() => handleTercero("tipoDoc", td)} />
                        {td}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="recl-field-block">
                  <label className="recl-label" htmlFor="nroDoc2">N° DOCUMENTO *</label>
                  <input id="nroDoc2" className="recl-input" value={tercero.nroDoc}
                    onChange={e => handleTercero("nroDoc", e.target.value)}
                    placeholder="Número de documento" />
                </div>
              </div>

              <div className="recl-row recl-row--split">
                <div className="recl-field-block">
                  <label className="recl-label" htmlFor="nombre2">NOMBRE O RAZÓN SOCIAL *</label>
                  <input id="nombre2" className="recl-input" value={tercero.nombre}
                    onChange={e => handleTercero("nombre", e.target.value)}
                    placeholder="Nombre completo" />
                </div>
                <div className="recl-field-block">
                  <label className="recl-label" htmlFor="email2">E-MAIL</label>
                  <input id="email2" type="email" className="recl-input" value={tercero.email}
                    onChange={e => handleTercero("email", e.target.value)}
                    placeholder="correo@ejemplo.com" />
                </div>
              </div>

              <div className="recl-row recl-row--split">
                <div className="recl-field-block">
                  <label className="recl-label" htmlFor="dom2">DOMICILIO *</label>
                  <input id="dom2" className="recl-input" value={tercero.domicilio}
                    onChange={e => handleTercero("domicilio", e.target.value)}
                    placeholder="Dirección completa" />
                </div>
                <div className="recl-field-block">
                  <label className="recl-label" htmlFor="tel2">TELÉFONO *</label>
                  <input id="tel2" className="recl-input" value={tercero.telefono}
                    onChange={e => handleTercero("telefono", e.target.value)}
                    placeholder="Número de contacto" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Sección 3 ─────────────────────────────── */}
        <div className="recl-section-bar">
          <span className="recl-section-num">3.</span>
          DETALLE DEL RECLAMO
        </div>
        <div className="recl-section-body">
          <div className="recl-row recl-row--split">
            <div className="recl-field-block">
              <label className="recl-label" htmlFor="area">ÁREA *</label>
              <select id="area" className="recl-select" value={area}
                onChange={e => { setArea(e.target.value); setServicio(""); }}>
                <option value="">SELECCIONE</option>
                {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="recl-field-block">
              <label className="recl-label" htmlFor="servicio">SERVICIO</label>
              <select id="servicio" className="recl-select" value={servicio}
                onChange={e => setServicio(e.target.value)} disabled={!area}>
                <option value="">SELECCIONE</option>
                {(SERVICIOS[area] ?? []).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="recl-field-block">
            <label className="recl-label" htmlFor="descripcion">
              DESCRIPCIÓN DE LOS HECHOS * <span className="recl-label-hint">(Máximo 900 caracteres)</span>
            </label>
            <textarea id="descripcion" className="recl-textarea"
              rows={5} maxLength={900}
              placeholder="Describa de forma detallada, clara y verídica los hechos ocurridos…"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)} />
            <div className="recl-char-count">
              <span>{descripcion.trim().length < 10 && descripcion.length > 0
                ? "Mínimo 10 caracteres"
                : ""}</span>
              <span>{descripcion.length} / 900</span>
            </div>
          </div>
        </div>

        {/* ── Sección 4 ─────────────────────────────── */}
        <div className="recl-section-4">
          <span className="recl-section-4__label">
            4. AUTORIZO NOTIFICACIÓN DEL RESULTADO DEL RECLAMO AL E-MAIL CONSIGNADO
          </span>
          <div className="recl-radio-group recl-radio-group--inline">
            <label className="recl-radio-label">
              <input type="radio" name="autoriza" checked={autorizaNotificacion}
                onChange={() => setAutorizaNotificacion(true)} />
              SÍ
            </label>
            <label className="recl-radio-label">
              <input type="radio" name="autoriza" checked={!autorizaNotificacion}
                onChange={() => setAutorizaNotificacion(false)} />
              NO
            </label>
          </div>
        </div>

        {/* ── Submit ────────────────────────────────── */}
        <div className="recl-submit-area">
          <button type="submit" className="recl-submit-btn"
            disabled={!area || descripcion.trim().length < 10 || cargando}>
            {cargando
              ? <><Loader2 size={16} className="recl-spinner-icon" /> Registrando…</>
              : "INGRESAR RECLAMO"}
          </button>
        </div>

        {/* ── Nota legal ───────────────────────────── */}
        <p className="recl-legal">
          Las IAFAS, IPRESS o UGIPRESS deben atender el reclamo en plazo de 30 días hábiles.
          "Estimado usuario: Usted puede presentar su queja ante SUSALUD cuando no le hayan brindado un servicio,
          prestación o cobertura solicitada, o recibida de las IAFAS o IPRESS, o que dependan de las UGIPRESS
          públicas, privadas o mixtas. También ante la negativa de atención de su reclamo, irregularidad en su
          tramitación o disconformidad con el resultado del mismo."
        </p>
      </form>
    </div>
  );
};

export { MiCuentaReclamaciones };
export default MiCuentaReclamaciones;
