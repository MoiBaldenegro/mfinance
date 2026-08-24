# Review — feature 15 (simulador-creditos)

**Veredicto ronda 1:** CHANGES_REQUESTED (histórico; el veredicto VIGENTE es
el de la ronda 2, al final de este archivo: APPROVED)

> Revisión de nivel 1 (2026-08-22). Todo lo indicado aquí fue verificado EN
> DISCO y ejecutando el arnés en esta sesión: `./init.sh` completo,
> `cargo check --all-targets`, `cargo test`, `pnpm test`,
> `audit-design-tokens`, greps hexagonales, `wc -l` propio sobre los 46
> archivos de la feature y lectura línea a línea de los tests nuevos.

## Verificación global (hecha, no asumida)

```bash
./init.sh                                            # ✔ INIT_EXIT=0 (entorno, formato, tests 100%, build)
cargo check --manifest-path src-tauri/Cargo.toml --all-targets  # 0 errores, 0 warnings
cargo test --manifest-path src-tauri/Cargo.toml      # ok. 170 passed; 0 failed (15 nuevos del simulador)
pnpm test                                            # tests 199 | suites 57 | pass 199 | fail 0
node scripts/audit-design-tokens.mjs                 # AUDIT ✔
grep invoke( fuera de src/adapters/                  # 0 coincidencias
grep react|@tauri-apps en src/domain/                # 0 imports
grep tauri en src-tauri/src/{domain,application}/    # solo comentarios //! doc, 0 deps
grep TODO|FIXME|dbg!|console.log en archivos F15     # 0 coincidencias
grep style={{|<style en src/components/deuda-section/ # 0 coincidencias
```

## Hallazgos por criterio de aceptación

1. **Cuota/intereses/tabla contra caso conocido (REQ-15-01/06)** — ✅ CUMPLE.
   `simulador_cuota_tests.rs` con valores exactos verificables: cuota
   `888.488` (francesa: P·i/(1−(1+i)^−n), comprobada a mano), intereses
   `661.85`, total `10.661.85`; mes 1: interés `100.0`, capital `788.49`,
   saldo `9.211.51`; 12 filas; suma de capital = importe (`:57-58`);
   acumulados encadenados fila a fila (`windows(2)`, `:61-64`); cierre en
   saldo 0.
2. **Extras reducen plazo e intereses (REQ-15-02)** — ✅ CUMPLE. Extra
   mensual 200 € → 12→10 meses, intereses `543.11`, ahorro `118.75`
   (`:35-50`); extraordinario 2.000 € en mes 3 → 10 meses, `491.28`, ahorro
   `170.57` (`:56-71`); sin extras → ahorro 0 y base==optimizado; test
   discriminante puntual-vs-repartido (`:82-87`). El motor ajusta la última
   cuota al saldo (`motor.rs:47 pago = disponible.min(saldo)`).
3. **Avalancha/bola reutilizando el motor plan-deuda (REQ-15-03)** — ✅
   CUMPLE. `estrategia.rs:6-8` importa `ordenar_por_tasa`, `ordenar_por_saldo`
   y `proyectar_orden` desde `plan_deuda_simulacion` — reutilización REAL, no
   duplicado; mapea crédito→`DeudaPlan` con pago mínimo = cuota francesa
   (`estrategia.rs:20-31`). Orden de ataque asertado exacto por estrategia
   (tasa desc: A,B,C / saldo asc: B,A,C) y deuda objetivo. Los 10 tests
   previos de F9 (`deuda_tests`) siguen íntegros y verdes tras el split del
   módulo (API pública idéntica vía `pub use` en
   `plan_deuda_simulacion/mod.rs:13-20`).
4. **UI base vs optimizado + badge sandbox (REQ-15-04)** — ✅ CUMPLE.
   `SimuladorPanel.tsx:31` badge «Sandbox · no afecta tu balance» visible;
   tarjetas Base|Optimizado (`TarjetaEscenario`); `ResumenAhorro` con meses e
   intereses ahorrados formateados es‑ES (`'118,74 €'` verificado por la
   suite node `simulador-comparativa.test.mjs:35`); acordeón según design.md.
