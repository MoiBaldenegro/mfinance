# Review — feature 20

VEREDICTO: APPROVED

**Veredicto:** APPROVED
**Feature:** 20 `moneda-ui-ajustes` (in_progress → propuesta done al líder)
**Revisor:** reviewer, 2026-08-23. Verificación contra DISCO, no contra el informe.

## Suites ejecutadas por mí HOY (no heredadas del informe)

| Comando | Resultado |
|---|---|
| `pnpm test` | **333 pass / 0 fail** (incluye los 26 nuevos de `tests/moneda-ui/`) |
| `cargo test --manifest-path src-tauri/Cargo.toml` | **233 passed / 0 failed** (backend intocado esta sesión; corrida como evidencia) |
| `./init.sh` | ✔ entorno · ✔ formato · ✔ tests 100% · ✔ build — **verde completo** |
| `node scripts/audit-design-tokens.mjs` | **AUDIT ✔** |

Greps exactos ejecutados por mí:

```
grep -rn "es-ES" src/domain/use-cases   → 0 coincidencias
grep -rn "€"    src/components          → 0 coincidencias
grep -rn "react\|@tauri-apps" src/domain → 0 coincidencias
invoke()                                 → solo bajo src/adapters/snapshot-ipc-adapter.ts
grep tipo/tasa de cambio|exchange src/  → 0 (sin conversión de importes)
formatoEuros|formatearEuros en src/ tests/ → 0 (los tres formateadores viejos ELIMINADOS)
TODO/FIXME/console.log/print en src/ tests/ → 0 (sin restos de debug)
```

## Verificación criterio por criterio (feature_list.json → id 20)

1. **TDD rojo→verde: formateadores migrados producen cadenas según la moneda recibida, casos MXN y EUR (REQ-20-03)** — ✅
   - ROJO observado antes del código en impl_20.md §1, con fallos específicos y no inventados a posteriori: `SyntaxError … 'conciliacion-logic.ts' does not provide an export named 'formatearImporte'`, `ERR_MODULE_NOT_FOUND … cambiar-moneda.ts` y `greps-moneda: fail 2` con la lista de archivos ofensores. Coherente con tests escritos contra firmas/módulos inexistentes.
   - En disco: `tests/moneda-ui/formateadores-migrados.test.mjs` (PyG/Balance/BalanceFuturo: `$1,576.00` MXN vs `1.576,00 €` EUR), `formateadores-deuda-simulador.test.mjs` (Deuda/Simulador/Conciliación/Inversiones, incluida la variante sin decimales `$1,235`), `resumenes-moneda.test.mjs` (resúmenes PyG Balance Deuda Inversiones Conciliación Ajustes derivan la moneda del snapshot; Registro/Cierre vía `resumenes-secciones`). Verde confirmado en mi ejecución.
2. **grep es-ES sobre src/domain/use-cases = 0 y grep € sobre src/components = 0 (REQ-20-04)** — ✅
   - Ejecutados por mí HOY: 0 y 0. Además quedan como test permanente `greps-moneda.test.mjs` (escanea `.ts/.tsx/.css` bajo ambos árboles), así el arnés vigila la regresión para siempre.
3. **Selector de Ajustes: tres monedas etiquetadas en español, marca la activa, reformateo al instante, persistencia vía save_state (REQ-20-01/02)** — ✅
   - `ETIQUETA_MONEDA` (`src/domain/entities/moneda.ts:48-52`: Pesos mexicanos/Dólares/Euros) testeada en `selector-moneda.test.mjs:15-25`.
   - `SelectorMoneda.tsx`: grupo segmentado con las tres opciones de `MONEDAS`, activa marcada con clase BEM + `aria-pressed`; delega sin lógica (conforme design.md decisión 1).
   - Persistencia: `use-cambio-moneda.ts:24-33` construye snapshot nuevo con el caso de uso puro `cambiarMoneda`, guarda por el puerto existente (`snapshotPort.save` → save_state, sin commands nuevos) y publica con `aplicarSnapshot`; error de guardado → aviso nombrado en español con `role="alert"`.
   - Reformateo instantáneo: proveedor ÚNICO en `AppShell.tsx:47` con `monedaDeSnapshot(snapshot)`; todo el árbol consume `usarMoneda()`; gráficas redibujan con la moneda en las deps del efecto (`PygChart.tsx:66`: `[serie, tema, moneda]`).
4. **Snapshot antiguo sin campo currency → pesos mexicanos sin errores (REQ-20-06)** — ✅
   - `moneda-snapshot.ts:10-19` cae a MXN ante undefined/null/sin strategy/fuera de catálogo/minúsculas; casos exactos en `selector-moneda.test.mjs:66-92`. El proveedor del shell lo usa como único valor; doble blindaje con el serde default de Rust de la F19.
