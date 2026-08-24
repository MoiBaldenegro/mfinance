# Informe de Implementación — Feature 26: onboarding-paso-deuda-proyeccion

## Resumen

Implementación completa del **Paso 3 del wizard de onboarding**: Estrategia de deuda, pago extra mensual y supuestos de proyección a 12 meses.

## Archivos Creados/Modificados

### Casos de uso (dominio)
- `src/domain/use-cases/onboarding/onboarding-paso3.ts` — Lógica pura `actualizarPaso3` + `paso3DataPorDefecto` (21 líneas)
- `src/domain/use-cases/onboarding/index.ts` — Exporta nuevas funciones

### Hook React
- `src/hooks/use-onboarding.ts` — Añade `paso3Actual`, `actualizarPaso3` con debounce 500ms (36 líneas)

### Componentes UI (arquitectura hexagonal, ≤100 líneas cada uno)
- `src/components/onboarding/OnboardingPasoDeudaProyeccion.tsx` — Componente padre (61 líneas)
- `src/components/onboarding/DeudaSection.tsx` — Sección estrategia + pago extra (41 líneas)
- `src/components/onboarding/ProyeccionSection.tsx` — Tabla supuestos + botón restablecer (79 líneas)
- `src/components/onboarding/PreviewSection.tsx` — Vista previa PyG + Patrimonio (65 líneas)
- `src/components/onboarding/index.ts` — Exporta nuevos componentes

### Estilos (solo tokens.css, ≤100 líneas)
- `src/styles/onboarding-paso-deuda-proyeccion.css` (93 líneas)
- `src/styles/deuda-section.css` (74 líneas)
- `src/styles/proyeccion-section.css` (88 líneas)
- `src/styles/preview-section.css` (53 líneas)

### Integración Wizard
- `src/components/onboarding/OnboardingWizard.tsx` — Renderiza paso 3 real (no placeholder), paso opcional, **inyecta `snapshotPort` correctamente**

### Tests TDD (rojo→verde)
- `tests/onboarding-wizard/onboarding-paso3-usecase.test.mjs` — 38 tests cubriendo:
  - Caso de uso `actualizarPaso3` / `paso3DataPorDefecto`
  - Entidades `Paso3Data`, `SupuestoProyeccion`
  - Hook `useOnboarding` con `actualizarPaso3`
  - Componentes: estructura, imports, sub-componentes, validaciones
  - Reutilización motores: `plan-deuda` (F9), `pyg-proyeccion` (F14)
  - Integración en `OnboardingWizard`
  - Puertos `SnapshotPort`
  - Estilos solo tokens.css

## Fixes Post-Review (CHANGES_REQUESTED → APPROVED)

1. **Fix crítico - Inyección correcta de `snapshotPort` en `OnboardingWizard.tsx`**:
   - Importado `snapshotPort` desde `../../adapters/snapshot-ipc-adapter.ts` (línea 11)
   - Cambiado `snapshotPort={onboardingPort as any}` → `snapshotPort={snapshotPort}` (línea 72)
   - Eliminado cast `as any` — tipos coinciden correctamente (`SnapshotPort` implementa `pygProyeccion`, `balanceFuturo`, `planDeuda`)
   - Eliminado import no usado `onboardingPort`

2. **Limpieza de `as any` innecesarios en `PreviewSection.tsx`**:
   - Prop `moneda: string` → `moneda: Moneda` (tipo correcto)
   - Removidos 4 casts `moneda as any` en líneas 15, 20-22 — `usarMoneda()` devuelve `Moneda` compatible con `filasDeTablaProyeccion(Moneda)` y `formatoMoneda(number, Moneda)`

## Cumplimiento de Requisitos (REQ-26-*)

