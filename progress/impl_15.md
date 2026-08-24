# Informe de implementación — Feature 15: simulador-creditos

Fecha: 2026-08-22. Estado al cierre de sesión: implementada y VERDE, pendiente
de revisión externa (no se marca `done`; el bucle lo orquesta el líder).

## Spec seguida

- `specs/15_simulador-creditos/requirements.md` (REQ-15-01..07, EARS).
- `specs/15_simulador-creditos/design.md`: formulario compacto arriba,
  dos tarjetas Base|Optimizado con métricas grandes, acordeón de tabla de
  amortización colapsado por defecto, badge sandbox visible, selector de
  estrategia reutilizando tokens/componentes de F9.

## Ciclo ROJO → VERDE (test-first)

### ROJO — Rust (antes de escribir código)

Tests escritos primero contra la spec (4 archivos registrados en
`application/tests/mod.rs`). Salida de `cargo test --manifest-path
src-tauri/Cargo.toml simulador`:

```text
error[E0433]: failed to resolve: could not find `simulador_creditos` in `application`
  --> src\application\tests\simulador_validacion_tests.rs:4:25
error[E0433]: failed to resolve: could not find `simulador_creditos` in `application`
  --> src\application\tests\simulador_extras_tests.rs:22:41
error[E0433]: ... (8 errores E0433/E0432 en total)
error: could not compile `mfinance` (lib test) due to 8 previous errors
```

### ROJO — Node (use-cases front)

`node --test tests/frontend-shell/simulador-validaciones.test.mjs
tests/frontend-shell/simulador-comparativa.test.mjs`:

```text
# tests 2
# pass 0
# fail 2        ← ERR_MODULE_NOT_FOUND: los use-cases aún no existían
```

### VERDE — Rust (tras implementar application/simulador_creditos)

```text
running 15 tests
test application::tests::simulador_cuota_tests::cuota_mensual_contra_caso_conocido ... ok
test application::tests::simulador_cuota_tests::amortizacion_base_devuelve_intereses_y_total_contra_caso_conocido ... ok
test application::tests::simulador_cuota_tests::tabla_de_amortizacion_mes_a_mes_con_capital_interes_saldo_acumulado ... ok
test application::tests::simulador_extras_tests::extra_mensual_reduce_plazo_e_intereses ... ok
test application::tests::simulador_extras_tests::extraordinario_puntual_reduce_plazo_e_intereses ... ok
test application::tests::simulador_extras_tests::sin_extras_el_optimizado_coincide_con_el_base ... ok
test application::tests::simulador_extras_tests::el_extraordinario_adelantado_ahorra_mas_que_el_extra_repartido ... ok
test application::tests::simulador_estrategia_tests::orden_de_ataque_avalancha_por_tasa_y_bola_por_saldo ... ok
test application::tests::simulador_estrategia_tests::cada_escenario_devuelve_base_vs_optimizado_con_extra_del_plan ... ok
test application::tests::simulador_estrategia_tests::sin_extra_no_hay_ahorro_y_con_extra_se_liquida_todo ... ok
test application::tests::simulador_estrategia_tests::sin_creditos_devuelve_escenarios_vacios ... ok
test application::tests::simulador_validacion_tests::plazo_cero_se_rechaza_con_mensaje_en_espanol ... ok
test application::tests::simulador_validacion_tests::tasa_negativa_se_rechaza_con_mensaje_en_espanol ... ok
test application::tests::simulador_validacion_tests::importe_no_positivo_se_rechaza_con_mensaje_en_espanol ... ok
test application::tests::simulador_validacion_tests::validar_credito_acepta_un_credito_valido_y_rechaza_los_invalidos ... ok

test result: ok. 15 passed; 0 failed
Suite completa: test result: ok. 170 passed; 0 failed
```

### VERDE — Node (tras implementar use-cases + UI)

```text
# suites 57
# tests 199
# pass 199
# fail 0
```

(188 tests previos + 11 nuevos de las suites F15.)

## Cobertura de los criterios de aceptación

1. **Cuota/intereses/tabla contra caso conocido**: `10.000 €, 12 meses, 12 %`
   → cuota `888,49 €`, intereses `661,85 €`, total pagado `10.661,85 €`,
   12 filas mes a mes (mes 1: interés 100 €, capital 788,49 €, saldo
   9.211,51 €), suma de capital = importe, acumulado final = total pagado.
   Tests en `simulador_cuota_tests.rs`.
2. **Extras reducen plazo e intereses**: extra mensual 200 € → 12→10 meses,
   661,85→543,11 € (ahorro 118,75 €); extraordinario puntual 2.000 € en mes 3
   → 10 meses, 491,28 € (ahorro 170,57 €); sin extras ahorro 0. Tests en
   `simulador_extras_tests.rs`.