5. **Plazo cero / tasa negativa rechazados en español (REQ-15-05)** — ✅
   CUMPLE en ambos lados. Backend: `ErrorSimulacion::{PlazoInvalido,
   TasaNegativa, ImporteNoPositivo}` con Display español y `codigo()` IPC
   nombrado (`errores.rs:21-58`), tests con `expect_err` + código exacto.
   Frontend: `validarPeticionSimulacion` rechaza ANTES del IPC con mensajes
   españoles (`simulador-validaciones.ts:21-41`), suite node lo cubre.
6. **Sandbox que no altera pasivos (REQ-15-07)** — ✅ CUMPLE por
   construcción: `simular_credito` y `simular_plan_creditos_cmd` no reciben
   `State<AppState>` ni tocan el repositorio (`simulador_commands.rs`);
   `use-plan-sandbox.ts` mantiene la lista multi-crédito en `useState` local
   sin persistencia; guardar sigue siendo decisión explícita fuera del panel.

TDD: ciclo ROJO→VERDE documentado en impl_15.md y coherente (los E0433
citados apuntan a los imports reales de tests escritos contra módulos aún no
existentes; ERR_MODULE_NOT_FOUND de use-cases aún inexistentes).

## Checkpoints

- C1: [x] `./init.sh` termina verde completo (INIT_EXIT=0).
- C2: [x] `cargo test` 170/0 · `pnpm test` 199/0 · `cargo check --all-targets`
        0 warnings.
- C3: [x] Dominio puro ambos lados (greps 0).
- C4: [x] `invoke()` solo bajo `src/adapters/`.
- C5: [x] Lógica en use-cases; `.tsx` renderizan y delegan.
- C6: [x] Tokens: AUDIT ✔; 0 CSS embebido.
- C7: [ ] Máx. 100 líneas — FALLA: `tests/frontend-shell/simulador-comparativa.test.mjs`
        tiene **102 líneas reales** (impl_15.md declara 117, también >100).
        Ni dividido ni justificado con estado blocked. Precedente directo:
        review_14 ronda 1 exigió dividir suites node >100 (134 y 103 líneas).
- C8: [ ] Coherencia impl_15.md ↔ repo — FALLA: ~22 de ~46 cifras «wc -l
        real» del informe no coinciden con mi medición independiente (ver
        tabla abajo) y `progress/current.md` afirma «wc -l máx 99 en archivos
        de la feature», que es FALSO (102 real).
- C9: [x] 0 warnings en compilación.
- C10: [x] Ciclo rojo/verde documentado y matemáticamente coherente.
- C11: [x] Dependencia [9] en `done`; sin dependencias npm/crates nuevas
        (validador verde dentro de init.sh).
- C12: [x] Mensajes UI/errores en español.
- C13: [x] Sin TODOs/FIXME/dbg!/print/console.log en archivos de la feature.
- C14: [x] Integración embebida en sección Deuda justificada (test F5 congela
        SECCIONES=10, `secciones-catalogos.test.mjs:21`); features cerradas
        siguen verdes.
- C15: [x] Split de `plan_deuda_simulacion.rs` correcto: API pública idéntica
        vía re-exports; tests F9 intactos.
- C16: [x] `feature_list.json`: id=15 `in_progress` con dependencias done —
        estado correcto antes del veredicto.

## Evidencia C8 — discrepancias wc -l (impl_15.md → real)

Backend: `simulador_creditos/mod.rs` 33→24 · `cuota.rs` 11→12 ·
`validacion.rs` 39→37 · `comparador.rs` 37→30 · `simulador_cuota_tests.rs`
64→65 · `simulador_validacion_tests.rs` 46→47 · `simulador_estrategia_tests.rs`
47→41 · `simulador_escenario_tests.rs` 60→56 · `simulador_fixtures.rs` 31→28 ·
`simulador_commands.rs` 40→33 · `error_conciliacion.rs` 55→47 ·
`plan_deuda_simulacion/mod.rs` 26→20 · `fachada.rs` 45→41 ·
`application/mod.rs` 30→29.

