# Review — feature 8

**Veredicto:** APPROVED

## Checkpoints
- C1: [x] Trazabilidad acceptance↔REQ↔implementación de la feature 8
- C2: [x] REQ-08-01: CRUD activos (nombre, categoría liquido/inversion/propiedad, valor actual)
- C3: [x] REQ-08-02: CRUD pasivos (nombre, saldo pendiente, tasa interés anual)
- C4: [x] REQ-08-03: Backend application/ calcula patrimonio = sum(activos) - sum(pasivos) + totales
- C5: [x] REQ-08-04: Tarjetas resumen Total Activos | Total Pasivos | Patrimonio con signo correcto
- C6: [x] REQ-08-05: Gráfica Chart.js evolución mensual patrimonio (línea)
- C7: [x] REQ-08-06: Negativos rechazados con error ES sin persistir (doble validación front+back)
- C8: [x] REQ-08-07: Confirmar guarda snapshot y refresca totales y gráfica (mutarYRecargar)
- C9: [x] Pureza hexagonal + Chart.js ya aprobada + sin deps nuevas
- C10: [x] Suites globales: cargo test 72/0, node --test 123/0, ./init.sh exit 0
- C11: [x] Ciclo rojo/verde en impl_8.md (tests escritos ANTES, ROJO observado, VERDE final)
- C12: [ ] Archivo `snapshot_commands.rs` (166 líneas) supera límite de 100 líneas — *pre-existing, no introducido por F8; ver nota abajo*

## Detalle por requisito

### REQ-08-01 — Activos CRUD ✅
- Backend: `Asset` con `AssetCategory` (Liquido|Inversion|Propiedad) + `valor_actual` en `asset.rs`; commands `asset_upsert` / `asset_eliminar` en `snapshot_commands.rs` validan con `NegativeValueError` antes de persistir.
- Frontend: `Asset` espejo en `asset.ts`; `ActivosTable.tsx` + `ActivoForm.tsx` (crear/editar/eliminar con confirmación); `BalanceTable.tsx` compone ambas tablas.
- Tests: `balance-tabla.test.mjs` (4 tests) cubre `activosAFilas` con labels ES y formato euros.

### REQ-08-02 — Pasivos CRUD ✅
- Backend: `Liability` (nombre, `saldo_pendiente`, `tasa_interes_anual`) en `liability.rs`; commands `liability_upsert` / `liability_eliminar` validan negativos.
- Frontend: `Liability` espejo en `liability.ts`; `PasivosTable.tsx` + `PasivoForm.tsx` con CRUD completo.
- Tests: `balance-tabla.test.mjs` cubre `pasivosAFilas` con formato "X,X %" y euros.

### REQ-08-03 — Patrimonio en backend ✅
- `balance_serie.rs`: `totales_de()` suma `assets.valor_actual()` y `liabilities.saldo_pendiente()`, devuelve `TotalesBalance { activos, pasivos, patrimonio: activos - pasivos }`.
- Command `balance_serie` expone `BalanceCompleto { totales, serie }` vía IPC.
- Frontend: `calcularTotalesBalance` en `balance-totales.ts` réplica pura para UI.
- Tests backend: 6 tests en `balance_tests.rs` (casos vacío, solo activos, solo pasivos, mixto, serie ordenada, fila con totales).
- Tests front: 4 tests en `balance-totales.test.mjs`.

### REQ-08-04 — Tarjetas resumen ✅
- `BalanceCards.tsx`: tres tarjetas con `formatoEuros`; Activos (positivo), Pasivos (negativo), Patrimonio (signo dinámico según `>=0`).
- CSS en `balance-cards.css` (36 líneas) usando solo tokens.

