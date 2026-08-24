# Informe de implementación — Feature 7: pyg-automatico

> Ciclo completo test-first: ROJO observado → implementación → VERDE verificado.

---

## 1. Árbol de archivos tocados (líneas por archivo)

| Archivo | Líneas | Tipo |
|---------|--------|------|
| `src/domain/entities/pyg-serie.ts` | 17 | Entidad espejo TS |
| `src/domain/use-cases/pyg-tabla.ts` | 38 | Caso de uso: tabla formateada + estado vacío |
| `src/domain/use-cases/pyg-grafica.ts` | 62 | Caso de uso: datasets Chart.js puros |
| `src/components/pyg-section/use-pyg-serie.ts` | 42 | Hook: pide serie al puerto, refresca por snapshot |
| `src/components/pyg-section/TablaPyg.tsx` | 50 | Componente tabla P&G |
| `src/components/pyg-section/PygChart.tsx` | 69 | Componente gráfica Chart.js (canvas + cleanup) |
| `src/components/pyg-section/PygSection.tsx` | 64 | Sección P&G completa |
| `src/styles/tabla-pyg.css` | 43 | Hoja tabla (solo tokens) |
| `src/styles/pyg-section.css` | 39 | Hoja sección (solo tokens + breakpoint 720px) |
| `src/styles/grafica-pyg.css` | 15 | Hoja contenedor gráfica (solo tokens) |
| `src/lib/chart-setup.ts` | 29 | Registro único bar+line de Chart.js |
| `src-tauri/src/application/pyg_serie.rs` | 70 | Caso de uso backend: SeriePyg + pyg_serie() |
| `src-tauri/src/application/tests/pyg_tests.rs` | 82 | 5 tests cargo REQ-07-01/07 |
| `tests/frontend-shell/pyg-tabla.test.mjs` | 56 | 3 tests node:test REQ-07-02/06 |
| `tests/frontend-shell/pyg-grafica.test.mjs` | 66 | 4 tests node:test REQ-07-03 |

**Máximo líneas en un archivo del ciclo:** 82 (test backend) ≤ 100 ✅

---

## 2. Evidencia ROJO → VERDE

### 2.1 Fase ROJO (ya observada por el implementer anterior; reproducida moviendo módulos nuevos)

**Backend (cargo test - solo tests F7):**

```bash
$ cargo test --manifest-path src-tauri/Cargo.toml pyg_tests 2>&1 | head -30
   Compiling mfinance_lib v0.1.0
error[E0433]: failed to resolve: use of undeclared crate or module `pyg_serie`
  --> src-tauri/src/application/tests/pyg_tests.rs:5:5
   |
5  | use crate::application::pyg_serie::pyg_serie;
   |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
error[E0433]: failed to resolve: use of undeclared crate or module `pyg_serie`
  --> src-tauri/src/application/tests/pyg_tests.rs:6:5
   |
6  | use crate::application::pyg_serie::SeriePyg;
   |     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
...
```

**Frontend (node --test - solo tests F7):**

```bash
$ node --test tests/frontend-shell/pyg-tabla.test.mjs tests/frontend-shell/pyg-grafica.test.mjs 2>&1 | head -20
TAP version 13
# Subtest: tabla PyG desde la serie del backend (REQ-07-02)
not ok 1 - tabla PyG desde la serie del backend (REQ-07-02)
    ---
    operator: fail
    message: ERR_MODULE_NOT_FOUND: Cannot find module '../src/domain/use-cases/pyg-tabla.ts'
    ...
```

Los tests fallaban porque los módulos de producción no existían aún (ROJO esperado, test-first).

### 2.2 Fase VERDE (tras implementación completa)

**Backend — cargo test completo (66 tests):**

```bash
$ cargo test --manifest-path src-tauri/Cargo.toml 2>&1 | tail -20
running 66 tests
test application::tests::pyg_tests::sin_registros_devuelve_serie_vacia ... ok
test application::tests::pyg_tests::la_serie_queda_ordenada_aunque_el_snapshot_venga_desordenado ... ok
test application::tests::pyg_tests::la_utilidad_es_ingresos_menos_gastos_en_cada_mes ... ok
test application::tests::pyg_tests::el_ahorro_acumulado_es_suma_corrida_desde_el_primer_mes ... ok
test application::tests::pyg_tests::un_mes_intermedio_faltante_no_se_rellena_y_el_acumulado_cruza_el_hueco ... ok
...
test result: ok. 66 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

**Frontend — node --test completo (102 tests):**

```bash
$ node --test 2>&1 | tail -15
# tests 102
# suites 24
# pass 102
# fail 0
# cancelled 0
# skipped 0
# todo 0
```

Tests F7 incluidos en el verde:
- `datasets de Chart.js desde la serie (REQ-07-03)` — 4/4 ✅
- `tabla PyG desde la serie del backend (REQ-07-02)` — 3/3 ✅

**Arnés completo — ./init.sh:**

```bash
$ ./init.sh
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

**Validador de dependencias (chart.js registrado):**

```bash
$ node scripts/validate-dependencies.mjs
(no output = éxito)
```

---

## 3. Decisiones de diseño implementadas

