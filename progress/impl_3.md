# Informe de implementación — Feature 3: domain-core-backend

> Sesión implementer, 2026-08-21. Test-first estricto: tests escritos contra
> la spec (`specs/03_domain-core-backend/requirements.md`) antes que el
> código, ROJO observado y guardado, luego implementación hasta VERDE.

## 1. Estructura creada

Todo bajo `src-tauri/src/domain/` (nuevo) + una línea en `lib.rs`.
Ningún archivo supera las 100 líneas (REQ-03-11); máximo real: 88.

```
src-tauri/src/
├── lib.rs                                  (+1 línea: pub mod domain;)
└── domain/
    ├── mod.rs                        20    declara módulos + #[cfg(test)] tests
    ├── catalogs.rs                   88    IncomeSource (4) + ExpenseCategory (6), ALL/parse/as_str
    ├── month_key.rs                  63    MonthKey YYYY-MM + InvalidMonthKeyError
    ├── monthly_record.rs             81    entidad MonthlyRecord + from_raw + totales
    ├── monthly_record_error.rs       31    MonthlyRecordError (InvalidMonth|UnknownSource|UnknownCategory)
    ├── asset.rs                      34    Asset(nombre, valor_actual)
    ├── liability.rs                  42    Liability(nombre, saldo_pendiente, tasa_interes_anual)
    ├── investment.rs                 85    InvestmentFamily (3 familias) + Investment
    ├── account_statement.rs          72    AccountStatement + Movement + conciliación
    ├── snapshot.rs                   56    FinanceSnapshot + StrategySettings + DebtStrategy
    ├── errors.rs                     68    Unknown{Source,Category,Family}Error + re-export NegativeValueError
    ├── negative_value.rs             40    NegativeValueError + ensure_non_negative()
    ├── repository.rs                 31    trait SnapshotRepository (load/save/export/import)
    ├── repository_errors.rs          86    Snapshot{Load,Save,Export,Import}Error
    └── tests/
        ├── mod.rs                    12
        ├── catalogs_tests.rs         61    catálogos exactos + rechazo por nombre
        ├── monthly_record_tests.rs   81    claves/validaciones/totales/mes a ceros
        ├── asset_tests.rs            35    valor actual + negativo → error nombrado
        ├── liability_tests.rs        41    saldo/tasa + negativos → error nombrado
        ├── investment_tests.rs       76    familia exacta + negativos + tasa editable
        ├── account_statement_tests.rs 52   saldo teórico algebraico + conciliada/diferencia
        ├── snapshot_tests.rs         61    agregado completo + estrategia + default
        ├── fake_repository.rs        78    doble en memoria del puerto (+ FailPoint inyectable)
        └── repository_tests.rs       65    load/save/export/import con errores nombrados
```

Total: 24 archivos `.rs`, 1.359 líneas.

## 2. Evidencia ROJO (antes de implementar)

Los tests se escribieron primero; solo existía el enganche mínimo
(`domain/mod.rs` con `#[cfg(test)] mod tests;` y `pub mod domain;` en
`lib.rs`). Salida de `cargo test --manifest-path src-tauri/Cargo.toml`
(guardada completa en `/c/Users/Moises/AppData/Local/Temp/opencode/f3_rojo.txt`):

```
error[E0432]: unresolved import `crate::domain::account_statement`
error[E0432]: unresolved import `crate::domain::asset`
error[E0432]: unresolved import `crate::domain::errors`
error[E0432]: unresolved import `crate::domain::catalogs`
error[E0432]: unresolved import `crate::domain::repository`
error[E0432]: unresolved import `crate::domain::snapshot`
error[E0432]: unresolved import `crate::domain::month_key`
error[E0432]: unresolved import `crate::domain::monthly_record`
... (22 errores E0432 en total, uno por módulo referenciado por los tests)
error: could not compile `mfinance` (lib test) due to 22 previous errors
```

El rojo demuestra que los tests existen ANTES que el código de producción y
que fallan porque la feature no existe todavía.

Durante el pase a verde hubo un segundo ciclo corto rojo→verde de ajuste
interno (sin tocar los contratos testados): `E0277 ExpenseCategory: Ord /
IncomeSource: Ord` (los enums usados como clave de `BTreeMap` necesitaban
derivar `Ord`) y `E0603 MonthlyRecordError is private` (faltaba re-export).

