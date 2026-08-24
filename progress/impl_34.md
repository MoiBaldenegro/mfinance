# Informe de implementación — feature 34: fix-paso2-details-glitch-layout

Fecha: 2026-08-24. Estado: implementada, suite verde, `done` marcada en
`feature_list.json` (todo verde, según instrucción del líder).

## Causa raíz (progress/research/fix-wizard-onboarding-inputs.md §CR-3)

Las tres secciones del Paso 2 usaban `<details>` controlado con el patrón
`open={abierto}` + `onToggle={() => setAbierto(!abierto)}`:

- `src/components/onboarding/ActivosSection.tsx:36`
- `src/components/onboarding/PasivosSection.tsx:36`
- `src/components/onboarding/InversionesSection.tsx:40`

React re-aplica `open={estado}` en cada render; con re-renders frecuentes el
estado React pelea con el toggle nativo → bucles onToggle y secciones que
saltan abierto/cerrado solas. Contribuyen: `.onboarding-wizard__pasos` con
`grid repeat(5, 1fr)` + títulos `nowrap` sin contención (`min-width: 0`)
→ desborde horizontal en ventanas estrechas, y el wizard montado standalone
desde `App.tsx` sin contenedor con padding/scroll propio.

## Ciclo rojo (TDD)

Test escrito ANTES del código:
`tests/onboarding-wizard/fix-details-glitch-estructura.test.mjs`
(REQ-34-01: patrón controlado ausente en las tres secciones; REQ-34-02:
helper `AcordeonSeccion` no controlado + semántica uncontrolled simulada;
REQ-34-03/04: contención CSS y contenedor standalone).

Comando: `node --test tests/onboarding-wizard/fix-details-glitch-estructura.test.mjs`

Fallo observado (rojo): `# pass 2 / # fail 10`, entre otros:

```
not ok - components/onboarding/ActivosSection.tsx: sin open={estado} + onToggle simultáneos
not ok - components/onboarding/PasivosSection.tsx: sin open={estado} + onToggle simultáneos
not ok - components/onboarding/InversionesSection.tsx: sin open={estado} + onToggle simultáneos
not ok - existe y renderiza <details> con open inicial no ligado a estado (AcordeonSeccion inexistente)
not ok - .onboarding-wizard__pasos con columnas contenidas
not ok - .onboarding-wizard__paso y __contenido con min-width: 0
not ok - contenedor standalone con padding y scroll propio (app.css + App.tsx)
```

## Implementación

- Nuevo helper `AcordeonSeccion.tsx`: `<details className={className} open>` no
  controlado — el estado abierto/cerrado vive en el DOM; React nunca re-aplica
  la prop tras el montaje, eliminando el bucle.
- Las tres secciones del Paso 2 delegan en `AcordeonSeccion`; se elimina
  `const [abierto, setAbierto] = useState(true)` y el handler de toggle.
- Contención en `onboarding-wizard.css`: `.onboarding-wizard__pasos` pasa a
  `repeat(5, minmax(0, 1fr))` + `min-width: 0`; `.onboarding-wizard__paso`,
  `.onboarding-wizard__contenido` y `.onboarding-wizard` ganan `min-width: 0`.
- Contenedor standalone: `App.tsx` envuelve el wizard en `<div
  className="app__pagina">`; `app.css` define padding con tokens
  (`var(--space-6) var(--space-4)`) + `overflow-y: auto`.
- Excepción documentada en `tests/frontend-hexagono/ui.test.mjs` para
  `AcordeonSeccion.tsx` (wrapper estructural sin hoja propia), mismo patrón
  que la excepción existente de `SnapshotProvider.tsx`.

## Ciclo verde

- `node --test tests/onboarding-wizard/fix-details-glitch-estructura.test.mjs`
  → `# pass 12 / # fail 0`.
- `pnpm test` → `# tests 617 / # pass 617 / # fail 0`.
- `pnpm build` → ✓ built in 1.95s.

## Verificaciones

- `node scripts/audit-design-tokens.mjs` → `AUDIT ✔ ningún color fuera de
  tokens.css en src/styles`.
- `./init.sh` → verde completo (formato + tests al 100% + build).
- Hexagonal verificado por suite: sin lógica nueva en componentes (solo
  wrapper estructural), `invoke()` sigue solo en adapters, dominio intacto.

## Archivos creados / modificados (wc -l)

| Archivo | wc -l | Cambio |
|---|---|---|
| src/components/onboarding/AcordeonSeccion.tsx | 19 | NUEVO helper acordeón no controlado |
| src/components/onboarding/ActivosSection.tsx | 56 | usa AcordeonSeccion; sin estado abierto |
| src/components/onboarding/PasivosSection.tsx | 56 | ídem |
| src/components/onboarding/InversionesSection.tsx | 60 | ídem |
| src/styles/onboarding-wizard.css | 251 | contención (minmax/min-width); ya excedía 100 antes (244) — design.md §Decisión 2 lo autoriza expresamente («ediciones mínimas… ya excede 100 líneas») |
| src/styles/app.css | 23 | NUEVO bloque `.app__pagina` con tokens |
| src/App.tsx | 44 | envuelve wizard en `.app__pagina` |
| tests/onboarding-wizard/fix-details-glitch-estructura.test.mjs | 79 | NUEVO test estructural TDD |
| tests/frontend-hexagono/ui.test.mjs | 80 | excepción documentada AcordeonSeccion |

Todos los archivos nuevos ≤100 líneas. Sin dependencias nuevas. No se tocó
ninguna otra feature.
