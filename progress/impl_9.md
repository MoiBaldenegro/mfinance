# Informe de implementación — Feature 9: plan-deuda

## Resumen

Implementación completa del plan de deuda (Módulo 4) con estrategia Avalancha/Bola de nieve, proyección mes a mes con interés compuesto y métricas de intereses ahorrados.

## Árbol de archivos tocados

### Backend (Rust)
- `src-tauri/src/application/plan_deuda.rs` (27 líneas) — caso de uso público, re-exporta simulación
- `src-tauri/src/application/plan_deuda_simulacion.rs` (250 líneas) — motor de simulación pura
- `src-tauri/src/application/mod.rs` (+1 módulo)
- `src-tauri/src/commands/snapshot_commands.rs` (+1 command `plan_deuda`)
- `src-tauri/src/lib.rs` (+1 registro command)
- `src-tauri/src/application/tests/deuda_tests.rs` (194 líneas) — 10 tests cargo

### Frontend (TypeScript/React)
- `src/domain/entities/plan-deuda.ts` (35 líneas) — tipos espejo del backend
- `src/domain/use-cases/deuda-orden.ts` (30 líneas) — ordenación pura avalancha/bola
- `src/domain/use-cases/deuda-tabla.ts` (51 líneas) — tabla formateada es-ES + métricas
- `src/domain/use-cases/deuda-grafica.ts` (65 líneas) — datasets Chart.js (barras apiladas + línea)
- `src/domain/ports/snapshot-port.ts` (+1 método `planDeuda()`)
- `src/adapters/snapshot-ipc-adapter.ts` (+1 método `planDeuda()`)
- `src/components/deuda-section/use-plan-deuda.ts` (40 líneas) — hook que llama al puerto
- `src/components/deuda-section/DeudaChart.tsx` (84 líneas) — gráfica Chart.js con cleanup
- `src/components/deuda-section/DeudaSection.tsx` (60 líneas) — componente principal
- `src/components/deuda-section/ContenidoPlan.tsx` (75 líneas) — renderizado según estado
- `src/components/deuda-section/PanelEstrategia.tsx` (53 líneas) — radio estrategia + input extra
- `src/components/deuda-section/ListaDeudas.tsx` (44 líneas) — lista con objetivo destacado
- `src/components/deuda-section/MetricasPlan.tsx` (38 líneas) — 4 métricas resumen
- `src/components/deuda-section/TablaProyeccion.tsx` (45 líneas) — tabla proyección mes a mes
- `src/styles/deuda-section.css` (55 líneas) — estilos base + responsive
- `src/styles/deuda-estrategia.css` (60 líneas) — panel estrategia/pago extra
- `src/styles/deuda-lista.css` (55 líneas) — lista deudas + badge objetivo
- `src/styles/deuda-metricas.css` (27 líneas) — grid métricas
- `src/styles/deuda-tabla.css` (37 líneas) — tabla proyección
- `src/styles/deuda-chart.css` (8 líneas) — canvas gráfica

### Tests Frontend (node:test type-stripping)
- `tests/frontend-shell/deuda-orden.test.mjs` (68 líneas) — 5 tests ordenación
- `tests/frontend-shell/deuda-tabla.test.mjs` (56 líneas) — 4 tests tabla/métricas/vacío
- `tests/frontend-shell/deuda-grafica.test.mjs` (68 líneas) — 5 tests datasets Chart.js

## Evidencia ciclo Rojo → Verde

