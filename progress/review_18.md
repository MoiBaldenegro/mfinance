# Review — feature 18 `refino-visual-secciones`

**Veredicto:** CHANGES_REQUESTED

2026-08-22 (reviewer). Ronda 1. El trabajo cosmético está bien ejecutado:
paridad literal de los 64 nombres de token verificada por cuenta propia,
cero valores sueltos en las hojas tocadas, `:focus-visible` presente en
todas las hojas exigidas, patrón común de estados vacíos/carga compartido
y usado realmente por Registro PyG Balance e Inversiones (+wizard), suite
íntegra verde sin modificar ningún test funcional y nada cambiado fuera de
styles/components/tests. Incumple UN punto con precedente directo de cambio
requerido: un archivo de test nuevo con 228 líneas (>100, sin discusión
registrada ni estado blocked).

## Comprobaciones ejecutadas (comando + resultado)

| # | Comando | Resultado |
|---|---------|-----------|
| 1 | `pnpm test` | OK 280/280 pass, 0 fail (coincide con impl_18.md) |
| 2 | Tests funcionales modificados | NINGUNO — `find src/styles src/components tests -newer progress/review_17.md` devuelve exactamente los archivos declarados en impl_18.md §5/§6 (5 .tsx + 22 css + 1 test nuevo); ningún test funcional preexistente tocado |
| 3 | Cambios fuera de styles/components/tests | VACÍO — find sobre src/domain src/adapters src/hooks src/lib src-tauri/src index.html package.json docs scripts = 0 archivos; lógica de use-cases/puertos/adapters/backend intacta (REQ-18-06) |
| 4 | `node scripts/audit-design-tokens.mjs` | OK «AUDIT ✔ ningún color fuera de tokens.css» (exit 0) |
| 5 | Colores sueltos / invoke / style= en componentes | 0 hex-rgb-hsl bajo src/components; 0 usos de invoke; 0 style= en .tsx |
| 6 | Valores sueltos en las 21 hojas tocadas (excluida tokens.css) | 0 coincidencias: font-size/letter-spacing/line-height literales, duraciones de transición crudas, box-shadow/border-radius/padding/margin/gap numéricos — todo vía var(--) |
| 7 | `grep -lc ':focus-visible'` | Presente en 13 hojas: section-tabs, header-bar, campo-importe, month-selector, balance-forms, movimiento-formulario, simulador-formulario, formulario-supuestos, inversiones-tabla, conciliacion-section, wizard-cierre, ajustes-section, registro-section |
| 8 | Patrón común estados vacíos/carga | grep 'estados-comunes' → registro/pyg/balance/inversiones (+ wizard-cierre); clases estado-vacio/estado-carga usadas en PygSection.tsx:24/37, BalanceSection.tsx:39/70, InversionesSection.tsx:50, GraficaProyeccion.tsx:75, WizardCierre.tsx:25/32 |
| 9 | Paridad de nombres entre temas (aceptación 6) | Verificación propia independiente (sed rangos 9–55 vs 58–100 + grep -oE + sort -u + diff): 64 nombres por bloque, conjuntos idénticos. Coincide con la cifra «64» del informe y la comprueba tests/refino-visual (REQ-18-06/F17, ok en suite) |
| 10 | `wc -l src/styles/*.css` | Máx tokens.css = 100 (límite justo, cumple «no supera»); resto de hojas tocadas 21–98 — coincide con impl_18.md |
| 11 | `wc -l` .tsx tocados | 71/74/75/82/87 — coincide con impl_18.md («71–87») |
| 12 | CSS embebido en .tsx | 0; tests frontend-hexagono verdes dentro de pnpm test |
| 13 | `./init.sh` completo | OK verde total: entorno + harness + formato + tests 100% + build («El entorno está perfecto») |
| 14 | Evidencia TDD rojo→verde | Documentada en impl_18.md §1: ROJO primero (277 tests / 22 fallos con extracto de errores coherentes con lo que luego implementa), VERDE 280/280 reproducido por el reviewer |
| 15 | Dependencias de la feature | depends_on [17]; feature 17 en status done en feature_list.json. La 18 queda in_progress (correcto: no marcada done a la espera de review) |

## Checkpoints

- C1 Tests rojos antes del código y verde al final: [x]
      Evidencia en impl_18.md §1; verde reproducido (280/280).
- C2 `./init.sh` verde completo: [x]
- C3 Arquitectura hexagonal intacta (invoke solo adapters, estilos fuera
      de .tsx, dominio puro, sin cambios de lógica): [x]
- C4 Tokens sin hardcodear (audit OK, 0 valores sueltos en hojas tocadas): [x]
- C5 Máx. 100 líneas por archivo creado o modificado: [ ] FALLA —
      `tests/refino-visual/estructura-refino.test.mjs` tiene **228 líneas**
      (creado en esta feature). Sin discusión registrada ni estado blocked.
- C6 Coherencia informe ↔ repo: [x] (tokens.css 100 ✓, 64 nombres ✓,
      280/280 ✓, rango hojas 21–98 ✓, .tsx 71–87 ✓, :focus-visible ≥12 ✓)

## Cambios requeridos