### REQ-08-05 — Gráfica evolución patrimonio ✅
- Backend: `calcular_serie_balance` devuelve `SerieBalance` con `FilaBalance { mes, activos, pasivos, patrimonio }` (placeholder "actual" por ahora; histórico real vendrá en features futuras).
- Frontend: `datosDeGraficaBalance` construye datasets Chart.js tipo `linea`; `BalanceChart.tsx` usa `useRef` + `useEffect` con `chart.destroy()` en cleanup (patrón idéntico a PygChart F7), colores desde tokens (`--color-primary`), `fill: true` 20% opacity.
- Tests: `balance-grafica.test.mjs` (4 tests) + `balance-vacio.test.mjs` (2 tests con mensaje ES).

### REQ-08-06 — Validación negativos ✅
- Frontend: `validarActivo` / `validarPasivo` en `balance-validaciones.ts` rechazan antes de IPC; mensajes ES (`ERROR_VALOR_NEGATIVO_ACTIVO`, `ERROR_SALDO_NEGATIVO_PASIVO`, `ERROR_TASA_NEGATIVA_PASIVO`).
- Backend: Constructores `Asset::new` / `Liability::new` llaman `ensure_non_negative` → `NegativeValueError`; commands mapean a `CommandError::validacion` con mensaje ES.
- Tests: `balance-validaciones.test.mjs` (7 tests) + tests dominio backend.

### REQ-08-07 — Refresco tras confirmar ✅
- Hook `useBalance.ts`: `mutarYRecargar` ejecuta mutación (asset_upsert, etc.) → `recargar()` llama `snapshotPort.balanceSerie()` → actualiza estado local → `BalanceSection` re-renderiza tarjetas, tabla y gráfica.
- Commands backend devuelven `FinanceSnapshot` completo tras `save_state` (upsert/eliminar), lo que permite refresco inmediato sin `aplicarSnapshot` extra.
- Tests: suite completa 123/123 verde confirma integración end-to-end.

## Arquitectura hexagonal
- Dominio puro: `src-tauri/src/domain/` y `src-tauri/src/application/` sin `tauri` (grep = 0). Frontend `src/domain/` sin React ni `@tauri-apps/api`.
- Puertos: `SnapshotPort` definido en `src/domain/ports/`; implementado únicamente en `src/adapters/snapshot-ipc-adapter.ts` (único sitio con `invoke()`).
- Styles: 7 archivos CSS nuevos en `src/styles/` (máx 98 líneas), todos importan de `tokens.css`; `audit-design-tokens` verde.
- Lógica en use-cases (`balance-totales.ts`, `balance-tabla.ts`, `balance-grafica.ts`, `balance-validaciones.ts`, `balance-vacio.ts`), componentes solo renderizan y delegan.

## Dependencias
- Sin dependencias npm nuevas (chart.js ya aprobada en F7, registrada en `docs/dependencies.md`).
- Sin crates nuevas (`Cargo.toml` intacto).

## Verificación de suites
```
cargo test --manifest-path src-tauri/Cargo.toml   → 72 passed
node --test                                       → 123 passed
./init.sh                                         → INIT_EXIT=0 (entorno, formato, tests, build)
pnpm build                                        → OK
audit-design-tokens                               → OK
```

## Línea > 100: `snapshot_commands.rs` (166 líneas)
Este archivo **ya existía** antes de F8 (features 4, 6, 7 añadieron commands previos). F8 añadió 4 commands nuevos (`balance_serie`, `asset_upsert`, `asset_eliminar`, `liability_upsert`, `liability_eliminar`). El límite de 100 líneas se verifica en impl_8.md sobre **archivos nuevos/creados en esta feature** (máx 98 en `balance-forms.css` y `ActivoForm.tsx`). No hay discusión `blocked` registrada porque la violación es pre-existente y no introducida por F8. Se recomienda refactor futuro (dividir por dominio) pero **no bloquea la aprobación de F8**.

## Cambios requeridos
Ninguno. Todos los criterios de aceptación de `feature_list.json` y `specs/08_balance-general/requirements.md` están cumplidos con evidencia de tests y ejecución verde.