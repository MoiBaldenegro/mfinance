# Review — feature 19

VEREDICTO: APPROVED

**Veredicto:** APPROVED
**Feature:** 19 `modelo-moneda-nucleo` (in_progress → propuesta done al líder)
**Revisor:** reviewer, 2026-08-23. Verificación contra DISCO, no contra el informe.

## Suites ejecutadas por mí HOY (no heredadas del informe)

| Comando | Resultado |
|---|---|
| `pnpm test` | **307 pass / 0 fail** (incluye 13 nuevos de `tests/modelo-moneda/`) |
| `cargo test --manifest-path src-tauri/Cargo.toml` | **233 passed / 0 failed** (incluye 4 nuevos de `domain::tests::currency_tests`) |
| `./init.sh` | ✔ entorno · ✔ formato · ✔ tests 100% · ✔ build — **verde completo** |
| `cargo check --manifest-path src-tauri/Cargo.toml` | Finished sin warnings |

## Verificación criterio por criterio (feature_list.json → id 19)

1. **TDD rojo→verde cargo: default() MXN + snapshot antiguo sin campo completa a MXN sin alterar el resto (REQ-19-01/02)** — ✅
   - Evidencia de ROJO observado antes del código en impl_19.md §1.1: errores de compilación específicos (`E0432 unresolved import crate::domain::currency`, `E0560 struct StrategySettings has no field named currency`, `E0609`), coherentes con tests escritos contra módulos inexistentes. No es un rojo genérico inventado a posteriori.
   - En disco: `src-tauri/src/domain/tests/currency_tests.rs:9-13` (`default_settings_carry_mxn_currency`) y `:16-32` (`legacy_snapshot_without_currency_completes_to_mxn`, verifica además `Snowball` y extra `150.0` intactos). Implementación: `#[serde(default)]` en `snapshot.rs:31-32` + `Default for Currency → Mxn` (`currency.rs:20-24`). Verde confirmado en mi ejecución.
2. **Round-trip serde MXN/USD/EUR sobre FinanceSnapshot + grep -ri tauri domain = 0 (REQ-19-01/03)** — ✅
   - `currency_round_trips_through_serde` (`currency_tests.rs:35-43`) pasa en mi ejecución.
   - `grep -ri tauri src-tauri/src/domain/` → **0 coincidencias** (ejecutado por mí). El comentario preexistente de `comprobante_pdf.rs` que citaba la palabra fue reescrito (`comprobante_pdf.rs:3`: "Sin dependencias del framework de escritorio ni de extracción PDF"): cambio solo de comentario, necesario para que el criterio sea verificablemente verde; legítimo.
3. **Test node:test formatoMoneda determinista con casos exactos (REQ-19-04)** — ✅
   - ROJO documentado en impl_19.md §1.2 (`ERR_MODULE_NOT_FOUND` sobre ambos módulos, `fail 2`) antes del código.
   - En disco, `tests/modelo-moneda/formato-moneda.test.mjs` cubre los casos exactos de la spec/research §4: `1576000.5 → $1,576,000.50` (MXN/USD), `1.576.000,50 €` (EUR), negativos `-$1,576.00` / `-1.576,00 €`, variante `decimales = 0`, determinismo repetido. Motor manual (`formato-moneda.ts:26-27`, regex `\B(?=(\d{3})+(?!\d))`), sin Intl/ICU ni dependencias nuevas.
4. **IF-test moneda fuera de catálogo lanza error nombrado bajo src/domain/errors sin devolver cadena (REQ-19-05)** — ✅
   - `MonedaFueraCatalogoError` en `src/domain/errors/moneda-errors.ts` (name/codigo/message); `formato-moneda.ts:20-22` hace `throw`. Tests con `assert.throws(..., MonedaFueraCatalogoError)` y try/catch instanceof (`formato-moneda.test.mjs:45-63`). Verde en mi ejecución.
5. **moneda.ts tipo+catálogo espejo; strategy-settings.ts currency con AJUSTES_POR_DEFECTO MXN; grep react/@tauri-apps bajo src/domain = 0 (REQ-19-03)** — ✅
   - Catálogo tabla-exacta contra research §4 (MXN/USD `$ , .` antes; EUR `€ . ,` después), verificado con deepEqual en `catalogo-moneda.test.mjs:16-29`.
   - `AJUSTES_POR_DEFECTO.currency = 'MXN'` (`strategy-settings.ts:14-18`); `SNAPSHOT_VACIO.strategy` referencia `AJUSTES_POR_DEFECTO` (única fuente de verdad, `finance-snapshot.ts:31`).
   - Mis greps: **0 imports** de `react`/`@tauri-apps` bajo `src/domain` (las únicas coincidencias son comentarios "sin React ni IPC", no imports); `invoke` solo bajo `src/adapters`.
6. **Ningún archivo creado/modificado supera 100 líneas; ./init.sh verde** — ✅
   - wc -l ejecutado por mí sobre los 17 archivos: máximo **96** (`deuda_proyeccion_tests.rs`). Todos ≤100.
   - `./init.sh` completo en verde (ejecutado por mí).

## Alcance y arquitectura

- **UI/components intocado:** grep de `moneda|currency|formatoMoneda` sobre `src/components|hooks|lib|adapters` → **0 coincidencias**. La UI sigue en euros (correcto: eso es la feature 20). No hay conversión de importes en ningún sitio.
- **Hexagonal respetado:** `Currency` en `domain/currency.rs` (puro, sin tauri); `formato-moneda.ts` en use-cases, entidad en entities, error en errors. Dependencias apuntan hacia el dominio en ambos lados.
- **Sin dependencias nuevas:** Cargo.toml/package.json solo contienen las ya aprobadas en docs/dependencies.md (validador dentro de init.sh en verde).
- **Dependencias de la feature:** `depends_on: []` — nada saltado.
- **División de deuda_tests.rs (198 → 95+96):** motivada por el criterio 6 (≤100 en modificados); mismas aserciones, suite verde, sin tocar código de producción. Aceptable.
- Sin restos de debug (`dbg!/println!/console.log/TODO/FIXME` → 0 en archivos nuevos).

## Checkpoints (CHECKPOINTS.md)

- C1 (arquitectura hexagonal, dominio puro ambos lados): [x]
- C2 (puertos/adapters; invoke solo en adapters): [x]
- C3 (sin CSS en .tsx / tokens): [x] (n/a: no se tocó UI)
- C4 (TDD rojo→verde documentado + suites verdes + ≤100 líneas + sin deps nuevas): [x]
- C5 (./init.sh, cargo check, cargo test en verde): [x]

Harness: `feature_list.json` aún no marca `done` — correcto: corresponde al líder tras este APPROVED. `progress/current.md` documentado; sin temporales ni TODOs sueltos.

## Incidencias (menores, no bloqueantes)

1. Tabla del informe impl_19.md §3 con desvíos triviales de conteo: declara `formato-moneda.ts` = 37 (real 36) y `application/tests/mod.rs` = 53 (real 51). Sin efecto en criterios (ambos ≤100 igualmente). Se pide más cuidado en conteos futuros; no requiere cambios.
2. Ninguna otra. No se piden cambios de código.

## Cambios requeridos

Ninguno.