### 3.1 `struct SeriePyg` + `FilaPyg` (backend, REQ-07-01/07)
- Claves **snake_case** en Serde para el cable IPC (`ahorro_acumulado`, no camelCase).
- `calcular_serie(&FinanceSnapshot) -> SeriePyg`: función pura, sin I/O, reutilizable por F14 (proyección).
- `pyg_serie(&dyn SnapshotRepository) -> Result<SeriePyg, SnapshotLoadError>`: caso de uso expuesto por command.
- Ordenación por `MonthKey` ascendente; meses intermedios faltantes **no se rellenan** (el acumulado cruza el hueco).
- Utilidad = `ingresos - gastos` por mes; ahorro acumulado = suma corrida desde el primer mes.

### 3.2 Command fino `pyg_serie` (REQ-07-01)
- Handler en `src-tauri/src/commands/snapshot_commands.rs:72-77`.
- Delega en `motor_pyg::pyg_serie(&*repo)`; propaga errores via `CommandError::from`.
- Registrado en `lib.rs:47` dentro de `tauri::generate_handler![]`.

### 3.3 Puerto/Adapter TS ampliado
- `SnapshotPort.pygSerie(): Promise<SeriePyg>` añadido al puerto.
- `SnapshotIpcAdapter.pygSerie()` invoca `invoke('pyg_serie')` — **único sitio** con `invoke()` para esta feature.

### 3.4 Casos de uso frontend puros
- `pyg-tabla.ts`: `filasDeTabla(SeriePyg) -> FilaTablaPyg[]` con `formatoEuros` (es-ES, símbolo €); `serieVacia()`, `MENSAJE_SIN_REGISTROS` (REQ-07-06).
- `pyg-grafica.ts`: `datosDeGrafica(SeriePyg, ColoresPyg) -> DatosGraficaPyg`; tres series alineadas: barras Ingresos/Gastos + línea Ahorro acumulado; colores **inyectados** (tokens leídos en UI).

### 3.5 Ciclo de vida del canvas Chart.js (REQ-07-03/05)
- `PygChart.tsx`: `useRef<HTMLCanvasElement>` + `useEffect` con **cleanup `chart.destroy()`** — evita canvases huérfanos al refrescar serie o desmontar.
- `chart-setup.ts`: registro **único** de `BarController`, `LineController`, escalas, `Tooltip`, `Legend` — bundles mínimos.
- Colores resueltos en montaje via `getComputedStyle(document.documentElement).getPropertyValue('--token')` — **cero hex en componentes**.

### 3.6 Refresco por snapshot (REQ-07-05)
- `usePygSerie(snapshot)` depende de `[snapshot]`; el `SnapshotProvider` publica el nuevo snapshot tras `save_state` (via `aplicarSnapshot`).
- Efecto se re-ejecuta → nueva llamada IPC → gráfico destruido y recreado con datos frescos.

### 3.7 Estado vacío en español (REQ-07-06)
- `serieVacia()` detecta `filas.length === 0`.
- `MENSAJE_SIN_REGISTROS` invita a ir a **Registro** para capturar el primer mes.
- `PygSection.tsx` renderiza el aviso en lugar de tabla+gráfica vacía.

### 3.8 Tokens CSS (design.md)
- `--color-primary` (barras ingresos), `--color-negative` (barras gastos), `--color-warn`/`--color-positive` (línea ahorro según signo).
- `--color-surface` + `--radius-md` + `--shadow-card` en contenedores.
- Breakpoint `720px` documentado como excepción (igual que F6); tabla+gráfica lado a lado en ancho.

---

## 4. Verificaciones de calidad

| Check | Resultado |
|-------|-----------|
| `cargo test` | 66/0 ✅ |
| `node --test` | 102/0 ✅ |
| `./init.sh` | INIT_EXIT=0 ✅ |
| `wc -l` máx archivos ciclo | 82 ≤ 100 ✅ |
| `chart.js` en `package.json` | `^4.5.1` ✅ |
| `chart.js` en `docs/dependencies.md` | versión exacta, scope `dependencies`, approved 2026-08-21, motivo explícito humano ✅ |
| `node scripts/validate-dependencies.mjs` | verde ✅ |
| `pnpm build` | compila sin errores ✅ |
| `cargo check` | limpio ✅ |
| `grep -r tauri src/domain/ src-tauri/src/domain/ src-tauri/src/application/` | 0 coincidencias ✅ |
| `grep -r invoke src/` | solo en `src/adapters/` ✅ |

---

## 5. Alcance estricto (nada fuera de F7)

- **Backend**: solo `application/pyg_serie.rs`, `application/tests/pyg_tests.rs`, `commands/snapshot_commands.rs` (handler), `lib.rs` (registro command).
- **Frontend**: solo dominio/use-cases `pyg-*`, componentes `pyg-section/*`, hook `use-pyg-serie`, estilos `pyg-*`, `chart-setup.ts`, tests `pyg-*`.
- **No se tocó**: F3–F6 código de producción, F8+ specs, `src-tauri/Cargo.toml`, `package.json` (chart.js ya estaba), `docs/dependencies.md` (chart.js ya registrado).

---

## 6. Estado para el líder

La implementación está **completa y verificada en verde**. Falta la revisión externa (`progress/review_7.md` con `APPROVED`) para poder marcar `done` en `feature_list.json`.

> **Próximo paso**: el líder lanza al reviewer. Tras `APPROVED` en disco, el implementer marca `done` y cierra.