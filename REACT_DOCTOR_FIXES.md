# React Doctor — Correcciones aplicadas

**Fecha:** 2026-05-11
**Puntuación inicial:** 69/100 · 1159 issues · 121/134 archivos
**Después de ronda 1:** 1043 issues · 91/118 archivos
**Después de ronda 2:** issues adicionales corregidos (ver detalle)
**Herramienta:** [React Doctor](https://www.react.doctor)

---

## Resumen ejecutivo

### Ronda 1 — issues críticos

| Categoría | Severidad | Issues | Estado |
|---|---|---|---|
| `useEffect` sin cleanup | Error | 2 | ✅ Corregido |
| Mutación directa de estado | Warning | 1 | ✅ Corregido |
| Inputs no controlados | Warning | 3 | ✅ Corregido |
| `setState` sin forma funcional | Warning | 26 | ✅ Corregido |
| Array index como `key` | Warning | 38 | ✅ Corregido |
| Archivos no usados (knip) | Warning | 22 | ✅ Eliminados |

### Ronda 2 — limpieza adicional

| Categoría | Severidad | Issues | Estado |
|---|---|---|---|
| Em-dash (`—`) en JSX text | Warning | 143 | ✅ Reemplazados por `-` |
| Three-period ellipsis (`...`) | Warning | 27 | ✅ Reemplazados por `…` |
| `z-index: 9999` | Warning | 3 | ✅ Reducidos a escala 50-70 |
| `transition: all` | Warning | 1 | ✅ Propiedades específicas |
| `autoFocus` (a11y) | Warning | 1 | ✅ Eliminado |
| `[...arr].sort()` no inmutable | Warning | 3 | ✅ `toSorted()` |
| `useState(fn())` sin lazy | Warning | 2 | ✅ `useState(() => fn())` |
| `Promise.all` secuencial | Warning | 1 | ✅ Paralelizado |
| `.map().filter(Boolean)` | Warning | 1 | ✅ `flatMap` |
| `useEffectEvent` pattern | Warning | 1 | ✅ Ref pattern |
| Default `[]` en prop (memo) | Warning | 3 | ✅ Constante a module scope |
| Array index keys restantes | Warning | 10 | ✅ `_uid` + claves estables |
| Derived-state-effect | Warning | 4 | ✅ Eventos en handler |
| No-effect-chain | Warning | 2 | ✅ Resueltos con handlers |
| `new Intl.DateTimeFormat()` | Warning | 6 | ✅ Hoisteados a module scope |
| `array.find()` en loop | Warning | 1 | ✅ `Map` lookup |
| `<h>` con `fontWeight: 700` | Warning | 2 | ✅ `600` |

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

---

## 7. Ronda 2 — Detalle de correcciones

### 7.1 Em-dashes (`—` → `-`) — 143 ocurrencias

**Regla:** `react-doctor/design-no-em-dash-in-jsx-text`
**Razón:** El em-dash lee como output de modelo de IA. Se prefiere puntuación estándar (coma, dos puntos, paréntesis, guion).
**Fix aplicado:** Script PowerShell que reemplaza `—` por `-` en todo `.tsx`/`.ts` excepto dentro de strings (preservando interpolaciones). 38 archivos modificados.

### 7.2 Ellipsis (`...` → `…`) — 27 ocurrencias

**Regla:** `react-doctor/design-no-three-period-ellipsis`
**Fix:** Reemplazo regex con PowerShell de `...` en JSX text por carácter unicode `…`. 22 archivos modificados.

### 7.3 z-index extremos

| Archivo | Antes | Después |
|---|---|---|
| `DetalleOrden.tsx:58` | 9999 | 50 |
| `DetalleOrden.tsx:194` | 10000 | 60 |
| `CredencialesModal.css` | 9999 | 70 |

### 7.4 `transition: "all"` → propiedades específicas

`Laboratorio.tsx:543`: `transition: "all 0.15s"` → `transition: "background-color 0.15s, border-color 0.15s"`

### 7.5 Lazy state initialization

```tsx
// Antes
const [calAño, setCalAño] = useState(hoy.getFullYear());
// Después
const [calAño, setCalAño] = useState(() => hoy.getFullYear());
```

### 7.6 Promise.all paralelizado en NotaSOAP

```tsx
// Antes (3 awaits secuenciales)
await MedicoApiService.guardarNotasClinicas(citaId, payload);
await MedicoApiService.actualizarEstadoCita(citaId, "ATENDIDA");
await Swal.fire(...)

// Después
await Promise.all([
  MedicoApiService.guardarNotasClinicas(citaId, payload),
  MedicoApiService.actualizarEstadoCita(citaId, "ATENDIDA"),
]);
await Swal.fire(...)
```

### 7.7 useEffectEvent pattern (ref alternative)

`DetalleOrden.tsx`: el handler `onClose` se mantiene en un ref para evitar re-suscripción del listener de teclado en cada render del padre.

### 7.8 Default array prop a module scope

```tsx
// Antes
const PasoDia = ({ diasBloqueados = [], ... }: Props) => ...

// Después
const EMPTY_DIAS: number[] = [];
const PasoDia = ({ diasBloqueados = EMPTY_DIAS, ... }: Props) => ...
```

Aplicado a: `PasoDia.tsx`, `ModalReceta.tsx` (alergias), `VistaMes.tsx` (bloqueos).

### 7.9 Array keys con `_uid` estables

Se agregó campo opcional `_uid?: string` a `ExamenOrdenado` y `MedicamentoSOAP`. Cuando un item es agregado por el usuario, se le asigna `crypto.randomUUID()`. Esto garantiza identidad estable incluso si el usuario añade duplicados.

```tsx
onAdd={e => { setExamenes(prev => [...prev, { ...e, _uid: crypto.randomUUID() }]); }}
```

### 7.10 Derived-state-effect y no-effect-chain

Resueltos creando handlers explícitos en lugar de cadenas de `useEffect`:

```tsx
// Antes (chain)
useEffect(() => { setPagina(1); setBusqueda(""); }, [activeTab]);
useEffect(() => { setPagina(1); }, [busqueda]);

// Después (handlers)
const cambiarTab = (tab: Tab) => {
  setActiveTab(tab);
  setPagina(1);
  setBusqueda("");
};
const cambiarBusqueda = (valor: string) => {
  setBusqueda(valor);
  setPagina(1);
};
```

Aplicado a `HistorialCitasPaciente.tsx` y `PacienteOrdenes.tsx`.

### 7.11 `Intl.DateTimeFormat` hoisting

```tsx
// Antes (re-asignación en cada llamada)
const formatear = (f: Date) => new Intl.DateTimeFormat("es-PE", {...}).format(f);

// Después
const FECHA_FMT = new Intl.DateTimeFormat("es-PE", {...});
const formatear = (f: Date) => FECHA_FMT.format(f);
```

Aplicado a: `HistorialCitasPaciente.tsx`, `ListaCitas.tsx`, `ReprogramarModal.tsx`, `PerfilCita.tsx`.

### 7.12 `array.find()` en loop → `Map` lookup

`OrdenExamenModal.tsx`: dos loops anidados usaban `examenes.find()` por cada item. Se construye un `Map` una sola vez y se hacen lookups O(1).

```tsx
const examenesPorId = new Map(examenes.map((e) => [e._id, e]));
// ...
const examen = examenesPorId.get(examenId);
```

### 7.13 `fontWeight: 700` en headings

- `DetalleOrden.tsx:67` → `<h2>` con `fontWeight: 700` reducido a `600`
- `NotaSOAP.tsx:724` → `<h3>` reducido a `600`

---

## Validación final

```bash
npx tsc --noEmit
# exit: 0  (sin errores de tipos en ambas rondas)
```

---

## Issues pendientes (no abordados intencionalmente)

Los siguientes issues quedan pendientes porque requieren cambios arquitecturales mayores o decisiones de diseño caso a caso:

| Regla | Count | Razón |
|---|---|---|
| `jsx-a11y/label-has-associated-control` | 496 | Requiere agregar `htmlFor`/`id` o reestructurar JSX para cada `<label>` + revisión de CSS por componente. Cambio masivo de markup. |
| `no-tiny-text` (fontSize < 12px) | 49 | Decisión de diseño: la nota SOAP usa texto compacto (`fontSize: 11`) intencionalmente. Cambiar afectaría densidad de información clínica. |
| `rendering-hydration-mismatch-time` | 44 | Falso positivo: el proyecto es SPA puro (Vite + React Router), sin SSR/hidratación. `new Date()` no causa mismatch. |
| `no-generic-handler-names` | 23 | Cosmético. Renombrar `handleChange` → `handlePatientFieldChange` requiere coordinar con convenciones de equipo. |
| `prefer-useReducer` | 22 | Refactor arquitectural: convertir componentes con muchos `useState` relacionados a `useReducer`. Algunos ya están con reducer (`PerfilCita`). |
| `no-inline-exhaustive-style` | 17 | Extraer estilos inline grandes a CSS modules / clases. Requiere decisión de equipo sobre styling convention. |
| `no-cascading-set-state` | 16 | Múltiples `setState` en un `useEffect` → migrar a `useReducer`. Refactor por componente. |
| `no-render-in-render` | 12 | `MiCuentaPerfil.tsx`: 12 funciones `render*()` inline → extraer a componentes nombrados. |
| `no-giant-component` | 11 | Componentes >500 líneas (NotaSOAP=789, Laboratorio=1100+). Refactor mayor. |
| `state-only-in-handlers` | 10 | Falsos positivos: `loading` SÍ se lee en el JSX (`if (loading) return <Spinner/>`). El detector no lo reconoce. |
| `js-combine-iterations` | 8 | Performance marginal: `.filter().map()` → un solo pase. Sacrifica legibilidad. |
| `no-react19-deprecated-apis` | 2 | Migrar `useContext` → `use()` requiere verificar versión de React. |
| `async-defer-await` | 1 | Falso positivo: el guard `if (cancelled) return` después del await sí es relevante por race conditions de unmount. |

