# Review — feature 14 (pyg-proyeccion-supuestos)

**Veredicto:** APPROVED *(ronda 2; ver «Ronda 2 — Verificación de cambios
requeridos» al final. La ronda 1 con CHANGES_REQUESTED se conserva abajo
como historial).*

> Revisión de nivel 1 (2026-08-22, ronda 1). Todo lo indicado aquí fue
> verificado EN DISCO y ejecutando el arnés en esa sesión: `./init.sh`
> completo, `cargo test`, `pnpm test`, `cargo check`, greps hexagonales y
> `wc -l`.

## Verificación global (hecha, no asumida) — ronda 1

```bash
./init.sh                                            # ✔ INIT_EXIT=0 (entorno, formato, tests 100%, build)
cargo test --manifest-path src-tauri/Cargo.toml      # 152 passed; 0 failed
pnpm test                                            # tests 187 | pass 187 | fail 0
node scripts/audit-design-tokens.mjs                 # AUDIT ✔
grep invoke fuera de src/adapters/                   # 0 coincidencias
grep react|@tauri-apps en src/domain/                # solo comentarios, 0 imports
grep tauri en src-tauri/src/{domain,application}/    # solo comentarios doc, 0 deps
```

## Hallazgos por criterio de aceptación — ronda 1

1. **Proyección 12 meses con variaciones % mensuales editables sobre ingresos
   y cada categoría de gasto partiendo del histórico real (REQ-14-01)** — ✅
   CUMPLE. `application/tests/pyg_proyeccion_tests.rs` cubre con valores
   exactos: composición mes 1–2 (`2040.0` → `2080.8` con +2%), multi-fuente y
   multi-categoría (`2835.0` ingresos / `1261.0` gastos), variación negativa
   (`1960.0` → `1920.8`), orden ascendente y 12 filas proyectadas siempre.
2. **Balance futuro: patrimonio mes a mes con amortización de pasivos según
   pagos actuales verificado por test (REQ-14-02)** — ⚠️ PARCIAL (ronda 1).
   El test solo afirmaba `patrimonio[0] > patrimonio_histórico`, la
   amortización usaba horizonte fijo `saldo / 60.0`, `_pago_total` calculado
   y descartado y `pago_mensual_pasivo` código muerto con warning.
   **RESUELTO en ronda 2** (ver §Ronda 2, cambio 3).
3. **Editar un supuesto y confirmar refresca tablas y gráficas** — ✅ CUMPLE.
   `ProyeccionSection.confirmar` → `setSupuestos(borrador)` →
   `use-pyg-proyeccion.ts` re-pide por IPC cuando cambian snapshot/supuestos;
   el adapter envía `supuestosACable(...)` (`snapshot-ipc-adapter.ts:137-143`).
4. **Distinción visual histórico/proyectado en tabla y gráfica** — ✅ CUMPLE
   (real, no cosmética). Tablas: badge `Real`/`Proyectado` +
   `.tabla-*-fila--historico/--proyectado`; gráficas: color/opacidad y radio
   por punto + tick `★` marcando la frontera.
5. **IF no hay al menos un mes histórico THEN mensaje en español pidiendo
   registrar el primer mes (REQ-14-05)** — ✅ CUMPLE.
6. **Restablecer supuestos → cero variación = continuación plana** — ✅
   CUMPLE.

## Checkpoints (ronda 1)

- C1: [x] `./init.sh` termina verde completo.
- C2: [x] `cargo test` 152/0 y `pnpm test` 187/0.
- C3: [x] Dominio puro en ambos lados.
- C4: [x] `invoke()` solo bajo `src/adapters/`.
- C5: [x] Lógica en use-cases; los `.tsx` renderizan y delegan.
- C6: [x] Estilos solo vía tokens.
- C7: [ ] Máx. 100 líneas — FALLABA (4 archivos >100). **RESUELTO ronda 2.**
- C8: [ ] Coherencia impl_14.md ↔ repo — FALLABA (afirmación falsa de wc -l).
        **RESUELTO ronda 2.**
- C9: [ ] Warnings de compilación — FALLABA (`pago_mensual_pasivo` nunca
        usada; `_pago_total` descartado). **RESUELTO ronda 2.**
- C10: [ ] Criterio 2 insuficientemente verificado por test.
        **RESUELTO ronda 2.**
- C11–C16: [x] rojo/verde documentado, dependencias done ([7, 8]), UI en
        español, sin TODOs/debug, integración justificada, backlog correcto.

## Cambios requeridos (ronda 1)

1. Dividir en módulos ≤100 líneas los 4 archivos >100 creados por la feature.
2. Eliminar el warning de compilación (`pago_mensual_pasivo` / `_pago_total`).
3. Fortalecer el test del balance futuro (asserts exactos + decrecimiento +
   consistencia patrimonio) y documentar qué significa «según pagos
   actuales».
