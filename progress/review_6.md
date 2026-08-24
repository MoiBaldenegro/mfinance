# Review — feature 6 (registro-mensual)

**Veredicto:** APPROVED

> Veredicto FINAL tras **Ronda 2** (2026-08-21): los cambios requeridos de la
> Ronda 1 quedaron aplicados íntegramente en disco y re-verificados hoy por
> el reviewer. El historial completo de la Ronda 1 se conserva más abajo sin
> modificaciones.

---

## Ronda 2 — verificación de las correcciones (2026-08-21)

Re-revisión sobre disco del punto requerido (disciplina tokens/hardcodeo +
correcciones del informe). Evidencia REPRODUCIDA hoy:

| # | Qué | Evidencia en disco | Resultado |
|---|-----|--------------------|-----------|
| 1 | Sin font-size en rem; width vía tokens | `campo-importe.css`: los `font-size: 0.925rem` (línea 10) y `0.85rem` (línea 44) eliminados — etiqueta y error heredan tipografía (líneas 11-13 y 42-45); `width: calc(var(--space-8) * 2)` (línea 23) sobre la escala existente | ✔ |
| 2 | Los 6 bordes normalizados O documentados | Criterio por rol aplicado: fieldset → `border: none` + `--shadow-card` (`tarjeta-montos.css:10-12`, convención F5); 2 divisores → banda `var(--space-1) solid var(--color-bg)` técnica section-tabs.css:10 aprobada en F5 (`tarjeta-montos.css:24`, `registro-section.css:46`); botones ‹ › → `border:none` con hover (`month-selector.css:16`); los **2 hairlines restantes** de controles de edición quedan registrados como **excepción explícita en impl_6.md §4** («Criterio único para los 6 bordes», líneas 151-162) con justificación técnica (tokens.css no define grosores de trazo) | ✔ |
| 3 | Grep hex/rgb/px/rem fuera de tokens.css | Grep reproducido hoy → **exactamente 3 coincidencias, TODAS registradas como excepción en impl_6.md §4**: hairline ×2 (`campo-importe.css:29`, `month-selector.css:30`, ambas con comentario «excepción registrada» en línea) + breakpoint `720px` (`registro-section.css:29`). impl_6.md §5 declara las 3 honestamente. Ninguna coincidencia sin registrar | ✔ |
| 4 | impl_6.md corregido | §3 incluye ahora `tests/frontend-shell/registro-meses.test.mjs` (46 líneas, línea 109 del informe); §2 sustituye «git stash» (imposible: workspace sin repo git) por el procedimiento real de reproducción del ROJO (mover temporalmente los módulos nuevos fuera de `src/` y repetir el comando, líneas 34-40) | ✔ |
| 5 | Suites globales reproducidas HOY | `node --test` → **# tests 95 / # pass 95 / # fail 0**, exit 0; `node scripts/audit-design-tokens.mjs` → **AUDIT ✔**, exit 0; `./init.sh` → **INIT_EXIT=0** (formato + tests al 100% + build tsc+vite). Backend intacto desde la Ronda 1 (verificado por mtime) ⇒ cargo test 61/0 de la Ronda 1 sigue vigente | ✔ |
| 6 | Alcance estricto de la ronda | `find src tests scripts specs docs package.json pnpm-lock.yaml src-tauri/src src-tauri/Cargo.toml -newermt "2026-08-21 15:50"` (hora del veredicto de Ronda 1) → **SOLO las 4 hojas CSS del ciclo**; ningún `.ts/.tsx/.mjs/.rs` tocado, nada de tests ni backend ni specs/docs/scripts | ✔ |
| 7 | Líneas ≤100 tras la ronda | `wc -l`: campo-importe.css **46**, month-selector.css **32**, tarjeta-montos.css **35**, registro-section.css **65** — coinciden con el inventario actualizado de impl_6.md §3; máximo del ciclo sigue siendo **100** (`use-registro-mensual.ts`) | ✔ |

Checkpoints actualizados respecto a la Ronda 1: **C2 pasa de [ ] a [x]**
(valores hardcodeados eliminados o registrados como excepción explícita;
grep reducido a las 3 excepciones documentadas en impl_6.md §4). C1, C3,
C4 y C5 permanecen [x]. Con esto los 5 checkpoints están cumplidos.

---

## Ronda 1 — revisión inicial (2026-08-21 · CHANGES_REQUESTED · RESUELTA)

**Veredicto de la ronda:** CHANGES_REQUESTED

> Revisión de nivel 1 sobre disco (2026-08-21). Toda la evidencia funcional y
> de suites fue REPRODUCIDA hoy por el reviewer (no heredada del informe).
> El único bloqueo es la disciplina de tokens/hardcodeo, con precedente
> directo en el estándar aplicado y aprobado en `progress/review_5.md`.

## Checkpoints

- C1 Arquitectura hexagonal front (dominio puro, puertos/adapters, invoke solo en adapters): **[x]**
- C2 Convenciones (naming, español, estilos separados, **solo tokens**): **[ ]** ← valores hardcodeados fuera de `tokens.css` en hojas nuevas del ciclo (detalle abajo)
- C3 Evidencia rojo/verde en `impl_6.md` + dependencia `[5]` en `done`: **[x]**
- C4 Suites globales y `./init.sh` en verde: **[x]**
- C5 Modularización ≤100 líneas + alcance intacto: **[x]**

