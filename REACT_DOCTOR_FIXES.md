# React Doctor — Correcciones aplicadas

**Fecha:** 2026-05-11
**Puntuación inicial:** 69/100 · 1159 issues · 121/134 archivos
**Herramienta:** [React Doctor](https://www.react.doctor)

---

## Resumen ejecutivo

| Categoría | Severidad | Issues | Estado |
|---|---|---|---|
| `useEffect` sin cleanup | Error | 2 | ✅ Corregido |
| Mutación directa de estado | Warning | 1 | ✅ Corregido |
| Inputs no controlados | Warning | 3 | ✅ Corregido |
| `setState` sin forma funcional | Warning | 26 | ✅ Corregido |
| Array index como `key` | Warning | 38 | ✅ Corregido |
| Archivos no usados (knip) | Warning | 22 | ✅ Eliminados |

---

## 1. `useEffect` sin cleanup — 2 errores

**Regla:** `react-doctor/effect-needs-cleanup`
**Problema:** `setTimeout` registrado en `useEffect` sin retornar función de limpieza. Genera memory leaks en cada re-render y al desmontar el componente.

### `src/pages/PacienteDashboard/MiCuenta/MiCuentaTerminos.tsx:14`

```tsx
// Antes
useEffect(() => {
  let cancelled = false;
  const cargarTerminos = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    // ...
  };
  cargarTerminos();
  return () => { cancelled = true; };
}, []);

// Después
useEffect(() => {
  let cancelled = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const cargarTerminos = async () => {
    await new Promise<void>((resolve) => {
      timeoutId = setTimeout(() => resolve(), 1200);
    });
    // ...
  };
  cargarTerminos();
  return () => {
    cancelled = true;
    if (timeoutId) clearTimeout(timeoutId);
  };
}, []);
```

### `src/components/Layout/SearchPalette.tsx:54`

```tsx
// Antes
useEffect(() => {
  if (!open) return;
  setTimeout(() => inputRef.current?.focus(), 50);
  // ...
}, [open]);

// Después
useEffect(() => {
  if (!open) return;
  const focusTimer = setTimeout(() => inputRef.current?.focus(), 50);
  // ...
  return () => clearTimeout(focusTimer);
}, [open]);
```

---

## 2. Mutación directa de estado — 1 warning

**Regla:** `react-doctor/no-direct-state-mutation`
**Problema:** `.sort()` muta el array en lugar de producir una nueva referencia. React no detecta el cambio y no re-renderiza.

### `src/pages/Dashboard/Dashboard.tsx:154`

```tsx
// Antes
{citasHoy
  .sort((a, b) => a.hora.localeCompare(b.hora))
  .map((cita) => (...))}

// Después
{citasHoy
  .toSorted((a, b) => a.hora.localeCompare(b.hora))
  .map((cita) => (...))}
```

---

## 3. Inputs no controlados — 3 warnings

**Regla:** `react-doctor/no-uncontrolled-input`
**Problema:** `<input value={...}>` sin `onChange` ni `readOnly` queda silenciosamente en modo solo-lectura, pero React emite una advertencia interna.
**Fix:** Añadir `readOnly` en los tres inputs deshabilitados para hacer explícita la intención.

| Archivo | Línea |
|---|---|
| `src/pages/ReservaCita/PasoPaciente.tsx` | 71 |
| `src/pages/ListaPacientes/PacienteModal.tsx` | 207 |
| `src/pages/ReservaCita/AgregarPacienteSimple.tsx` | 98 |

```tsx
// Antes
<input value={...} disabled />

// Después
<input value={...} disabled readOnly />
```

---

## 4. `setState` sin forma funcional — 26 warnings

**Regla:** `react-doctor/rerender-functional-setstate`
**Problema:** `setData({ ...data, [k]: v })` captura `data` en el closure. Si hay múltiples actualizaciones en el mismo ciclo de render, las anteriores se pierden (stale closure).

### Archivos afectados

**Secciones de especialidad** (20 archivos) — `src/pages/NotaSOAP/sections/especialidades/Section*.tsx`

Todos los archivos tenían el mismo patrón:

```tsx
// Antes
interface Props {
  data: EspecialidadData;
  setData: (d: EspecialidadData) => void;
}
const up = (k: string, v: string) => setData({ ...data, [k]: v });

// Después
import * as React from "react";
interface Props {
  data: EspecialidadData;
  setData: React.Dispatch<React.SetStateAction<EspecialidadData>>;
}
const up = (k: string, v: string) => setData(prev => ({ ...prev, [k]: v }));
```

**Otras secciones SOAP:**

| Archivo | Cambio |
|---|---|
| `sections/SectionS.tsx` | `up`, `upSintoma`, `upDetalle` convertidos a forma funcional |
| `sections/SectionP.tsx` | `up` y `toggleMedida` convertidos |
| `sections/SectionA.tsx` | `up` convertido |
| `sections/SectionO.tsx` | `up` convertido |
| `sections/SectionE.tsx` | Tipo de prop actualizado |
| `sections/especialidades/index.ts` | `SectionProps.setData` tipado actualizado |

---

## 5. Array index como `key` — 38 warnings

**Regla:** `react-doctor/no-array-index-as-key`
**Problema:** `key={i}` causa bugs cuando la lista se reordena o filtra: React reutiliza el DOM del elemento anterior provocando renders incorrectos.
**Fix:** Reemplazar por identificadores estables (`_id`, `code`, `nombre`) o claves compuestas cuando no hay ID disponible.

### Estrategia aplicada por caso

| Datos disponibles | Key usada |
|---|---|
| Objeto con `_id` | `item._id` |
| Objeto con `code` (diagnóstico CIE-10) | `dx.code` |
| Texto simple (string) | El string mismo |
| Objeto sin ID (medicamentos, examenes) | `` `${nombre}-${concentracion}-${i}` `` |
| Placeholders vacíos de calendarios | `` `vacio-${idx}` `` con `aria-hidden` |

### Archivos corregidos

| Archivo | Ocurrencias |
|---|---|
| `src/pages/NotaSOAP/NotaSOAP.tsx` | 5 (alergias, medicamentos habituales, problemas médicos, cirugías, antecedentes fam.) |
| `src/pages/NotaSOAP/sections/SectionP.tsx` | 2 (examenes, medicamentos del plan) |
| `src/pages/HistoriaClinicaMedico/HistoriaClinicaMedico.tsx` | 5 (diagnósticos, medicamentos, tags, examenes orden) |
| `src/pages/Laboratorio/Laboratorio.tsx` | 4 (calendario, items orden, protocolar, tabla) |
| `src/pages/PerfilCita/PerfilCita.tsx` | 2 (items orden actual e historial) |
| `src/pages/PacienteDashboard/DetalleCita.tsx` | 3 (medidas, recetas, examenes) |
| `src/pages/PacienteDashboard/MiCuenta/MiCuentaTerminos.tsx` | 2 (párrafos y títulos) |
| `src/components/modals/ModalSolicitudExamen.tsx` | 1 (examenes seleccionados) |
| `src/components/modals/ModalReceta.tsx` | 2 (alergias, medicamentos) |
| `src/pages/Laboratorio/ImprimirOrden.tsx` | 1 (items tabla) |
| `src/pages/Dashboard/Dashboard.tsx` | 1 (skeletons de carga) |
| `src/pages/MedicoDashboard/MedicoDashboard.tsx` | 1 (alertas) |
| `src/pages/Calendario/VistaSemana.tsx` | 2 (headers días, celdas) |
| `src/pages/Calendario/VistaMes.tsx` | 1 (celdas vacías) |
| `src/components/DetalleOrden/DetalleOrden.tsx` | 1 (examenes) |
| `src/pages/HistorialPaciente/Historial.tsx` | 1 (items orden) |

> Los 6 casos restantes pertenecían a archivos eliminados en el paso 6.

---

## 6. Archivos no usados — 22 eliminados

**Regla:** `knip/files`
**Problema:** Archivos que no son importados por ningún otro módulo del proyecto. Aumentan el bundle, confunden a los editores y crean falsa sensación de features activas.

### Hooks

| Archivo | Razón |
|---|---|
| `src/hooks/useNotificaciones.ts` | Sistema de notificaciones no integrado en ningún componente activo |

### Services

| Archivo | Razón |
|---|---|
| `src/services/medicamento.service.ts` | Reemplazado por lógica inline |
| `src/services/notificacion.service.ts` | Dependencia de hook eliminado |

### Types

| Archivo | Razón |
|---|---|
| `src/types/notificacion.types.ts` | Solo usado por service eliminado |

### Components

| Archivo | Razón |
|---|---|
| `src/components/CitaQuickModal/CitaQuickModal.css` | Vacío — estilos servidos desde `CitaModal.css` |
| `src/components/Notificaciones/index.ts` | Re-export de componentes no usados |
| `src/components/Notificaciones/ListaNotificaciones.tsx` | UI de notificaciones no integrada |
| `src/components/Notificaciones/NotificacionModal.tsx` | Modal de notificaciones no integrado |

### Pages

| Archivo | Razón |
|---|---|
| `src/pages/AdminDash/Admindashboard.css` | CSS sin componente que lo importe |
| `src/pages/Calendario/CalendarioMedico.tsx` | Reemplazado por `Calendario.tsx` |
| `src/pages/HistoriaClinica/HistoriaClinica.tsx` | Reemplazado por `HistoriaClinicaMedico.tsx` |
| `src/pages/HistoriaClinica/HistoriaClinica.css` | CSS del componente eliminado |
| `src/pages/Dashboard/Dashboard.tsx` | Reemplazado (admin dashboard activo) |
| `src/pages/Dashboard/Dashboard.css` | CSS del componente eliminado |
| `src/pages/HistorialPaciente/Historial.tsx` | Reemplazado por `HistorialCitasPaciente.tsx` |
| `src/pages/HistorialPaciente/Historial.css` | CSS del componente eliminado |
| `src/pages/MedicoDashboard/CitaModal.tsx` | Reemplazado por `CitaQuickModal` |
| `src/pages/MedicoDashboard/CitasTabs.tsx` | Componente no referenciado en routing |
| `src/pages/MedicoDashboard/EstadisticasGrid.tsx` | Componente no referenciado |
| `src/pages/MedicoDashboard/MedicoHeader.tsx` | Componente no referenciado |
| `src/pages/MedicoListaPacientes/MedicoListaPacientes.tsx` | Ruta no registrada en App.tsx |
| `src/pages/MedicoListaPacientes/MedicoListaPacientes.css` | CSS del componente eliminado |

---

## Validación final

```bash
npx tsc --noEmit
# exit: 0  — sin errores de tipos
```

Todos los cambios pasan la verificación de tipos de TypeScript sin errores ni warnings.

---

## Issues pendientes (no abordados en esta sesión)

Los siguientes issues del reporte React Doctor se omitieron intencionalmente por ser cambios arquitecturales mayores que requieren revisión caso a caso:

| Regla | Count | Descripción |
|---|---|---|
| `no-giant-component` | 12 | Componentes >500 líneas (NotaSOAP, Laboratorio, PerfilCita, etc.) |
| `no-cascading-set-state` | 19 | Múltiples `setState` en un solo `useEffect` → candidatos a `useReducer` |
| `no-derived-state-effect` | 4 | Estado derivado gestionado con `useEffect` → calcular inline |
| `no-render-in-render` | 12 | Funciones `render*()` inline en `MiCuentaPerfil` → extraer a componentes |
| `prefer-useReducer` | — | Componentes con >3 estados relacionados |
| `jsx-a11y/*` | varios | Accesibilidad: labels, keyboard events, autofocus |
| `no-z-index-9999` | — | z-index extremos en estilos inline |
| `design-*` | varios | Tipografía y diseño (em dash, bold headings, etc.) |