## 3. Evidencia VERDE

`cargo test --manifest-path src-tauri/Cargo.toml` (guardado completo en
`/c/Users/Moises/AppData/Local/Temp/opencode/f3_verde.txt`):

```
running 33 tests
test domain::tests::account_statement_tests::reconciled_when_real_matches_theoretical ... ok
test domain::tests::asset_tests::negative_value_is_rejected_with_named_error ... ok
test domain::tests::catalogs_tests::income_sources_match_catalog_exactly ... ok
test domain::tests::catalogs_tests::expense_categories_match_catalog_exactly ... ok
test domain::tests::catalogs_tests::unknown_income_source_is_rejected_with_named_error ... ok
test domain::tests::catalogs_tests::unknown_expense_category_is_rejected_with_named_error ... ok
test domain::tests::investment_tests::investment_families_match_catalog_exactly ... ok
test domain::tests::investment_tests::negative_monthly_contribution_is_rejected_by_name ... ok
test domain::tests::liability_tests::negative_pending_balance_is_rejected_with_named_error ... ok
test domain::tests::monthly_record_tests::unknown_income_source_is_rejected_by_name ... ok
test domain::tests::monthly_record_tests::unknown_expense_category_is_rejected_by_name ... ok
test domain::tests::monthly_record_tests::invalid_month_key_is_rejected_by_name ... ok
test domain::tests::repository_tests::save_then_load_returns_identical_snapshot ... ok
test domain::tests::repository_tests::export_then_import_roundtrips_the_same_snapshot ... ok
test domain::tests::repository_tests::each_operation_reports_its_own_named_error_on_failure ... ok
test domain::tests::snapshot_tests::aggregate_groups_every_domain_collection ... ok
(... 33 en total ...)
test result: ok. 33 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

Verificación completa del cierre:

| Check | Resultado |
|-------|-----------|
| `cargo test --manifest-path src-tauri/Cargo.toml` | **33 passed; 0 failed** |
| `cargo check --manifest-path src-tauri/Cargo.toml` | sin warnings, Finished ok |
| `grep -ri tauri src-tauri/src/domain/` | **0 coincidencias** |
| `wc -l` máx. bajo `src-tauri/src/domain/` | **88 líneas** (≤ 100, REQ-03-11) |
| Tokens prohibidos del kit presentes en `src-tauri/src/` | 0 |
| `node --test` | **21 pass / 0 fail** (intacto) |
| `./init.sh` | **verde completo** (formato + tests + build) |

Nota aprendida durante el desarrollo: el test REQ-17-03/05 escanea todo el
repo buscando subcuerdas de tokens de app de un ciclo anterior; una palabra
castellana habitual de mis comentarios contiene por casualidad una de esas
subcuerdas y lo activó. Reescrita la palabra; el detalle se registra aquí
sin reproducir ni la palabra ni el token para no reintroducir la fuga.

## 4. Decisiones de diseño

1. **Ubicación de los tests**: archivos paralelos bajo
   `src-tauri/src/domain/tests/` enganchados con `#[cfg(test)] mod tests;`,
   un archivo por entidad/puerto. Los módulos inline `#[cfg(test)]`
   contarían para las 100 líneas de REQ-03-11 (`wc -l` no distingue) y
   obligarían a partir las entidades. Los tests viven dentro del crate
   (no en `tests/` de integración) para ejercitar la API tipada interna.
2. **Serde derives**: permitidos explícitamente por el líder para preparar
   F4. Derivados en entidades, catálogos, MonthKey, Movement, agregado y
   settings. Los enums serializan como string canónica (`"salario"`,
   `"cuotas_deuda"`, `"renta_fija"`…), lo que da JSON estable. El dominio
   NO depende de serde_json ni de tauri: solo del derive de serde.
3. **Diseño del puerto**: trait `SnapshotRepository` con `load(&self)` e
   `import(&self)` (lecturas) y `save/export(&mut self)` (mutaciones);
   los adapters reales envolverán su estado en Mutex en F4. Cuatro tipos
   de error nombrados independientes (uno por operación fallible,
   REQ-03-07) con campo `reason` legible en español. El doble de tests usa
   dos ranuras (stored/exported) para demostrar que export/import es un
   canal independiente de save/load.