5. **CampoImporte sufijo = símbolo activo; cabeceras de euro fijo → símbolo activo (REQ-20-05)** — ✅
   - `CampoImporte.tsx:34,53`: `simboloDe(usarMoneda())`. Cabeceras re-etiquetadas verificadas por muestreo en `TablaInversiones.tsx:26` y `DiagnosticoTabla.tsx:28`; greps de `(€)` y aria "en euros" bajo src/components → 0.
6. **Estilos solo tokens, ningún archivo >100 líneas, ./init.sh verde** — ✅
   - `audit-design-tokens.mjs` AUDIT ✔ (ejecutado por mí); `selector-moneda.css` usa exclusivamente custom properties (revisada línea a línea).
   - wc -l global sobre src/ y tests/ (ts/tsx/mjs) + todas las hojas CSS: máximos `tokens.css` y `conciliacion-cuenta.css` en 100; TODOS los archivos creados/modificados por la F20 ≤100 y los conteos del informe §4/§5 cuadran exactos contra disco.
   - `./init.sh` completo en verde (ejecutado por mí).

## Alcance y arquitectura

- **Dependencias de la feature:** `depends_on: [19]` y la 19 está `done` — nada saltado.
- **Hexagonal respetado:** `moneda-snapshot.ts`/`cambiar-moneda.ts` puros en use-cases; entidad-catálogo en entities; error nombrado en errors (`MonedaFueraCatalogoError`, probado con `assert.throws` en `selector-moneda.test.mjs:54-57`); 0 imports de react/@tauri-apps bajo src/domain; invoke() confinado a adapters. El contexto vive en shell/hooks siguiendo el patrón use-tema aprobado en F17, tal como admite design.md decisión 2, con UNA sola fuente de verdad (el snapshot).
- **Sin conversión de importes:** `cambiarMoneda` solo muta `strategy.currency` de forma inmutable (testeado que el original no muta); `formatoMoneda` re-etiqueta símbolo/separadores; greps de tipos de cambio/tasas → 0. Investigación §3 respetada.
- **Migración completa de la tabla research §2:** `formatoEuros` (resumenes-flujo) y las dos `formatearEuros` divergentes (conciliacion-logic Intl es-ES, inversiones-proyeccion toLocaleString) eliminadas — converge TODO en `formatoMoneda`; literal de `GraficaProyeccion.tsx` migrado (ahora `formatoMoneda(Number(value), moneda, 0)`); sufijos/cabeceras/aria actualizados.
- **Sin dependencias nuevas:** docs/dependencies.md sin entradas nuevas (última: pdf-extract de F12); validador dentro de init.sh en verde.
- Sin subagentes, sin temporales, feature queda `in_progress` a la espera del volteo del líder.

## Checkpoints (CHECKPOINTS.md)

- C1 (dependencias hacia el dominio; dominio puro ambos lados): [x]
- C2 (puertos/adapters; invoke solo en adapters): [x]
- C3 (sin CSS en .tsx; estilos en src/styles desde tokens): [x]
- C4 (sin lógica de negocio en UI; vive en use-cases): [x]
- C5 (tokens, nada hardcodeado): [x]
- C6 (≤100 líneas por archivo tocado): [x] — ver incidencia 2 (archivo PREEXISTENTE fuera de alcance)
- C7 (sin dependencias externas sin aprobación): [x]
- V1 (`./init.sh` verde): [x]
- V2/V3 (cargo check/test cuando toca backend): [x] — backend intocado; cargo test corrido igual: 233/233
- V4 (app arranca y muestra la UI correcta): [x] — claim de sesión del implementador respaldado por equivalentes automatizados (build verde, propagación/formateo/redibujado cubiertos por tests estructurales y de comportamiento)
- H1 (`done` en feature_list.json): [ ] ← correcto a mitad de flujo: el líder lo voltea tras este APPROVED
- H2 (current.md documentado): [x]
- H3 (sin temporales/debug/TODOs sueltos): [x]

## Incidencias (menores, NO bloqueantes)

1. **Comentarios obsoletos post-migración** — `src/components/balance-section/BalanceCards.tsx:2` ("formato es-ES euros"), `src/components/deuda-section/simulador/ResumenAhorro.tsx:2` y `TarjetaEscenario.tsx:2` ("en euros"): documentación engañosa ahora que el formato sigue a la moneda activa. Los greps de aceptación pasan porque sus alcances son src/domain/use-cases y el símbolo €; corrección concreta: reescribir esos tres comentarios ("formato según la moneda activa del snapshot") la próxima vez que se toque cada archivo. No requiere ciclo de cambios.
2. **Deuda preexistente fuera de alcance F20** — `src/adapters/snapshot-ipc-adapter.ts` tiene 148 líneas (creció en features aprobadas 11/13/14; la F20 NO lo tocó). El box global de CHECKPOINTS.md "ningún archivo supera las 100 líneas" es inexacto a nivel repo. Corrección concreta: que el líder programe una feature de refactor (partir el adapter en snapshot/mercado/conciliación). No afecta el criterio 6 de la F20, que limita a creados/modificados.
3. Ninguna otra. No se piden cambios de código.

## Cambios requeridos

Ninguno.
