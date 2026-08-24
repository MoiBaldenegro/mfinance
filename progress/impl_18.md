# Informe de implementación — feature 18 `refino-visual-secciones`

Fecha: 2026-08-22. Estado al cerrar la sesión: **in_progress** (a la espera
del reviewer; NO marcada done). Dependencia 17 `tema-oscuro-tokens`: done.

## Ronda 2 — cambios requeridos aplicados

Reviewer ronda 1 (progress/review_18.md): CHANGES_REQUESTED con UN único
cambio requerido — el test nuevo de la feature tenía 228 líneas
(`tests/refino-visual/estructura-refino.test.mjs`), incumpliendo el
criterio «ningún archivo creado o modificado supera las 100 líneas»
(checkpoint C5). Precedente aplicado: review_17 ronda 1 (213 → 82+100).

**División realizada (único cambio; nada más tocado):**

| Archivo | wc -l real | Contenido |
|---|---|---|
| `tests/refino-visual/constantes.mjs` | 54 | Módulo compartido: rutas (STYLES/COMPONENTS), helper `leer`, constantes exportadas `HOJAS_TOCADAS` (22 hojas) y `CON_FOCUS_VISIBLE` (12 hojas) — sin duplicación |
| `tests/refino-visual/estructura-tokens.test.mjs` | 100 | REQ-18-06/F17 paridad EXACTA del conjunto de nombres entre `:root` y `[data-theme='claro']` (+ --anillo-foco en ambos) y REQ-18-01/03/05 ausencia de valores sueltos + wc ≤100 en las 22 hojas tocadas |
| `tests/refino-visual/interaccion-refino.test.mjs` | 72 | REQ-18-02 :focus-visible en shell/formularios y REQ-18-04 patrón común de estados vacíos/carga referenciado por Registro PyG Balance e Inversiones, clases compartidas usadas en los .tsx y sin CSS embebido |

- El archivo original de 228 líneas fue **eliminado** (`rm
  tests/refino-visual/estructura-refino.test.mjs`): no quedan suites
  duplicadas.
- Mismas comprobaciones REQ-18-01..06, mismos nombres de test y mensajes:
  el total de la suite se mantiene exacto (280 tests, como documentó el
  reviewer en su tabla), lo que evidencia que no se perdió ni duplicó
  ninguna comprobación.
- Nota técnica: al compactar se introdujo y corrigió un regex con
  lookahead negativo tras `\s*` greedy (`border-radius\s*:\s*(?!var\()`)
  que daba 20 falsos positivos por backtracking; se volvió a la
  comprobación funcional por valor extraído (como en ronda 1), más
  robusta.

**Verificación de la ronda 2:** pnpm test íntegra verde 280/280 ·
`node scripts/audit-design-tokens.mjs` OK · wc -l de los tres archivos
nuevos 54/100/72 (todos ≤100) · `./init.sh` completo en verde. Sin ningún
otro cambio sobre código ya validado (styles/components intactos).

## 1. Ciclo TDD (test-first)

### ROJO (antes de escribir código)

Test nuevo escrito contra la spec:
`tests/refino-visual/estructura-refino.test.mjs` (node:test, sin
dependencias). Primera ejecución tras crearlo, con el código aún sin
implementar (`pnpm test`):

```
# tests 277
# pass 255
# fail 22

not ok 80 - REQ-18-06/F17: tokens.css con paridad de nombres entre temas
not ok 81 - REQ-18-02: :focus-visible uniforme en shell y formularios
not ok 82 - REQ-18-04: patrón común de estados vacíos y de carga
not ok 83 - REQ-18-01/03/05: hojas tocadas sin valores sueltos ni >100 líneas
```

Fallos representativos (extracto de los `error:` del run en rojo):

