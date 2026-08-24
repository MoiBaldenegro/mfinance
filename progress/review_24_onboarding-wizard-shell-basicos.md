# Review — feature 24

**Veredicto:** APPROVED

## Checkpoints
- C1: [x] Arquitectura hexagonal (dependencias → dominio, invoke solo en adapter)
- C2: [x] Estilos solo tokens.css (audit-design-tokens OK)
- C3: [x] Tests TDD rojo→verde documentados (403 tests pasan, ./init.sh verde)
- C4: [x] **Bug crítico REQ-24-11**: "Reanudar onboarding" carga datos parciales desde perfil ya cargado (sin IPC extra)
- C5: [x] Límite 100 líneas: entidades onboarding divididas en 5 archivos ≤100 líneas (onboarding.ts ya no existe)
- C6: [x] Naming adapter: `OnboardingAdapter` en `onboarding-adapter.ts` (sin sufijo -ipc)
- C7: [x] Errores adapter: `errorOnboardingDesdeRechazo` mapea códigos IPC a errores específicos (patrón `errorDesdeCodigoIpc`)
- C8: [x] `./init.sh` verde completo (tests + build + formato + cargo test 288/288)
- C9: [x] Specs REQ-24-01 a REQ-24-14 cumplidas

## Evidencia verificada

### 1. Bug crítico REQ-24-11 resuelto (Opción C implementada)
- **Archivo:** `src/components/ajustes-section/GestionPerfiles.tsx` (líneas 55-63)
- **Antes:** `obtenerDatosParciales()` llamaba a `obtener_onboarding_datos` (command inexistente)
- **Ahora:** `reanudarOnboarding(perfilId)` lee `perfil.onboarding_data` y `perfil.onboarding_status.current_step` del perfil ya cargado en `usarPerfiles`, y los pasa al wizard vía props `datosIniciales` y `pasoInicial`. Cero IPC extra, cero llamadas a command inexistente.

### 2. Entidades divididas ≤100 líneas (REQ-24-14)
```
src/domain/entities/onboarding/onboarding-status.ts   →   7 líneas
src/domain/entities/onboarding/onboarding-data.ts     →  21 líneas
src/domain/entities/onboarding/onboarding-pasos.ts    →  83 líneas
src/domain/entities/onboarding/perfil-minimo.ts       →   9 líneas
src/domain/entities/onboarding/index.ts               →  19 líneas
```
Archivo monolítico `onboarding.ts` (112 líneas) **eliminado**.

### 3. Naming adapter corregido (REQ-24-02)
- **Archivo:** `src/adapters/onboarding-adapter.ts` (antes `onboarding-ipc-adapter.ts`)
- **Clase:** `OnboardingAdapter` (antes `OnboardingIpcAdapter`)
- **Imports actualizados** en: `use-onboarding.ts`, `gestionar-onboarding.ts` (vía puerto), tests

### 4. Errores adapter alineados con patrón `errorDesdeCodigoIpc`
- **Archivo:** `src/domain/errors/onboarding-errors.ts` (líneas 48-65)
- `CODIGOS_ONBOARDING` = `{ status, datos, completar }`
- `errorOnboardingDesdeRechazo(codigo, rechazo)` → instancia error específico según código
- Consistente con `snapshot-errors.ts` / `snapshot-ipc-adapter.ts`

### 5. Suite completa verde
```
pnpm test:     403 tests pasan (0 fallos)
pnpm build:    ✓ TypeScript + Vite build OK
cargo test:    288 tests pasan (backend)
./init.sh:     ✓ Todo verde (formato + tests + build)
```

### 6. Arquitectura hexagonal verificada
| Capa | Archivos | Validación |
|------|----------|------------|
| Domain (puro) | entities/onboarding/*.ts, ports/onboarding-port.ts, use-cases/onboarding/gestionar-onboarding.ts, errors/onboarding-errors.ts | 0 imports react, 0 imports @tauri-apps/api, 0 invoke |
| Adapters | adapters/onboarding-adapter.ts | **Único sitio con invoke()** (3 commands: obtener_onboarding_status, actualizar_perfil_onboarding, completar_onboarding) |
| Components | components/onboarding/*.tsx, components/ajustes-section/GestionPerfiles.tsx | Delegan en hooks/use-cases, sin invoke directo |
| Hooks | hooks/use-onboarding.ts | Usa puerto via adapter, sin invoke directo |

### 7. Tests TDD ciclo rojo→verde documentado
**Use-case tests (12):**
- obtenerEstado: NotStarted, InProgress, Completed, error propagado
- actualizarDatos: guarda paso1, pasa datos tal cual (merge en hook), error propagado
- completarOnboarding: marca Completed, devuelve perfil, error propagado
- Validaciones paso 1: nombre vacío, sin fuentes, sin categorías (caso de uso delega a UI)
- Saltar onboarding: crea perfil mínimo

**Component tests (33):**
- Estructura componentes: archivos existen, imports CSS, sin CSS embebido
- OnboardingWizard: 5 pasos, botones, navegación controlada
- OnboardingPaso1: campos, moneda, checkboxes, validaciones, botón Saltar
- useOnboarding hook: DEBOUNCE_MS=500, debounce, flush, API expuesta
- GestionPerfiles integración: wizard, Reanudar, lanza wizard
- Estilos: solo custom properties tokens.css
- Hexagonal: domain sin react/@tauri-apps/api, invoke solo en adapters/onboarding-adapter.ts, líneas dominio ≤105

---

**Estado: APROBADO ✅** — La feature 24 cumple todos los criterios de aceptación post-correcciones. Lista para marcar `done` en `feature_list.json`.