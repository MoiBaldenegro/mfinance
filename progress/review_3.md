# Review — feature 3 (domain-core-backend)

**Veredicto:** APPROVED

> Veredicto actualizado en **Ronda 2** (2026-08-21). En la Ronda 1 el
> veredicto fue CHANGES_REQUESTED con un único cambio requerido; ese cambio
> quedó aplicado y verificado en disco. El historial íntegro de la Ronda 1
> se conserva al final de este archivo.

## Ronda 2 — re-revisión del cambio requerido #1 (2026-08-21)

Objeto del fix (único bloqueante de la Ronda 1): hueco de REQ-03-09 en
`Investment::new`, que aceptaba una `tasa_esperada_anual` negativa. El
implementer aplicó el fix test-first y documentó el ciclo en
`progress/impl_3.md` §6 («Ronda 2»).

### Verificación en disco del fix

| # | Punto | Evidencia | Resultado |
|---|-------|-----------|-----------|
| 1 | `impl_3.md` contiene sección «Ronda 2» con evidencia rojo→verde | `impl_3.md` §6: ROJO con `negative_expected_rate_is_rejected_by_name ... FAILED` (`33 passed; 1 failed`, `unwrap_err()` sobre un `Ok` — demuestra el hueco exacto) → guard → VERDE `34 passed; 0 failed` | ✅ |
| 2 | Guard presente en `Investment::new` | `src-tauri/src/domain/investment.rs:64`: `ensure_non_negative("Investment", "tasa_esperada_anual", tasa_esperada_anual)?;` — tercera guard, mismo patrón que `Liability::new` para su tasa (`liability.rs:23-24`) | ✅ |
| 3 | Test nuevo que espera el error nombrado | `src-tauri/src/domain/tests/investment_tests.rs:78-95`: `negative_expected_rate_is_rejected_by_name` construye `Investment::new(RentaVariable, 100.0, 1200.0, -5.0)` y espera exacto `NegativeValueError { entidad: "Investment", campo: "tasa_esperada_anual", valor: -5.0 }` | ✅ |

### Reproducción del reviewer (esta sesión, comandos ejecutados)

| Check | Comando | Resultado |
|-------|---------|-----------|
| Suite backend | `cargo test --manifest-path src-tauri/Cargo.toml` | `running 34 tests` … `test domain::tests::investment_tests::negative_expected_rate_is_rejected_by_name ... ok` → **34 passed; 0 failed** |
| Arnés global | `./init.sh` | todas las secciones ✔ (entorno, formato, tests node:test al 100%, build) → **INIT_EXIT=0** |
| Tamaño REQ-03-11 | `find src-tauri/src/domain -name "*.rs" -exec wc -l {} +` | máx **95 líneas** (`tests/investment_tests.rs`) ≤ 100; producción máx 87 (`investment.rs`) / 88 (`catalogs.rs`) |
| Pureza hexagonal | `grep -rni tauri src-tauri/src/domain` | exit 1 → **0 coincidencias** |
| Sin unwrap/expect/panic!/fs/red en producción | `grep -rnE "unwrap\\(|expect\\(|panic!|std::fs|File::open|TcpStream" src-tauri/src/domain/*.rs` | exit 1 → **0 coincidencias** (solo tests los usan) |

### Alcance de la ronda 2 (sin regresiones, nada fuera del fix)

- `src-tauri/src/domain/investment.rs`: solo +1 guard + doc de `new` (85→87 líneas).
- `src-tauri/src/domain/tests/investment_tests.rs`: solo +1 test (76→95 líneas).
- `progress/impl_3.md` (§6 Ronda 2) y `progress/current.md` (bitácora de ronda 2).
- `feature_list.json`: estado de F3 sigue `in_progress` (correcto: no se marcó
  `done` sin review); formato re-validado en verde por `./init.sh`.
- `lib.rs` intacto: única línea propia sigue siendo `pub mod domain;` (l.2).
- `Cargo.toml` intacto (validador de dependencias de `./init.sh` en verde);
  specs/, docs/, scripts/, src/ frontend sin tocar.

### Checkpoints tras la ronda 2

- C1 Arquitectura hexagonal respetada (dominio puro, puerto-trait): [x]
- C2 Convenciones de naming y estilo Rust: [x]
- C3 Ciclo rojo→verde documentado en `progress/impl_3.md` §6: [x]
- C4 Cobertura completa REQ-03-01..11: [x] ← REQ-03-09 cerrado con guard + test
- C5 `./init.sh` verde total + suites cargo/node al 100%: [x]

### Conclusión Ronda 2

El único cambio requerido se aplicó con ciclo test-first completo (ROJO
observado antes de la guard, test que fija el contrato del error nombrado,
VERDE 34/34), sin regresiones ni toques fuera de alcance; suite global
verde reproducida por el reviewer. La trazabilidad acceptance↔REQ↔código de
la feature 3 queda completa. **APPROVED.**

---

# Historial — Ronda 1 (2026-08-21)