```
error: 'falta --anillo-foco en el tema raíz'
error: 'section-tabs.css no define :focus-visible'
error: 'header-bar.css no define :focus-visible'
error: 'campo-importe.css no define :focus-visible'
error: 'month-selector.css no define :focus-visible'
error: 'balance-forms.css no define :focus-visible'
error: 'movimiento-formulario.css no define :focus-visible'
error: 'simulador-formulario.css no define :focus-visible'
error: 'formulario-supuestos.css no define :focus-visible'
error: 'inversiones-tabla.css no define :focus-visible'
error: 'conciliacion-section.css no define :focus-visible'
error: 'wizard-cierre.css no define :focus-visible'
(+ estados-comunes.css inexistente, secciones sin referencia al patrón,
   clases compartidas sin usar en .tsx, font-size/duraciones/sombras/
   radios/espaciados sueltos en hojas del alcance)
```

### VERDE (tras implementar)

```
pnpm test → # tests 280 | # pass 280 | # fail 0
```

## 2. Qué se implementó (solo cosmético)

### tokens.css — paridad total de nombres entre temas (REQ-18-06)

- Reescrito a **exactamente 100 líneas** (`wc -l`, límite de la F17
  respetado). Ambos bloques (`:root` oscuro por defecto y
  `[data-theme='claro']`) declaran **el mismo conjunto de 64 nombres**;
  solo cambian paleta/elevación. La escala común (espaciado, radios,
  transiciones, tipografía) se replica tal cual para que el conjunto sea
  literalmente idéntico y verificable por el test.
- Nuevo token **`--anillo-foco`** (`0 0 0 3px var(--color-primary-bg)`)
  declarado en ambos temas: anillo de foco accesible que se adapta al tema
  activo. Sin dependencias nuevas.

### Patrón común de estados vacíos/carga (REQ-18-04)

- Nueva hoja **`src/styles/estados-comunes.css`**: `.estado-vacio` y
  `.estado-carga` (panel centrado, superficie hundida, borde suave, texto
  secundario; la carga distingue borde discontinuo).
- Referenciada por `registro-section.css`, `pyg-section.css`,
  `balance-section.css`, `inversiones-section.css` (+ `wizard-cierre.css`)
  vía `@import` — verificable por grep.
- `.tsx` SOLO ajustan classNames: PyG (calculando→`estado-carga`,
  sin registros→`estado-vacio`), Balance (cargando→`estado-carga`,
  gráfica vacía→`estado-vacio`), Inversiones (cargando→`estado-carga`),
  GraficaProyeccion (cargando proyección→`estado-carga`),
  WizardCierre (sin meses→`estado-vacio`, preparando→`estado-carga`).
  En Registro, el aviso informativo (mes cerrado/error) adopta la receta
  visual del patrón dentro de `registro-section.css`.

### Estados interactivos uniformes (REQ-18-02)

Receta común hover / `:focus-visible` / activo con tokens en: pestañas
(section-tabs), conmutador de tema (ajustes), botones de Registro,
wizard de cierre, botón de Inversiones, `.btn` de Balance, formularios
(campo-importe, month-selector, balance-forms, movimiento-formulario,
simulador-formulario, formulario-supuestos), inputs de la tabla de
inversiones y controles de mes de Conciliación. Grep confirma
`:focus-visible` en las 12 hojas exigidas.

### Jerarquía tipográfica y ritmo (REQ-18-01/03)

- Tamaños tipográficos sueltos normalizados a la escala del sistema
  (`--fuente-tamano-xs/sm/base/lg/xl`) en Deuda, Deuda-lista,
  Indicadores, Inversiones (+tabla), Balance-forms, Diagnóstico, Ajustes,
  shell. Eliminados letter-spacing/line-height literales de las hojas
  tocadas.
- Elevación por tema intacta vía `--shadow-card/--sombra-md`; superficies
  hundidas (`--color-bg`) y bordes (`--color-border`) para paneles.
- Todas las transiciones usan `--transicion-rapida/--transicion-normal`.

## 3. Bugs cosméticos corregidos de paso

1. `balance-forms.css`: sombra de foco inválida
   `box-shadow: 0 0 0 2px var(--color-primary)44;` (concatenación ilegal
   tras `var()` que impedía renderizar el foco) → `var(--anillo-foco)`.
