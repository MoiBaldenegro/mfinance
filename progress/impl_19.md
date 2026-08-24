# Informe de implementación — Feature 19: modelo-moneda-nucleo

> Implementador, 2026-08-23. Spec regentea:
> `specs/19_modelo-moneda-nucleo/requirements.md`. Análisis de fondo:
> `progress/research/config-monedas-perfiles.md` (§3 y §4). Estado final:
> **suite completa en verde**, feature queda `in_progress` a la espera del
> review (el cambio a `done` lo decide el líder tras APPROVED).

## 1. Ciclo ROJO (tests antes que código)

### 1.1 Backend Rust — test escrito primero

Creado `src-tauri/src/domain/tests/currency_tests.rs` + registro
`mod currency_tests;` en `src-tauri/src/domain/tests/mod.rs`, ANTES de que
existiera `domain/currency.rs` o el campo `currency`.

Comando:

```
cargo test --manifest-path src-tauri/Cargo.toml
```

Salida resumida (rojo):

```
error[E0432]: unresolved import `crate::domain::currency`
error[E0560]: struct `StrategySettings` has no field named `currency`
error[E0609]: no field `currency` on type `StrategySettings`
error: could not compile `mfinance` (lib test) due to 6 previous errors
```

### 1.2 Frontend TS — tests escritos antes

Creados `tests/modelo-moneda/formato-moneda.test.mjs` y
`tests/modelo-moneda/catalogo-moneda.test.mjs` ANTES de existir los módulos.

Comando:

```
node --test tests/modelo-moneda/formato-moneda.test.mjs tests/modelo-moneda/catalogo-moneda.test.mjs
```

Salida resumida (rojo):

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../src/domain/entities/moneda.ts'
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../src/domain/use-cases/formato-moneda.ts'
# pass 0
# fail 2
```

## 2. Ciclo VERDE (implementación mínima)

Implementado tras observar ambos rojos; suites completas:

```
cargo test --manifest-path src-tauri/Cargo.toml
  → test result: ok. 233 passed; 0 failed        (4 nuevos: currency_tests)
cargo check --manifest-path src-tauri/Cargo.toml
  → Finished `dev` profile ... sin warnings
pnpm test                                        (node --test)
  → # tests 307 / # pass 307 / # fail 0          (13 nuevos: modelo-moneda)
./init.sh
  → ✔ formato · ✔ tests al 100% · ✔ build · El entorno está perfecto