Frontend: `simulador-plan.ts` 23→22 · `simulador-port.ts` 27→19 ·
`simulador-formulario.ts` 58→60 · `FormularioCredito.tsx` 56→55 ·
`ResumenAhorro.tsx` 28→27 · `TablaAmortizacion.tsx` 44→43 ·
`simulador-validaciones.test.mjs` 69→75 · **`simulador-comparativa.test.mjs`
117→102 (>100)**.

El resto de cifras del informe sí coinciden (types 72, resultado 66, errores
61, motor 99, estrategia 71, extras_tests 88, plan tipos/orden/mes/motor
72/37/59/63, adapter 36, validaciones.ts 80, comparativa.ts 73, SimuladorPanel
77, TarjetaEscenario 38, PlanSandbox 80, use-simulador 92, use-plan-sandbox
64, CSS ×6, DeudaSection 62, tests/mod 35, commands/mod 24, lib 69, error 89).

## Cambios requeridos

1. Dividir `tests/frontend-shell/simulador-comparativa.test.mjs` (**102
   líneas reales**) en módulos ≤100 líneas, mismo precedente aplicado en la
   ronda 1 de la feature 14 (suites divididas + fixtures compartidos sin
   sufijo `.test.mjs`). Alternativamente, si se considera imprescindible
   mantenerlo entero, documentar la discusión con estado `blocked` — pero el
   estándar del repo y de review_14 es dividir.
2. Corregir la trazabilidad del informe: regenerar el recuento «Archivos
   creados/modificados (wc -l real)» de impl_15.md con los valores REALES
   valor a valor (los 22 corregidos arriba como mínimo) y eliminar/corregir
   la afirmación falsa de `progress/current.md` («wc -l máx 99 en archivos de
   la feature» — hay uno con 102). Tras dividir el archivo, re-medir todo y
   re-ejecutar `./init.sh`.

## Notas menores (NO bloqueantes)

- Typo cosmético en el nombre del test node
  (`simulador-comparativa.test.mjs:89`: «texto es- euros»).
- El find global detecta otros archivos >100 heredados de features cerradas
  (`snapshot-ipc-adapter.ts` 148, `deuda_tests.rs` 194, etc.): fuera del
  alcance de esta revisión (no fueron creados/modificados por F15).

**Veredicto: CHANGES_REQUESTED** — la feature es funcionalmente sólida
(motor correcto, sandbox estructural, reuso real del motor F9, suites verdes);
fallan exclusivamente el límite de 100 líneas (C7) y la trazabilidad del
informe (C8), ambos ya tipificados como cambios requeridos en review_14.

---

# Ronda 2 — Verificación de cambios requeridos

Re-revisión (2026-08-22) tras reporte del implementer. Todo verificado EN
DISCO y ejecutando el arnés en esta sesión. Cambio 1 a cambio 3:

## Cambio 1 — Split de `tests/frontend-shell/simulador-comparativa.test.mjs` — ✅ APLICADO Y VERIFICADO

Medición propia con `wc -l`:

- `simulador-comparativa.test.mjs` → **39 líneas** (era 102). ≤100 ✔
- `simulador-amortizacion.test.mjs` → **26 líneas** (nuevo). ≤100 ✔
- `fixtures-simulador.mjs` → **47 líneas**, **SIN sufijo `.test.mjs`** ✔
  (no duplica el descubrimiento bare de `node --test`; comentario en su
  cabecera lo documenta).

Cobertura conservada (lectura línea a línea + ejecución):

- Comparativa (REQ-15-04), 3 tests con los MISMOS asserts que la ronda 1:
  `mesesAhorrados=2`, `interesesAhorrados='118,74 €'` (el assert que cité
  en ronda 1 en `:35`), `hayAhorro=true`, métricas es‑ES de ambos escenarios
  (`888,49 €`/`661,85 €`/`10.661,85 €` vs `1.088,49 €`/`543,11 €`),
  y caso plano con `hayAhorro=false` + `mesesAhorrados=0`.
