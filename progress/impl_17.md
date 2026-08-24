# Informe de implementación — feature 17 `tema-oscuro-tokens`

> Sesión del 2026-08-22 (implementador). Test-first/TDD: los tests se
> escribieron ANTES que el código y se observaron EN ROJO antes de
> implementar. Estado al terminar: suite verde completa, feature queda
> `in_progress` a la espera del reviewer (no se marca done).

## Ciclo rojo/verde (evidencia)

### ROJO — antes de escribir código de la feature

Se creó primero la suite `tests/tema-oscuro/` (2 archivos) contra la spec
(`specs/17_tema-oscuro-tokens/requirements.md` + `design.md`) y se ejecutó
`pnpm test`. Salida textual (extracto):

```
not ok 80 - REQ-17-05: tokens.css dual ≤100 líneas
not ok 81 - REQ-17-08: data-theme fijado antes del primer render
not ok 82 - REQ-17-07: puerto TemaPort + adapter localStorage
not ok 83 - REQ-17-06: gráficas redibujadas al cambiar de tema
not ok 84 - REQ-17-02: conmutador de tema en Ajustes
# Error [ERR_MODULE_NOT_FOUND]: Cannot find module
#   '...\\src\\domain\\use-cases\\resolver-tema.ts' imported from
#   '...\\tests\\tema-oscuro\\resolver-tema.test.mjs'
not ok 48 - tests\\tema-oscuro\\resolver-tema.test.mjs
+   'components/balance-section/BalanceChart.tsx'   <- palabra "hex" en comentario
+   'components/deuda-section/DeudaChart.tsx'
+   'components/pyg-section/PygChart.tsx'
not ok 85 - Cero colores hardcodeados en src/components
# tests 234
# pass 220
# fail 14
```

14 fallos: el módulo `resolver-tema.ts` no existía, `tokens.css` no tenía
bloque `[data-theme='claro']`, `main.tsx` no fijaba data-theme, faltaban
puerto/adapter, ninguna gráfica consumía el tema ni dependía de él,
`GraficaProyeccion.tsx` pasaba literales `'var(--chart-*)'` a Chart.js, no
había conmutador en Ajustes y 3 comentarios contenían la palabra "hex".

### VERDE — tras implementar

```
# tests 239
# pass 239
# fail 0

AUDIT ✔ ningún color fuera de tokens.css en src/styles
FORMATO ✔ feature_list.json, progress/current.md, specs/ y docs/dependencies.md correctos

✔ tests al 100% (node:test)
✔ build de producción (pnpm build)
✔ El entorno está perfecto. Podemos empezar a trabajar.   <- ./init.sh completo

cargo test: 191 passed; 0 failed   |   cargo check: Finished (sin errores)
```

## Qué se implementó

**Núcleo puro (dominio, sin framework):**
- `src/domain/entities/tema.ts`: tipo `Tema = 'oscuro' | 'claro'`.
- `src/domain/use-cases/resolver-tema.ts`: `resolverTema(preferencia)` —
  sin preferencia o valor corrupto → `'oscuro'`; solo `'claro'/'oscuro'`
  exactos se respetan (REQ-17-04). `alternarTema(tema)` para el conmutador.
- `src/domain/ports/tema-port.ts`: interfaz `TemaPort { leer(): string|null;
  guardar(tema): void }`.

**Adapters y glue:**
- `src/adapters/tema-local-storage-adapter.ts`: implementa TemaPort sobre
  localStorage con degradación silenciosa si el storage falla; singleton
  `temaPort`. Único sitio que toca storage para el tema.
- `src/lib/estado-tema.ts`: estado observable del tema; `iniciarTema(port)`
  resuelve + aplica `data-theme` sobre `<html>`; `conmutarTema()` alterna,
  persiste vía puerto y notifica suscriptores.
- `src/hooks/use-tema.ts`: `usarTema()` con `useSyncExternalStore`.
- `src/main.tsx`: llama `iniciarTema(temaPort)` ANTES de `.render()` —
  sin destello claro; oscuro por defecto (REQ-17-08).