1. **`tests/refino-visual/estructura-refino.test.mjs` (228 → ≤100 líneas
   por archivo).** Dividir en dos suites cohesivas manteniendo verdes las
   mismas comprobaciones REQ-18-01..06 y exportando/compartiendo las
   constantes (`HOJAS_TOCADAS`, `CON_FOCUS_VISIBLE`) para no duplicarlas,
   por ejemplo:
   - `tests/refino-visual/estructura-tokens.test.mjs`: paridad del
     conjunto de nombres entre `:root` y `[data-theme='claro']`
     (REQ-18-06/F17), ausencia de valores sueltos en las hojas tocadas y
     límite wc -l ≤100.
   - `tests/refino-visual/interaccion-refino.test.mjs`: `:focus-visible`
     en shell/formularios (REQ-18-02), patrón común de estados vacíos/carga
     referenciado por Registro PyG Balance e Inversiones (REQ-18-04) y
     clases compartidas usadas en los .tsx.
   Precedente aplicado: review_17 ronda 1 cambio requerido 1 (213 →
   división 82+100), que a su vez cita review_10 D10 (139/119 líneas) y
   review_14 C7 («4 archivos >100»). El criterio de aceptación 5 de F18 es
   explícito: «Ningún archivo creado o modificado supera las 100 líneas».

No se toca nada más: los hallazgos funcionales, visuales, arquitectónicos y
del arnés son positivos y no requieren acción. Tras aplicar el cambio 1,
re-lanzar review (ronda 2).

---

# Ronda 2 — Verificación del cambio requerido

2026-08-22 (reviewer). El único cambio requerido de la ronda 1 queda
aplicado y verificado en disco. La suite se mantiene en **280/280** sin
ningún fallo; no se tocó nada fuera del cambio pedido.

## Cambio requerido 1 — división del test de 228 líneas

- `tests/refino-visual/estructura-refino.test.mjs`: **eliminado**
  (`test -f` → no existe). ✔
- `tests/refino-visual/constantes.mjs`: **54 líneas** (wc -l) — módulo
  compartido con rutas, helper `leer`, `HOJAS_TOCADAS` (22 hojas) y
  `CON_FOCUS_VISIBLE` (12 hojas); constantes exportadas una sola vez, sin
  duplicación. ✔
- `tests/refino-visual/estructura-tokens.test.mjs`: **100 líneas** (wc -l;
  cumple «no supera las 100» justo en el límite) — cubre REQ-18-06/F17
  (bloques `:root` oscuro + `[data-theme='claro']`, paridad EXACTA del
  conjunto de nombres, `--anillo-foco` en ambos temas, tokens.css ≤100) y
  REQ-18-01/03/05 (por cada una de las 22 hojas tocadas: ≤100 líneas, sin
  tipografía suelta, duraciones solo con tokens de tiempo —incluida la
  guardia contra el token de espaciado-- , box-shadow/border-radius solo
  var(), espaciado crudo prohibido). ✔
- `tests/refino-visual/interaccion-refino.test.mjs`: **72 líneas** (wc -l)
  — cubre REQ-18-02 (`:focus-visible` en las 12 hojas shell/formularios) y
  REQ-18-04 (estados-comunes.css con `.estado-vacio/.estado-carga`,
  referenciado por registro/pyg/balance/inversiones, clases usadas en los
  .tsx y sin CSS embebido). ✔
- Cobertura equivalente a la ronda 1 confirmada describe/it a it contra el
  archivo original; la cuenta de tests no cambió (280 antes y después), lo
  que descarta comprobaciones perdidas o duplicadas. ✔

## Coherencia informe ↔ disco (impl_18.md «Ronda 2»)

| Cifra declarada | Medición propia | ¿Coherente? |
|---|---|---|
| constantes.mjs 54 | wc -l = 54 | ✔ |
| estructura-tokens.test.mjs 100 | wc -l = 100 | ✔ |
| interaccion-refino.test.mjs 72 | wc -l = 72 | ✔ |
| original eliminado | test -f → no existe | ✔ |
| suite se mantiene 280 | pnpm test = 280/280 pass, 0 fail | ✔ |

## Comprobaciones re-ejecutadas (comando + resultado)

| Comando | Resultado |
|---------|-----------|
| `pnpm test` | OK 280 tests / 280 pass / 0 fail; suites refino-visual ok |
| `node scripts/audit-design-tokens.mjs` | OK AUDIT ✔ (exit 0) |
| Paridad de nombres entre temas (sed rangos + grep -oE + sort -u + diff) | 64 vs 64, conjuntos idénticos |
| grep `:focus-visible` | presente en las 12 hojas de CON_FOCUS_VISIBLE |
| grep `estados-comunes` | referenciado por registro/pyg/balance/inversiones |
| Grep valores sueltos en las 21 hojas tocadas (excl. tokens.css) | 0 coincidencias (tipografía/duraciones/radios/sombras/espaciados) |
| grep `style={{\|<style` en src/components | 0 coincidencias |
| `wc -l` archivos creados/modificados F18 | máx 100 (estructura-tokens.test.mjs; tokens.css sigue en 100) |
| find -newer review_18.md sobre src+tests | solo los 3 archivos del cambio requerido |
| `pnpm build` | OK (built in 1.67s) |
| `./init.sh` completo | OK verde total («El entorno está perfecto») |

## Checkpoints ronda 2

- C1 Tests rojos antes del código y verde al final: [x]
- C2 `./init.sh` verde completo: [x]
- C3 Arquitectura hexagonal intacta (invoke solo adapters, estilos fuera
      de .tsx, dominio puro): [x]
- C4 Tokens sin hardcodear: [x]
- C5 Máx. 100 líneas por archivo creado o modificado: [x] RESUELTO ronda 2
      (228 → eliminado; ahora 54 + 100 + 72).
- C6 Coherencia informe ↔ repo: [x]

## Veredicto

**VEREDICTO FINAL RONDA 2: APPROVED**

El cambio requerido queda aplicado y verificado en disco; los hallazgos
positivos de la ronda 1 permanecen intactos. La suite queda en verde
(280/280), audit OK, build OK y `./init.sh` completo en verde. La feature
18 puede pasar a `done` por el flujo habitual del líder.