## Checklist con evidencia objetiva

| # | Qué | Evidencia en disco | Resultado |
|---|-----|--------------------|-----------|
| 1 | Trazabilidad acceptance ↔ REQ ↔ implementación | Las 6 acceptance de F6 (`feature_list.json:94-101`) mapean 1:1 contra REQ-06-01…08 (`specs/06_registro-mensual/requirements.md`) y contra código verificado: selector (`MonthSelector.tsx`), formulario por catálogos (`TarjetaMontos.tsx` + `catalogs.ts`), persistencia (`guardar-registro.ts:92-98` → `port.save`), bloqueos inline (`CampoImporte.tsx:52-56`), totales en vivo (`use-registro-mensual.ts:64-74`), botón ocupado (`RegistroSection.tsx:64-71`), apertura a ceros (`textos-registro.ts:14-18`) | ✔ |
| 2 | Catálogos EXACTOS cruzados contra backend | `src-tauri/src/domain/catalogs.rs`: `IncomeSource{Salario,Freelance,Arriendos,Otros}` (líneas 10-15) y `ExpenseCategory{Vivienda,Alimentacion,Transporte,CuotasDeuda,Ocio,Otros}` (48-55); claves canónicas `salario/freelance/arriendos/otros` (27-34) y `vivienda/alimentacion/transporte/cuotas_deuda/ocio/otros` (69-78) = `INCOME_SOURCES`, `EXPENSE_CATEGORIES`, `CANONICAL_*_KEYS` de `src/domain/entities/catalogs.ts:9-49` idénticos y en el mismo orden | ✔ |
| 3 | Persistencia sin invoke en componentes | Cadena completa: `RegistroSection` → hook `use-registro-mensual.ts:77-85` → caso de uso `guardar-registro.ts` (puerto inyectado) → `SnapshotPort` → adapter `snapshot-ipc-adapter.ts` (F5, único sitio con `invoke`). `grep -rn "invoke" src/` excluyendo `src/adapters/` → **0 coincidencias**; `grep -rnE "from 'react'|@tauri-apps" src/domain/` → **0 coincidencias**. Backend NO tocado (alcance ítem 9) y `save_state` existente cubre la escritura (decisión documentada en `impl_6.md §4`) | ✔ |
| 4 | Validaciones REQ-06-06 + mes inválido | Negativo/no numérico → `ImporteNegativoError` / `ImporteNoNumericoError` nombrados ES (`importe-errors.ts:5-26`), mensajes citan el valor («importe no numérico: "doce"», «el importe no puede ser negativo: "-150"»); el guardado NO llama al puerto con errores (`registro-bloqueos.test.mjs:11-39`, `port.llamadas.length === 0`); mes inválido `2026-13` → «Mes inválido: se espera el formato AAAA-MM.» sin tocar puerto (`registro-bloqueos.test.mjs:41-52`); error inline junto al campo con `--color-negative` + `role="alert"` + `aria-invalid/describedby` (`campo-importe.css:32-45`, `CampoImporte.tsx:46-56`) según `design.md` | ✔ |
| 5 | design.md respetado | input nativo `type=month` + ‹ › reales `<button>` sin dependencia de calendario (`MonthSelector.tsx:16-43`); dos tarjetas lado a lado que apilan bajo ancho estrecho (`registro-section.css:21-33`); `step="0.01"` + sufijo € (`CampoImporte.tsx:41-50`); una hoja propia por componente importada desde `src/styles/`; todo rótulo visible en español | ⚠ Parcial: ver Cambios requeridos 1-3 (hardcodeo fuera de tokens) |
| 6 | Subtotales EN VIVO (REQ-06-05) | `numeroSeguro` suma lo tecleado sin lanzar (inválido=0, coma decimal, negativos visibles en preview; el bloqueo es solo al guardar) — `validacion-importes.ts:40-45`, `use-registro-mensual.ts:64-74` con `useMemo`; cobertura en `registro-totales.test.mjs:53-68` (incluye `numeroSeguro('-5') === -5`, contrato corregido en implementación y no en test, `impl_6.md §2`) | ✔ |
| 7 | Apertura a ceros + navegación ‹ › | Mes sin registro → textos `''` (=0) sin arrastrar otros meses (`textos-delMes`/`buscarRegistroMes` undefined, `registro-upsert.test.mjs:88-90`); cruce de año probado en ambas direcciones (`registro-meses.test.mjs:18-28`); mes inicial = mes de trabajo o calendario (`use-registro-mensual.ts:25-27`) | ✔ |
| 8 | ≤100 líneas TODO archivo del ciclo incluidos tests | `wc -l` reproducido hoy sobre los 24 archivos nuevos/modificados: máx. **100** (`use-registro-mensual.ts`, exactamente en el límite), tests máx. **96** (`registro-validaciones.test.mjs`); ninguno supera el límite | ✔ |
| 9 | Alcance: solo src/** y tests/** (+progress) | `find src-tauri/src src-tauri/Cargo.toml scripts specs docs package.json pnpm-lock.yaml -newermt "2026-08-21 15:00"` → **vacío**; sin backend nuevo ⇒ hexagonal back no aplica y `cargo test` 61/0 confirma integridad; Cargo.toml/package.json intactos, cero dependencias nuevas npm/crates | ✔ |
| 10 | Suites globales reproducidas HOY | `node --test` → **# tests 95 / # pass 95 / # fail 0**, exit 0; `cargo test --manifest-path src-tauri/Cargo.toml` → **61 passed / 0 failed**; `./init.sh` → **INIT_EXIT=0** (formato + tests al 100% + build tsc+vite) | ✔ |
| 11 | Ciclo rojo→verde evidenciado | `impl_6.md §2`: ROJO observado antes del código (15× ERR_MODULE_NOT_FOUND, pass 0 / fail 5, comando reproducible) con corrección intermedia documentada (contrato de `numeroSeguro` fijado por el test); VERDE final 95/95 + 61/0 + INIT_EXIT=0. Dependencia `depends_on:[5]` en `done` (`feature_list.json:86`) — nada saltado | ✔ |
| 12 | Regresión estructural del shell + build | Las otras 9 secciones permanecen intactas (spot-check `PygSection.tsx` placeholder 21 líneas sin cambios; `secciones.ts` 33 y `App.tsx` 34 sin tocar según mtimes >15:00 vacío fuera de `registro-section/`, `SnapshotProvider.tsx` y hojas del ciclo); el build de producción pasa dentro de `./init.sh` verde | ✔ |
| 13 | Tokens exclusivos (grep hex/rgb/px/rem fuera de tokens.css) | Grep reproducido: **3× rem** en `campo-importe.css` (líneas 10 `font-size: 0.925rem`, 22 `width: 7.5rem`, 44 `font-size: 0.85rem`), **6× px** en bordes crudos `1px solid` (`tarjeta-montos.css:8,22`; `registro-section.css:46`; `campo-importe.css:28`; `month-selector.css:14,28`) y breakpoint `720px` (`registro-section.css:29`). `impl_6.md §4` solo defiende el breakpoint; **no registra excepción** para fuentes, ancho ni bordes. Precedente: `review_5.md` ítem 10 exigió grep hex/rgb/px/rem = 0 para aprobar F5 | ✘ |

## Cambios requeridos

1. **Eliminar el hardcodeo tipográfico en `campo-importe.css`**: líneas 10
   (`font-size: 0.925rem;`) y 44 (`font-size: 0.85rem;`). `docs/architecture.md`
   principio 6 reserva las **tipografías** a las custom properties de
   `tokens.css` (que no define escala de tamaños). Solución preferente: quitar
   las declaraciones y heredar (como hace el resto de hojas aprobadas de F5);
   si se desea escala de tamaños, proponerla como tokens nuevos ANTES (nota:
   `design.md` dice «sin valores nuevos salvo semánticos», así que ampliar
   `tokens.css` requiere esa discusión registrada, nunca en silencio).
2. **Sustituir `width: 7.5rem;` (`campo-importe.css:22`)** por la escala de
   espaciado existente (mismo patrón que `month-selector.css:9`,
   `min-width: var(--space-8)`), u obtener el mismo ancho con tokens.
3. **Normalizar o registrar los bordes `1px solid`** (6 ocurrencias, ítem 13):
   alinear con la convención vigente (`section-tabs.css:10` usa
   `var(--space-1)` para el grosor) o dejar documentada en `impl_6.md §4` la
   excepción del hairline junto a la ya existente del breakpoint, de forma
   explícita y por qué no es token del sistema.
4. **Corregir el informe `impl_6.md`**: (a) el inventario de §3 omite
   `tests/frontend-shell/registro-meses.test.mjs` (**46 líneas**, existe en
   disco y forma parte del ciclo ROJO); (b) §2 indica reproducir el ROJO
   «tras `git stash`», pero el workspace NO es un repositorio git — sustituir
   por el procedimiento real (p. ej., mover temporalmente los módulos nuevos
   fuera de `src/`).
5. Tras los cambios: `node --test` verde completo (mismas aserciones o más,
   ninguna debilitada), `node scripts/audit-design-tokens.mjs` ✔,
   `./init.sh` con INIT_EXIT=0, y grep hex/rgb/px/rem fuera de `tokens.css`
   reducido a lo explícitamente registrado como excepción.

## Notas (sin acción requerida)

- La calidad funcional del ciclo es alta: trazabilidad REQ↔test↔código
  completa, catálogos exactos verificados contra el serde real del backend,
  inmutabilidad del upsert probada, errores IPC traducidos a aviso global en
  español y accesibilidad razonable (labels, aria-invalid, role=alert).
- La defensa del breakpoint de media query (`impl_6.md §4`) es razonable y
  queda aceptada como excepción documentada; el problema son los valores SIN
  registrar, no el breakpoint.
- Verificación visual de ventana (`pnpm tauri dev`) corresponde al humano,
  igual que en F5: todo lo automatizable está en verde.
