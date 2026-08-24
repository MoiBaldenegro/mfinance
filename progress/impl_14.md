# Informe de implementación — Feature 14: pyg-proyeccion-supuestos

> Sesión de continuación (2026-08-21). La feature quedó interrumpida a
> medias: el backend ya estaba completo y verde; el frontend estaba a
> medias con tests en rojo y build roto. Este informe documenta el ciclo
> rojo→verde completado. Sin subagentes lanzados.

## 1. Estado ROJO inicial (evidencia)

### 1.1 `pnpm test` — 175/178, 3 fallos

```
# tests 178
# pass 175
# fail 3
```

Fallo (a) — `tests/frontend-hexagono/ui.test.mjs`, REQ-05-06 sin CSS embebido:

```
not ok 1 - cada .tsx visual importa su hoja desde src/styles y esa hoja existe
error: |-
  Expected values to be strictly deep-equal:
  + [
  +   'src/components/pyg-proyeccion-section/BalanceFuturoChart.tsx: hoja inexistente',
  +   'src/components/pyg-proyeccion-section/FormularioSupuestos.tsx: hoja inexistente',
  +   'src/components/pyg-proyeccion-section/ProyeccionChart.tsx: hoja inexistente'
  + ]
```

Fallos (b) y (c) — módulos inexistentes que las suites importan:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '...src\domain\use-cases\balance-futuro.ts'
  imported from ...tests\frontend-shell\balance-futuro-logic.test.mjs

Error [ERR_MODULE_NOT_FOUND]: Cannot find module '...src\domain\use-cases\pyg-proyeccion.ts'
  imported from ...tests\frontend-shell\pyg-proyeccion-logic.test.mjs
```

### 1.2 `pnpm build` — errores TypeScript (extracto)

```
BalanceFuturoChart.tsx(43,9): error TS2322: ... Types of property 'pointRadius' are incompatible.
BalanceFuturoChart.tsx(70,15): error TS2322: label callback vs TooltipItem<"line">
ProyeccionChart.tsx(43,38): error TS6133: 'i' is declared but its value is never read.
ProyeccionChart.tsx(51,9):  error TS2322: pointRadius/ScriptableContext incompatible
ProyeccionChart.tsx(51,51): error TS6133: 'idx' is declared but its value is never read.
ProyeccionChart.tsx(81,15): error TS2322: tooltip label mal tipado
ProyeccionSection.tsx(15,3): error TS6133: 'MENSAJE_SIN_BALANCE_HISTORICO' ...
ProyeccionSection.tsx(71,22): error TS6133: 'nuevos' ...
ProyeccionSection.tsx(113,9): error TS6133: 'formularioSupuestos' ...
use-pyg-proyeccion.ts(8,1): error TS6133: 'SnapshotLoadError' ...
use-pyg-proyeccion.ts(29,9): error TS6133: 'cargar' ...
pyg-proyeccion-grafica.ts(42,9): error TS6133: 'totalHistoricas' ...
ELIFECYCLE Command failed with exit code 2.
```

### 1.3 Backend

`cargo test --manifest-path src-tauri/Cargo.toml` ya estaba VERDE al tomar el
relevo (152 passed, 0 failed): motor `application/pyg_proyeccion.rs` con
`calcular_proyeccion_pyg` / `calcular_balance_futuro`, commands finos
registrados en lib.rs y suite `application/tests/pyg_proyeccion_tests.rs`
(REQ-14-01/02/06 cubiertos por test, incluida amortización de pasivos).
No se tocó ninguna línea del backend.

## 2. ROJO intermedio (contratos profundos que emergieron)

Tras crear los barriles, la suite `pyg-proyeccion-logic` destapó 5 subtests
en rojo que definían el contrato real de la lógica pura:

```
assert.ok(MENSAJE_SIN_HISTORICO.includes('registrar'))  → falsy (decía "registrado")
Object.keys(supuestos.variacionIngresos)                → TypeError undefined (era snake_case)
supuestos.variacionIngresos.salario                     → undefined (era variacion_ingresos)
datosDeGraficaProyección nombres esperados:
  ['Ingresos', 'Gastos', 'Utilidad', 'Patrimonio']      → la 4ª serie decía 'Ahorro acumulado'