3. **Avalancha/bola reutilizando motor plan-deuda**: `estrategia.rs` mapea
   cada crédito a una `DeudaPlan` (pago mínimo = cuota francesa) y llama a
   las primitivas públicas del motor F9 (`ordenar_por_tasa`,
   `ordenar_por_saldo`, `proyectar_orden`) — la lógica de simulación mes a
   mes vive SOLO en plan_deuda_simulacion/. Devuelve orden de ataque,
   deuda objetivo e intereses base vs optimizado por estrategia. Tests en
   `simulador_estrategia_tests.rs` + `simulador_escenario_tests.rs`.
4. **UI base vs optimizado + badge sandbox**: `SimuladorPanel.tsx` embebido
   en la sección Deuda (SECCIONES sigue congelada a 10 por el test de F5),
   tarjetas Base|Optimizado con métricas en euros es-ES, `ResumenAhorro`
   con meses/intereses ahorrados, badge «SANDBOX · no afecta tu balance»
   visible en la cabecera.
5. **Plazo cero / tasa negativa rechazados en español**: backend
   (`ErrorSimulacion::{PlazoInvalido, TasaNegativa, ImporteNoPositivo}` con
   mensajes españoles, código IPC nombrado) y frontend
   (`validarPeticionSimulacion` rechaza ANTES de invocar el IPC mostrando
   el mensaje junto al formulario). Tests en ambos lados.
6. **Sandbox que no toca pasivos**: `simular_credito` y
   `simular_plan_creditos_cmd` NO reciben `State<AppState>` ni acceden al
   repositorio — no pueden mutar pasivos por construcción. La lista
   multi-crédito vive en estado local del hook (`use-plan-sandbox.ts`);
   guardar sigue siendo decisión explícita del usuario fuera del panel.

## Archivos creados (wc -l real, re-verificado en ronda 2)

Backend — application/simulador_creditos/:
- mod.rs (24) · types.rs (72) · resultado.rs (66) · errores.rs (61) ·
  cuota.rs (12) · validacion.rs (37) · motor.rs (99) · comparador.rs (30) ·
  estrategia.rs (71)

Backend — application/tests/:
- simulador_cuota_tests.rs (65) · simulador_extras_tests.rs (88) ·
  simulador_validacion_tests.rs (47) · simulador_estrategia_tests.rs (41) ·
  simulador_escenario_tests.rs (56) · simulador_fixtures.rs (28)

Backend — commands/ y split del motor F9:
- src-tauri/src/commands/simulador_commands.rs (33)
- src-tauri/src/commands/error_conciliacion.rs (47) — extracción de error.rs
- plan_deuda_simulacion/ (split del archivo único de 251 líneas, API pública
  idéntica vía re-exports): mod.rs (20) · tipos.rs (72) · orden.rs (37) ·
  mes.rs (63) · motor.rs (59) · fachada.rs (41)

Frontend:
- src/domain/entities/simulador-credito.ts (64) · simulador-plan.ts (22)
- src/domain/ports/simulador-port.ts (19)
- src/adapters/simulador-ipc-adapter.ts (36) — invoke() solo aquí
- src/domain/use-cases/simulador-validaciones.ts (80) ·
  simulador-formulario.ts (60) · simulador-comparativa.ts (73)
- src/components/deuda-section/simulador/SimuladorPanel.tsx (77) ·
  FormularioCredito.tsx (55) · TarjetaEscenario.tsx (37) · ResumenAhorro.tsx (27) ·
  TablaAmortizacion.tsx (43) · PlanSandbox.tsx (80) · use-simulador.ts (92) ·
  use-plan-sandbox.ts (64)
- src/styles/simulador-credito.css (37) · simulador-formulario.css (56) ·
  simulador-tarjetas.css (40) · simulador-ahorro.css (22) ·
  simulador-amortizacion.css (40) · simulador-plan.css (60)
- tests/frontend-shell/simulador-validaciones.test.mjs (75) ·
  simulador-comparativa.test.mjs (39) · simulador-amortizacion.test.mjs (26) ·
  fixtures-simulador.mjs (47)

## Archivos modificados (wc -l real, re-verificado en ronda 2)

- src-tauri/src/application/mod.rs (29) · tests/mod.rs (35) — registros
- src-tauri/src/commands/error.rs (121→89) — From<ErrorSimulacion> añadido;
  bloque conciliación extraído a error_conciliacion.rs para bajar de 100
- src-tauri/src/commands/mod.rs (24) · src-tauri/src/lib.rs (69) — registro
  de commands simular_credito / simular_plan_creditos_cmd
- src/components/deuda-section/DeudaSection.tsx (62) — embebe SimuladorPanel

Máximo real entre todos los archivos creados/modificados de la feature:
**99 líneas** (application/simulador_creditos/motor.rs); ninguno supera 100.

## Verificación final (todas en verde)

```text
cargo check --manifest-path src-tauri/Cargo.toml --all-targets
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 1.36s   (0 warnings)

cargo test  → test result: ok. 170 passed; 0 failed
pnpm test   → # tests 199 / # pass 199 / # fail 0
pnpm build  → ✓ built in 1.67s
audit-design-tokens.mjs → AUDIT ✔ ningún color fuera de tokens.css
grep tauri en domain|application → solo comentarios "sin fs ni tauri" (8, todos //!)
grep react|@tauri-apps en src/domain → 0
invoke() fuera de src/adapters → 0
TODO/FIXME/dbg!/console.log en archivos de la feature → 0
./init.sh → ✔ El entorno está perfecto (formato + tests + build)
```

