# Análisis: Gap entre Onboarding Implementado (Features 23-27) y Primera Instalación

## Problema en propias palabras

El usuario reporta: "ahora hay datos mockeados con lo que te recibe al parece sin no hay ningún usuario necesitamos entrar a un onboarding para crear el usuario personal, crear una experiencia para el usuario cuando recién se instala la app".

**Traducción técnica**: Al instalar la app por primera vez, el usuario ve datos de ejemplo (seed) en la interfaz principal en lugar de ser guiado por el wizard de onboarding para crear su perfil personal. El onboarding existe (features 23-27) pero **no se dispara automáticamente** en la primera ejecución.

---

## Qué ya está implementado (Features 23-27 ✓)

| Feature | Qué cubre |
|---------|-----------|
| 23 `perfiles-onboarding-modelo` | Backend: `Perfil` extendido con `onboarding_status` (NotStarted/InProgress/Completed), `onboarding_data`, `goals_journal`, `financial_profile`. Commands `actualizar_perfil_onboarding`, `completar_onboarding`, `obtener_onboarding_status`. |
| 24 `onboarding-wizard-shell-basicos` | Frontend: `OnboardingWizard` (5 pasos, barra progreso, navegación, persistencia parcial debounce 500ms). Paso 1: nombre, moneda, fuentes ingreso, categorías gasto. Botón "Saltar". Integración Ajustes: "Crear perfil" lanza wizard. |
| 25 `onboarding-paso-balance` | Paso 2: Activos/Pasivos/Inversiones CRUD, reusa motores features 8/11. |
| 26 `onboarding-paso-deuda-proyeccion` | Paso 3: Estrategia deuda (avalancha/bola nieve), pago extra, supuestos proyección 12m. Reusa features 9/14. |
| 27 `onboarding-paso-metas-completar` | Paso 4: Umbrales indicadores + Metas/Journal CRUD. Paso 5: Resumen + "Finalizar onboarding" → consolida en `StrategySettings`/`Investment`/`financial_profile` + `status=Completed`. Toast bienvenida. Ajustes: "Saltar", "Reanudar", sub-sección "Mis metas". |

**Todo esto funciona** — PERO solo si el usuario va a **Ajustes → "Crear perfil"**.

---

## Flujo real en primera instalación (lo que pasa hoy)

1. **Backend** `preparar_arranque` → `cargar_registro` devuelve `None` (no existe `profiles.json`)
2. **Backend** `arranque_frio` → `Perfil::nuevo("Personal")` → **`onboarding_status = NotStarted`** ✓
3. **Backend** `ensure_seed` → siembra `example_snapshot()` (12 meses registros, 3 activos, 3 pasivos, 3 inversiones, 2 estados cuenta) en `perfiles/<id>/mfinance.json`
4. **Frontend** `SnapshotProvider` → `cargarSnapshot` → `load_state` → carga el snapshot **con datos de ejemplo**
5. **Frontend** `AppShell` → renderiza **Registro** (primera sección) con datos mockeados
6. **Usuario** ve la app "ya funcionando" con datos ajenos, **nunca ve el onboarding**

---

## Gaps Identificados

### Gap 1: Falta "puerta de entrada" automática al onboarding en arranque
- **Dónde**: `SnapshotProvider` / `AppShell` / `App.tsx`
- **Qué falta**: Chequear `activo?.onboarding_status` tras cargar perfiles. Si `NotStarted` o `InProgress` → mostrar `OnboardingWizard` **en lugar de** `AppShell`.
- **Por qué no existe**: El wizard solo se renderiza desde `GestionPerfiles` (botón "Crear perfil" / "Reanudar").

