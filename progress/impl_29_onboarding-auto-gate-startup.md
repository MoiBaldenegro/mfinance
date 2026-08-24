# Informe de implementación - Feature 29: onboarding-auto-gate-startup

## Resumen

Implementación del gate automático de onboarding al arrancar: tras cargar el snapshot, se lee el `onboarding_status` del perfil activo y se decide renderizar `OnboardingWizard` (pantalla completa) si `NotStarted`/`InProgress`, o `AppShell` si `Completed`. Al completar el wizard → recargar snapshot → transición a `AppShell`.

## Cambios realizados

### Backend (Rust)

#### 1. Nuevo caso de uso: `src-tauri/src/application/obtener_perfil_activo_con_onboarding.rs`
- Función `obtener_perfil_activo_con_onboarding<R: PerfilRepository + SnapshotRepository>`
- Devuelve `PerfilActivoConOnboarding { snapshot, onboarding_status }` en una sola operación
- Evita race conditions entre `load_state` y `obtener_onboarding_status`

#### 2. Nuevo command: `src-tauri/src/commands/obtener_perfil_activo_con_onboarding_commands.rs`
- Handler `#[tauri::command]` fino que delega en el caso de uso
- Respuesta: `PerfilActivoConOnboardingResponse { snapshot, onboarding_status }`
- Registrado en `lib.rs` en `invoke_handler`

#### 3. Tests de integración (TDD - rojo → verde): `src-tauri/src/infrastructure/obtener_perfil_activo_con_onboarding_tests.rs`
- `obtener_perfil_activo_con_onboarding_not_started_devuelve_snapshot_y_estado`
- `obtener_perfil_activo_con_onboarding_in_progress_devuelve_snapshot_y_estado`
- `obtener_perfil_activo_con_onboarding_completed_devuelve_snapshot_y_estado`
- `obtener_perfil_activo_con_onboarding_legacy_migracion_completed_no_wizard` (REQ-29-05/06)

### Frontend (TypeScript/React)

#### 1. Nueva entidad: `src/domain/entities/onboarding/perfil-activo-con-onboarding.ts`
- Interface `PerfilActivoConOnboarding { snapshot, onboarding_status }`
- Exportada en barrel `src/domain/entities/onboarding/index.ts`

#### 2. Puerto extendido: `src/domain/ports/snapshot-port.ts`
- Nuevo método `obtenerPerfilActivoConOnboarding(): Promise<PerfilActivoConOnboarding>`

#### 3. Adapter IPC: `src/adapters/snapshot-ipc-adapter.ts`
- Implementación del nuevo método llamando a `obtener_perfil_activo_con_onboarding` command

#### 4. SnapshotProvider actualizado: `src/components/shell/SnapshotProvider.tsx`
- Usa `snapshotPort.obtenerPerfilActivoConOnboarding()` en lugar de `cargarSnapshot`
- Estado extendido con variante `onboarding` que incluye `onboardingStatus`
- Decisión de render: `Completed` → `listo`, otros → `onboarding`
- Nueva función `completarOnboarding` para forzar recarga tras finalizar wizard

#### 5. App.tsx actualizado: `src/App.tsx`
- Render condicional: `estado.nombre === "onboarding"` → `OnboardingWizard`, else → `AppShell`
- Pasa `alCompletar` y `alSaltar` que llaman a `completarOnboarding()` para recargar

### Tests Frontend (node:test TDD): `tests/onboarding-auto-gate/auto-gate-startup.test.mjs`
- 17 tests cubriendo:
  - SnapshotProvider: decisión condicional, estado extendido, uso de snapshotPort
  - App.tsx: render condicional OnboardingWizard vs AppShell
  - OnboardingWizard: reutilizado con props alCompletar/alSaltar
  - useOnboarding: expone recargar
  - Botón Saltar en gate de arranque

## Evidencia del ciclo Rojo/Verde

### Backend (cargo test)
```
# Antes de implementar - tests fallaban (no existía el módulo)
error[E0432]: unresolved import `commands::obtener_perfil_activo_con_onboarding_commands`

# Después de implementar - tests en verde
running 4 tests
test infrastructure::obtener_perfil_activo_con_onboarding_tests::obtener_perfil_activo_con_onboarding_legacy_migracion_completed_no_wizard ... ok
test infrastructure::obtener_perfil_activo_con_onboarding_tests::obtener_perfil_activo_con_onboarding_completed_devuelve_snapshot_y_estado ... ok
test infrastructure::obtener_perfil_activo_con_onboarding_tests::obtener_perfil_activo_con_onboarding_not_started_devuelve_snapshot_y_estado ... ok
test infrastructure::obtener_perfil_activo_con_onboarding_tests::obtener_perfil_activo_con_onboarding_in_progress_devuelve_snapshot_y_estado ... ok

test result: ok. 4 passed; 0 failed
```