- Amortización (REQ-15-06), 2 tests idénticos a los de la ronda 1:
  filas mes a mes (`'100,00 €'`/`'788,49 €'`/`'9.211,51 €'`,
  acumulado `'1.776,98 €'`) y lista vacía para tabla sin filas.
- Ejecución directa: `node --test simulador-comparativa.test.mjs
  simulador-amortizacion.test.mjs` → **tests 5 / pass 5 / fail 0**.
  El total global NO cambia (199 antes y después): la división no añadió
  ni perdió tests.
- Re-medición de TODOS los archivos creados/modificados por F15 (46):
  máximo real = `application/simulador_creditos/motor.rs` **99 líneas**;
  **ninguno supera 100** → C7 pasa.

## Cambio 2 — Trazabilidad corregida — ✅ APLICADO Y VERIFICADO

Comparé las cifras «wc -l real» de impl_15.md §Ronda 2 contra mi medición
independiente, valor a valor: **las ~46 coinciden todas** esta vez
(simulador_creditos 24/72/66/61/12/37/99/30/71 · plan_deuda_simulacion
20/72/37/63/59/41 · tests 65/88/47/41/56/28 · commands 33/89/47 · domain
64/22/19/80/60/73 · adapter 36 · componentes 77/55/37/27/43/80/92/64 ·
CSS 37/56/40/22/40/60 · node 75/39/26/47 · modificados 29/35/24/69/62).
La afirmación falsa de `progress/current.md` fue eliminada Y corregida con
nota explícita de corrección (`current.md:33-35`) más entrada de ronda 2
coherente (`current.md:39-47`). → C8 pasa.

## Cambio 3 — Typo menor — ✅ APLICADO Y VERIFICADO

`simulador-amortizacion.test.mjs:10`: «convierte cada fila a texto **es-ES
en euros** manteniendo el mes». Grep global de «es- euros» en `src/` y
`tests/`: 0 coincidencias.

## Gates re-ejecutados por el reviewer (esta sesión)

```text
./init.sh                                            # ✔ INIT_EXIT=0 completo
cargo check --all-targets                            # Finished; 0 warnings (grep ^warning = 0)
cargo test                                           # ok. 170 passed; 0 failed
pnpm test                                            # suites 57 · tests 199 · pass 199 · fail 0
node --test comparativa+amortizacion                 # 5 pass / 0 fail
grep invoke( fuera de src/adapters/                  # 0 coincidencias
grep react|@tauri-apps en dominio TS del simulador   # 0 imports
grep TODO|FIXME|console.log|dbg! en archivos F15     # 0 coincidencias
```

## Checkpoints ronda 2

- C1: [x] `./init.sh` verde completo (INIT_EXIT=0).
- C2: [x] cargo 170/0 · pnpm 199/0 · check --all-targets 0 warnings.
- C3: [x] Dominio puro ambos lados.
- C4: [x] invoke() solo bajo src/adapters/.
- C5: [x] Lógica en use-cases; .tsx renderizan y delegan.
- C6: [x] Tokens: AUDIT ✔ dentro de init.sh/build; 0 CSS embebido.
- C7: [x] Máx. 100 líneas: máx real 99 (motor.rs); suite dividida 39+26+47.
- C8: [x] impl_15.md ↔ repo coherentes (46/46 cifras verificadas);
        current.md corregido con nota de corrección.
- C9: [x] 0 warnings.
- C10: [x] Ciclo rojo/verde documentado (ronda 1, sin cambios).
- C11: [x] Dependencia [9] done; sin dependencias nuevas (validador verde).
- C12: [x] Mensajes UI/errores en español.
- C13: [x] Sin TODOs/FIXME/dbg!/print/console.log.
- C14: [x] Integración embebida en Deuda (SECCIONES=10 intacto).
- C15: [x] Split plan_deuda_simulacion con API estable (170 tests Rust verdes).
- C16: [x] feature_list.json id=15 in_progress, depends_on=[9] done.

**VEREDICTO FINAL RONDA 2: APPROVED** — los 3 cambios requeridos están
aplicados y verificados en disco; todos los gates en verde.
