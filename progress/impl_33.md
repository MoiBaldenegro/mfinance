# Informe de implementación — feature 33: fix-onboarding-guardado-ocupacion

Fecha: 2026-08-24 · Estado: implementada, suite verde, pendiente de review.

## Causas raíz atendidas (progress/research/fix-wizard-onboarding-inputs.md)

- **CR-1**: `aplicar()` en `use-onboarding.ts` hacía `setGuardando(true)` síncrono
  en cada edición; el IPC solo ocurre tras el debounce de 500 ms y `guardando`
  se propagaba como prop `deshabilitado` a TODOS los inputs (`OnboardingWizard.tsx:86`
  → `WizardContenido` → `OnboardingPaso1:65`) → lag por tecla y pérdida de foco.
- **CR-2**: `sig()` hacía `setGuardando(true)` + `await flushGuardado()`, pero
  `flushGuardado` es no-op sin guardado pendiente; nadie ejecutaba entonces
  `setGuardando(false)` → `guardando === true` para siempre → Paso 2 congelado.
  Defecto latente idéntico en `comp()` y `salt()`.

## Solución

Módulo puro nuevo `src/domain/use-cases/onboarding/onboarding-ocupacion.ts`
(máquina mínima sobre `crearLogicaGuardado`, que se conserva junto a
`DEBOUNCE_MS = 500`):

- `editar()`: solo acumula en el debounce; jamás activa ocupación (REQ-33-01).
- Al expirar el debounce: exactamente un IPC con los últimos datos; `ocupado`
  true únicamente mientras el envío está en vuelo (REQ-33-02, REQ-33-06).
- `flush()`: restablece ocupación SIEMPRE en `finally`, incluso sin pendiente
  (regresión CR-2) o con error (REQ-33-04).
- Error: se registra en `estado().error`, ocupación false, datos locales intactos
  (el guardado fallido lanza desde el hook si `!r.ok`) (REQ-33-05).
- Reparto de conceptos (design.md Decisión 2): `guardando` = persistencia parcial
  en vuelo (solo alimenta el toast); `operacionEnCurso` = operación bloqueante de
  completar/saltar (lo único que deshabilita botones y contenido). `sig/comp/salt`
  restauran la ocupación en `finally`.

## Ciclo TDD rojo → verde

### Rojo (tests escritos ANTES del código)

Comandos:

```
node --test tests/onboarding-wizard/onboarding-ocupacion.test.mjs \
          tests/onboarding-wizard/fix-guardado-ocupacion-estructura.test.mjs \
          tests/onboarding-wizard/use-onboarding-hook.test.mjs
```

Resultado contra el código vigente (módulo inexistente + hook roto):

```
not ok 1 - F33 — use-onboarding: editar jamás activa ocupación (REQ-33-01/03)
not ok 2 - F33 — sig/comp/salt restablecen la ocupación en finally (REQ-33-04)
not ok 3 - F33 — deshabilitado del contenido NO deriva de persistencia parcial (REQ-33-03)
not ok 4 - F33 — arquitectura conservada
# tests 19 · pass 8 · fail 11   (incl. use-onboarding-hook.test.mjs actualizado)
```

Segunda pasada intermedia (tras crear el módulo, mock mal planteado corregido):
`flush con error…` y `hace flush inmediato…` aún en rojo por mocks/regex de test,
corregidos en los propios tests antes del verde definitivo.

### Verde (misma terna tras implementar)

```
ok 1..4 — estructura (REQ-33-01/03/04)
ok 5..8 — onboarding-ocupacion (REQ-33-01/02/04/05/06)
ok 9    — useOnboarding hook
# tests 24 · pass 24 · fail 0
```

Suite completa: `pnpm test` → **605 tests / 175 suites / 605 pass / 0 fail**.

## Archivos creados / modificados (wc -l)

| Archivo | wc -l | Cambio |
|---|---|---|
| src/domain/use-cases/onboarding/onboarding-ocupacion.ts | 85 | NUEVO — máquina de ocupación pura |
| src/hooks/use-onboarding.ts | 100 | MODIFICADO — sin setGuardando(true); flush/restablecer en finally |
| src/components/onboarding/OnboardingWizard.tsx | 99 | MODIFICADO — deshabilitado={operacionEnCurso}; botones ya no dependen de guardando |
| tests/onboarding-wizard/onboarding-ocupacion.test.mjs | 119 | NUEVO — REQ-33-01/02/04/05/06 |
| tests/onboarding-wizard/fix-guardado-ocupacion-estructura.test.mjs | 72 | NUEVO — REQ-33-03/04 estructural |
| tests/onboarding-wizard/use-onboarding-hook.test.mjs | 43 | MODIFICADO — 2 aserciones actualizadas primero (TDD) |

Ningún archivo supera las 100 líneas. Hexagonal verificado: el módulo puro no
importa React ni @tauri-apps (única coincidencia grep = comentario); sin `invoke`
fuera de adapters; sin dependencias nuevas; backend Rust intacto.

## ./init.sh

```
✔ formato de feature_list.json y progress/current.md
✔ tests al 100% (node:test)
✔ build de producción (pnpm build)
✔ El entorno está perfecto. Podemos empezar a trabajar.
```

## Notas de alcance

- El glitch visual de `<details>` controlados y contención CSS es CR-3 → feature 34
  (depends_on: [33]); NO tocado aquí.
- El toast «Guardando cambios…» permanece ligado a `guardando` (solo visible con
  IPC en vuelo), como pide design.md.
