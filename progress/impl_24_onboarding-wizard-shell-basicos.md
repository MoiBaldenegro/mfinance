# Informe de Implementación — Feature 24: onboarding-wizard-shell-basicos

## Resumen

Implementación completa del **Shell del wizard de onboarding + Paso 1** según especificación REQ-24-01 a REQ-24-14, con correcciones aplicadas tras revisión (CHANGES_REQUESTED).

## Cambios Realizados (Implementación Inicial)

### 1. Entidades de Dominio — divididas en múltiples archivos ≤100 líneas
- `src/domain/entities/onboarding/onboarding-status.ts` — `OnboardingStatus`
- `src/domain/entities/onboarding/onboarding-data.ts` — `OnboardingData`, `ONBOARDING_DATA_VACIO`
- `src/domain/entities/onboarding/onboarding-pasos.ts` — `Paso1Data` a `Paso4Data`, `OnboardingActivo`, `OnboardingPasivo`, `OnboardingInversion`, `SupuestoProyeccion`, `UmbralIndicador`, `MetaOnboarding`, `paso1DataPorDefecto()`
- `src/domain/entities/onboarding/perfil-minimo.ts` — `PerfilMinimoOnboarding`
- `src/domain/entities/onboarding/index.ts` — barrel export

### 2. Puerto (`src/domain/ports/onboarding-port.ts`)
- `OnboardingPort` con: `obtenerEstado()`, `actualizarDatos()`, `completarOnboarding()`
- **Eliminado** `obtenerDatosParciales()` (no hay command backend; se usa perfil cargado en GestionPerfiles)

### 3. Adapter IPC — renombrado a `onboarding-adapter.ts` (REQ-24-02)
- Archivo: `src/adapters/onboarding-adapter.ts` (antes `onboarding-ipc-adapter.ts`)
- Clase: `OnboardingAdapter` (antes `OnboardingIpcAdapter`)
- Único lugar con `invoke()` para commands: `obtener_onboarding_status`, `actualizar_perfil_onboarding`, `completar_onboarding`
- **Eliminado** `obtenerDatosParciales()` (llama a command inexistente `obtener_onboarding_datos`)

### 4. Errores (`src/domain/errors/onboarding-errors.ts`) — alineado con `snapshot-errors.ts`
- Clases `OnboardingStatusError`, `OnboardingDatosError`, `OnboardingCompletarError`
- `motivoDeRechazoOnboarding()` extrae mensaje legible
- `errorOnboardingDesdeRechazo(codigo, rechazo)` mapea códigos backend a errores específicos (patrón `errorDesdeCodigoIpc`)

### 5. Caso de Uso (`src/domain/use-cases/onboarding/gestionar-onboarding.ts`)
- `obtenerEstadoOnboarding()` → devuelve OnboardingStatus | Error
- `actualizarDatosOnboarding()` → pasa datos tal cual al puerto (merge se hace en hook)
- `completarOnboarding()` → consolida y marca Completed
- **Eliminado** `obtenerDatosParcialesOnboarding()`
- Fachada `gestionarOnboarding` exporta las 3 operaciones

### 6. Hook React (`src/hooks/use-onboarding.ts`)
- `useOnboarding(opciones?)` acepta `datosIniciales` y `pasoInicial` para reanudar
- **Debounce 500ms** en `guardarConDebounce()` al modificar campos
- **Flush inmediato** al cambiar de paso (`siguientePaso`)
- Expone: `actualizarPaso1`, `completar`, `saltar`, `recargar`, `siguientePaso`, `pasoAnterior`

### 7. Componentes UI
- **OnboardingWizard.tsx** (`src/components/onboarding/`)
  - Barra progreso 5 pasos con indicadores visuales
  - Navegación controlada: Atrás/Siguiente/Finalizar/Saltar
  - Deshabilita Siguiente si paso inválido (validación paso 1)
  - Recibe `datosIniciales` y `pasoInicial` props para reanudar
  - Renderiza paso activo via `PasoContenido` (paso1 real, 2-5 placeholders)
  