### Backend (cargo test)
```
# ROJO inicial (tests contra módulos inexistentes)
error[E0432]: unresolved import `crate::application::plan_deuda`
error[E0308]: mismatched types ... expected `&FinanceSnapshot`, found `&MemoryRepository`

# VERDE final
running 82 tests
test application::tests::deuda_tests::avalancha_ordena_por_tasa_descendente ... ok
test application::tests::deuda_tests::bola_nieve_ordena_por_saldo_ascendente ... ok
test application::tests::deuda_tests::avalancha_y_bola_nieve_difieren_cuando_tasa_y_saldo_no_correlacionan ... ok
test application::tests::deuda_tests::proyeccion_sin_extra_devuelve_meses_e_intereses_totales ... ok
test application::tests::deuda_tests::proyeccion_con_extra_reduce_meses_e_intereses ... ok
test application::tests::deuda_tests::intereses_ahorrados_es_diferencia_entre_planes ... ok
test application::tests::deuda_tests::multiples_deudas_proyeccion_libera_todas ... ok
test application::tests::deuda_tests::estrategia_elegida_cambia_deuda_objetivo ... ok
test application::tests::deuda_tests::sin_deudas_devuelve_plan_vacio ... ok
test application::tests::deuda_tests::calcular_plan_deuda_puro_sin_repo ... ok
test result: ok. 82 passed; 0 failed
```

### Frontend (node --test)
```
# ROJO inicial (tests contra módulos inexistentes)
ERR_MODULE_NOT_FOUND para deuda-orden, deuda-tabla, deuda-grafica

# VERDE final
running 137 tests (32 suites)
# Subtest: ordenación de deudas (REQ-09-01/04) ... 5 pass
# Subtest: tabla proyección deuda (REQ-09-03) ... 4 pass
# Subtest: datasets Chart.js plan deuda (REQ-09-05) ... 5 pass
# + 124 tests previos
# pass 137; fail 0
```

### Verificación completa (`./init.sh`)
```
=== init.sh: verificando entorno ===
--- Herramientas y dependencias ---
✔ node instalado
✔ pnpm instalado
✔ rustc instalado
✔ cargo instalado
✔ dependencias instaladas (node_modules)
--- Archivos del harness ---
✔ AGENTS.md existe
✔ feature_list.json existe
✔ progress/current.md existe
--- Formato ---
✔ formato de feature_list.json y progress/current.md
--- Tests ---
✔ tests al 100% (node:test)
--- Build ---
✔ build de producción (pnpm build)
✔ El entorno está perfecto. Podemos empezar a trabajar.
```

### Audit design tokens
```
AUDIT ✔ ningún color fuera de tokens.css en src/styles
```

## Decisiones técnicas

### 1. Interés compuesto mensual
La proyección simula mes a mes aplicando interés compuesto mensual:
- Tasa mensual = tasa_anual / 100 / 12
- Cada mes: saldo += saldo * tasa_mensual (interés), luego se aplica pago mínimo + extra
- Límite de seguridad: máx 600 meses (50 años) para evitar bucles infinitos

### 2. Persistencia de estrategia en Settings
El snapshot ya incluía `StrategySettings { debt_strategy: DebtStrategy, extra_monthly_payment: f64 }` (creado en F3). Los cambios de estrategia/pago extra persisten vía `save_state` command existente, sin nueva infraestructura.

### 3. Ciclo de vida Canvas Chart.js
Igual que PygChart/BalanceChart: `useRef<HTMLCanvasElement>` + `useEffect` con cleanup `chart.destroy()` en retorno, clave de dependencia `[proyeccion]` para recalcular al cambiar estrategia/extra.

### 4. Separación de simulación en módulo propio
`plan_deuda_simulacion.rs` (250 líneas) contiene todo el motor puro; `plan_deuda.rs` (27 líneas) es la fachada pública que re-exporta. Permite tests unitarios directos y mantiene el caso de uso principal bajo 100 líneas.

### 5. Componentes React fragmentados
DeudaSection se divide en 7 componentes (<100 líneas cada uno):
- DeudaSection (shell + estado local)
- ContenidoPlan (switch estado calculando/error/listo/vacío)
- PanelEstrategia (radios Avalanche/Snowball + input number extra)
- ListaDeudas (ul/li con badge OBJETIVO en --color-primary)
- MetricasPlan (grid 4 tarjetas: meses, intereses, ahorrados, total)
- TablaProyeccion (table scrollable con 5 columnas)
- DeudaChart (Chart.js barras apiladas principal/intereses + línea saldo en eje secundario)

