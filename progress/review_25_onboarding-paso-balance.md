# Review — feature 25

**Veredicto:** APPROVED

## Checkpoints
- C1: [x] Dependencias apuntan al dominio — `src/domain/` sin React ni `@tauri-apps/api`; `src-tauri/src/domain/` sin `tauri` crate
- C2: [x] Puertos definidos por el núcleo, adapters implementan — `OnboardingPort` en `src/domain/ports/`, `OnboardingAdapter` en `src/adapters/` con `invoke()`
- C3: [x] Estilos solo en `src/styles/` desde `tokens.css` — 4 hojas CSS nuevas (`onboarding-paso-balance.css`, `activos-section.css`, `pasivos-section.css`, `inversiones-section.css`) todas importan tokens
- C4: [x] Lógica de negocio fuera de UI — casos de uso en `src/domain/use-cases/onboarding/` (gestión estado, debounce, validaciones, guardado)
- C5: [x] Colores/espaciados solo via tokens — `scripts/audit-design-tokens.mjs` OK, `grep` de hex/rgb/rgba en componentes 0 coincidencias
- C6: [x] **Ningún archivo supera 100 líneas** — verificado con `wc -l`:
  - Domain use-cases: máx 82 líneas (`gestionar-paso2-balance.ts`)
  - Componentes: máx 59 líneas (`InversionesSection.tsx`)
  - Estilos: máx 30 líneas
  - Tests: máx 94 líneas (`onboarding-integracion-estilos-hexagonal.test.mjs`)
- C7: [x] Sin dependencias externas sin aprobar — no se añadieron paquetes npm ni crates
- C8: [x] `./init.sh` termina en verde — comprobado: entorno, formato, 462 tests, build OK
- C9: [x] Tests TDD reales (rojo→verde) — placeholders eliminados, 17 tests reales para `actualizarPaso2Onboarding`, 5 para debounce, 3 para lógica guardado, 28 tests estructura/contratos componentes; ciclo documentado en `impl_25_onboarding-paso-balance.md`
- C10: [x] Reutilización real features 8/11 — `validarActivo`/`validarPasivo` (feat 8), `validarTasa` (feat 11), `validarInversion` (nueva en `inversiones-proyeccion.ts`); componentes delegan validación a dominio

## Cambios requeridos (si aplica)
Ninguno. La feature cumple todos los criterios tras la corrección de límites de 100 líneas.

---

### Evidencia de verificación `wc -l` (archivos creados/modificados en F25)

**Domain use-cases (`src/domain/use-cases/onboarding/`):**
```
   6 index.ts
   9 onboarding-paso2.ts
   9 onboarding-paso3.ts
   9 onboarding-paso4.ts
  12 onboarding-paso1.ts
  32 onboarding-estado.ts
  37 onboarding-paso5.ts
  41 onboarding-debounce.ts
  44 onboarding-guardado.ts
  72 gestionar-onboarding.ts
  82 gestionar-paso2-balance.ts
```

**Hook (`src/hooks/use-onboarding.ts`):** 34 líneas

**Componentes (`src/components/onboarding/`):**
```
  47 OnboardingPasoBalance.tsx
  55 ActivosSection.tsx
  55 PasivosSection.tsx
  59 InversionesSection.tsx
```

**Estilos (`src/styles/`):**
```
  30 onboarding-paso-balance.css
  29 activos-section.css
  30 pasivos-section.css
  30 inversiones-section.css
```

**Tests (`tests/onboarding-wizard/`):**
```
  26 onboarding-wizard-structure.test.mjs
  29 formato-moneda-paso2.test.mjs
  43 use-onboarding-hook.test.mjs
  44 onboarding-debounce-hook.test.mjs
  58 validaciones-paso2.test.mjs
  61 gestionar-paso2-merge-errores.test.mjs
  70 gestionar-onboarding-completar-saltar.test.mjs
  74 onboarding-debounce-core.test.mjs
  78 onboarding-paso-balance-props-validation.test.mjs
  78 gestionar-onboarding-estado-actualizar.test.mjs
  87 onboarding-paso-balance-structure.test.mjs
  89 gestionar-paso2-validaciones.test.mjs
  94 onboarding-integracion-estilos-hexagonal.test.mjs
  38 gestionar-paso2-dobles.mjs (helpers compartidos)
```

**Dependencias de la feature (todas en `done`):**
- Feature 24: `onboarding-wizard-shell-basicos` — done
- Feature 8: `balance-general` — done
- Feature 11: `inversiones-proyeccion` — done