- **OnboardingPaso1.tsx** (`src/components/onboarding/`)
  - Nombre completo (requerido)
  - Selector moneda: MXN/USD/EUR (reusa `MONEDAS`, `ETIQUETA_MONEDA` de `moneda.ts`)
  - 4 fuentes ingreso con checkboxes (Salario, Freelance, Arriendos, Otros)
  - 6 categorías gasto con checkboxes (Vivienda, Alimentación, Transporte, Cuotas de deuda, Ocio, Otros)
  - Validación: ≥1 fuente y ≥1 categoría activas
  - Mensajes error en español junto a cada grupo
  - Botón "Saltar onboarding" con ayuda contextual
  - Indicador visual de paso válido/inválido

- **OnboardingPasoPlaceholder.tsx** - placeholders para pasos 2-5

### 8. Integración Ajustes (`src/components/ajustes-section/GestionPerfiles.tsx`)
- "Crear perfil" → crea perfil + lanza wizard (`setMostrarWizard({reanudar: false})`)
- Perfiles con `onboarding_status.nombre === 'InProgress'` muestran botón "Reanudar onboarding"
- **Al reanudar**: lee `onboarding_data` del perfil ya cargado en `usarPerfiles` y lo pasa al wizard vía props `datosIniciales` y `pasoInicial` (evita IPC extra — Opción C de la revisión)
- Callbacks `manejarWizardCompletar` / `manejarWizardSaltar` recargan snapshot y perfiles

### 9. Estilos (solo `tokens.css`)
- `onboarding-wizard.css`: barra progreso, navegación, botones, estados
- `onboarding-paso1.css`: campos, checkboxes, validaciones, botón Saltar
- `onboarding-paso-placeholder.css`: placeholders pasos 2-5
- Actualizado `gestion-perfiles.css`: botón "Reanudar" con color warning
- **audit-design-tokens OK** - sin colores/espaciados/radios/sombras hardcodeados

### 10. Tests TDD (RED → GREEN) — actualizados tras correcciones

#### `tests/onboarding-wizard/gestionar-onboarding.test.mjs` (12 tests)
- Obtener estado: NotStarted, InProgress, Completed, error propagado
- Actualizar datos: guarda paso1, **pasa datos tal cual** (merge en hook), error propagado
- Completar: marca Completed, devuelve perfil, error propagado
- Validaciones paso 1: nombre vacío, sin fuentes, sin categorías
- Saltar onboarding: crea perfil mínimo

#### `tests/onboarding-wizard/onboarding-wizard.test.mjs` (33 tests)
- Estructura componentes: archivos existen, imports CSS, sin CSS embebido
- OnboardingWizard: 5 pasos, botones, navegación controlada
- OnboardingPaso1: campos, moneda, checkboxes, validaciones, botón Saltar
- useOnboarding hook: DEBOUNCE_MS=500, debounce, flush, API expuesta
- GestionPerfiles integración: wizard, Reanudar, lanza wizard
- Estilos: solo custom properties
- Hexagonal: domain sin react/@tauri-apps/api, **invoke solo en adapters/onboarding-adapter.ts**, líneas dominio ≤105

## Correcciones Aplicadas tras Revisión (CHANGES_REQUESTED)

| # | Issue | Solución Aplicada |
|---|-------|-------------------|
| 1 | **Bug crítico**: `obtenerDatosParciales` llama a command inexistente `obtener_onboarding_datos` | Eliminado del puerto/adapter/caso de uso/hook. **Opción C**: `GestionPerfiles` pasa `onboarding_data` del perfil cargado al wizard vía props `datosIniciales`/`pasoInicial` |
| 2 | **Archivo dominio >100 líneas**: `onboarding.ts` (112 líneas) | Dividido en 5 archivos ≤100 líneas: `onboarding-status.ts` (12), `onboarding-data.ts` (23), `onboarding-pasos.ts` (84), `perfil-minimo.ts` (10), `index.ts` (20) |
| 3 | **Naming adapter**: `OnboardingIpcAdapter` en `onboarding-ipc-adapter.ts` vs spec `OnboardingAdapter` en `onboarding-adapter.ts` | Renombrado archivo y clase. Actualizados todos los imports |
| 4 | **Manejo errores**: `errorOnboardingDesdeRechazo` no distinguía operaciones | Alineado con `snapshot-ipc-adapter.ts`: usa `errorDesdeCodigoIpc` pattern con códigos `status`/`datos`/`completar` |

