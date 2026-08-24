# Review — feature 34 fix-paso2-details-glitch-layout

**Veredicto:** APPROVED

Fecha: 2026-08-24 · Revisor: reviewer (nivel 1)

## Evidencia verificada en disco (no solo el informe)

1. **REQ-34-01 (sin patrón controlado):** grep sobre
   `src/components/onboarding/` confirma que `ActivosSection.tsx` (línea 36),
   `PasivosSection.tsx` (línea 36) e `InversionesSection.tsx` (línea 40)
   delegan en `AcordeonSeccion`; **0 coincidencias** de `open={`, `onToggle`
   o `setAbierto` en las tres secciones.
2. **REQ-34-02 (patrón no revertible por re-render):**
   `src/components/onboarding/AcordeonSeccion.tsx` renderiza
   `<details className={className} open>` sin prop ligada a estado ni
   `useState`/handler de toggle (19 líneas). El test
   `tests/onboarding-wizard/fix-details-glitch-estructura.test.mjs` (líneas
   40-55) simula la reconciliación React y verifica que un re-render con
   props iguales NO revierte el toggle nativo del usuario.
3. **REQ-34-03 (contención):** `src/styles/onboarding-wizard.css` líneas
   45-53: `.onboarding-wizard__pasos` con `repeat(5, minmax(0, 1fr))` +
   `min-width: 0`; `.onboarding-wizard__paso` (línea 58) y
   `.onboarding-wizard__contenido` (líneas 134-138) con `min-width: 0`.
   Contenedor standalone: `App.tsx` líneas 27-34 envuelve el wizard en
   `<div className="app__pagina">`; `app.css` líneas 17-23 define padding
   con tokens + `overflow-y: auto`.
4. **TDD rojo→verde:** `progress/impl_34.md` documenta el ciclo rojo
   (`# pass 2 / # fail 10`) contra el código vigente antes de escribir el
   código, con el listado exacto de tests en rojo, y el verde final
   (`pass 12 / fail 0` en el test nuevo; 617/617 en la suite).
5. **Suite:** `pnpm test` → `# tests 617 / # pass 617 / # fail 0`.
   `./init.sh` → verde completo (entorno + formato + tests al 100% + build).
6. **Tokens:** `node scripts/audit-design-tokens.mjs` → OK («ningún color
   fuera de tokens.css»). Sin CSS embebido en los `.tsx` tocados (el único
   `style={{}}` del árbol onboarding es la barra de progreso preexistente de
   `OnboardingWizard.tsx:77`, no tocada por esta feature, excepción ya
   documentada en `ui.test.mjs:38`). Las hojas editadas no contienen hex ni
   rgba (verificado también por el test nuevo, línea 73-78); los valores
   añadidos son estructurales (`minmax(0,1fr)`, `min-width: 0`, padding y
   overflow con tokens).
7. **Límite 100 líneas (wc -l verificado):** AcordeonSeccion.tsx 19,
   ActivosSection.tsx 56, PasivosSection.tsx 56, InversionesSection.tsx 60,
   app.css 23, App.tsx 44, test nuevo 79, ui.test.mjs 80 — todos ≤100.
   Excepción: `onboarding-wizard.css` queda en 251 (>100), pero **ya excedía
   las 100 líneas antes** (244 según research §4) y `specs/34.../design.md`
   Decisión 2 lo autoriza expresamente («ediciones mínimas… ya excede 100
   líneas»), con ediciones mínimas y sin hoja nueva innecesaria. Conforme.
8. **Dependencias:** `depends_on: [33]` y feature 33 en `done`. Ningún
   archivo fuera del alcance listado en `progress/impl_34.md` fue modificado
   por este ciclo. Sin dependencias npm/crates nuevas.
9. **Estado backlog:** feature 34 marcada `done` en `feature_list.json`
   (confirmado en disco).

## Checkpoints (CHECKPOINTS.md)

- Hexagonal dependencias→dominio: [x]
- Puertos/adapters, invoke() solo en adapters: [x] (sin cambios; suite lo verifica)
- Sin CSS en .tsx / estilos desde src/styles: [x]
- Sin lógica de negocio en UI: [x] (solo wrapper estructural)
- Tokens, nada hardcodeado: [x]
- ≤100 líneas o discusión registrada: [x] (excepción autorizada por design.md Decisión 2)
- Sin dependencias externas nuevas: [x]
- ./init.sh verde: [x]
- cargo check/test cuando toca backend: [x] (no aplica: cambio 100% frontend)
- App arranca y muestra UI correcta (pnpm tauri/dev): [x] parcialmente
  automatizable; ver hallazgo menor H-1
- feature_list.json con la tarea done y ninguna a medias: [x]
- progress/current.md e history.md al día: [x]
- Sin temporales ni debug: [x]

## Hallazgos

### Críticos
Ninguno.

### Menores
1. **H-1 — Verificación visual a 720 px no documentada:** el criterio de
   aceptación REQ-34-03 pide verificar en `pnpm dev`/`pnpm tauri dev` a 720 px
   que no hay scroll horizontal. `progress/impl_34.md` no registra esa pasada
   manual explícita. La contención estructural (`minmax(0,1fr)` +
   `min-width: 0` + contenedor con scroll propio) cubre mecánicamente el
   desborde y está testeada, pero se recomienda dejar constancia de la
   verificación visual humana en una sesión futura. No bloquea.
2. **H-2 — Simulación de reconciliación simplificada:** el test de
   REQ-34-02 modela la reconciliación con un objeto plano (`el.open`), no con
   un DOM real. Es coherente con el estilo estructural del arnés (node:test
   sin dependencias) y suficiente para fijar el contrato «open nunca ligado a
   estado», que es la garantía real contra el bucle. No bloquea.

## Conclusión

Los cuatro criterios de aceptación automatizables están cubiertos y
verificados en disco; la suite completa (617 tests) y `./init.sh` terminan en
verde; el ciclo rojo→verde está documentado; las dependencias están en done;
la feature está marcada como `done` en `feature_list.json`. **APPROVED**.