| Requisito | Estado | Evidencia |
|-----------|--------|-----------|
| REQ-26-01: Componente con 2 secciones | ✅ | `OnboardingPasoDeudaProyeccion` + `DeudaSection` + `ProyeccionSection` |
| REQ-26-02: Radio Avalancha/Bola nieve | ✅ | `DeudaSection.tsx` líneas 26-33 |
| REQ-26-03: Pago extra ≥0 formateado moneda | ✅ | `DeudaSection.tsx` líneas 17-20, 38 |
| REQ-26-04: Tabla supuestos -50..+100% | ✅ | `ProyeccionSection.tsx` líneas 24-30, clamp `Math.max(-0.5, Math.min(1, valor))` |
| REQ-26-05: Reutiliza motor plan-deuda (F9) | ✅ | `SnapshotPort.planDeuda()` + `deudaObjetivo`/`deudasSegunEstrategia` |
| REQ-26-06: Reutiliza motor pyg-proyección (F14) | ✅ | `SnapshotPort.pygProyeccion()` + `balanceFuturo()` + `filasDeTablaProyeccion` |
| REQ-26-07: Vista previa PyG 12m + Patrimonio 12m | ✅ | `PreviewSection.tsx` + `filasDeTablaProyeccion` |
| REQ-26-08: Persistencia debounce 500ms | ✅ | `useOnboarding.ts` usa `crearLogicaGuardado(DEBOUNCE_MS=500)` |
| REQ-26-09: Paso opcional, Siguiente siempre habilitado | ✅ | `OnboardingWizard.tsx` `pasoValido` para step 3 retorna `true` |
| REQ-26-10: Tests TDD node:test | ✅ | 38 tests en `onboarding-paso3-usecase.test.mjs` |
| REQ-26-11: Arquitectura hexagonal, ≤100 líneas, tokens.css | ✅ | Todos los archivos ≤100 líneas, `audit-design-tokens` OK |

## Evidencia Ciclo Rojo→Verde

### Tests en Rojo (antes de implementar)
```
$ pnpm test
# tests 496
# pass 474
# fail 22  ← Tests nuevos fallando (esperado)
```

### Tests en Verde (tras implementación + fixes)
```
$ pnpm test
# tests 519
# pass 518
# fail 1   ← Pre-existente: OnboardingWizard.tsx 188 líneas (>170 límite test, deuda F24)
```

El único fallo es pre-existente en `OnboardingWizard.tsx` (archivo legacy ya >100 líneas antes de F26). Todos los **archivos nuevos** cumplen ≤100 líneas.

### Build y Verificación (tras fixes)
```
$ pnpm build        ✅ OK
$ cargo check       ✅ OK (warnings pre-existentes)
$ cargo test        ✅ 288 passed
$ ./init.sh         ✅ Build OK, formato OK, solo 1 test pre-existente falla (F24)
```

## Arquitectura Hexagonal

- **Dominio puro**: `onboarding-paso3.ts`, `use-onboarding.ts` (sin React, sin `@tauri-apps/api`)
- **Puertos**: `SnapshotPort` expone `planDeuda()`, `pygProyeccion()`, `balanceFuturo()`
- **Adapters**: `snapshotPort` (IPC) inyectado en componente paso 3 vía `OnboardingWizard`
- **Componentes**: Delegan en casos de uso, usan `formatoMoneda` del dominio
- **Estilos**: Solo `tokens.css` (audit OK)

## Reutilización Motores (F9, F14)

| Motor | Puerto | Uso en F26 |
|-------|--------|------------|
| plan-deuda (F9) | `SnapshotPort.planDeuda()` | Ordena deudas según estrategia, proyecta con pago extra |
| pyg-proyección (F14) | `SnapshotPort.pygProyeccion()`, `balanceFuturo()` | Aplica supuestos % a 12 meses, distingue histórico/proyectado |

**Sin duplicación de lógica** — toda la proyección se calcula en backend vía puertos.

## Próximos Pasos

- Feature 27 (`onboarding-paso-metas-completar`): Paso 4 (umbrales indicadores + metas/journal) + Paso 5 (resumen/finalizar)
- Integración completa con `completarOnboarding` para consolidar en `StrategySettings`, `Investment.tasa_esperada`, `financial_profile`
---

## Ronda 2 — fix bloqueante transversal (2026-08-23)

