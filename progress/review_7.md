# Review — feature 7

**Veredicto:** APPROVED

## Checkpoints
- C1: [x] Trazabilidad acceptance↔REQ↔implementación — Cada acceptance de `feature_list.json` mapea a REQ-07-01..07 y a archivos concretos del ciclo (backend `pyg_serie.rs`/tests, frontend `pyg-tabla.ts`/`pyg-grafica.ts`/componentes/hook/estilos, chart-setup, adapter IPC, command).
- C2: [x] REQ-07-01: `src-tauri/src/application/pyg_serie.rs::calcular_serie()` pura, ordena `MonthlyRecord` por mes ascendente, devuelve `SeriePyg` con `FilaPyg{mes, ingresos, gastos, utilidad, ahorro_acumulado}`; expuesta vía `pyg_serie(&dyn SnapshotRepository)`.
- C3: [x] REQ-07-02: `src/domain/use-cases/pyg-tabla.ts::filasDeTabla()` transforma la serie en `FilaTablaPyg[]` con `formatoEuros` (es-ES, símbolo €); `TablaPyg.tsx` renderiza columnas Mes/Ingresos/Gastos/Utilidad/Ahorro acumulado; CSS usa solo tokens.
- C4: [x] REQ-07-03: `src/domain/use-cases/pyg-grafica.ts::datosDeGrafica()` construye 3 series alineadas (barras Ingresos/Gastos + línea Ahorro acumulado) con colores inyectados; `PygChart.tsx` usa `canvas` + `useEffect` con cleanup `chart.destroy()`; `chart-setup.ts` registra solo `BarController`+`LineController` (bundles mínimos).
- C5: [x] REQ-07-04: `docs/dependencies.md` entrada `chart.js` con `version: ^4.5.1`, `scope: dependencies`, `approved: 2026-08-21`, `motivo: pedido explícito del humano en el requerimiento del producto...`; coincide con `package.json`; `node scripts/validate-dependencies.mjs` verde.
- C6: [x] REQ-07-05: `usePygSerie(snapshot)` depende de `[snapshot]`; `SnapshotProvider` publica nuevo snapshot tras `save_state`; efecto se re-ejecuta → IPC `pyg_serie` → gráfico destruido/recreado con datos frescos.
- C7: [x] REQ-07-06: `pyg-tabla.ts::serieVacia()` detecta `filas.length === 0`; `MENSAJE_SIN_REGISTROS` invita a ir a Registro; `PygSection.tsx` renderiza aviso en lugar de tabla+gráfica vacía.
- C8: [x] REQ-07-07: Backend `fila_de()` calcula `utilidad = ingresos - gastos`; `calcular_serie()` acumula `ahorro_acumulado = acumulado_previo + utilidad` (suma corrida desde primer mes). Tests `la_utilidad_es_ingresos_menos_gastos_en_cada_mes` y `el_ahorro_acumulado_es_suma_corrida_desde_el_primer_mes` verifican la fórmula.
- C9: [x] Pureza hexagonal: `grep -r tauri src/domain/ src-tauri/src/domain/ src-tauri/src/application/` → 0 coincidencias (solo comentario "ni tauri"); `grep -r invoke src/` → solo `src/adapters/snapshot-ipc-adapter.ts`; tests backend `cargo test` (dominio aislado) + frontend `node --test` (type-stripping).
- C10: [x] ≤100 líneas por archivo: máximo 82 (`src-tauri/src/application/tests/pyg_tests.rs`); todos ≤100 ✅.
- C11: [x] Sin dependencias nuevas salvo `chart.js` aprobada (ver C5); `validate-dependencies.mjs` verde.
- C12: [x] Suites globales: `cargo test` 66 passed; `node --test` 102 passed; `./init.sh` INIT_EXIT=0; `audit-design-tokens` ✔.
- C13: [x] Ciclo rojo/verde documentado en `progress/impl_7.md` §2: fase ROJO (tests fallaban por módulos inexistentes) → fase VERDE (suites completas en verde).

## Cambios requeridos (si aplica)
Ninguno. La implementación cumple todos los requisitos de aceptación, respeta la arquitectura hexagonal, usa solo tokens CSS, mantiene ≤100 líneas por archivo, no introduce dependencias no aprobadas, y deja todas las suites en verde.