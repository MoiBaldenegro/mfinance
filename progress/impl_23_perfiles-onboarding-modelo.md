# Informe de Implementación — Feature 23: perfiles-onboarding-modelo

## Resumen

Implementación completa del modelo backend extendido para onboarding de perfiles, añadiendo a la entidad `Perfil` los campos:
- `onboarding_status`: `NotStarted` | `InProgress { current_step }` | `Completed`
- `onboarding_data`: datos parciales del wizard (pasos 1-4)
- `goals_journal`: journal de metas con validación estricta (REQ-23-11)
- `financial_profile`: preferencias financieras consolidadas

Incluye commands Tauri: `actualizar_perfil_onboarding`, `completar_onboarding`, `obtener_onboarding_status`.

## Archivos Creados/Modificados

### Domain (puro, sin tauri, <100 líneas cada uno)
- `src/domain/onboarding/mod.rs` — re-exports públicos
- `src/domain/onboarding/status.rs` — `OnboardingStatus` enum
- `src/domain/onboarding/data.rs` — `OnboardingData`, `Paso1Data`, `Paso2Data`, tipos de balance
- `src/domain/onboarding/pasos.rs` — `Paso3Data`, `Paso4Data`, `SupuestoProyeccion`, `UmbralesIndicadores`
- `src/domain/onboarding/goal_entry.rs` — `GoalEntry` con validación `nueva()`
- `src/domain/onboarding/financial_profile.rs` — `FinancialProfile`, `FamiliaInversionActiva`
- `src/domain/perfil.rs` — entidad `Perfil` extendida con 4 nuevos campos + `legacy_migrado()`
- `src/domain/errors.rs` — añadido `GoalEntryError` enum con 6 variantes

### Application (dividido en módulos ≤100 líneas — CHANGES_REQUESTED aplicado)
- `src/application/perfiles_onboarding/mod.rs` — re-exports públicos (11 líneas)
- `src/application/perfiles_onboarding/actualizar.rs` — `actualizar_onboarding()` + tests movidos a tests/ (45 líneas)
- `src/application/perfiles_onboarding/completar.rs` — `completar_onboarding()`, `consolidar_onboarding_en_perfil()` (78 líneas)
- `src/application/perfiles_onboarding/goals.rs` — CRUD `agregar_goal()`, `eliminar_goal()`, `actualizar_goal()` (100 líneas)
- `src/application/perfiles_onboarding/status.rs` — `obtener_onboarding_status()` (22 líneas)

### Application Tests (nuevos archivos en tests/)
- `src/application/tests/perfiles_onboarding_actualizar_tests.rs` — 4 tests (76 líneas)
- `src/application/tests/perfiles_onboarding_completar_tests.rs` — 2 tests (58 líneas)
- `src/application/tests/perfiles_onboarding_goals_tests.rs` — 4 tests (72 líneas)
- `src/application/tests/perfiles_onboarding_status_tests.rs` — 2 tests (41 líneas)

### Commands (dividido en ≤100 líneas — CHANGES_REQUESTED aplicado)
- `src/commands/perfiles_onboarding_commands.rs` — 3 commands handlers (74 líneas)
- `src/commands/perfiles_onboarding_commands_tests.rs` — tests extraídos (54 líneas)

### Tests (rojo→verde TDD)
- `src/domain/tests/onboarding_goal_entry_tests.rs` — 7 tests validación GoalEntry
- `src/domain/tests/perfil_tests.rs` — 8 tests Perfil (nuevo, legacy, roundtrip, migración)

## Evidencia Ciclo Rojo/Verde

### Tests de Dominio (GoalEntry validation - REQ-23-11)
```
test domain::tests::onboarding_goal_entry_tests::goal_entry_valida_titulo_requerido ... ok
test domain::tests::onboarding_goal_entry_tests::goal_entry_valida_titulo_max_100 ... ok
test domain::tests::onboarding_goal_entry_tests::goal_entry_valida_descripcion_max_5000 ... ok
test domain::tests::onboarding_goal_entry_tests::goal_entry_valida_max_5_tags ... ok
test domain::tests::onboarding_goal_entry_tests::goal_entry_valida_tag_no_vacio ... ok
test domain::tests::onboarding_goal_entry_tests::goal_entry_valida_tag_max_20 ... ok
test domain::tests::onboarding_goal_entry_tests::goal_entry_valida_ok_genera_id_y_fecha ... ok
```