### Gap 2: Datos de ejemplo (seed) visibles antes de completar onboarding
- **Dónde**: `arranque_frio` → `ensure_seed` siembra **antes** de que el usuario haga onboarding.
- **Consecuencia**: El snapshot que carga el frontend ya tiene 12 meses de datos, activos, pasivos, inversiones. El usuario cree que son sus datos.
- **Opciones**:
  - **A. Diferir seed**: No sembrar hasta `completar_onboarding` (cambio backend).
  - **B. Gate frontend**: Cargar snapshot pero no mostrar app hasta `onboarding_status = Completed` (cambio frontend).
  - **C. Seed "vacío"**: `example_snapshot()` con arrays vacíos; poblar real en `completar_onboarding`.

### Gap 3: No hay experiencia "primera vez" (welcome / empty state)
- El usuario no ve mensaje de bienvenida, ni explicación de qué hace la app, ni guía para crear su perfil.
- El toast "¡Bienvenido, <nombre>!" solo aparece **tras** finalizar onboarding (feature 27), no al abrir la app.

### Gap 4: Perfil "Personal" creado automáticamente confunde
- `arranque_frio` crea perfil "Personal" con `onboarding_status = NotStarted`.
- Usuario piensa "ya tengo un perfil" y no entiende por qué debe hacer onboarding.
- Falta comunicación visual: "Este perfil está incompleto, completemos tu configuración".

---

## Capas y Archivos Afectados

| Capa | Archivos a tocar |
|------|------------------|
| **Backend (Rust)** | `src-tauri/src/application/arranque_perfiles.rs` (diferir seed), `src-tauri/src/commands/` (nuevo command o extender `load_state`), `src-tauri/src/application/perfiles_onboarding.rs` |
| **Frontend Domain (TS)** | `src/domain/use-cases/load-snapshot.ts` (extender resultado), `src/domain/use-cases/onboarding/` (nuevo caso de uso "gate") |
| **Frontend Adapters** | `src/adapters/snapshot-ipc-adapter.ts` (nuevo command), `src/adapters/perfil-ipc-adapter.ts` |
| **Frontend Components** | `src/components/shell/SnapshotProvider.tsx` (gate principal), `src/components/shell/AppShell.tsx`, `src/App.tsx` |
| **Frontend Hooks** | `src/hooks/use-onboarding.ts`, `src/hooks/use-perfil.ts` |

---

## Riesgos y Trabas

1. **Cambio en `load_state`**: Rompe contrato IPC si no se versiona. Mejor: nuevo command `load_state_with_onboarding` o extender respuesta.
2. **Seed diferido**: `ensure_seed` se llama desde `arranque_frio` y `recuperar` (R3). Moverlo a `completar_onboarding` requiere garantizar que el snapshot existe antes de cualquier `load`.
3. **Race condition**: `SnapshotProvider` carga snapshot ANTES de que `AppShell` cargue perfiles. El gate debe coordinar ambos.
4. **Tests existentes**: `cargarSnapshot` y `AppShell` tienen tests; el gate añade rama nueva que debe testearse (TDD obligatorio).
5. **Migración perfiles legacy**: Perfiles migrados tienen `onboarding_status = Completed` (feature 23). No deben ver wizard.

---

## Decisiones de Diseño Propuestas

### Opción Recomendada: Gate Frontend + Seed Diferido (Híbrido)

1. **Backend**: Modificar `arranque_frio` para **NO llamar `ensure_seed`**. En su lugar, `completar_onboarding` sembrará el snapshot base (o uno vacío) al finalizar.
2. **Backend**: Añadir `onboarding_status` del perfil activo en la respuesta de `load_state` (nuevo campo opcional en `FinanceSnapshot` o command separado).
3. **Frontend**: En `SnapshotProvider`, tras `cargarSnapshot` OK, leer `onboarding_status` del perfil activo (vía `usarPerfiles` o nuevo campo en snapshot).
4. **Frontend**: Si `NotStarted`/`InProgress` → renderizar `OnboardingWizard` full-screen (modal o pantalla dedicada) **dentro del `SnapshotProvider`**, bloqueando `AppShell`.
5. **Frontend**: Al completar onboarding (`completarOnboarding` OK) → recargar snapshot → `AppShell` se muestra con datos ya sembrados.

