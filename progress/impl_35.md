# Implementación feature 35 — fix-onboarding-status-wire-format

Fecha: 2026-08-24
Estado: implementada y aprobada (`feature_list.json`: `done`).

## Alcance

- `OnboardingStatus` ahora serializa el contrato canónico `{ nombre: ... }` y
  conserva `current_step` para `InProgress`.
- La deserialización acepta el contrato canónico y las tres formas serde
  externas legacy ya persistidas.
- Se añadieron contratos Rust y Node para el wire format, gate y recargas de
  finalización/salto. No se añadieron dependencias ni se modificó la UI.

## TDD rojo → verde

### Rojo, antes de implementar

- `cargo test --manifest-path src-tauri/Cargo.toml onboarding_status_wire`:
  2 fallos. El serializer producía `"NotStarted"` en vez de
  `{"nombre":"NotStarted"}` y el deserializer rechazaba la clave `nombre`.
- `node --test tests/onboarding-status-wire/onboarding-status-wire-contract.test.mjs`:
  2 fallos de 4; faltaban `nombre` y el deserializer compatible en Rust.

### Verde, después de implementar

- `cargo test --manifest-path src-tauri/Cargo.toml onboarding_status_wire`:
  2 passed, 0 failed.
- `node --test tests/onboarding-status-wire/onboarding-status-wire-contract.test.mjs`:
  4 passed, 0 failed.

## Verificación final

- `cargo test --manifest-path src-tauri/Cargo.toml`: 328 passed, 0 failed.
- `pnpm test`: 621 passed, 0 failed.
- `./init.sh`: verde completo; formato, tests y build de producción OK.

## Archivos

- `src-tauri/src/domain/onboarding/status.rs`
- `src-tauri/src/domain/tests/onboarding_status_wire_tests.rs`
- `src-tauri/src/domain/tests/mod.rs`
- `tests/onboarding-status-wire/onboarding-status-wire-contract.test.mjs`
- `feature_list.json`, `progress/current.md`

`progress/review_35.md` contiene `APPROVED`; la feature 35 queda cerrada y se
conserva en el array de `feature_list.json`.