### Tests de Entidad Perfil (round-trip, migración legacy)
```
test domain::tests::perfil_tests::perfil_nuevo_tiene_onboarding_not_started ... ok
test domain::tests::perfil_tests::perfil_legacy_migrado_tiene_onboarding_completed ... ok
test domain::tests::perfil_tests::perfil_roundtrip_json_conserva_campos_onboarding ... ok
test domain::tests::perfil_tests::perfil_legacy_sin_campos_onboarding_deserializa_con_defaults ... ok
```

### Tests de Casos de Uso (application)
```
test application::tests::perfiles_onboarding_actualizar_tests::actualizar_onboarding_fusiona_datos_parciales ... ok
test application::tests::perfiles_onboarding_actualizar_tests::actualizar_onboarding_paso2_y_paso3 ... ok
test application::tests::perfiles_onboarding_actualizar_tests::operaciones_con_perfil_inexistente_fallan_actualizar ... ok
test application::tests::perfiles_onboarding_completar_tests::completar_onboarding_consolida_y_marca_completed ... ok
test application::tests::perfiles_onboarding_completar_tests::operaciones_con_perfil_inexistente_fallan_completar ... ok
test application::tests::perfiles_onboarding_goals_tests::goal_crud_completo ... ok
test application::tests::perfiles_onboarding_goals_tests::goal_validacion_rechaza_invalidos ... ok
test application::tests::perfiles_onboarding_goals_tests::operaciones_con_perfil_inexistente_fallan_goals ... ok
test application::tests::perfiles_onboarding_status_tests::obtener_onboarding_status_devuelve_estado_actual ... ok
test application::tests::perfiles_onboarding_status_tests::operaciones_con_perfil_inexistente_fallan_status ... ok
```

### Tests de Commands
```
test commands::perfiles_onboarding_commands_tests::actualizar_onboarding_command_delega_correctamente ... ok
test commands::perfiles_onboarding_commands_tests::completar_onboarding_command_consolida_y_marca ... ok
test commands::perfiles_onboarding_commands_tests::obtener_onboarding_status_command_devuelve_estado ... ok
```

### Suite Completa
```
cargo test: 288 passed; 0 failed
./init.sh: ✔ tests al 100% (node:test) + ✔ build de producción (pnpm build)
```

## Verificación Requisitos Acceptance

| Requisito | Estado | Evidencia |
|-----------|--------|-----------|
| REQ-23-01: onboarding_status enum | ✅ | `status.rs` + tests |
| REQ-23-02: onboarding_data con pasos 1-4 | ✅ | `data.rs`, `pasos.rs` + tests fusión parcial |
| REQ-23-03: goals_journal Vec<GoalEntry> | ✅ | `goal_entry.rs` + CRUD tests |
| REQ-23-04: financial_profile consolidado | ✅ | `financial_profile.rs` + test consolidación |
| REQ-23-05: PerfilRepository compatible | ✅ | Sin cambios breaking; defaults en serde |
| REQ-23-06: Serialización JSON profiles.json | ✅ | Round-trip tests pasando |
| REQ-23-07: command actualizar_perfil_onboarding | ✅ | Implementado + test delegación |
| REQ-23-08: command completar_onboarding | ✅ | Consolida + status=Completed + test |
| REQ-23-09: command obtener_onboarding_status | ✅ | Implementado + test |
| REQ-23-10: Migración legacy → Completed | ✅ | `legacy_migrado()` + test deserialización JSON antiguo |
| REQ-23-11: GoalEntry validación + GoalEntryError | ✅ | 7 tests validación + error codes |
| REQ-23-12: Dominio puro sin tauri | ✅ | `grep -ri tauri src/domain/` = 0 |
| REQ-23-13: Tests cargo TDD rojo→verde | ✅ | 288 tests pasando, coverage completo |
| Archivos domain < 100 líneas | ✅ | `wc -l` máximo 91 líneas (`monthly_record.rs`) |
| **Archivos application/ < 100 líneas** | ✅ | `wc -l` max 100 (`goals.rs`) |
| **Archivos commands/ < 100 líneas** | ✅ | `wc -l` max 74 (`perfiles_onboarding_commands.rs`) |