**Tokens duales:** `src/styles/tokens.css` reescrito compacto: paleta OSCURA
como valores por defecto en `:root`, paleta CLARA bajo
`[data-theme='claro']` con el MISMO conjunto de nombres crudos; alias con
`var()` heredan el tema activo. Nuevos `--chart-grid` y `--chart-ticks`
(design.md). 93 líneas (≤100). Los nombres históricos están intactos.

**UI:** conmutador accesible en `AjustesSection.tsx` ("Tema activo: X" +
botón "Usar tema Y", aria-label en español), estilos en
`ajustes-section.css` solo con tokens.

**Gráficas (REQ-17-06):** las 6 (`PygChart`, `BalanceChart`, `DeudaChart`,
`ProyeccionChart`, `BalanceFuturoChart`, `GraficaProyeccion`) consumen
`usarTema()` e incluyen `tema` en las deps del efecto → redibujan con la
paleta activa sin recargar. Se eliminaron los 3 `token()` locales duplicados
en favor de `src/lib/chart-colores.ts` (+ helper `coloresDeEjes()` para
rejilla/etiquetas según tema). `GraficaProyeccion.tsx` ya NO pasa literales
`var(--chart-*` al canvas: colores resueltos con `token()`/`coloresDeEjes()`.

## Decisiones tomadas

1. **Preferencia fuera del snapshot**: puerto propio TemaPort + adapter
   localStorage; StrategySettings, esquema Rust y commands intactos (0
   cambios bajo src-tauri/src).
2. **Estado de tema sin Provider .tsx nuevo**: mini-store observable en
   `lib/estado-tema` + `useSyncExternalStore` evita crear un `.tsx` sin hoja
   (respetando la regla de ui.test "todo .tsx importa su hoja") y permite a
   las gráficas depender del tema sin prop-drilling.
3. **Bloque claro = valores actuales claros** exactos (más grid/ticks
   nuevos): la F18 parte de la misma referencia visual.
4. **Ejes de gráficas tematizados** en las 6 gráficas (rejilla + ticks desde
   tokens) para legibilidad real en oscuro, no solo series.
5. Comentarios de componentes reescritos para que `grep -riE "hex|rgb|rgba"`
   dé 0 coincidencias (más estricto que el criterio literal).

## Verificación (cómo reproducirla)

```
./init.sh                                  # entorno+formato+tests+build TODO VERDE
pnpm test                                  # 239 pass / 0 fail
node scripts/audit-design-tokens.mjs       # AUDIT OK
pnpm build                                 # tsc + vite OK
cargo check --manifest-path src-tauri/Cargo.toml
cargo test --manifest-path src-tauri/Cargo.toml   # 191 pass
grep -rn "localStorage" src/components/           # 0 coincidencias
grep -rniE "#[0-9a-f]{3,8}\b|rgba?\(|\b(hex|rgb)\b" src/components/   # 0
grep -n "var(--chart" src/components/inversiones-section/GraficaProyeccion.tsx  # 0
wc -l src/styles/tokens.css                # 93 ≤ 100
```

Manual (opcional): `pnpm dev` → abre oscura sin destello; en Ajustes pulsa
"Usar tema claro" → toda la UI y las gráficas cambian al instante; cierra y
reabre → recuerda la elección.

## Archivos tocados