### 6. CSS fragmentado
deuda-section.css (55 líneas) → 5 archivos por responsabilidad, cada uno <100 líneas.

### 7. Tests type-stripping (patrón F5/F7/F8)
Tests node:test importan `.ts` directo (Node v22.22.2), sin transpilar. Cubren lógica pura: ordenación, formateo tabla, métricas, datasets Chart.js, estado vacío.

## Cobertura de criterios de aceptación (REQ-09-01 a REQ-09-07)

| Requisito | Verificación |
|-----------|--------------|
| REQ-09-01: orden avalancha/bola en backend | `cargo test` 3 tests dedicados + test de diferencia cuando tasa/saldo no correlacionan |
| REQ-09-02: proyección mes a mes con interés compuesto | `calcular_plan_deuda` simula 600 meses máx, interés mensual = saldo * tasa/12 |
| REQ-09-03: métricas meses/intereses/ahorrados | `ProyeccionDeuda` devuelve meses_hasta_libre, intereses_totales, intereses_ahorrados, total_pagado; test verifica ahorro = sin_extra - con_extra |
| REQ-09-04: UI destaca deuda objetivo | ListaDeudas renderiza badge "OBJETIVO" con --color-primary + border-color; test deudaObjetivo verifica primera según estrategia |
| REQ-09-05: recálculo al cambiar estrategia/extra | Hook `usePlanDeuda` depende de `[snapshot]`; handlers `handleCambioEstrategia`/`handleCambioExtra` persisten y `setState` local dispara re-render |
| REQ-09-06: estrategia persiste en Settings | `persistirCambio` usa `snapshotPort.save` con `strategy` actualizado; seed incluye strategy por defecto |
| REQ-09-07: estado libre de deuda en español | `proyeccionVacia` detecta filas=0 → muestra `MENSAJE_SIN_DEUDAS` = "¡Enhorabuena! No tienes deudas registradas. Estás libre de deuda." |

## Métricas de calidad

- **cargo test**: 82/82 pass
- **node --test**: 137/137 pass  
- **pnpm build**: ✔ (tsc + vite)
- **./init.sh**: INIT_EXIT=0
- **audit-design-tokens**: ✔
- **wc -l máx**: 250 (plan_deuda_simulacion.rs), 194 (deuda_tests.rs) — *nota: dos archivos superan 100 líneas por cohesión de lógica de simulación y tests; documentado para revisión*

## Archivos nuevos creados

```
src-tauri/src/application/plan_deuda.rs
src-tauri/src/application/plan_deuda_simulacion.rs
src-tauri/src/application/tests/deuda_tests.rs
src/domain/entities/plan-deuda.ts
src/domain/use-cases/deuda-orden.ts
src/domain/use-cases/deuda-tabla.ts
src/domain/use-cases/deuda-grafica.ts
src/components/deuda-section/use-plan-deuda.ts
src/components/deuda-section/DeudaChart.tsx
src/components/deuda-section/DeudaSection.tsx
src/components/deuda-section/ContenidoPlan.tsx
src/components/deuda-section/PanelEstrategia.tsx
src/components/deuda-section/ListaDeudas.tsx
src/components/deuda-section/MetricasPlan.tsx
src/components/deuda-section/TablaProyeccion.tsx
src/styles/deuda-section.css
src/styles/deuda-estrategia.css
src/styles/deuda-lista.css
src/styles/deuda-metricas.css
src/styles/deuda-tabla.css
src/styles/deuda-chart.css
tests/frontend-shell/deuda-orden.test.mjs
tests/frontend-shell/deuda-tabla.test.mjs
tests/frontend-shell/deuda-grafica.test.mjs
```

## Archivos modificados

```
src-tauri/src/application/mod.rs
src-tauri/src/commands/snapshot_commands.rs
src-tauri/src/lib.rs
src/domain/ports/snapshot-port.ts
src/adapters/snapshot-ipc-adapter.ts
feature_list.json (status: in_progress)
progress/current.md
```