4. Corregir la trazabilidad del informe (wc -l REAL de TODOS los archivos).
5. *(Menor)* Test node duplicado/engañoso: renombrar o hacerlo significativo.

---

# Ronda 2 — Verificación de cambios requeridos

> Re-ejecutado TODO por el reviewer en esta sesión (2026-08-22), no asumido:
> `./init.sh` completo, `cargo clean -p mfinance` + `cargo check
> --all-targets` (recompilación real), `cargo test`, `pnpm test`,
> `audit-design-tokens`, `wc -l` propio sobre los 35 archivos de la feature,
> lectura línea a línea de los tests nuevos y de design.md.

## Gates re-ejecutados en esta sesión

```bash
./init.sh                                          # ✔ INIT_EXIT=0 completo
cargo clean -p mfinance && cargo check --all-targets  # 0 warnings, 0 errores (compilación REAL, no cache)
cargo test --manifest-path src-tauri/Cargo.toml    # ok. 155 passed; 0 failed
pnpm test                                          # tests 188 | suites 54 | pass 188 | fail 0
node scripts/audit-design-tokens.mjs               # AUDIT ✔
grep pago_mensual_pasivo|_pago_total|saldo / 60    # 0 coincidencias en src-tauri/src/
grep invoke( fuera de src/adapters/                # 0 coincidencias
grep react|@tauri-apps en src/domain/              # 0 imports
grep tauri en src-tauri/src/{domain,application}/  # 0 deps
grep style={{|<style en pyg-proyeccion-section/    # 0 coincidencias
```

## Cambio 1 — División de archivos >100: ✅ APLICADO Y VERIFICADO

Los 4 archivos señalados ya NO existen (`ls`: No such file or directory):

- `src-tauri/src/application/pyg_proyeccion.rs` (era 335) → raíz re-exportadora
  de **17 líneas** (`pyg_proyeccion.rs`) + módulo directorio: `types.rs` (93),
  `engine_pyg.rs` (87), `engine_balance.rs` (97), `fachada.rs` (48). La API
  pública queda idéntica vía `pub use` (verificado: `commands/error.rs:73` y
  `commands/pyg_proyeccion_commands.rs:5-6` siguen consumiendo
  `crate::application::pyg_proyeccion::{...}` sin cambios).
- `tests/pyg_proyeccion_tests.rs` (era 228) → 5 módulos: fixtures (71),
  motor (88), supuestos (76), balance (56), balance_reparto (66).
- `pyg-proyeccion-logic.test.mjs` (era 134) → tabla (68) + supuestos (53)
  + `fixtures-proyeccion.mjs` compartido (63, sin sufijo `.test.mjs` para
  no ser descubierto por `node --test`).
- `balance-futuro-logic.test.mjs` (era 103) → tabla (64) + patrimonio (36).

**wc -l propio sobre TODOS los archivos de la feature**: máximo global **97**
(`engine_balance.rs` y `PanelesProyeccion.tsx`). Ninguno supera 100. La
división no rompió nada: cargo 155/0, node 188/0, init.sh verde.

## Cambio 2 — Sin warnings de compilación: ✅ APLICADO Y VERIFICADO

- `pago_mensual_pasivo`, `_pago_total` y el horizonte `saldo / 60.0`:
  **0 coincidencias** en todo `src-tauri/src/`.
- Verificado en **recompilación real** (no cache): `cargo clean -p mfinance`
  (eliminó 640 artefactos) seguido de `cargo check --all-targets` → ninguna
  línea `warning:` ni `error:`.

## Cambio 3 — Test del balance futuro fortalecido + decisión documentada: ✅ APLICADO Y VERIFICADO

Aserciones leídas línea a línea en disco:

- `pyg_proyeccion_balance_tests.rs:28-29` — caso canónico EXACTO del review:
  saldo 6000 con cuota registrada 100/mes → **5900.0** tras el mes 1 y
  **4800.0** tras el mes 12.
- `pyg_proyeccion_balance_tests.rs:49-55` — discriminante contra saldo/60:
  cuota real 250 → 5750 mes 1 / 3000 mes 12, y **pasivos estrictamente
  decrecientes mes a mes** (`assert!(fila.pasivos < previo)` en bucle sobre
  las 12 filas).
- `pyg_proyeccion_balance_reparto_tests.rs:32` — reparto proporcional al
  saldo (4000/2000 con cuota 150 → 5850 tras el mes 1); líneas 33-40:
  **patrimonio = activos − pasivos consistente** en meses 1, 6 y 12.