### Alternativa Simple (Solo Frontend Gate)

1. **Backend**: Sin cambios (seed sigue existiendo).
2. **Frontend**: En `AppShell` o `SnapshotProvider`, si `activo?.onboarding_status != 'Completed'` → mostrar `OnboardingWizard` overlay.
3. **Problema**: Usuario ve datos ajenos en fondo/preview mientras hace onboarding. Menos limpio.

---

## Features Propuestas (Descomposición)

### Feature 29: `onboarding-auto-gate-startup` (Complejidad Media)
**Objetivo**: Gate automático al arranque — si perfil activo tiene `onboarding_status != Completed`, mostrar wizard en lugar de app principal.
- **Backend**: Extender `load_state` o nuevo command para incluir `onboarding_status` del activo.
- **Frontend**: `SnapshotProvider` coordina con `usarPerfiles`; render condicional `OnboardingWizard` vs `AppShell`.
- **Integración**: Al completar wizard → recargar snapshot → transición suave a `AppShell`.

### Feature 30: `onboarding-defer-seed-until-complete` (Complejidad Simple)
**Objetivo**: No sembrar datos de ejemplo hasta que el usuario complete onboarding.
- **Backend**: Quitar `ensure_seed` de `arranque_frio` y `recuperar` (R3). Añadir siembra en `completar_onboarding` (o `ensure_seed` condicional).
- **Resultado**: Primera carga de snapshot tras onboarding = datos reales del usuario (o vacío limpio), nunca datos de ejemplo.

### Feature 31: `onboarding-welcome-empty-state` (Complejidad Simple, opcional)
**Objetivo**: Pantalla de bienvenida / empty state antes del paso 1 del wizard (explicar app, beneficio, CTA "Empezar").
- **Frontend**: Nuevo paso 0 o pantalla previa al wizard. Solo UX, sin lógica backend.

---

## Criterios de Aceptación Medibles (para features)

**Feature 29**:
- `./init.sh` verde.
- Test: Arranque en directorio temporal SIN `profiles.json` → backend crea perfil "Personal" `NotStarted` → frontend muestra `OnboardingWizard` (no `AppShell`).
- Test: Arranque con perfil `Completed` → frontend muestra `AppShell` directamente.
- Test: Completar wizard → `onboarding_status = Completed` → `AppShell` visible con snapshot cargado.

**Feature 30**:
- `./init.sh` verde.
- Test: `arranque_frio` en directorio temporal → perfil creado, **NO** existe `perfiles/<id>/mfinance.json` (ni seed).
- Test: `completar_onboarding` → snapshot creado con seed base (o vacío) y `onboarding_status = Completed`.
- Test: Reinicio posterior → `load_state` carga snapshot sembrado correctamente.

---

## Preguntas para Clarificar (antes de implementar)

1. **¿Seed vacío o seed real tras onboarding?** ¿El snapshot post-onboarding debe tener datos de ejemplo (para que la app "funcione ya") o empezar vacío (usuario entra sus datos desde cero)?
2. **¿Wizard modal o pantalla completa?** ¿El `OnboardingWizard` se renderiza como overlay sobre `AppShell` (modal) o reemplaza toda la UI (`App.tsx` condicional)?
3. **¿Perfil "Personal" renombrable?** ¿El usuario puede cambiar el nombre "Personal" en el paso 1, o se queda fijo?
4. **¿Migración legacy?** Perfiles existentes (pre-onboarding) tienen `Completed`. Confirmar que NO ven wizard nunca.

---

## Conclusión

El onboarding **existe y está completo** (features 23-27), pero **falta el disparador automático en primera instalación**. La solución requiere coordinar backend (estado de onboarding visible al cargar) + frontend (gate condicional en `SnapshotProvider`/`AppShell`). Dos features cubren el gap principal; una tercera opcional mejora UX.