import { useEffect, useState } from "react";
import { CitaApiService } from "../../services/cita.service";
import { DoctorApiService } from "../../services/doctor.service";
import type { CitaTransformada } from "../../services/cita.service";
import type { DoctorTransformado } from "../../services/doctor.service";
import MiniCalendario from "./MiniCalendario";
import "./Calendario.css";

type Vista = "dia" | "semana" | "mes";

const diasSemana = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

/* 08:00 – 17:00 cada 15 min */
const HORAS_LABORALES = Array.from({ length: 36 }, (_, i) => {
  const total = 8 * 60 + i * 15;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
});

const Calendario = () => {
  const [vista, setVista] = useState<Vista>("mes");
  const [fecha, setFecha] = useState<Date>(new Date());
  const [citas, setCitas] = useState<CitaTransformada[]>([]);
  const [doctores, setDoctores] = useState<DoctorTransformado[]>([]);
  const [doctorId, setDoctorId] = useState<string>("ALL");

  /* ======================= CARGA ======================= */
  useEffect(() => {
    DoctorApiService.listar().then(setDoctores);
  }, []);

  useEffect(() => {
    cargarCitas();
  }, [fecha, vista, doctorId]);

  const cargarCitas = async () => {
    const fechaStr = fecha.toISOString().split("T")[0];
    const data = await CitaApiService.obtenerCalendario(fechaStr, vista);
    setCitas(
      doctorId === "ALL"
        ? data
        : data.filter((c) => c.doctorId._id === doctorId)
    );
  };

  /* ======================= FECHAS ======================= */
  const cambiarFecha = (delta: number) => {
    const f = new Date(fecha);
    if (vista === "mes") f.setMonth(f.getMonth() + delta);
    if (vista === "semana") f.setDate(f.getDate() + delta * 7);
    if (vista === "dia") f.setDate(f.getDate() + delta);
    setFecha(f);
  };

  const inicioSemana = (d: Date) => {
    const i = new Date(d);
    const day = (i.getDay() + 6) % 7;
    i.setDate(i.getDate() - day);
    return i;
  };

  const tituloCalendario = () => {
    if (vista === "mes") {
      return fecha.toLocaleDateString("es-PE", {
        month: "long",
        year: "numeric",
      });
    }

    if (vista === "dia") {
      return fecha.toLocaleDateString("es-PE", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }

    const ini = inicioSemana(fecha);
    const fin = new Date(ini);
    fin.setDate(ini.getDate() + 6);

    return `${ini.toLocaleDateString("es-PE")} – ${fin.toLocaleDateString(
      "es-PE"
    )}`;
  };

  const doctorSeleccionado =
    doctorId === "ALL" ? null : doctores.find((d) => d.id === doctorId);

  /* ======================= MES ======================= */
  const generarDiasMes = () => {
    const inicio = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
    const fin = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
    const dias: Date[] = [];
    const offset = (inicio.getDay() + 6) % 7;

    for (let i = 0; i < offset; i++) dias.push(new Date(NaN));
    for (let d = 1; d <= fin.getDate(); d++) {
      dias.push(new Date(fecha.getFullYear(), fecha.getMonth(), d));
    }
    return dias;
  };

  const citasPorFecha = (d: Date) =>
    citas.filter((c) => new Date(c.fecha).toDateString() === d.toDateString());

  const citaPorHora = (d: Date, h: string) =>
    citas.find(
      (c) =>
        new Date(c.fecha).toDateString() === d.toDateString() && c.hora === h
    );

  const renderMes = () => (
    <div className="calendario-grid">
      {diasSemana.map((d) => (
        <div key={d} className="calendario-col-header">
          {d}
        </div>
      ))}

      {generarDiasMes().map((dia, i) => (
        <div key={i} className="calendario-celda">
          {!isNaN(dia.getTime()) && (
            <>
              <span className="dia-numero">{dia.getDate()}</span>
              {citasPorFecha(dia).map((c) => (
                <div key={c._id} className="cita-chip">
                  {c.hora} {c.pacienteId.nombres}
                </div>
              ))}
            </>
          )}
        </div>
      ))}
    </div>
  );

  /* ======================= SEMANA ======================= */
  const renderSemana = () => {
    const inicio = inicioSemana(fecha);

    return (
      <div className="agenda-semana">
        <div className="agenda-header">
          <div />
          {Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(inicio);
            d.setDate(inicio.getDate() + i);
            return (
              <div key={i} className="agenda-dia-header">
                {diasSemana[i]} {d.getDate()}
              </div>
            );
          })}
        </div>

        {HORAS_LABORALES.map((h) => (
          <div key={h} className="agenda-row">
            <div className="agenda-hora">{h}</div>
            {Array.from({ length: 7 }).map((_, i) => {
              const d = new Date(inicio);
              d.setDate(inicio.getDate() + i);
              const cita = citaPorHora(d, h);
              return (
                <div key={i} className="agenda-celda">
                  {cita && (
                    <div className="agenda-cita">{cita.pacienteId.nombres}</div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  /* ======================= DÍA ======================= */
  const renderDia = () => (
    <div className="agenda-dia">
      {HORAS_LABORALES.map((h) => {
        const cita = citaPorHora(fecha, h);
        return (
          <div key={h} className="agenda-linea">
            <div className="agenda-hora">{h}</div>
            <div className="agenda-celda">
              {cita && (
                <div className="agenda-cita">
                  {cita.pacienteId.nombres} {cita.pacienteId.apellidos}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  /* ======================= JSX ======================= */
  return (
    <div className="calendario-container">
      <div className="calendario-layout">
        {/* IZQUIERDA */}
        <div className="calendario-left">
          <MiniCalendario fecha={fecha} onChange={setFecha} />

          <div className="doctores-panel">
            <h4>Doctores</h4>

            <div className="doctores-lista">
              {/* TODOS */}
              <div
                className={`doctor-item ${doctorId === "ALL" ? "activo" : ""}`}
                onClick={() => setDoctorId("ALL")}
              >
                Todos los doctores
              </div>

              {/* INDIVIDUALES */}
              {doctores.map((d) => (
                <div
                  key={d.id}
                  className={`doctor-item ${doctorId === d.id ? "activo" : ""}`}
                  onClick={() => setDoctorId(d.id)}
                >
                  {d.apellidos}, {d.nombres}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* DERECHA */}
        <div className="calendario-main">
          <div className="calendario-topbar">
            <button onClick={() => cambiarFecha(-1)}>◀</button>
            <h2>{tituloCalendario()}</h2>
            <button onClick={() => cambiarFecha(1)}>▶</button>

            <div className="vista-selector">
              {(["dia", "semana", "mes"] as Vista[]).map((v) => (
                <button
                  key={v}
                  className={vista === v ? "active" : ""}
                  onClick={() => setVista(v)}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {doctorSeleccionado && (
            <div className="doctor-bar">
              Calendario de: {doctorSeleccionado.apellidos},{" "}
              {doctorSeleccionado.nombres}
            </div>
          )}

          {vista === "mes" && renderMes()}
          {vista === "semana" && renderSemana()}
          {vista === "dia" && renderDia()}
        </div>
      </div>
    </div>
  );
};

export default Calendario;
