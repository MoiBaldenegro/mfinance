# Review — feature 32 fix-balance-crud-commands

**Veredicto:** APPROVED

## Checkpoints
- C1 (TDD rojo→verde): [x] — `progress/impl_32.md` §Evidencia documenta el rojo con salida de compilación real (`error[E0432]: unresolved import crate::application::balance_crud`) antes del código y el verde posterior (8 suites nuevas, 318→326 tests cargo). Verificado en disco: las 8 pruebas existen y pasan (`cargo test balance_crud` → 8 passed).
- C2 (4 commands finos y registrados): [x] — `src-tauri/src/commands/balance_commands.rs`: `asset_upsert`, `asset_eliminar`, `liability_upsert`, `liability_eliminar` son `#[tauri::command]` que solo hacen lock + delegación en `application::balance_crud`; sin filesystem directo ni lógica. Registrados en `generate_handler!` de `src-tauri/src/lib.rs` línea 82.
- C3 (validaciones REQ-32-04 sin persistir): [x] — validación de dominio ANTES de tocar el snapshot (`Asset::new`/`Liability::new` → `BalanceCrudError::ValorNegativo`, más `CategoriaInvalida`), códigos IPC nombrados en español (`ValidacionError`/`SnapshotLoadError`/`SnapshotSaveError` en `balance_crud_error.rs`). Los tests `asset_con_valor_negativo_rechaza_sin_persistir_cambios`, `categoria_desconocida_rechaza_sin_persistir_cambios` y `pasivo_con_saldo_o_tasa_negativos_rechaza_sin_persistir_cambios` verifican con re-lectura real que nada se persiste.
- C4 (test de contrato actualizado): [x] — `tests/contrato-ipc-adapters/contrato-invoke-commands.test.mjs` (99 líneas): allowlist `PENDIENTES_32` eliminada (grep en repo: solo quedan menciones documentales en progress/, ninguna en código); `COMMANDS_BALANCE` exige existencia de los 4 commands y claves camelCase `valorActual`/`saldoPendiente`/`tasaInteresAnual` (líneas 74, 93-98); el adapter envía exactamente esas claves (`snapshot-ipc-adapter.ts` líneas 88-107).
- C5 (hexagonal / límites / deps): [x] — `grep -ri tauri src-tauri/src/domain` = 0; archivos NUEVOS todos ≤99 líneas (`balance_crud.rs` 91, `balance_commands.rs` 92, `balance_crud_error.rs` 48, tests ≤68); sin dependencias nuevas (los diffs de `package.json`/`Cargo.toml`/`docs/dependencies.md` frente a HEAD corresponden a chart.js f7 y pdf-extract f12, ya aprobadas y previas a esta feature). invoke() solo bajo `src/adapters`.
- C6 (suites verdes): [x] — ejecutado por el reviewer: `cargo test --manifest-path src-tauri/Cargo.toml` → 326 passed / 0 failed; `pnpm test` → 587 pass / 0 fail; `./init.sh` → «El entorno está perfecto» (formato + node:test 100% + build).
- C7 (estado en feature_list.json): [x] — la feature 32 está `in_progress` «pendiente de review» según `progress/current.md`: correcto; el paso a `done` corresponde al líder tras este APPROVED (ningún criterio de aceptación exige que el implementador la marque done antes del review; todas las condiciones para ello se cumplen).
- C8 (progress/current.md actualizado): [x] — documenta ciclo rojo→verde, verificación y siguiente paso.

## Notas (no bloqueantes)
1. `lib.rs` queda en 103 líneas y `snapshot-ipc-adapter.ts` en 155: ambos PREEXISTENTES por encima del límite blando y modificados (no nuevos); la aceptación de la f32 solo cubre archivos nuevos. Ya documentado como observación en `impl_32.md` §Observaciones; candidato a refactor propio.
2. Observación válida del implementador: `CategoriaActivo` TS es lowercase mientras el JSON backend trae `Liquido|Inversion|Propiedad`; `categoria_de()` lo tolera en entrada, pero la lectura de etiquetas en tablas puede necesitar normalización en una feature propia.
3. REQ-32-06 (CRUD visible tras recarga) queda cubierto por cableado completo + round-trip real con relectura (fixtures sobre directorio temporal, instancia nueva del adapter) y test de contrato; la comprobación visual end-to-end en `pnpm tauri dev` corresponde al humano/líder si lo desea.

## Cambios requeridos
Ninguno.