```

Tests nuevos backend (`domain::tests::currency_tests`):
`default_settings_carry_mxn_currency`,
`legacy_snapshot_without_currency_completes_to_mxn`,
`currency_round_trips_through_serde`,
`currency_serializes_with_catalog_code_on_the_wire`.

Tests nuevos frontend: casos exactos de la spec (1576000.5 → `$1,576,000.50`
en MXN/USD, `1.576.000,50 €` en EUR), negativos `-$1,576.00` /
`-1.576,00 €`, variante `decimales = 0` para inversiones, determinismo,
catálogo espejo tabla-exacta, AJUSTES_POR_DEFECTO.currency = `'MXN'`,
SNAPSHOT_VACIO heredando MXN e IF-test de error nombrado fuera de catálogo.

## 3. Archivos creados / modificados (wc -l, todos ≤ 100)

| Archivo | Estado | wc -l |
|---|---|---|
| `src-tauri/src/domain/currency.rs` | creado | 35 |
| `src-tauri/src/domain/mod.rs` | modificado | 25 |
| `src-tauri/src/domain/snapshot.rs` | modificado | 87 |
| `src-tauri/src/domain/comprobante_pdf.rs` | modificado (solo comentario) | 61 |
| `src-tauri/src/domain/tests/currency_tests.rs` | creado | 61 |
| `src-tauri/src/domain/tests/mod.rs` | modificado | 14 |
| `src-tauri/src/application/tests/deuda_tests.rs` | dividido | 95 |
| `src-tauri/src/application/tests/deuda_proyeccion_tests.rs` | creado (división) | 96 |
| `src-tauri/src/application/tests/mod.rs` | modificado | 53 |
| `src-tauri/src/seed/mod.rs` | modificado (campo nuevo) | 33 |
| `src/domain/entities/moneda.ts` | creado | 45 |
| `src/domain/entities/strategy-settings.ts` | modificado | 18 |
| `src/domain/entities/finance-snapshot.ts` | modificado | 33 |
| `src/domain/errors/moneda-errors.ts` | creado | 14 |
| `src/domain/use-cases/formato-moneda.ts` | creado | 37 |
| `tests/modelo-moneda/formato-moneda.test.mjs` | creado | 64 |
| `tests/modelo-moneda/catalogo-moneda.test.mjs` | creado | 52 |

## 4. Verificación criterio por criterio (feature_list.json)

1. **TDD rojo→verde cargo: default() lleva MXN y snapshot antiguo sin campo
   se completa a MXN sin alterar el resto** — CUMPLE. Evidencia roja §1.1;
   verde §2 (`default_settings_carry_mxn_currency`,
   `legacy_snapshot_without_currency_completes_to_mxn`: verifica además
   debt_strategy Snowball y extra 150.0 intactos).
2. **Round-trip serde MXN/USD/EUR sobre FinanceSnapshot + grep -ri tauri
   src-tauri/src/domain = 0** — CUMPLE. `currency_round_trips_through_serde`
   ok; grep devuelve **0** líneas (se corrigió un comentario preexistente en
   `comprobante_pdf.rs` que citaba la palabra, ver decisiones).
3. **Test node formatoMoneda determinista con casos exactos** — CUMPLE.
   Evidencia roja §1.2; verde §2: `$1,576,000.50` MXN/USD,
   `1.576.000,50 €` EUR, negativos y variante sin decimales.
4. **IF-test moneda fuera del catálogo lanza error nombrado bajo
   src/domain/errors sin devolver cadena** — CUMPLE.
   `MonedaFueraCatalogoError` (name, codigo, message) verificada con
   `assert.throws(..., MonedaFueraCatalogoError)` y try/catch instanceof.
5. **moneda.ts tipo+catálogo espejo; strategy-settings.ts currency con
   AJUSTES_POR_DEFECTO en MXN; grep react/@tauri-apps bajo src/domain = 0**
   — CUMPLE. Catálogo tabla-exacta del research §4 (deepEqual); greps de
   `react`/`@tauri-apps`/`invoke(` bajo `src/domain`: **0** coincidencias.
6. **Ningún archivo creado o modificado supera 100 líneas; ./init.sh
   verde** — CUMPLE. Máximo 96 (`deuda_proyeccion_tests.rs`);
   `./init.sh` completo en verde (formato + node:test + pnpm build).

## 5. Decisiones tomadas

- **Ubicación del enum**: `Currency` vive en archivo propio
  `src-tauri/src/domain/currency.rs` (snapshot.rs quedó en 87 líneas; el
  research §8 ya anticipaba esta opción). Cable serde `MXN`/`USD`/`EUR`
  vía `#[serde(rename_all = "UPPERCASE")]` para que el enum Rust y la
  entidad TS usen exactamente los mismos códigos (espejo exacto, evita
  variantes `Mxn` ≠ `'MXN'`). Variantes Rust PascalCase por lint
  `non_camel_case_types`; mapeo documentado con `as_str()`.
- **Comentario preexistente con la palabra tauri** en
  `comprobante_pdf.rs` ("Sin `tauri` ni `pdf_extract`") hacía fallar
  literalmente el grep del criterio 2 (devolvía 1). Reescrito como
  "Sin dependencias del framework de escritorio ni de extracción PDF":
  cambio solo de comentario, sin efecto en comportamiento, necesario para
  dejar el criterio de ESTA feature verificablemente verde.
- **División de deuda_tests.rs (198 → 95+96)**: el campo nuevo obligaba a
  tocar sus literales de `StrategySettings` y el criterio 6 prohíbe >100
  líneas en archivos modificados (ya tenía 195 antes de esta sesión).
  Split cohesivo ordenación/proyección + helper compartido
  `repo_ajustado` que elimina el setup duplicado; mismas aserciones,
  suite en verde sin tocar código de producción.
- **formato-moneda.ts en use-cases** y **moneda.ts en entities**, según el
  research §4; motor manual con regex `\B(?=(\d{3})+(?!\d))` (mismo espíritu
  que `formatoEuros`), sin motores nativos de formateo regional ni ICU ni
  dependencias nuevas.
- **SNAPSHOT_VACIO** ahora referencia `AJUSTES_POR_DEFECTO` (única fuente
  de verdad de los defaults) en lugar del literal inline duplicado.
- **Sin conversión de importes**: la moneda re-etiqueta; ningún formateador
  vivo fue tocado (eso es la feature 20). UI/components: intocado.

## 6. Alcance NO tocado (explícito)

- `src/components/**` y estilos: nada (feature 20).
- Formateadores existentes (`formatoEuros`, `formatearEuros`,
  `toLocaleString('es-ES')`, sufijos €): intactos (feature 20).
- Perfiles/almacenamiento: intactos (features 21/22).
- Sin dependencias npm ni crates nuevas; sin subagentes lanzados.
