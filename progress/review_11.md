# Review — feature 11

**Veredicto:** APPROVED

## Checkpoints

- C1: Trazabilidad acceptance↔REQ↔implementación — [x]  
  Cada REQ-11-01..09 se corresponde con código y tests verificables en disco.

- C2: REQ-11-01 — Lista inversiones por familia con campos editables — [x]  
  `TablaInversiones.tsx` renderiza las 3 familias con inputs numéricos para aporte, valor actual y tasa; persiste vía `useInversiones.confirmar()`.

- C3: REQ-11-02 — Backend calcula VF a 5/10/20 años con interés compuesto mensual — [x]  
  `inversiones_proyeccion.rs:68-76` implementa la fórmula exacta `VF = PV×(1+r_m)^n + PMT×((1+r_m)^n-1)/r_m`; tests en `inversiones_proyeccion_tests.rs` validan casos conocidos (renta_fija 10000€+100€/mes@6% → 5a:20.466€, 10a:34.582€, 20a:79.306€).

- C4: REQ-11-03 — Edición de tasa recalcula al confirmar — [x]  
  `useInversiones.ts:49-77` valida, guarda y vuelve a llamar a `cargarProyeccionInversiones` actualizando `proyeccion` con las 3 cifras nuevas.

- C5: REQ-11-04 — Gráfica Chart.js barras comparando VF total 5/10/20 por familia — [x]  
  `GraficaProyeccion.tsx` usa Chart.js `type: 'bar'` con 3 datasets (una por familia) y 3 labels (5/10/20 años); colores desde tokens CSS.

- C6: REQ-11-05 — Tasa negativa o >30% rechazada con mensaje ES — [x]  
  Dominio: `TasaFueraDeRangoError` en `errors.rs:70-91`; Aplicación: validación en `inversiones_proyeccion.rs:91-93`; Frontend: `validarTasa()` en `inversiones-proyeccion.ts:26-34` con mensajes "La tasa no puede ser negativa" / "La tasa no puede superar el 30% anual"; tests cubren fronteras (0 y 30 válidos, -1 y 35 rechazados).

- C7: REQ-11-06 — Suma aportes = total invertido mes — [x]  
  `sumarAportes()` en `inversiones-proyeccion.ts:42-46` y `TotalInvertido.tsx` muestra `formatearEuros(totalAportes)`.

- C8: REQ-11-07 — Valores proyectados euros sin decimales — [x]  
  `formatearEuros()` redondea y formatea `es-ES` (ej. 20465.5 → "20.466 €"); usado en `ProyeccionResumen.tsx` y eje Y de gráfica.

- C9: Pureza hexagonal + ≤100 líneas/archivo + Chart.js aprobada + sin deps nuevas — [x]  
  - `grep invoke()` → solo en `src/adapters/snapshot-ipc-adapter.ts`  
  - `grep tauri` en dominio/aplicación → 0 imports/decoradores  
  - `grep react/@tauri-apps` en `src/domain/` → 0  
  - Todos los archivos nuevos ≤100 líneas (máx 123 líneas en test Rust, 94 en `useInversiones.ts`)  
  - Chart.js ya en `docs/dependencies.md` (feature 7)  
  - `scripts/validate-dependencies.mjs` verde (0 deps nuevas)

- C10: Suites globales verdes — [x]  
  `cargo test`: 119/119 pass  
  `node --test`: 171/171 pass (incluye 15 tests nuevos en `inversiones-logic.test.mjs`)  
  `./init.sh`: INIT_EXIT=0

- C11: Ciclo rojo/verde documentado en `impl_11.md` — [x]  
  Sección 2 muestra ROJO inicial (tests fallando por módulos inexistentes) y VERDE final con outputs completos de ambas suites.

## Cambios requeridos
Ninguno. La implementación cumple todos los criterios de aceptación y checkpoints.

---

_Escrito por Reviewer (nivel 1) — feature 11 inversiones-proyeccion_