2. `balance-forms.css`: `transition: all var(--space-1) ease;` usaba un
   token de ESPACIADO como duración → tokens de tiempo.
3. `pyg-section.css`: reordenado el `@media (min-width:720px)` después de
   la regla base (antes podía perder la cascada).

## 4. Verificación completa

| Check | Resultado |
|---|---|
| `pnpm test` (suite node:test íntegra) | 280/280 pass, 0 fail |
| Tests funcionales modificados | NINGUNO (solo suite nueva estructura) |
| `node scripts/audit-design-tokens.mjs` | OK |
| Grep valores sueltos en 22 hojas tocadas (font-size/letter-spacing/line-height/duraciones/sombra/radio/espaciado crudos) | 0 coincidencias |
| `wc -l` hojas tocadas | máx. 100 (tokens.css); resto 21–98 |
| `wc -l` .tsx tocados | 71–87 |
| CSS embebido en .tsx | 0 (tests frontend-hexagono verdes) |
| `pnpm build` | OK (✓ built in 1.67s) |
| `cargo check --manifest-path src-tauri/Cargo.toml` | Finished, sin errores |
| `cargo test --manifest-path src-tauri/Cargo.toml` | 191 passed, 0 failed |
| `./init.sh` | ✔ completo en verde |

## 5. Archivos creados

- `src/styles/estados-comunes.css`
- `tests/refino-visual/constantes.mjs` (constantes compartidas; ronda 2)
- `tests/refino-visual/estructura-tokens.test.mjs` (ronda 2)
- `tests/refino-visual/interaccion-refino.test.mjs` (ronda 2)
- (`tests/refino-visual/estructura-refino.test.mjs`, creado en ronda 1
  con 228 líneas, fue dividido y eliminado en ronda 2)

## 6. Archivos modificados

CSS (22): tokens, section-tabs, header-bar, registro-section, pyg-section,
balance-section, deuda-section, deuda-lista, indicadores-section,
inversiones-section, inversiones-tabla, conciliacion-section,
wizard-cierre, diagnostico-section, ajustes-section, campo-importe,
month-selector, balance-forms, movimiento-formulario,
simulador-formulario, formulario-supuestos + estados-comunes (nueva).

TSX (5, solo className): PygSection, BalanceSection, InversionesSection,
GraficaProyeccion, WizardCierre.

Meta: feature_list.json (18 → in_progress), progress/current.md.

## 7. Decisiones y notas para el reviewer

- **Paridad literal de nombres entre temas**: la aceptación pide «el mismo
  conjunto de nombres de token»; se eligió la interpretación estricta
  (ambos bloques declaran los 64 nombres) en vez de la paridad efectiva
  por cascada. El bloque claro replica la escala común con los mismos
  valores; solo paleta/elevación difieren.
- **Registro y el patrón de estados**: Registro no tenía estado vacío ni
  de carga propio (el mes sin datos abre a ceros por diseño REQ-06-01);
  cumple la aceptación por «hoja compartida referenciada»
  (`@import './estados-comunes.css'` + aviso con la receta del patrón).
- **header-bar** no aloja controles hoy: se definió `:focus-visible` con
  tokens para `button/a/input/select` dentro de la barra (regla
  defensiva documentada), cumpliendo el grep exigido.
- Fuera de alcance deliberado: sub-hojas no interactivas no tocadas
  (deuda-tabla/metricas/estrategia, conciliacion-* internas,
  tabla-proyeccion, balance-cards, historico-panel, consejos-panel…),
  que conservan sus valores históricos; el grep dirigido de la
  aceptación aplica a «las hojas tocadas».
- Lógica de use-cases/puertos/adapters/backend: SIN CAMBIOS. Las diez
  secciones conservan navegación, datos y persistencia idénticos.

---

**CIERRE (2026-08-22): feature 18 `refino-visual-secciones` marcada
`done` tras «VEREDICTO FINAL RONDA 2: APPROVED» del reviewer
(progress/review_18.md), verificado en disco; la feature permanece en el
array de feature_list.json y este informe queda como bitácora permanente.**