**Veredicto:** CHANGES_REQUESTED *(resuelto en Ronda 2, ver arriba)*

Revisor externo, 2026-08-21. Revisión en disco de la feature 3 contra
`specs/03_domain-core-backend/requirements.md` (REQ-03-01..11),
`feature_list.json`, `docs/architecture.md`, `docs/conventions.md` y
`CHECKPOINTS.md`. Todos los comandos reproducidos por el reviewer en esta
sesión; no se editó código.

## Checklist con evidencia objetiva

| # | Validación | Evidencia | Resultado |
|---|-----------|-----------|-----------|
| 1 | Trazabilidad acceptance↔REQ↔implementación | 5/6 acceptance verificados al completo (ver detalle abajo); el criterio «grep sobre domain/ y application/» es vacuo en `application/` porque la carpeta aún no existe (le toca a F4: sus acceptance dicen «handlers que delegan en application/») | OK c/observación |
| 2a | REQ-03-01 catálogos EXACTOS + MonthlyRecord YYYY-MM | `catalogs.rs:10-15` IncomeSource{Salario,Freelance,Arriendos,Otros}; `catalogs.rs:48-55` ExpenseCategory{Vivienda,Alimentacion,Transporte,CuotasDeuda,Ocio,Otros}; claves canónicas `salario/freelance/arriendos/otros` y `vivienda/alimentacion/transporte/cuotas_deuda/ocio/otros` (`as_str`, l.27-34 y 69-78); `month_key.rs:29-51` valida YYYY-MM y mes 01..=12. Tests: `catalogs_tests.rs:8-39`, `monthly_record_tests.rs:18-39` | ✅ |
| 2b | REQ-03-02 Asset/Liability campos pedidos | `asset.rs:10-13` nombre+valor_actual; `liability.rs:10-14` nombre+saldo_pendiente+tasa_interes_anual. Tests: `asset_tests.rs:8-13`, `liability_tests.rs:8-18` | ✅ |
| 2c | REQ-03-03 Investment familias+aporte+valor+tasa editable | `investment.rs:11-15` {RentaFija,RentaVariable,FincaRaiz} = `renta_fija/renta_variable/finca_raiz`; campos `aporte_mensual`, `valor_actual`, `tasa_esperada_anual`. Test: `investment_tests.rs:32-44` | ✅ |
| 2d | REQ-03-04 AccountStatement saldo inicial/movimientos/saldo final | `account_statement.rs:19-24` + `theoretical_balance()` (l.58-61) = inicial + suma algebraica; `difference()` e `is_reconciled()`. Tests: `account_statement_tests.rs:32-52` | ✅ |
| 2e | REQ-03-05 FinanceSnapshot agregador | `snapshot.rs:36-49`: monthly_records, assets, liabilities, investments, account_statements, strategy(StrategySettings+DebtStrategy). Tests: `snapshot_tests.rs:38-61` | ✅ |
| 2f | REQ-03-06 trait SnapshotRepository load/save/export/import | `repository.rs:13-30`, cuatro operaciones tipadas sobre FinanceSnapshot. Doble en memoria `tests/fake_repository.rs` con dos ranuras (stored/exported). Tests: `repository_tests.rs:16-65` | ✅ |
| 3 | REQ-03-07 errores nombrados por operación fallible; sin unwrap/expect/panic! en producción ni errores genéricos | Errores propios: Unknown{Source,Category,Family}Error (`errors.rs`), NegativeValueError (`negative_value.rs`), InvalidMonthKeyError (`month_key.rs`), MonthlyRecordError (`monthly_record_error.rs`), Snapshot{Load,Save,Export,Import}Error (`repository_errors.rs`). `grep -rnE "unwrap\\(|expect\\(|panic!|todo!|unimplemented!" src-tauri/src/domain/*.rs` → **0 coincidencias** (exit 1); solo tests usan unwrap/expect | ✅ |
| 4 | REQ-03-08 fuera de catálogo rechazado con error nombrado (test) | `catalogs_tests.rs:42-61` («bono_extra»→UnknownSourceError, «viajes»→UnknownCategoryError); `monthly_record_tests.rs:42-73`; `investment_tests.rs:23-29` («cripto»→UnknownFamilyError) | ✅ |
| 4b | REQ-03-09 valor negativo rechazado (test) — **las tres entidades** | Asset ✓ (`asset_tests.rs:21-35`), Liability saldo ✓ y tasa ✓ (`liability_tests.rs:21-41`), Investment aporte ✓ y valor_actual ✓ (`investment_tests.rs:47-76`)… pero **tasa_esperada_anual SIN validar** → ver Cambios requeridos #1 | ⚠️ PARCIAL |
| 5 | PUREZA HEXAGONAL | `grep -rni tauri src-tauri/src/domain` → exit 1 (**0 coincidencias**); `grep -rnE "std::fs|std::net|std::process|File::open|File::create|TcpStream|UdpSocket|reqwest|ureq" src-tauri/src/domain/*.rs` (fuera de tests) → **0 coincidencias**; puerto = trait implementado por terceros (fake en memoria), tests sin disco/red | ✅ |
| 6 | serde derives permitidos; CERO dependencias nuevas | Decisión del líder registrada en `impl_3.md` §4.2. `src-tauri/Cargo.toml` = tauri, tauri-plugin-opener, serde(+derive), serde_json + build tauri-build: idéntico a las entradas vigentes de `docs/dependencies.md` (crates §96-130). Sin crates nuevos | ✅ |
| 7 | lib.rs mínimo; resto intacto | `lib.rs:2` única línea añadida `pub mod domain;`; comando `greet` intacto (l.4-7). No existe `commands/` ni `infrastructure/` (`ls src-tauri/src` → domain, lib.rs, main.rs). Frontend `src/` = scaffold original intacto. `./init.sh` valida formato de specs/, docs/, scripts/ → verde | ✅ |
| 8 | Calidad Rust / convenciones | Módulos snake_case, tipos PascalCase, errores con sufijo Error, mensajes en español (`conventions.md` §Nombres). `cargo check --manifest-path src-tauri/Cargo.toml` → `Finished dev profile ... in 0.29s`, **sin warnings** | ✅ |
| 9 | Suite global | `cargo test --manifest-path src-tauri/Cargo.toml` → **33 passed; 0 failed** (reproducido); `node --test` → **pass 21 / fail 0** (reproducido); `./init.sh` → todas las secciones ✔, **INIT_EXIT=0** (reproducido) | ✅ |
| 10 | Ciclo rojo/verde evidenciado en impl_3.md | `impl_3.md` §2: ROJO con 22× error[E0432] unresolved import (compilación fallida ANTES del código) + segundo ciclo corto E0277/E0603 documentado; §3: VERDE 33 passed. Test-first demostrado | ✅ |