## Decisiones relevantes

- **Split de `plan_deuda_simulacion.rs` (251 líneas)**: al necesitar exponer
  costuras de reutilización (`proyectar_orden`, `ordenar_por_tasa/saldo`),
  tocarlo habría violado el límite de 100 líneas sobre archivos modificados.
  Se dividió en módulo-directorio conservando la API pública exacta vía
  re-exports (mismo precedente que pyg_proyeccion en la feature 14); los 10
  tests existentes de F9 pasan sin cambios.
- **Sin nueva entrada de navegación**: el test de F5 congela SECCIONES a
  exactamente 10; el simulador vive como panel dentro de la sección Deuda,
  igual que ProyeccionSection dentro de PyG desde la feature 14.
- **Comandos sin `State`**: garantía estructural del requisito sandbox.
- **Última cuota ajustada**: la fila final usa `min(disponible, saldo)`; en
  el caso conocido la tabla cierra en saldo 0 con 12 filas exactas.

## Notas para el reviewer

- El criterio «intereses ahorrados en euros» se muestra formateado es-ES
  mediante `formatoEuros` (determinista, ya usado por el resto de secciones).
- Los extras del escenario optimizado aceptan extra mensual Y extraordinario
  puntual simultáneamente; `validar_extras` exige mes ∈ [1, plazo] e importe > 0.

## Ronda 2 — cambios requeridos por review

Veredicto CHANGES_REQUESTED en `progress/review_15.md`. Cambios aplicados:

1. **Split de `tests/frontend-shell/simulador-comparativa.test.mjs` (102
   líneas reales, detectado por el review)** siguiendo el precedente de la
   ronda 1 de la feature 14: fixtures compartidos SIN sufijo `.test.mjs`
   (para no duplicar descubrimiento bare de node --test) + dos suites:
   - tests/frontend-shell/fixtures-simulador.mjs (47)
   - tests/frontend-shell/simulador-comparativa.test.mjs (39) — 3 tests REQ-15-04
   - tests/frontend-shell/simulador-amortizacion.test.mjs (26) — 2 tests REQ-15-06
   Total suite: 5/5 en verde; el recuento global no cambia (199/199).
2. **Trazabilidad corregida**: las secciones «Archivos creados/modificados»
   de este informe fueron regeneradas valor a valor con `wc -l` REAL tras
   la ronda 1 (el recuento anterior contenía ~22 cifras incorrectas por
   escribirse de memoria antes de medir). La afirmación falsa de
   `progress/current.md` («wc -l máx 99» cuando había un archivo de 102)
   fue corregida también.
3. **Typo menor corregido**: «texto es- euros» → «texto es-ES en euros» en
   la descripción del test de la tabla de amortización.

### wc -l real verificado tras la ronda 2 (máx 99; ninguno >100)

```text
simulador_creditos/:      mod 24 · types 72 · resultado 66 · errores 61 ·
                          cuota 12 · validacion 37 · motor 99 · comparador 30 ·
                          estrategia 71
plan_deuda_simulacion/:   mod 20 · tipos 72 · orden 37 · mes 63 · motor 59 ·
                          fachada 41
application/tests/:       cuota 65 · extras 88 · validacion 47 · estrategia 41 ·
                          escenario 56 · fixtures 28
commands/:                simulador_commands 33 · error 89 · error_conciliacion 47
src/domain:               simulador-credito.ts 64 · simulador-plan.ts 22 ·
                          simulador-port.ts 19 · simulador-validaciones.ts 80 ·
                          simulador-formulario.ts 60 · simulador-comparativa.ts 73
src/adapters:             simulador-ipc-adapter.ts 36
components/simulador/:    SimuladorPanel 77 · FormularioCredito 55 ·
                          TarjetaEscenario 37 · ResumenAhorro 27 ·
                          TablaAmortizacion 43 · PlanSandbox 80 ·
                          use-simulador 92 · use-plan-sandbox 64
styles/:                  credito 37 · formulario 56 · tarjetas 40 · ahorro 22 ·
                          amortizacion 40 · plan 60
tests node:               validaciones.test 75 · comparativa.test 39 ·
                          amortizacion.test 26 · fixtures-simulador 47
modificados:              application/mod 29 · application/tests/mod 35 ·
                          commands/mod 24 · lib.rs 69 · DeudaSection.tsx 62
```

### Gates finales de la ronda 2

```text
cargo check --manifest-path src-tauri/Cargo.toml --all-targets
  → 0 warnings / 0 errores (grep -c "^(warning|error)" = 0)
cargo test  → test result: ok. 170 passed; 0 failed
pnpm test   → # suites 57 / # tests 199 / # pass 199 / # fail 0
pnpm build  → ✓ built in 1.68s
./init.sh   → ✔ formato · ✔ tests al 100% (node:test) · ✔ build ·
              ✔ El entorno está perfecto. Podemos empezar a trabajar.
```