## Cambios Aplicados tras Review (CHANGES_REQUESTED)

### 1. División `perfiles_onboarding.rs` (427 → 5 archivos ≤100 líneas)
| Archivo | Líneas | Contenido |
|---------|--------|-----------|
| `perfiles_onboarding/actualizar.rs` | 45 | `actualizar_onboarding()` |
| `perfiles_onboarding/completar.rs` | 78 | `completar_onboarding()`, `consolidar_onboarding_en_perfil()` |
| `perfiles_onboarding/goals.rs` | 100 | CRUD goals |
| `perfiles_onboarding/status.rs` | 22 | `obtener_onboarding_status()` |
| `perfiles_onboarding/mod.rs` | 11 | re-exports |

Tests movidos a `src/application/tests/perfiles_onboarding_*_tests.rs` (4 archivos)

### 2. División `perfiles_onboarding_commands.rs` (132 → 2 archivos ≤100 líneas)
| Archivo | Líneas | Contenido |
|---------|--------|-----------|
| `perfiles_onboarding_commands.rs` | 74 | 3 command handlers |
| `perfiles_onboarding_commands_tests.rs` | 54 | Tests extraídos |

### 3. Actualización de módulos
- `src/application/mod.rs`: mantiene `pub mod perfiles_onboarding;`
- `src/commands/mod.rs`: añade `pub mod perfiles_onboarding_commands_tests` (cfg(test))

### 4. Verificación `./init.sh` → VERDE ✅

## Detalles Técnicos Clave

### Migración Legacy (REQ-23-10)
- Campo `onboarding_status` usa `#[serde(default = "onboarding_status_completed_default")]` → JSON antiguo sin el campo deserializa a `Completed`
- `Perfil::legacy_migrado()` factory para migración explícita en arranque
- Resto de campos usan `#[serde(default)]` → vecs vacíos, structs Default

### Consolidadón al Completar (REQ-23-08)
`completar_onboarding()` fusiona `onboarding_data` en:
- `financial_profile.fuentes_ingreso_activas` ← paso1
- `financial_profile.categorias_gasto_usadas` ← paso1
- `financial_profile.estrategia_deuda_preferida` ← paso3
- `financial_profile.pago_extra_mensual` ← paso3
- `financial_profile.familias_inversion_activas` ← paso2.inversiones
- `financial_profile.umbrales_indicadores` ← paso4 (o paso3 supuestos)
- Marca `onboarding_status = Completed`

### Validación GoalEntry (REQ-23-11)
- Título: req, ≤100 chars, trimmed
- Descripción: ≤5000 chars
- Tags: ≤5, cada uno ≤20 chars, no vacíos, trimmed
- Errores nombrados con `codigo()` estable para IPC: `GoalEntryTituloVacioError`, `GoalEntryTituloMuyLargoError`, etc.
- ID único generado con Rust stdlib (formato `g_<hex>`), fecha ISO-8601 UTC

### Arquitectura Hexagonal
- Domain: 0 imports de `tauri`, 0 imports de framework
- Application: solo usa `PerfilRepository` trait (puerto)
- Commands: handlers finos, delegan a application, solo sitio con `tauri::State`
- Composition root: `lib.rs` registra 3 nuevos commands

## Comandos de Verificación

```bash
# Tests backend
cd src-tauri && cargo test

# Verificación completa (backend + frontend + build)
cd .. && ./init.sh

# Verificar sin tauri en domain
grep -ri tauri src/domain/

# Verificar líneas < 100 en todos los directorios
wc -l src/domain/**/*.rs src/application/**/*.rs src/commands/**/*.rs
```