Tamaño (REQ-03-11): `wc -l` máx. bajo `src-tauri/src/domain/` = **88**
(`catalogs.rs`); los 24 archivos .rs ≤100 líneas. Coincide con `impl_3.md`.

Dependencias de F3: `depends_on: []` → nada pendiente; no saltó ninguna
dependencia.

## Checkpoints (protocolo + CHECKPOINTS.md)

- C1 Arquitectura hexagonal respetada (dominio puro, puerto-trait, sin tauri/fs/red): [x]
- C2 Convenciones de naming y estilo Rust: [x]
- C3 Evidencia rojo→verde documentada en `progress/impl_3.md`: [x]
- C4 Cobertura completa de REQ-03-01..11 (trazabilidad sin huecos): [ ] ← Razón: REQ-03-09 incompleto para Investment (tasa negativa aceptada)
- C5 `./init.sh` verde total + suites cargo/node al 100%: [x]

## Cambios requeridos

1. **REQ-03-09 hueco en Investment (bloqueante).**
   `src-tauri/src/domain/investment.rs:55-64` — `Investment::new` valida
   `aporte_mensual` y `valor_actual` pero NO `tasa_esperada_anual`: hoy
   `Investment::new(familia, 100.0, 1200.0, -5.0)` devuelve `Ok`,
   incumpliendo «IF un Investment recibe un valor negativo THEN el dominio
   SHALL rechazarlo». La tasa forma parte de la entidad según REQ-03-03 y el
   propio código ya trata las tasas como validables: `Liability::new`
   rechaza su tasa negativa (`liability.rs:23-24`,
   test `liability_tests.rs:30-41`). Asimetría sin justificación en
   `impl_3.md` §4.
   Acción: test-first — añadir test que observe ROJO al construir una
   Investment con tasa negativa esperando `NegativeValueError { entidad:
   "Investment", campo: "tasa_esperada_anual", .. }`, luego añadir en
   `Investment::new` la guard `ensure_non_negative("Investment",
   "tasa_esperada_anual", tasa_esperada_anual)?` y dejar `cargo test` en
   verde (33+N passed). Documentar el ciclo en `progress/impl_3.md`.

## Observaciones (no bloqueantes)

- Acceptance #2 de F3 menciona `src-tauri/src/application/`: la carpeta no
  existe todavía y todos los REQ-03-* están acotados a `domain/`; la capa
  application llega con F4 («handlers que delegan en application/»). El
  grep es vacuamente cierto hoy; quedaría cubierto de verdad cuando exista.
- «Tasa esperada editable» (REQ-03-03) se satisface hoy vía reconstrucción
  inmutable (getters + `new`); el test `builds_investment_with_editable_
  expected_rate` solo prueba construcción. Si F11 prefiere un mutador
  explícito, se decide ahí; no bloquea esta feature.

## Conclusión

Trabajo excelente en pureza hexagonal, errores nombrados, tamaño y ciclo
test-first, con suite global verde reproducida por el reviewer. Se pide un
único ajuste accionable (guard + test de REQ-03-09 para la tasa de
Investment) antes de aprobar.