El review devolvió `CHANGES_REQUESTED` por un único bloqueante **transversal**
(no introducido por la feature 26): `./init.sh` no terminaba verde porque el
test pre-existente de la feature 24
`tests/onboarding-wizard/onboarding-integracion-estilos-hexagonal.test.mjs` →
subtest «archivos de dominio ≤ 100 líneas (componentes/hooks pueden ser
mayores)» fallaba con `OnboardingWizard.tsx tiene 188 líneas (>170)`.

### Qué se hizo

Refactor **cosmético/estructural** de `src/components/onboarding/OnboardingWizard.tsx`
(sin cambio de comportamiento, sin tocar contratos de puertos/adapters/dominio,
sin editar tests):

1. **Extraído a `src/components/onboarding/validarPaso.ts` (19 líneas):**
   regla de completitud del paso 1 como función pura `esPaso1Completo(paso1:
   Paso1Data | null | undefined)`; tipada contra la entidad de dominio
   `Paso1Data` (dirección hexagonal correcta: componentes → dominio).
2. **Extraído a `src/components/onboarding/WizardErrorCarga.tsx` (20 líneas):**
   vista de error de carga (`role="alert"` + botón Reintentar). Reutiliza las
   clases BEM existentes de `src/styles/onboarding-wizard.css`; sin CSS nuevo
   ni embebido.
3. **Sustituido el sub-componente interno `PasoContenido`** (que tipaba todo
   como `any`) por una cadena ternaria directa en el render del wizard, que
   preserva exactamente la semántica de fallthrough original (cualquier
   combinación no cubierta → `OnboardingPasoPlaceholder`).
4. **Fix de tipos latente:** `type PasoInfo = typeof PASOS[0]` con `as const`
   solo capturaba el primer elemento (`key: 'paso1'`). El código original lo
   enmascaraba pasando props como `any`; al inlinear el render, `tsc` lo
   destapó (TS2367). Corregido a `(typeof PASOS)[number]` — solo tipos,
   cero impacto en runtime.
5. Se conservaron intactos todos los marcadores que los tests existentes
   exigen sobre este archivo: import de `onboarding-wizard.css`, clase
   `onboarding-wizard__pasos`, cálculo `/4`, textos Atrás/Siguiente/Finalizar/
   Saltar, `pasoValido` con `disabled=`/`aria-disabled=`, `keyPaso === 'paso3'`,
   `currentStep === 3`, `return true`, `paso1Data={pasoActual}`, `snapshotPort`,
   y ausencia de `invoke`.

### wc -l final

| Archivo | Antes | Después | Umbral |
|---------|-------|---------|--------|
| `src/components/onboarding/OnboardingWizard.tsx` | 188 | **100** | ≤100 (regla dura) / <170 (test REQ-24-14) |
| `src/components/onboarding/validarPaso.ts` | — | **19** | ≤100 |
| `src/components/onboarding/WizardErrorCarga.tsx` | — | **20** | ≤100 |

### Evidencia rojo → verde

**Rojo (antes del refactor)** — `pnpm test`: 518/519 pass, 1 fail:

```
# Subtest: archivos de dominio ≤ 100 líneas (componentes/hooks pueden ser mayores)
not ok 3 - archivos de dominio ≤ 100 líneas (componentes/hooks pueden ser mayores)
  error: 'src\components\onboarding\OnboardingWizard.tsx tiene 188 líneas (>170)'
  failureType: 'testCodeFailure'
```

**Verde (tras el refactor)** — `pnpm test`: **519/519 pass, 0 fail**
(`# tests 519 / # pass 519 / # fail 0`). El archivo antes fallador ejecutado
en solitario: `node --test tests/onboarding-wizard/
onboarding-integracion-estilos-hexagonal.test.mjs` → 10/10 ok.

### ./init.sh completo: VERDE

```
--- Formato ---   ✔ formato de feature_list.json y progress/current.md
--- Tests ---     ✔ tests al 100% (node:test)
--- Build ---     ✔ build de producción (pnpm build)
✔ El entorno está perfecto. Podemos empezar a trabajar.
```

Nota: durante la ronda se detectó y resolvió un fallo intermedio de `tsc`
(TS2367 por el narrowing del alias de tipo); el build final pasa limpio.

Feature 26 permanece `in_progress` a la espera del re-review (no se marca
`done` hasta `APPROVED` verificado en disco).
