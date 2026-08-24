# Review — feature 17 `tema-oscuro-tokens`

**Veredicto: CHANGES_REQUESTED**

Ronda 1 — 2026-08-22 (reviewer). La feature es funcionalmente sólida y
arquitectónicamente limpia (hexagonal respetada, TDD con rojo documentado,
arnés verde completo), pero incumple DOS puntos que tienen precedente
directo de cambio requerido en reviews anteriores: un archivo de test
nuevo con 213 líneas (>100, sin discusión registrada) y una cifra del
informe que no coincide con disco.

## Comprobaciones ejecutadas (comando + resultado)

| # | Comando | Resultado |
|---|---------|-----------|
| 1 | `pnpm test` | OK 239 tests / 239 pass / 0 fail (incl. frontend-hexagono: REQ-05-05 tokens.css completo y REQ-17-03/05 nombres intactos) |
| 2 | `node scripts/audit-design-tokens.mjs` | OK "AUDIT ✔ ningún color fuera de tokens.css" (exit 0) |
| 3 | `pnpm build` | OK tsc + vite (220 módulos) |
| 4 | `cargo check --manifest-path src-tauri/Cargo.toml` | OK Finished sin errores |
| 5 | `./init.sh` completo | OK entorno + formato + tests + build ("El entorno está perfecto") |
| 6 | `wc -l src/styles/tokens.css` | **93** líneas (<=100). Dual correcto: paleta OSCURA en `:root` (líneas 8–64), CLARA bajo `[data-theme='claro']` (67–93); añade `--chart-grid`/`--chart-ticks`; nombres históricos intactos |
| 7 | `grep -rniE "#hex|rgba?\(" src/components/` | 0 coincidencias (exit 1) |
| 8 | `grep -n "var(--chart" GraficaProyeccion.tsx` | 0 literales; colores resueltos vía `token()`/`coloresDeEjes()` de `src/lib/chart-colores.ts` (líneas 27–36) |
| 9 | `grep -rni "localStorage" src/components/` | 0 usos; solo `src/adapters/tema-local-storage-adapter.ts` |
| 10 | `grep -rln "invoke(" src/` | solo los 3 adapters IPC existentes (cierre/simulador/snapshot) |
| 11 | Puerto + adapter | OK `src/domain/ports/tema-port.ts` (leer/guardar) + `src/adapters/tema-local-storage-adapter.ts` (implementa TemaPort, degradación silenciosa, singleton) |
| 12 | data-theme pre-render | OK `src/main.tsx`: línea 10 `iniciarTema(temaPort)` ANTES de `.render()` (línea 12); `resolverTema(null)` devuelve `'oscuro'`; sin preferencia la app abre oscura (REQ-17-01/08) |
| 13 | Redibujado de gráficas | OK las 6 gráficas consumen `usarTema()` y tienen `tema` en las deps del efecto (PygChart:64, BalanceChart:71, DeudaChart:78, ProyeccionChart:92, BalanceFuturoChart:91, GraficaProyeccion:73) |
| 14 | Dominio puro | OK `src/domain/**` no importa react ni @tauri-apps (grep 0); `resolver-tema.ts` sin DOM ni storage |
| 15 | CSS fuera de .tsx / inline styles | OK 0 `style={{}}` en componentes tocados; `AjustesSection.tsx` importa `ajustes-section.css`; conmutador accesible con aria-label en español (REQ-17-02/03) |
| 16 | TDD rojo→verde | OK evidencia en `progress/impl_17.md`: suite `tests/tema-oscuro/` primero con 14 fallos documentados (incl. ERR_MODULE_NOT_FOUND de resolver-tema.ts = test antes que código) y luego 239/239 |
| 17 | Dependencias de la feature | OK la feature 17 no declara `depends_on` en feature_list.json (vacío por omisión): nada pendiente que saltarse. Estado `in_progress`, no marcada done (correcto a la espera de review) |
| 18 | Debug/temporales | OK 0 console.log/debug en archivos nuevos; index.html sin tema hardcodeado |

## Checkpoints

- C1 Tests rojos antes del código y verde al final: [x]
      impl_17.md documenta el ciclo; reproducido verde (239/239).