- `pyg_proyeccion_balance_reparto_tests.rs:60-65` — interés primero: cuota
  100 < interés mensual 120 (12000 al 12%) → pasivos constantes 12000, no
  amortiza principal.

Decisión «pagos actuales» documentada en
`specs/14_pyg-proyeccion-supuestos/design.md:28-43`: cuotas_deuda del último
registro mensual (datos reales del snapshot), reparto proporcional al saldo,
interés antes que principal, 0 si no hay registro; horizonte fijo 60 meses
descartado explícitamente. El motor lo implementa:
`pago_mensual_actual()` (`engine_balance.rs:14-21`) lee
`ExpenseCategory::CuotasDeuda` del último `monthly_records`.

TEST-FIRST coherente (impl_14.md §6.3): el ROJO citado es matemáticamente
consistente con el modelo viejo — p. ej. cuota 250 bajo saldo/60 daba 5900
frente al 5750 esperado («test result: FAILED. 10 passed; 4 failed»).

## Cambio 4 — Trazabilidad corregida: ✅ APLICADO Y VERIFICADO

- impl_14.md §5 admite explícitamente que la afirmación anterior era FALSA y
  remite al recuento final; §6.6 lista el wc -l de todos los archivos y
  **coincide valor a valor** con mi medición independiente (los 35 valores:
  97, 93, 92, 88, 87, 85, 77, 76, 71, 71, 68, 66, 64, 64, 63, 56, 53, 52,
  51, 51, 48, 48, 44, 41, 41, 39, 39, 36, 20, 19, 18, 17, 15…).
- `progress/current.md` bitácora ronda 2 con gates ciertos (155/0, 188/0,
  0 warnings, init ✓): los tres verificados por mí en esta sesión.
- Nota menor NO bloqueante: §6.1 segunda tabla cita «reemplazan
  tests/pyg_proyeccion_tests.rs, 335 líneas» cuando eran 228 (335 es el
  tamaño viejo de `pyg_proyeccion.rs`, mezclado al transcribir). Es una
  referencia histórica a un archivo eliminado; las cifras del estado actual
  son todas correctas.

## Cambio 5 — Test node significativo: ✅ APLICADO Y VERIFICADO

«proyección con supuestos cero mantiene valores del último mes histórico»
sustituido por «formatear y parsear son inversos y toleran entrada sucia»
(`pyg-proyeccion-supuestos.test.mjs:43-52`): round-trip exacto (0.025),
signo negativo ('-1%' ↔ '-1.0%') y entrada vacía/no numérica → 0. Prueba lo
que su nombre dice sobre exportaciones existentes.

## Checkpoints (ronda 2)

- C1: [x] `./init.sh` verde completo (INIT_EXIT=0, re-ejecutado).
- C2: [x] `cargo test` 155/0 · `pnpm test` 188/0 (re-ejecutados).
- C3: [x] Dominio puro ambos lados (greps 0).
- C4: [x] `invoke()` solo bajo `src/adapters/`.
- C5: [x] Lógica en use-cases; `.tsx` delegan.
- C6: [x] Tokens: AUDIT ✔; 0 CSS embebido.
- C7: [x] Máx. 100 líneas: máximo real 97, verificado con wc -l propio.
- C8: [x] impl_14.md ↔ repo coherentes (recuento coincide valor a valor).
- C9: [x] 0 warnings en `cargo check --all-targets` tras `cargo clean -p`.
- C10: [x] REQ-14-02 verificado por test con importes exactos y derivado de
        datos reales (cuotas_deuda), decisión en design.md.
- C11: [x] Ciclo rojo/verde documentado también para la ronda 2 (ROJO
        10 passed/4 failed coherente → VERDE).
- C12: [x] Dependencias [7, 8] en `done`; sin dependencias nuevas npm/crates
        (validador verde dentro de init.sh).
- C13: [x] Mensajes UI en español.
- C14: [x] Sin TODOs/FIXME/dbg!/print/console.log en los archivos de la
        feature (grep 0).
- C15: [x] Integración embebida en sección PyG, justificada, sin romper
        features cerradas (suites de features done siguen en verde).
- C16: [x] `feature_list.json`: id=14 `in_progress` con dependencias done —
        estado correcto antes del veredicto (pasará a `done` tras aprobarse).

## Conclusión ronda 2

Los 5 cambios requeridos están aplicados y verificados EN DISCO y por
ejecución propia: archivos ≤100 (máx 97) sin romper nada, 0 warnings en
compilación real, REQ-14-02 ahora demostrado por tests con importes exactos
y pagos derivados de datos reales con decisión documentada, trazabilidad
cierta y test menor sustituido por uno significativo. Los 6 criterios de
aceptación quedan cubiertos y el arnés completo está verde.

**Veredicto final: APPROVED**
