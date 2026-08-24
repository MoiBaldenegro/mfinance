# Informe de implementación: Feature 30 — onboarding-defer-seed-until-complete

## Resumen

Implementación completa de la feature 30 que diferir la siembra de datos de ejemplo (seed) hasta que el usuario complete el onboarding. Antes, `arranke_frio` y `recuperar` (regla R3) llamaban a `ensure_seed` sembrando 12 meses de datos de ejemplo. Ahora, el seed solo se siembra en `completar_onboarding` usando un snapshot vacío mínimo.

## Cambios realizados

### Backend (Rust)

#### 1. `src-tauri/src/application/arranque_perfiles.rs`
- **`arranke_frio`**: Eliminada la llamada a `ensure_seed::ensure_seed(store)`. El flujo frío ahora crea el perfil "Personal" con `onboarding_status = NotStarted` y **no** siembra snapshot.
- Comentario actualizado referenciando REQ-30-01 y REQ-30-03.

#### 2. `src-tauri/src/application/recuperacion_arranque.rs`
- **Regla R3**: Eliminada la llamada a `ensure_seed::ensure_seed(store)`. Ahora R3 solo persiste el primer perfil como activo y devuelve `Ok(false)` sin sembrar.
- Import actualizado: `use crate::application::arranque_perfiles::arranke_frio;`
- Comentario actualizado referenciando REQ-30-02 y REQ-30-03.

#### 3. `src-tauri/src/infrastructure/json_repository.rs`
- Constante `SIN_ACTIVO` cambiada de `"sin perfil activo: no hay snapshot que operar"` a `"sin perfil activo no hay snapshot que operar"` (sin dos puntos) para cumplir REQ-30-06 exactamente.

#### 4. `src-tauri/src/application/perfiles_onboarding/finalizar.rs`
- **`completar_onboarding_en_adaptador`**: No se requirió cambio en la lógica de siembra porque `consolidar` ya usaba `snapshots.load().unwrap_or_default()` que crea `FinanceSnapshot::default()` (snapshot vacío mínimo) cuando no existe archivo. El comportamiento ya era correcto para REQ-30-03/05.

### Tests actualizados (comportamiento anterior → nuevo)

#### `src-tauri/src/application/tests/arranke_tests.rs`
- `sin_nada_crea_el_perfil_inicial_sin_sembrar_seed`: verifica que NO hay snapshot tras arranque frío y `onboarding_status = NotStarted`
- `con_registro_previo_no_repite_ni_alta_ni_siembra`: verifica que no hay seed en ningún arranque
- `con_legado_pendiente_lo_adopta_al_primer_perfil_sin_sembrar`: verifica que adopta legado sin seed adicional

#### `src-tauri/src/infrastructure/arranke_guarda_tests.rs`
- `sin_ningun_perfil_crea_inicial_sin_sembrar_seed`: flujo frío crea perfil sin snapshot; `load` falla con error de archivo no encontrado
- `completar_onboarding_siembra_snapshot_vacio_minimo`: **nuevo test** que verifica que completar onboarding siembra snapshot vacío + onboarding

#### `src-tauri/src/infrastructure/recuperacion_flujo_frio_tests.rs`
- `sin_ningun_snapshot_legible_r3_persiste_activo_sin_sembrar`: R3 persiste activo sin sembrar
- `registro_sin_perfiles_flujo_frio_crea_inicial_sin_seed`: flujo frío sin seed
- `registro_sin_perfiles_adopta_el_legado_pendiente_sin_seed_adicional`: adopta legado sin seed extra
- `completar_onboarding_siembra_snapshot_en_perfil_sin_datos`: completar onboarding siembra en perfil R3

### Nuevos tests TDD (feature 30)

#### `src-tauri/src/infrastructure/onboarding_defer_seed_tests.rs` (7 tests)
1. `arranke_frio_crea_perfil_sin_snapshot_ni_seed` — REQ-30-01
2. `recuperar_r3_no_llama_ensure_seed_solo_persiste_activo` — REQ-30-02
3. `completar_onboarding_siembra_snapshot_vacio_minimo_si_no_existe` — REQ-30-03/05
4. `completar_onboarding_no_resiembra_si_snapshot_ya_existe` — REQ-30-04
5. `reinicio_post_onboarding_carga_snapshot_sembrado` — REQ-30-07
6. `migracion_legacy_mantiene_completed_y_snapshot_intacto_recuperar_r1_no_toca_seed` — REQ-30-08
7. `load_state_error_sin_perfil_activo_mensaje_exacto` — REQ-30-06

### Documentación

#### `specs/30_onboarding-defer-seed-until-complete/design.md`
Decisión REQ-30-05: **Opción B — Snapshot vacío mínimo** con justificación completa.

## Verificación

### Tests cargo (318 tests)
```
test result: ok. 318 passed; 0 failed
```

### ./init.sh
```
=== init.sh: verificando entorno ===
✔ Herramientas y dependencias
✔ Archivos del harness
✔ Formato
✔ Tests al 100% (node:test)
✔ Build de producción (pnpm build)
✔ El entorno está perfecto.
```

### Reglas hexagonales
- `grep -ri tauri src-tauri/src/domain/ src-tauri/src/application/` → 0 coincidencias ✔
- `grep -ri invoke src/ | grep -v src/adapters/` → 0 coincidencias ✔
- Archivos de producción ≤ 100 líneas (tests exceptuados) ✔

## Criterios de aceptación cubiertos

| REQ | Descripción | Estado |
|-----|-------------|--------|
| REQ-30-01 | `arranke_frio` crea perfil Personal NotStarted sin `ensure_seed` | ✅ Tests + implementación |
| REQ-30-02 | `recuperar` R3 no llama `ensure_seed`, persiste activo, `Ok(false)` | ✅ Tests + implementación |
| REQ-30-03 | `completar_onboarding` siembra snapshot vacío mínimo si no existe | ✅ Tests + `unwrap_or_default()` |
| REQ-30-04 | `completar_onboarding` NO resiembra si snapshot existe | ✅ Test `completar_onboarding_no_resiembra_si_snapshot_ya_existe` |
| REQ-30-05 | Decisión documentada en `design.md` (Opción B: vacío mínimo) | ✅ `design.md` creado |
| REQ-30-06 | `load_state` error `SnapshotLoadError` mensaje exacto | ✅ Constante `SIN_ACTIVO` ajustada + test |
| REQ-30-07 | Tests TDD cubren 4 escenarios principales | ✅ 7 tests en `onboarding_defer_seed_tests.rs` |
| REQ-30-08 | Migración legacy mantiene `Completed` + snapshot intacto; R1 no toca seed | ✅ Test `migracion_legacy_mantiene_completed_y_snapshot_intacto_recuperar_r1_no_toca_seed` |

## Evidencia ciclo rojo/verde

**Fase ROJO (tests escritos primero, fallando):**
- 6 de 7 tests nuevos fallaban inicialmente
- 3 tests existentes fallaban por cambio de comportamiento esperado

**Fase VERDE (implementación + fix tests):**
- Todos los 7 tests nuevos pasan
- Todos los 3 tests existentes actualizados pasan
- Suite completa: 318 tests pasan
- `./init.sh` verde completo

---

**Fecha:** 2026-08-24  
**Estado:** Implementación completa, lista para revisión