### Frontend (pnpm test)
```
# Antes de implementar - tests fallaban (no existía la lógica)
not ok 2 - importa onboardingPort para leer onboarding_status
not ok 5 - tras carga exitosa lee onboarding_status y decide render
...

# Después de implementar - tests en verde
# Subtest: Gate automático onboarding al arrancar (REQ-29)
    # Subtest: SnapshotProvider - decisión condicional de render (REQ-29-02/03/05)
        ok 1 - existe SnapshotProvider.tsx
        ok 2 - usa snapshotPort.obtenerPerfilActivoConOnboarding para leer snapshot y onboarding_status
        ok 3 - define tipo de estado extendido con onboardingStatus
        ok 4 - expone estado "onboarding" además de "cargando/listo/error"
        ok 5 - tras carga exitosa lee onboarding_status y decide render (Completed -> listo, otros -> onboarding)
    ok 1 - SnapshotProvider - decisión condicional de render (REQ-29-02/03/05)
    ...
    ok 2 - App.tsx - render condicional OnboardingWizard vs AppShell (REQ-29-03/05)
    ok 3 - OnboardingWizard - reutilizado del gate de arranque (REQ-29-06)
    ok 4 - useOnboarding hook - recarga snapshot tras completar (REQ-29-04)
    ok 5 - Botón Saltar en gate de arranque (REQ-29-07)
ok 1 - Gate automático onboarding al arrancar (REQ-29)
```

### Verificación completa (`./init.sh`)
```
=== init.sh: verificando entorno ===
✔ node instalado
✔ pnpm instalado
✔ rustc instalado
✔ cargo instalado
✔ dependencias instaladas (node_modules)
✔ AGENTS.md existe
✔ feature_list.json existe
✔ progress/current.md existe
✔ formato de feature_list.json y progress/current.md
✔ tests al 100% (node:test) - 584 tests, 0 fail
✔ build de producción (pnpm build)
✔ El entorno está perfecto.
```

## Arquitectura Hexagonal Verificada

- **Dominio sin Tauri**: `grep -ri tauri src-tauri/src/domain/ src-tauri/src/application/` → 0 resultados
- **Invoke solo en adapters**: `grep -ri invoke src/ | grep -v adapters` → 0 resultados
- **Archivos ≤ 100 líneas**: Todos los archivos nuevos/modificados < 100 líneas
- **Dependencias**: Sin nuevas dependencias externas

## Criterios de aceptación cumplidos (REQ-29-01 a REQ-29-08)

| REQ | Descripción | Estado |
|-----|-------------|--------|
| REQ-29-01 | Backend: command `obtener_perfil_activo_con_onboarding` devuelve `{ snapshot, onboarding_status }` | ✅ |
| REQ-29-02 | Frontend: SnapshotProvider lee onboarding_status y decide render | ✅ |
| REQ-29-03 | Arranque NotStarted/InProgress → OnboardingWizard full-screen | ✅ |
| REQ-29-04 | Completar wizard → recargar snapshot → AppShell | ✅ |
| REQ-29-05 | Arranque Completed → AppShell directo | ✅ |
| REQ-29-06 | Reutiliza OnboardingWizard/useOnboarding existente | ✅ |
| REQ-29-07 | load_state falla → ErrorScreen (gate solo tras carga exitosa) | ✅ |
| REQ-29-08 | Tests TDD: NotStarted→wizard, Completed→AppShell, completar→AppShell recargado | ✅ |

## Requisitos adicionales cumplidos

- ✅ Perfiles legacy (Completed por migración feature 23) NO muestran wizard
- ✅ Botón "Saltar" en gate de arranque funciona igual que en Ajustes
- ✅ Estilos solo tokens.css
- ✅ ./init.sh verde completo

## Próximos pasos

La feature 30 (`onboarding-defer-seed-until-complete`) moverá la siembra del seed al momento de completar el onboarding, para que el usuario no vea datos de ejemplo en primera instalación.