```

Decisiones tomadas contra la spec:

- **camelCase en la lógica pura**: la suite fija `{ variacionIngresos,
  variacionGastos }` como lenguaje de la app. La traducción al cable serde
  snake_case del backend se hace en el adapter (`src/adapters/supuestos-
  cable.ts`), que es donde vive esa responsabilidad en la hexagonal (mismo
  patrón que `saldo_pendiente: saldoPendiente` en los demás comandos).
- **Mensaje REQ-14-05** reescrito para incluir literalmente "registrar" y
  "primer mes" (ambas frases exigidas por el criterio de aceptación 5).

## 3. Cambios archivo por archivo

### Nuevos

| Archivo | Líneas | Contenido |
|---|---|---|
| `src/domain/use-cases/pyg-proyeccion.ts` | 19 | Barril que re-exporta tabla/supuestos/gráfica (lo que importan las suites) |
| `src/domain/use-cases/balance-futuro.ts` | 18 | Barril equivalente para balance futuro |
| `src/adapters/supuestos-cable.ts` | 20 | Mapeo camelCase↔cable serde snake_case (único sitio con `invoke` traducido) |
| `src/lib/chart-colores.ts` | 18 | `token()` (lee custom property de :root) y `conAlpha()` (hex→rgba); cero colores sueltos |
| `src/components/pyg-proyeccion-section/CampoVariacion.tsx` | 51 | Campo % editable extraído: texto libre mientras se escribe (permite teclear "-"), normaliza al perder foco |
| `src/components/pyg-proyeccion-section/PanelesProyeccion.tsx` | 97 | Paneles extraídos de la sección: tarjeta supuestos (confirmar/restablecer), tarjetas PyG y balance futuro, estado vacío REQ-14-05 |
| `src/styles/grafica-proyeccion.css` | 15 | Contenedor gráfica proyección (solo tokens) |
| `src/styles/grafica-balance-futuro.css` | 15 | Contenedor gráfica balance futuro (solo tokens) |
| `src/styles/formulario-supuestos.css` | 83 | Panel supuestos: grupos, rejilla, inputs, ayuda y botón confirmar (solo tokens) |

### Modificados

| Archivo | Cambio |
|---|---|
| `src/domain/entities/pyg-proyeccion.ts` | `SupuestosProyeccion`/`SUPUESTOS_DEFECTO` a camelCase; comentario documenta que el adapter traduce al cable |
| `src/domain/use-cases/pyg-proyeccion-supuestos.ts` | `supuestosPorDefecto()`/`aplicarSupuestos()` operan camelCase |
| `src/domain/use-cases/pyg-proyeccion-tabla.ts` | `MENSAJE_SIN_HISTORICO`: incluye "registrar" y "primer mes" |
| `src/domain/use-cases/balance-futuro-tabla.ts` | Igual para `MENSAJE_SIN_BALANCE_HISTORICO` |
| `src/domain/use-cases/pyg-proyeccion-grafica.ts` | 4ª serie renombrada 'Ahorro acumulado'→'Patrimonio' (contrato del test); eliminado `totalHistoricas` sin usar (TS6133) |
| `src/adapters/snapshot-ipc-adapter.ts` | `pygProyeccion`/`balanceFuturo` envían `supuestosACable(supuestos)` |
| `src/components/pyg-proyeccion-section/use-pyg-proyeccion.ts` | Simplificado: supuestos como prop; efecto re-pide por IPC cuando cambian snapshot o supuestos; fuera `const cargar =` y `SnapshotLoadError` (TS6133) |
| `src/components/pyg-proyeccion-section/ProyeccionSection.tsx` | 129→52 líneas: orquestadora con borrador + confirmar + restablecer (remonta formulario vía `claveFormulario`); eliminada duplicación del formulario y memo muerto (TS6133) |
| `src/components/pyg-proyeccion-section/FormularioSupuestos.tsx` | 121→85 líneas: componente controlado sobre borrador; reutiliza `aplicarSupuestos` del dominio; `import { useState }` movido arriba (estaba a mitad del archivo) |
| `src/components/pyg-proyeccion-section/ProyeccionChart.tsx` | 112→93 líneas: callbacks scriptables sin tipo sustituidos por arrays por punto (type-safe), `'#fff'` hardcodeado→token `--color-surface` vía helper, fuera `i`/`idx` (TS6133), tick '★' marca la frontera histórico/proyectado |
| `src/components/pyg-proyeccion-section/BalanceFuturoChart.tsx` | 100→92 líneas: mismos arreglos de tipos y tokens |
| `src/components/pyg-section/PygSection.tsx` | Integra `<ProyeccionSection snapshot={snapshot} />` bajo el histórico (ver decisión §4) |

## 4. Decisión de integración (nota para el reviewer)

El catálogo `SECCIONES` está congelado a **exactamente 10 secciones** por el
test de la feature 5 done (`secciones-catalogos.test.mjs`: longitud y títulos
exactos). Añadir una pestaña rompería ese contrato cerrado. Como la propia
feature 14 "reutiliza el motor de P&G", la vista se embebe dentro de la
sección PyG: mismo motor, misma sección, cero cambios en features cerradas.

## 5. Verificación final (VERDE)

```
node --test (pnpm test):
  # tests 187 | # suites 47 | # pass 187 | # fail 0