## Verificación Final

### Ciclo Rojo/Verde Documentado (con correcciones)

**Use-case tests - Tras correcciones (GREEN):**
```
✓ 12 tests pasan
  gestionarOnboarding — obtenerEstado (4/4)
  gestionarOnboarding — actualizarDatos (3/3)  ← test de merge actualizado
  gestionarOnboarding — completarOnboarding (2/2)
  gestionarOnboarding — validaciones paso 1 (3/3)
```

**Component tests - Tras correcciones (GREEN):**
```
✓ 33 tests pasan
  OnboardingWizard — estructura (6/6)
  OnboardingPaso1 — estructura (11/11)
  useOnboarding hook — lógica (6/6)
  GestionPerfiles — integración (5/5)
  Estilos — tokens.css (2/2)
  Arquitectura hexagonal (3/3)  ← archivo adapter renombrado
```

### Suite Completa
```
pnpm test:     403 tests pasan (0 fallos)
pnpm build:    ✓ TypeScript + Vite build OK
cargo test:    288 tests pasan (backend)
./init.sh:     ✓ Todo verde (formato + tests + build)
```

## Arquitectura Hexagonal Verificada

| Capa | Archivos | Validación |
|------|----------|------------|
| Domain (puro) | entities/onboarding/*.ts, ports/onboarding-port.ts, use-cases/onboarding/gestionar-onboarding.ts, errors/onboarding-errors.ts | 0 imports react, 0 imports @tauri-apps/api, 0 invoke |
| Adapters | adapters/onboarding-adapter.ts | **Único sitio con invoke()** |
| Components | components/onboarding/*.tsx, components/ajustes-section/GestionPerfiles.tsx | Delegan en hooks/use-cases, sin invoke directo |
| Hooks | hooks/use-onboarding.ts | Usa puerto via adapter, sin invoke directo |

## Líneas por Archivo (Dominio ≤100)

| Archivo | Líneas |
|---------|--------|
| domain/entities/onboarding/onboarding-status.ts | 12 |
| domain/entities/onboarding/onboarding-data.ts | 23 |
| domain/entities/onboarding/onboarding-pasos.ts | 84 |
| domain/entities/onboarding/perfil-minimo.ts | 10 |
| domain/entities/onboarding/index.ts | 20 |
| domain/ports/onboarding-port.ts | 13 |
| domain/use-cases/onboarding/gestionar-onboarding.ts | 74 |
| domain/errors/onboarding-errors.ts | 53 |
| adapters/onboarding-adapter.ts | 36 |

## Criterios de Aceptación Cumplidos (Post-Correcciones)

| REQ | Descripción | Estado |
|-----|-------------|--------|
| 24-01 | OnboardingPort en domain/ports/ | ✓ |
| 24-02 | **OnboardingAdapter** en adapters/onboarding-adapter.ts con invoke() único | ✓ |
| 24-03 | gestionarOnboarding use-case | ✓ |
| 24-04 | OnboardingWizard: 5 pasos, navegación, barra progreso | ✓ |
| 24-05 | Persistencia parcial debounce 500ms + flush al cambiar paso | ✓ |
| 24-06 | Paso 1: nombre, moneda MXN/USD/EUR, botón Saltar | ✓ |
| 24-07 | Paso 1: fuentes ingreso checkboxes, ≥1 activa | ✓ |
| 24-08 | Paso 1: categorías gasto checkboxes, ≥1 activa | ✓ |
| 24-09 | Bloquea Siguiente con mensaje español si inválido | ✓ |
| 24-10 | Ajustes: Crear perfil lanza wizard; Saltar → perfil mínimo | ✓ |
| 24-11 | **Ajustes: Reanudar onboarding si InProgress — carga datos parciales** | ✓ |
| 24-12 | Estilos solo tokens.css (audit OK) | ✓ |
| 24-13 | Tests TDD node:test use-case + componente | ✓ |
| 24-14 | Hexagonal, **≤100 líneas dominio**, domain sin react/@tauri | ✓ |

---

**Estado: IMPLEMENTADO, CORREGIDO Y VERIFICADO** ✅

Listo para revisión del leader.