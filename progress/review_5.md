# Review — feature 5 (shell-frontend)

**Veredicto:** APPROVED

> Veredicto FINAL tras **Ronda 2** (2026-08-21): el único CHANGES_REQUESTED
> de la Ronda 1 quedó resuelto íntegramente en disco. El historial completo
> de la Ronda 1 se conserva más abajo sin modificaciones.

---

## Ronda 2 — verificación de las correcciones (2026-08-21)

Re-revisión sobre disco del punto requerido (regla dura ≤100 líneas excedida
por los dos archivos de test nuevos). Evidencia reproducida hoy:

| # | Qué | Evidencia en disco | Resultado |
|---|-----|--------------------|-----------|
| 1 | División `tests/frontend-shell.test.mjs` (305) | `tests/frontend-shell/{helpers.mjs(90), secciones-catalogos.test.mjs(67), month-key-errores-carga.test.mjs(87), resumenes.test.mjs(96)}`; el archivo monolítico ya no existe | ✔ |
| 2 | División `tests/frontend-hexagono.test.mjs` (131) | `tests/frontend-hexagono/{utils.mjs(31), nucleo.test.mjs(62), ui.test.mjs(69)}`; el archivo monolítico ya no existe | ✔ |
| 3 | TODOS los `.mjs` de `tests/` ≤100 líneas | `wc -l` sobre `tests/**/*.mjs` → máx. nuevo **96** (`resumenes.test.mjs`); máx. absoluto 100 (`harness-kit-integrity.test.mjs`, preexistente del arnés) | ✔ |
| 4 | Mismas aserciones o más, ninguna eliminada | Contados `it()`: shell 6+7+13 = **26** (idénticos a Ronda 1, solo extraídos fixture/puerto falso a `helpers.mjs`); hexágono 4+2 = **6** idénticos. `node --test` → **# tests 53 / pass 53 / fail 0** (21 previas + 32 nuevas, igual que Ronda 1). Los `helpers/utils` NO casan con `*.test.mjs`, así que node:test no los descubre como suites | ✔ |
| 5 | `./init.sh` verde | Reproducido: **INIT_EXIT=0** (entorno, formato, tests al 100%, build tsc+vite) | ✔ |
| 6 | impl_5.md §5 corregido + nota en current.md | §5 retitulado «Árbol nuevo/modificado (líneas; máx. del ciclo 96 ≤ 100)» con desglose real incluido `tests/frontend-*`; `progress/current.md` (bitácora F5 ronda 2) documenta la división, la métrica real y el alcance estricto | ✔ |
| 7 | Sin cambios fuera del alcance de la ronda | `find src -type f -newermt "2026-08-21 14:55"` → vacío; mtimes de `src/` anteriores a esta ronda (14:42–14:53, ronda 1); solo tocados `tests/`, `impl_5.md` y bitácora | ✔ |

Checkpoints actualizados respecto a la Ronda 1: **C5 pasa de [ ] a [x]**
(todos los archivos nuevos/modificados del ciclo quedan ≤100 líneas);
C1-C4 permanecen [x]. Con esto los 5 checkpoints están cumplidos.

---

## Ronda 1 — revisión inicial (2026-08-21 · CHANGES_REQUESTED · RESUELTA)

## Checkpoints

- C1 Arquitectura hexagonal front: **[x]**
- C2 Convenciones (naming, tokens, español, estilos separados): **[x]**
- C3 Evidencia rojo/verde + dependencias `[3,4]` en `done`: **[x]**
- C4 Suites globales y `./init.sh` en verde: **[x]**
- C5 Modularización ≤100 líneas + alcance intacto: **[ ]** ← `tests/frontend-shell.test.mjs` (305) y `tests/frontend-hexagono.test.mjs` (131) superan el límite de `docs/architecture.md` regla 10 sin discusión registrada ni estado `blocked`.

## Checklist con evidencia objetiva