cargo test --manifest-path src-tauri/Cargo.toml:
  test result: ok. 152 passed; 0 failed; 0 ignored

pnpm build: tsc ✓ + vite ✓ (built in 1.67s)
node scripts/audit-design-tokens.mjs:
  AUDIT ✔ ningún color fuera de tokens.css en src/styles
./init.sh: ✔ El entorno está perfecto. Podemos empezar a trabajar.
```

Reglas duras verificadas:

- wc -l ≤ 100 en los archivos frontend de la feature (máx: 97). **CORRECCIÓN
  ronda 2**: esta afirmación era FALTA tal como se escribió — los 4 archivos
  backend/node creados por la sesión 1 excedían 100 (pyg_proyeccion.rs=335,
  pyg_proyeccion_tests.rs=228, pyg-proyeccion-logic.test.mjs=134,
  balance-futuro-logic.test.mjs=103) y fueron detectados por el reviewer
  (C7/C8). Tras la división de la ronda 2, TODOS los archivos de la feature
  quedan ≤100: ver §6.
- Dominio puro: 0 imports de react/@tauri-apps en `src/domain/`; 0 imports
  de tauri en `src-tauri/src/domain|application` (solo comentarios de
  procedencia preexistentes).
- `invoke()` solo bajo `src/adapters/` (0 apariciones fuera).
- Sin CSS embebido en .tsx (0 matches `style={{`/`<style`).
- Sin dependencias nuevas (chart.js ya aprobada; no se añadió nada).
- Mensajes de UI en español.

Incidente durante el cierre (capturado por ./init.sh): el primer borrador de
este informe usaba un sinónimo castellano de "archivo" que contiene, por
casualidad ortográfica, uno de los substrings prohibidos que vigila
`tests/harness-kit-integrity.test.mjs` sobre todo el repo (fuga de tokens
del kit de otra app). Sustituido por "archivo". Al documentar el incidente
se citaron los substrings literales y el propio escáner los volvió a
detectar en esta nota: lección registrada, ni los nombres prohibidos ni las
palabras que los contienen se reproducen en ningún archivo. Escaneo final
limpio y ./init.sh re-ejecutado en verde.

## 6. Ronda 2 — cambios requeridos por review

Veredicto CHANGES_REQUESTED (progress/review_14.md): 5 cambios. Estado tras
aplicarlos: todos verificados en disco; gates finales al final de la sección.

### 6.1 División de archivos >100 (C7)

Backend (`src-tauri/src/application/`), ruta pública estable vía re-exports:

| Nuevo | Líneas | Contenido |
|---|---|---|
| `pyg_proyeccion.rs` | 17 | Raíz del módulo: decls + pub use (API idéntica para commands/error/tests) |
| `pyg_proyeccion/types.rs` | 93 | Tipos del cable serde + `mes_siguiente` |
| `pyg_proyeccion/engine_pyg.rs` | 87 | Motor PyG 12 meses (`calcular_proyeccion_pyg`) |
| `pyg_proyeccion/engine_balance.rs` | 97 | Motor balance futuro con pagos reales |
| `pyg_proyeccion/fachada.rs` | 48 | Wrappers del puerto + `ProyeccionError` |

Tests Rust (reemplazan `tests/pyg_proyeccion_tests.rs`, 335 líneas):

| Nuevo | Líneas | Contenido |
|---|---|---|
| `tests/pyg_proyeccion_fixtures.rs` | 71 | Constructores compartidos (+ builder `supuestos_con`) |
| `tests/pyg_proyeccion_motor_tests.rs` | 88 | Motor PyG: vacío, variación %, histórico/proyectado, plana |
| `tests/pyg_proyeccion_supuestos_tests.rs` | 76 | Multi-fuente, orden asc, variación negativa |
| `tests/pyg_proyeccion_balance_tests.rs` | 56 | Cuota real: caso canónico + discriminante |
| `tests/pyg_proyeccion_balance_reparto_tests.rs` | 66 | Reparto proporcional + interés primero + consistencia |

Tests node (reemplazan las dos suites >100):

| Nuevo | Líneas | Contenido |
|---|---|---|
| `tests/frontend-shell/fixtures-proyeccion.mjs` | 63 | Fixtures compartidos (serie PyG, balance, colores) |
| `tests/frontend-shell/pyg-proyeccion-tabla.test.mjs` | 68 | Tabla + estado vacío + datasets gráfica |
| `tests/frontend-shell/pyg-proyeccion-supuestos.test.mjs` | 53 | Supuestos + round-trip formato (cambio 5) |
| `tests/frontend-shell/balance-futuro-tabla.test.mjs` | 64 | Tabla + vacío + gráfica balance futuro |
| `tests/frontend-shell/balance-futuro-patrimonio.test.mjs` | 36 | Patrimonio creciente + pasivos decrecientes |

### 6.2 Warning de compilación eliminado (C9)

`pago_mensual_pasivo` (código muerto, saldo/60) ELIMINADA y `_pago_total`
calculado-y-descartado eliminado junto al motor viejo. La nueva lógica usa
el pago real (§6.3):

```
cargo check --manifest-path src-tauri/Cargo.toml --all-targets
  → 0 warnings, 0 errores (grep -cE "^(warning|error)" = 0)
```

### 6.3 «Pagos actuales» derivados de datos reales + tests reforzados (C10)

Decisión documentada en `specs/14_pyg-proyeccion-supuestos/design.md`:
«pagos actuales» = cuotas_deuda del último registro mensual; reparto
proporcional al saldo; interés primero; sin registro → 0 amortización. El
horizonte fijo saldo/60 quedó descartado explícitamente.

TEST-FIRST: los 4 tests nuevos se escribieron primero contra la
implementación anterior y fallaron (ROJO real):

```
test ...balance_reparte_la_cuota_proporcional_al_saldo ... FAILED
    assertion failed: (balance.filas_proyectadas[0].pasivos - 5850.0).abs() < 0.01
test ...balance_amortiza_segun_cuota_registrada_caso_canonico ... FAILED
    assertion failed: (...[11].pasivos - 4800.0).abs() < 0.01   # modelo viejo no era lineal
test ...balance_cubre_primero_intereses_y_no_amortiza_si_no_alcanza ... FAILED
test ...balance_usa_la_cuota_real_y_no_un_horizonte_fijo ... FAILED
    assertion failed: (...[0].pasivos - 5750.0).abs() < 0.01    # daba 5900 (saldo/60)
test result: FAILED. 10 passed; 4 failed
```

Tras implementar el nuevo modelo (VERDE): los 4 pasan con importes EXACTOS
(6000→5900 mes 1 y 4800 mes 12 con cuota 100; 5750/3000 con cuota 250;
5850 reparto proporcional 100/50; pasivos constantes 12000 cuando la cuota
no cubre intereses), pasivos decrecientes mes a mes verificados y
patrimonio = activos − pasivos consistente en meses 1, 6 y 12.

```
cargo test → test result: ok. 155 passed; 0 failed
```

(155 = 152 previos − 1 test débil sustituido por la suite fuerte + 4 nuevos.)

### 6.4 Trazabilidad corregida (C8)

Este §5 lleva la corrección de la afirmación falsa y el recuento REAL final
de TODOS los archivos de la feature está en §6.5. Bitácora de current.md
actualizada con afirmaciones ciertas.

### 6.5 Test node renombrado (cambio menor)

«proyección con supuestos cero mantiene valores del último mes histórico»
(duplicaba asserts y no probaba su nombre) → sustituido por
«formatear y parsear son inversos y toleran entrada sucia» sobre
`parsearVariacion`/`formatearVariacion`: round-trip exacto (0.025), signo
negativo ('-1%' ↔ '-1.0%') y entrada vacía/no numérica → 0. Cambio solo de
tests sobre exportaciones existentes: verde inmediato, sin código nuevo.

### 6.6 wc -l REAL final de TODOS los archivos de la feature

Máximo: 97. Ningún archivo supera las 100 líneas.

| Rango | Archivos |
|---|---|
| 97 | engine_balance.rs · PanelesProyeccion.tsx |
| 93 | types.rs · ProyeccionChart.tsx |
| 92 | BalanceFuturoChart.tsx |
| 88 | pyg_proyeccion_motor_tests.rs |
| 87 | engine_pyg.rs |
| 85 | FormularioSupuestos.tsx |
| 77 | pyg-proyeccion-supuestos.ts |
| 76 | pyg_proyeccion_supuestos_tests.rs |
| 71 | pyg_proyeccion_fixtures.rs · pyg-proyeccion-grafica.ts |
| 68 | pyg-proyeccion-tabla.test.mjs |
| 66 | pyg_proyeccion_balance_reparto_tests.rs |
| 64 | balance-futuro-tabla.test.mjs · balance-futuro-grafica.ts |
| 63 | fixtures-proyeccion.mjs |
| 56 | pyg_proyeccion_balance_tests.rs |
| 53 | pyg-proyeccion-supuestos.test.mjs |
| 52 | ProyeccionSection.tsx |
| 51 | use-pyg-proyeccion.ts · CampoVariacion.tsx |
| 48 | fachada.rs · design.md |
| 44 | entities/pyg-proyeccion.ts |
| 41 | pyg-proyeccion-tabla.ts · TablaProyeccion.tsx |
| 39 | balance-futuro-tabla.ts · TablaBalanceFuturo.tsx |
| 36 | balance-futuro-patrimonio.test.mjs |
| 20–17 | supuestos-cable.ts (20) · use-cases/pyg-proyeccion.ts (19) · chart-colores.ts (18) · pyg_proyeccion.rs (17) |
| 15 | use-cases/balance-futuro.ts |

### 6.7 Gates finales (ronda 2)

```
cargo check --manifest-path src-tauri/Cargo.toml --all-targets → 0 warnings
cargo test --manifest-path src-tauri/Cargo.toml → ok. 155 passed; 0 failed
pnpm test → # tests 188 | # pass 188 | # fail 0
./init.sh → ✔ El entorno está perfecto. Podemos empezar a trabajar.
node scripts/audit-design-tokens.mjs → AUDIT ✔
```