- C2 `./init.sh` verde completo: [x]
- C3 Arquitectura hexagonal (puerto/adapter, dominio puro, invoke solo en adapters, estilos fuera de .tsx): [x]
- C4 Tokens sin hardcodear (audit OK, grep 0 hex/rgb/rgba, literales var(--chart eliminados): [x]
- C5 Máx. 100 líneas por archivo tocado: [ ] FALLA — `tests/tema-oscuro/estructura-tema.test.mjs` tiene **213 líneas** (wc -l y grep -c coinciden), sin discusión registrada ni estado blocked.
- C6 Coherencia informe ↔ repo: [ ] FALLA — impl_17.md afirma DOS VECES que tokens.css tiene **92** líneas (§Tokens duales y §Verificación); medición real `wc -l` = **93**.

## Cambios requeridos

1. **`tests/tema-oscuro/estructura-tema.test.mjs` (213 → <=100 por archivo).**
   Dividir en dos suites cohesivas manteniendo verdes las mismas
   comprobaciones REQ-17-05/06/07/08, por ejemplo:
   - `tests/tema-oscuro/estructura-tokens.test.mjs`: bloque dual de
     tokens.css (<=100 líneas, :root oscuro, [data-theme='claro'], mismos
     nombres, grid/ticks nuevos).
   - `tests/tema-oscuro/integracion-tema.test.mjs`: data-theme pre-render,
     puerto TemaPort + adapter, pureza del dominio, redibujado de las 6
     gráficas y ausencia de literales 'var(--chart' en GraficaProyeccion.
   Precedente aplicado: review_10 D10 exigió exactamente esta división para
   tests .mjs de 139/119 líneas, y review_14 C7 marcó "4 archivos >100"
   como fallo resuelto dividiendo.
2. **`progress/impl_17.md`.** Corregir la cifra de tokens.css de 92 a **93**
   líneas en ambas menciones (§"Tokens duales" y el comentario del bloque
   Verificación `wc -l ... # 92 <= 100`). Precedente aplicado: review_14
   C8, review_15 y review_16 C8 tipifican toda cifra del informe que no
   coincida con disco como cambio requerido.

No se toca nada más: los hallazgos funcionales, de arquitectura, de tests y
del arnés son positivos y no requieren acción. Tras aplicar 1 y 2, re-lanzar
review (ronda 2).

---

# Ronda 2 — Verificación de los cambios requeridos

2026-08-22 (reviewer). Ambos cambios requeridos de la ronda 1 quedan
aplicados y verificados en disco. La suite pasa de 239 a **238** tests
(−1 por reagrupación de asserts en la división del archivo de test), sin
ningún fallo.

## Cambio requerido 1 — división del test de 213 líneas

- `tests/tema-oscuro/estructura-tema.test.mjs`: **eliminado**
  (`test -f` → no existe). ✔
- `tests/tema-oscuro/estructura-tokens.test.mjs`: **82 líneas** (wc -l)
  — cubre REQ-17-05 completa: ≤100 líneas, bloque oscuro en `:root`,
  claro bajo `[data-theme='claro']`, mismos nombres de token en ambos
  bloques (sin inventados y sin crudas sin override), `:root` oscuro por
  defecto distinto del claro, nombres históricos + grid/ticks. ✔
- `tests/tema-oscuro/integracion-tema.test.mjs`: **100 líneas** (wc -l;
  cumple «no supera las 100» justo en el límite) — cubre REQ-17-08
  (data-theme pre-render), REQ-17-07 (puerto + adapter + 0 localStorage
  en components + dominio puro), REQ-17-06 (las 6 gráficas con tema en
  deps y GraficaProyeccion sin literales 'var(--chart') y además
  REQ-17-02 (conmutador accesible) + cero colores hardcodeados. ✔
- Cobertura equivalente a la ronda 1 confirmada línea a línea contra el
  listado de describes/its del archivo original. ✔

## Cambio requerido 2 — coherencia informe ↔ disco

- `progress/impl_17.md` §Tokens duales (línea 83): ahora "**93** líneas
  (≤100)". ✔
- `progress/impl_17.md` §Verificación (línea 125): comentario corregido a
  "`wc -l src/styles/tokens.css # 93 ≤ 100`". ✔
- Las únicas menciones restantes de "92" están en la nueva sección
  "Ronda 2" del propio informe documentando la corrección (histórico
  intencional). ✔
- Medición propia: `wc -l src/styles/tokens.css` = **93**. Coherente. ✔

## Comprobaciones re-ejecutadas (comando + resultado)

| Comando | Resultado |
|---------|-----------|
| `pnpm test` | OK 238 tests / 238 pass / 0 fail; suites REQ-17-* todas ok |
| `node scripts/audit-design-tokens.mjs` | OK AUDIT ✔ (exit 0) |
| `pnpm build` | OK tsc + vite (built in 1.65s) |
| `cargo check --manifest-path src-tauri/Cargo.toml` | OK Finished sin errores |
| `wc -l tests/tema-oscuro/*.mjs` | 82 / 100 / 42 — todos ≤100; estructura-tema.test.mjs inexistente |
| `wc -l src/styles/tokens.css` | 93 ≤100; paleta dual intacta (:root oscuro + [data-theme='claro']) |
| grep hex/rgb/rgba sobre src/components | 0 coincidencias |
| grep 'var(--chart' GraficaProyeccion.tsx | 0 coincidencias |
| grep localStorage bajo src/components | 0 usos |
| `./init.sh` completo | OK verde total ("El entorno está perfecto") |

## Checkpoints ronda 2

- C1 Tests rojos antes del código y verde al final: [x]
- C2 `./init.sh` verde completo: [x]
- C3 Arquitectura hexagonal (puerto/adapter, dominio puro, estilos fuera de .tsx): [x]
- C4 Tokens sin hardcodear: [x]
- C5 Máx. 100 líneas por archivo tocado: [x] RESUELTO ronda 2 (213 → 82+100).
- C6 Coherencia informe ↔ repo: [x] RESUELTO ronda 2 (93 en ambas menciones).

## Veredicto

**VEREDICTO FINAL RONDA 2: APPROVED**

Los dos cambios requeridos quedan aplicados y verificados en disco; los
hallazgos funcionales, arquitectónicos y de tests de la ronda 1 permanecen
intactos y positivos. La suite queda en verde (238/238), audit OK, build OK,
cargo check OK y `./init.sh` completo en verde. La feature 17 puede pasar a
`done` por el flujo habitual del líder.