| # | Qué | Evidencia en disco | Resultado |
|---|-----|--------------------|-----------|
| 1 | REQ-05-01 pureza de `src/domain/` | `grep -rn "react\|@tauri-apps" src/domain/` → exit 1, **0 coincidencias**; test ejecutable `frontend-hexagono.test.mjs:46-56` | ✔ |
| 2 | Tipos espejo fieles al serde real | Cruzados contra `.rs`: `MonthlyRecord{mes,ingresos,gastos}`, `Asset{nombre,valor_actual}` (asset.rs:11-12), `Liability{nombre,saldo_pendiente,tasa_interes_anual}` (liability.rs:11-14), `Investment{familia,aporte_mensual,valor_actual,tasa_esperada_anual}` (investment.rs:47-51), `Movement{fecha,concepto,importe}` + `AccountStatement{cuenta,saldo_inicial,movimientos,saldo_final}` (account_statement.rs:9-23), `StrategySettings{debt_strategy,extra_monthly_payment}` y `FinanceSnapshot{monthly_records,assets,liabilities,investments,account_statements,strategy}` (snapshot.rs:21-48). Enums sin `rename_all` → variantes Rust tal cual (`Salario`, `CuotasDeuda`, `RentaFija`, `Avalanche`, `Snowball`) = valores de cable correctos; `as_str()` canónicas (`salario…`, `cuotas_deuda`, `renta_fija…`) expuestas en `CANONICAL_*_KEYS` alineadas 1:1 (catalogs.rs:27-35, 51-59) y cubiertas por test (`frontend-shell.test.mjs:101-123`). Campos snake_case correctos: sin `serde(rename_all)` en las structs | ✔ |
| 3 | REQ-05-02 invoke() solo adapters | `grep -rn "invoke" src/` excluyendo adapters → **0**; único sitio `src/adapters/snapshot-ipc-adapter.ts`. Operaciones contra firmas REALES de `snapshot_commands.rs`: `load_state()`→FinanceSnapshot, `save_state({snapshot})`, `export_json({destination})`→String, `import_json({origin})`→FinanceSnapshot (snapshot_commands.rs:18-53). Rechazo mapeado desde `CommandError{codigo,mensaje}` (commands/error.rs:17-20, 44-49) con códigos idénticos a los `CODIGOS` TS | ✔ |
| 4 | REQ-05-03 carga al arrancar → contexto compartido | `App.tsx` monta `SnapshotProvider`; su `useEffect` llama `cargarSnapshot(snapshotPort)` y publica `{cargando\|listo(snapshot)\|error}` (SnapshotProvider.tsx:41-55); caso de uso puro con puerto inyectado (`load-snapshot.ts:33-45`) | ✔ |
| 5 | REQ-05-04 navegación: DIEZ secciones del REQ | `secciones.ts`: Registro PyG Balance Deuda Inversiones Indicadores Conciliación Cierre Diagnóstico Ajustes — **exactamente las 10 del REQ-05-04 en orden** (el design.md de 9 queda correctamente subordinado al REQ, precisión del líder aplicada). Test de orden exacto (`frontend-shell.test.mjs:88-91`). Placeholders con datos reales: `resumenDeSeccion()` calcula cifras del snapshot (utilidad 1.576,00 €, patrimonio −6.519,50 €, conciliación «1 de 2», etc.), sin strings muertos | ✔ |
| 6 | REQ-05-05 tokens.css completo | Define TODOS los prometidos en design.md: `--color-bg/surface/primary/text/muted`, `--space-1..8` (escala 4px), `--radius-md:10px`, `--shadow-card`, `--font-sans` system-ui, y semánticos reservados `--color-positive/warn/negative`. `node scripts/audit-design-tokens.mjs` → **AUDIT ✔, exit 0**; test de tokens (`frontend-hexagono.test.mjs:104-130`) | ✔ |
| 7 | REQ-05-06 sin CSS en .tsx | `grep -rnE "style=\|<style" src/components src/App.tsx src/main.tsx` → **0 coincidencias**. Cada `.tsx` visual importa su hoja de `src/styles/` (16 hojas presentes); única excepción `SnapshotProvider.tsx`, glue de contexto sin marcado propio, excepción documentada en impl_5.md §6 y en el propio test (líneas 85-87). Aceptable: no contiene CSS ni valores visuales | ✔ |
| 8 | REQ-05-07 error nombrado ES + Reintentar | `ErrorScreen.tsx`: título «No se pudieron cargar tus datos», mensaje del `SnapshotLoadError` («no se pudo cargar el snapshot: …») y botón **Reintentar** cableado a `recargar` → `setIntento(n+1)` → relanza el efecto de carga (SnapshotProvider.tsx:57). Nunca pantalla vacía | ✔ |
| 9 | Líneas ≤100 (mandato: wc sobre `src/**`) | `src/**` máx **79** (`catalogs.ts`) ≤ 100 — **cumple en src/**. PERO los archivos de TEST nuevos: `frontend-shell.test.mjs` **305**, `frontend-hexagono.test.mjs` **131** → ver Cambios requeridos | ✘ |
| 10 | Sin hardcodeo fuera de tokens.css | `grep` de hex/rgb/px/rem fuera de tokens.css → **0**; 89 usos de `var(--…)` en hojas; audit verde. Español en todos los rótulos visibles | ✔ |
| 11 | Alcance F4 intacto + sin deps npm | `find src-tauri scripts specs docs templates -newermt "2026-08-21 14:30"` → vacío; Cargo.toml mtime 10:59; package.json 12:04; pnpm-lock.yaml 11:18; deps = exactamente las 4+6 del scaffold aprobadas. index.html modificado (lang="es", title mfinance) declarado en impl_5.md §5 — dentro del alcance front de F5 | ✔ |
| 12 | Suites globales | `node --test` → **53 pass / 0 fail** (21 previas + 32 nuevas: 26 shell + 6 hexágono); `./init.sh` → **INIT_EXIT=0** (entorno, formato, tests, build tsc+vite); `cargo test` → **61/0** (backend intacto, confirmación extra) | ✔ |
| 13 | Ciclo rojo/verde + type-stripping en impl_5.md | §2: experimento Node v22.22.2 con salida observada (`TYPE-STRIP OK`) y restricciones erasable-only; §3: hallazgo serde con scratch FUERA del repo; §4: ROJO guardado (ERR_MODULE_NOT_FOUND + 4 fails + endurecimiento del pase vacuo) → VERDE desglosado 26+6, 53/53 | ✔ |
| 14 | Dependencias de F5 en `done` | `depends_on: [3,4]` → features 3 y 4 `done` en feature_list.json; no se saltó ninguna dependencia | ✔ |

## Cambios requeridos (RESUELTOS en la Ronda 2 — ver evidencia arriba)

1. **Dividir `tests/frontend-shell.test.mjs` (305 líneas)** en módulos ≤100
   líneas cada uno, siguiendo el patrón ya existente en `tests/`
   (`harness-*` están todas ≤100; en F4 `transfer_tests.rs` quedó en
   exactamente 100). Sugerencia por dominio temático ya presente en sus
   `describe`: secciones+catálogos / month-key+errores+carga / resúmenes.
2. **Reducir o dividir `tests/frontend-hexagono.test.mjs` (131 líneas)** hasta
   ≤100 líneas (p. ej. separar el bloque REQ-05-06/05 de tokens del resto).
3. **Corregir la métrica del informe**: impl_5.md §5 titula «máx. 79 ≤ 100»
   contando solo `src/`; debe reflejar el máximo real de TODO archivo
   nuevo/modificado del ciclo (incluidos tests) y quedar ≤100 tras los
   puntos 1-2. Anotar la corrección en `progress/current.md`.
4. Tras el cambio: `node --test` verde completo (mismo nº de aserciones o
   más, ninguna eliminada) y `./init.sh` INIT_EXIT=0.

## Notas (sin acción requerida)

- `pnpm tauri dev` no se lanzó (procesos largos): la comprobación visual de
  ventana corresponde al humano, tal y como documenta honestamente
  impl_5.md §7. Todo lo automatizable está en verde.
- La excepción de hoja CSS para `SnapshotProvider.tsx` está bien delimitada:
  glue sin marcado, sin CSS embebido ni valores visuales.