4. **Errores**: cada validación produce su tipo nombrado propio
   (`UnknownSourceError`, `UnknownCategoryError`, `UnknownFamilyError`,
   `NegativeValueError`, `InvalidMonthKeyError`, los cuatro del puerto y
   el enum `MonthlyRecordError` para la construcción desde crudo). Cero
   `unwrap()`/`expect()` en código de producción del dominio; los únicos
   `expect/unwrap` están en los tests sobre resultados verificados.
5. **Catálogos como enums** con `ALL` + `parse` + `as_str`: imposible
   representar una fuente/categoría/familia fuera de catálogo en memoria;
   el rechazo nombrado ocurre en la frontera de texto (`parse`, y
   `MonthlyRecord::from_raw`), que es donde entra el dato del usuario.
6. **Imputación contable**: importes como `f64` euros (spec no exige
   decimales fijos); comparaciones flotantes en tests con tolerancia 1e-9
   y conciliación con tolerancia de medio céntimo (0.005).
7. **Scope respetado**: única capa creada `domain/`; único toque a
   `lib.rs` = `pub mod domain;`. Sin tocar commands/, infrastructure/,
   src/, scripts/, docs/, specs/. Sin dependencias nuevas.

## 5. Estado

- Feature 3 queda `in_progress` esperando revisión del reviewer externo.
- No marcada `done`: pendiente `progress/review_3.md` con APPROVED.

## 6. Ronda 2 — cambios requeridos (post review_3.md CHANGES_REQUESTED)

El reviewer exigió un único cambio bloqueante: hueco de REQ-03-09 en
`Investment::new`, que aceptaba una `tasa_esperada_anual` negativa
(asimétrico con `Liability::new`, que sí valida su tasa). Aplicado en la
misma feature, test-first, sin tocar nada más.

### ROJO (test añadido antes que la guard)

Test nuevo en `src-tauri/src/domain/tests/investment_tests.rs`:
`negative_expected_rate_is_rejected_by_name`, que construye
`Investment::new(RentaVariable, 100.0, 1200.0, -5.0)` y espera
`NegativeValueError { entidad: "Investment", campo: "tasa_esperada_anual",
valor: -5.0 }`. Salida de `cargo test --manifest-path src-tauri/Cargo.toml`
(guardada completa en `/c/Users/Moises/AppData/Local/Temp/opencode/f3_r2_rojo.txt`):

```
test domain::tests::investment_tests::negative_expected_rate_is_rejected_by_name ... FAILED

---- ...negative_expected_rate_is_rejected_by_name stdout ----
thread '...' panicked at src\domain\tests\investment_tests.rs:86:6:
called `Result::unwrap_err()` on an `Ok` value: Investment { .. }

failures:
    domain::tests::investment_tests::negative_expected_rate_is_rejected_by_name
test result: FAILED. 33 passed; 1 failed; 0 ignored; 0 measured; 0 filtered out
```

El rojo demuestra el hueco exacto señalado por el reviewer: hoy la tasa
negativa devuelve `Ok`.

### Fix implementado

En `investment.rs`, dentro de `Investment::new`, tercera guard (mismo patrón
que Liability para su tasa):

```rust
ensure_non_negative("Investment", "tasa_esperada_anual", tasa_esperada_anual)?;
```

### VERDE

```
test domain::tests::investment_tests::negative_expected_rate_is_rejected_by_name ... ok
test result: ok. 34 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```
(guardado completo en `/c/Users/Moises/AppData/Local/Temp/opencode/f3_r2_verde.txt`)

### Verificación completa tras el fix

| Check | Resultado |
|-------|-----------|
| `cargo test --manifest-path src-tauri/Cargo.toml` | **34 passed; 0 failed** |
| `node --test` | **21 pass / 0 fail** (intacto) |
| `./init.sh` | **verde completo** |
| `cargo check --manifest-path src-tauri/Cargo.toml` | Finished sin warnings |
| `grep -ri tauri src-tauri/src/domain/` | **0 coincidencias** |
| `wc -l` máx. bajo `domain/` tras el fix | **95 líneas** (`tests/investment_tests.rs`) ≤ 100 |

Alcance del cambio: solo `investment.rs` (+1 guard +doc), solo
`tests/investment_tests.rs` (+1 test), y este informe/bitácora. Nada más
tocado: ni otros módulos, ni lib.rs, ni specs.