Nuevos: `src/domain/entities/tema.ts`, `src/domain/ports/tema-port.ts`,
`src/domain/use-cases/resolver-tema.ts`,
`src/adapters/tema-local-storage-adapter.ts`, `src/lib/estado-tema.ts`,
`src/hooks/use-tema.ts`, `tests/tema-oscuro/resolver-tema.test.mjs`,
`tests/tema-oscuro/estructura-tokens.test.mjs` y
`tests/tema-oscuro/integracion-tema.test.mjs` (ronda 2; sustituyen a la
primitiva `estructura-tema.test.mjs`, eliminada).
Modificados: `src/main.tsx`, `src/styles/tokens.css`,
`src/lib/chart-colores.ts`, `src/components/ajustes-section/AjustesSection.tsx`,
`src/styles/ajustes-section.css`, `src/components/pyg-section/PygChart.tsx`,
`src/components/balance-section/BalanceChart.tsx`,
`src/components/deuda-section/DeudaChart.tsx`,
`src/components/pyg-proyeccion-section/ProyeccionChart.tsx`,
`src/components/pyg-proyeccion-section/BalanceFuturoChart.tsx`,
`src/components/inversiones-section/GraficaProyeccion.tsx`,
`feature_list.json` (status in_progress), `progress/current.md`.

## Ronda 2 — cambios requeridos aplicados

Respuesta al veredicto CHANGES_REQUESTED ronda 1 (progress/review_17.md,
puntos C5 y C6). Se aplicaron EXACTAMENTE los dos cambios requeridos y nada
más: ningún archivo de src/ ni del backend fue tocado en esta ronda.

**1. División de la suite de 213 líneas (C5).** El archivo
`tests/tema-oscuro/estructura-tema.test.mjs` (213 líneas) se eliminó y sus
comprobaciones quedan repartidas en dos suites cohesivas, ambas ≤100 líneas:

| Archivo | Líneas | Contenido |
|---|---|---|
| `tests/tema-oscuro/estructura-tokens.test.mjs` | 82 | REQ-17-05: bloque dual de tokens.css (≤100 líneas, :root oscuro por defecto, paleta clara bajo [data-theme='claro'] con los MISMOS nombres, :root ≠ claro, nombres históricos + --chart-grid/--chart-ticks) |
| `tests/tema-oscuro/integracion-tema.test.mjs` | 100 | REQ-17-08 data-theme pre-render; REQ-17-07 puerto TemaPort + adapter localStorage + 0 storage en componentes + pureza del dominio; REQ-17-06 redibujado de las 6 gráficas (usarTema + chart-colores + deps) y 0 literales 'var(--chart' en GraficaProyeccion; REQ-17-02 conmutador en Ajustes; cero colores hardcodeados |

Las mismas comprobaciones REQ-17-05/06/07/08 siguen verdes (la única fusión
es el chequeo chart-colores de las 6 gráficas, ahora dentro del test de
deps). Precedente aplicado según el reviewer: review_10 D10 y review_14 C7.
`resolver-tema.test.mjs` (42 líneas) no cambió.

**2. Cifra de tokens.css corregida (C6).** Las DOS menciones del informe
(§"Tokens duales" y comentario del bloque Verificación) pasan de 92 a **93**
líneas. Origen de la discrepancia: el primer wc -l (92) se tomó antes del
último ajuste del comentario cabecera de tokens.css (+1 línea); la medición
del reviewer (93) es la correcta y coincide con disco.

**Verificación de la ronda 2** (todas ejecutadas tras los cambios):

```
pnpm test                                   # 238 tests / 238 pass / 0 fail
node scripts/audit-design-tokens.mjs        # AUDIT OK
node scripts/check-format.mjs               # FORMATO OK
wc -l tests/tema-oscuro/*.test.mjs          # 82 + 100 + 42 (todos ≤100)
wc -l src/styles/tokens.css                 # 93 ≤ 100
./init.sh                                   # completo en verde
```

Nota: 238 tests frente a 239 de la ronda 1 — al fusionar el chequeo
chart-colores en el test de dependencias de las 6 gráficas, un `it` pasó a
formar parte de otro; ninguna comprobación se perdió.

## Cierre

Feature 17 `tema-oscuro-tokens` CERRADA el 2026-08-22: veredicto final
ronda 2 APPROVED (progress/review_17.md, línea «VEREDICTO FINAL RONDA 2:
APPROVED», verificado en disco por el líder). Estado marcado `done` en
feature_list.json; la feature permanece en el array.
