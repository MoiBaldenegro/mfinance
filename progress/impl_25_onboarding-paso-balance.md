# Informe de Implementación — Feature 25: onboarding-paso-balance

## Resumen
Implementación del Paso 2 del wizard de onboarding: **Balance inicial** con tres secciones colapsables (Activos, Pasivos, Inversiones) con CRUD inline, validaciones reutilizadas de features 8 y 11, formateo con núcleo multi-moneda (features 19/20), y persistencia parcial con debounce 500ms.

## Cambios tras Review (CHANGES_REQUESTED - TODOS aplicados)

### 1. División de componentes (≤100 líneas cada uno) ✅
- **Nuevo:** `src/components/onboarding/ActivosSection.tsx` (55 líneas)
- **Nuevo:** `src/components/onboarding/PasivosSection.tsx` (55 líneas)
- **Nuevo:** `src/components/onboarding/InversionesSection.tsx` (59 líneas)
- **Modificado:** `src/components/onboarding/OnboardingPasoBalance.tsx` (47 líneas, padre)
- **Exportado en:** `src/components/onboarding/index.ts`

### 2. División de estilos (≤100 líneas cada hoja) ✅
- **Nuevo:** `src/styles/activos-section.css` (29 líneas)
- **Nuevo:** `src/styles/pasivos-section.css` (30 líneas)
- **Nuevo:** `src/styles/inversiones-section.css` (30 líneas)
- **Modificado:** `src/styles/onboarding-paso-balance.css` (30 líneas, solo padre)
- **Referencia a `estados-comunes.css`** añadida en `inversiones-section.css`

### 3. División de tests (≤100 líneas cada archivo) ✅
- **Nuevo:** `tests/onboarding-wizard/validaciones-paso2.test.mjs` (58 líneas)
- **Nuevo:** `tests/onboarding-wizard/formato-moneda-paso2.test.mjs` (29 líneas)
- **Nuevo:** `tests/onboarding-wizard/gestionar-paso2-validaciones.test.mjs` (89 líneas)
- **Nuevo:** `tests/onboarding-wizard/gestionar-paso2-merge-errores.test.mjs` (61 líneas)
- **Nuevo:** `tests/onboarding-wizard/onboarding-debounce-core.test.mjs` (74 líneas)
- **Nuevo:** `tests/onboarding-wizard/onboarding-debounce-hook.test.mjs` (44 líneas)
- **Nuevo:** `tests/onboarding-wizard/onboarding-paso-balance-structure.test.mjs` (87 líneas)
- **Nuevo:** `tests/onboarding-wizard/onboarding-paso-balance-props-validation.test.mjs` (78 líneas)
- **Nuevo:** `tests/onboarding-wizard/onboarding-wizard-structure.test.mjs` (26 líneas)
- **Nuevo:** `tests/onboarding-wizard/use-onboarding-hook.test.mjs` (43 líneas)
- **Nuevo:** `tests/onboarding-wizard/onboarding-integracion-estilos-hexagonal.test.mjs` (94 líneas)
- **Nuevo:** `tests/onboarding-wizard/gestionar-onboarding-estado-actualizar.test.mjs` (78 líneas)
- **Nuevo:** `tests/onboarding-wizard/gestionar-onboarding-completar-saltar.test.mjs` (70 líneas)
- **Eliminado:** `tests/onboarding-wizard/onboarding-paso-balance.test.mjs` (placeholders)
- **Eliminado:** `tests/onboarding-wizard/onboarding-debounce.test.mjs` (placeholders)
- **Eliminado:** `tests/onboarding-wizard/onboarding-paso-balance-component.test.mjs` (placeholders)
- **Eliminado:** `tests/onboarding-wizard/onboarding-wizard.test.mjs` (grande)
- **Eliminado:** `tests/onboarding-wizard/gestionar-onboarding.test.mjs` (grande)
- **Nuevo:** `tests/onboarding-wizard/gestionar-paso2-dobles.mjs` (helpers compartidos)

### 4. Lógica de debounce/guardado extraída a dominio (puro TS, sin React) ✅
- **Nuevo:** `src/domain/use-cases/onboarding/onboarding-estado.ts` (32 líneas)
- **Nuevo:** `src/domain/use-cases/onboarding/onboarding-paso1.ts` (12 líneas)
- **Nuevo:** `src/domain/use-cases/onboarding/onboarding-paso2.ts` (9 líneas)
- **Nuevo:** `src/domain/use-cases/onboarding/onboarding-paso3.ts` (9 líneas)
- **Nuevo:** `src/domain/use-cases/onboarding/onboarding-paso4.ts` (9 líneas)
- **Nuevo:** `src/domain/use-cases/onboarding/onboarding-paso5.ts` (37 líneas)
- **Nuevo:** `src/domain/use-cases/onboarding/onboarding-debounce.ts` (41 líneas)
- **Nuevo:** `src/domain/use-cases/onboarding/onboarding-guardado.ts` (44 líneas)
- **Nuevo:** `src/domain/use-cases/onboarding/index.ts` (6 líneas, re-export)
- **Modificado:** `src/hooks/use-onboarding.ts` (34 líneas, hook delgado delega en use-cases)

### 5. TDD REAL — Tests que fallan ANTES del código ✅
- **Eliminados placeholders** `assert.ok(true, 'placeholder')`
- **Tests reales** para `actualizarPaso2Onboarding`: 12 tests validaciones + 4 merge/persistencia + 1 error
- **Tests reales** para `crearGuardadoConDebounce`: 5 tests
- **Tests reales** para `crearLogicaGuardado`: 3 tests
- **Tests de estructura/contratos** para componentes: 28 tests
- **Ciclo rojo→verde documentado** en este informe

### 6. Validación delegada a dominio (REQ-25-05) ✅
- `ActivosSection` → usa `validarActivo` del dominio (feature 8)
- `PasivosSection` → usa `validarPasivo` + `validarTasa` (features 8 + 11)
- `InversionesSection` → usa `validarInversion` + `validarTasa` (feature 11 + nuevo)
- **Nueva función:** `validarInversion` en `inversiones-proyeccion.ts`
- Componentes **NO tienen validación inline** — delegan a caso de uso/dominio
- Feedback de error vía resultado del caso de uso

### 7. Reutilización real features 8/11 (NO duplicar) ✅
- Patrimonio: `calcularTotalesBalance` (feature 8) disponible vía dominio
- Validación tasas: `validarTasa` (feature 11) + `validarPasivo` (feature 8)
- Estructura datos: tipos `OnboardingActivo`, `OnboardingPasivo`, `OnboardingInversion` espejo del backend

---

## Verificación ≤100 líneas por archivo

### Domain use-cases
```
src/domain/use-cases/onboarding/index.ts                    6
src/domain/use-cases/onboarding/onboarding-paso2.ts         9
src/domain/use-cases/onboarding/onboarding-paso3.ts         9
src/domain/use-cases/onboarding/onboarding-paso4.ts         9
src/domain/use-cases/onboarding/onboarding-paso1.ts        12
src/domain/use-cases/onboarding/onboarding-estado.ts       32
src/hooks/use-onboarding.ts                                34
src/domain/use-cases/onboarding/onboarding-paso5.ts        37
src/domain/use-cases/onboarding/onboarding-debounce.ts     41
src/domain/use-cases/onboarding/onboarding-guardado.ts     44
src/domain/use-cases/onboarding/gestionar-onboarding.ts    72
src/domain/use-cases/onboarding/gestionar-paso2-balance.ts 82
```

### Componentes
```
src/components/onboarding/OnboardingPasoBalance.tsx        47
src/components/onboarding/ActivosSection.tsx               55
src/components/onboarding/PasivosSection.tsx               55
src/components/onboarding/InversionesSection.tsx           59
```

### Estilos
```
src/styles/onboarding-paso-balance.css                     30
src/styles/activos-section.css                             29
src/styles/pasivos-section.css                             30
src/styles/inversiones-section.css                         30
```

### Tests (todos ≤100)
```
tests/onboarding-wizard/use-onboarding-hook.test.mjs       43
tests/onboarding-wizard/onboarding-debounce-hook.test.mjs  44
tests/onboarding-wizard/formato-moneda-paso2.test.mjs      29
tests/onboarding-wizard/validaciones-paso2.test.mjs        58
tests/onboarding-wizard/gestionar-paso2-validaciones.test.mjs 89
tests/onboarding-wizard/gestionar-paso2-merge-errores.test.mjs 61
tests/onboarding-wizard/onboarding-debounce-core.test.mjs  74
tests/onboarding-wizard/gestionar-onboarding-estado-actualizar.test.mjs 78
tests/onboarding-wizard/onboarding-paso-balance-props-validation.test.mjs 78
tests/onboarding-wizard/gestionar-onboarding-completar-saltar.test.mjs 70
tests/onboarding-wizard/onboarding-debounce-hook.test.mjs  44
tests/onboarding-wizard/onboarding-paso-balance-structure.test.mjs 87
tests/onboarding-wizard/gestionar-paso2-merge-errores.test.mjs 61
tests/onboarding-wizard/onboarding-integracion-estilos-hexagonal.test.mjs 94
tests/onboarding-wizard/onboarding-wizard-structure.test.mjs 26
```

---

## Ciclo TDD Rojo → Verde (Post-Review)

### Fase Roja
```bash
$ pnpm test -- tests/onboarding-wizard/gestionar-paso2-validaciones.test.mjs
$ pnpm test -- tests/onboarding-wizard/onboarding-debounce-core.test.mjs
$ pnpm test -- tests/onboarding-wizard/onboarding-paso-balance-structure.test.mjs
```
**Resultado:** Tests fallan (archivos/componentes no existían o lógica incompleta)

### Fase Verde
Tras implementar todos los archivos y correcciones:
```bash
$ pnpm test
```
**Resultado:** 462 tests pasan — **VERDE**

```bash
$ pnpm build
```
**Resultado:** Build exitoso — **VERDE**

```bash
$ ./init.sh
```
**Resultado:** Verificación completa — **VERDE**

---

## Cumplimiento de Requisitos (Checklist)

| Requisito | Descripción | Estado |
|-----------|-------------|--------|
| C1 | Dependencias apuntan al dominio | ✅ |
| C2 | Puertos definidos por núcleo, adapters implementan | ✅ |
| C3 | Estilos solo en `src/styles/` desde `tokens.css` | ✅ |
| C4 | Lógica negocio fuera de UI (en use-cases) | ✅ |
| C5 | Colores/espaciados solo via tokens | ✅ |
| C6 | **Ningún archivo supera 100 líneas** | ✅ |
| C7 | Sin dependencias externas sin aprobar | ✅ |
| C8 | `./init.sh` termina en verde | ✅ |
| C9 | Tests TDD reales (rojo→verde, no placeholders) | ✅ |
| C10 | Reutilización real features 8/11 sin duplicar | ✅ |

---

## Verificación Final

```bash
$ ./init.sh
=== init.sh: verificando entorno ===
✔ node instalado
✔ pnpm instalado
✔ rustc instalado
✔ cargo instalado
✔ dependencias instaladas (node_modules)
✔ AGENTS.md existe
✔ feature_list.json existe
✔ progress/current.md existe
✔ formato de feature_list.json y progress/current.md
✔ tests al 100% (node:test) — 462 tests
✔ build de producción (pnpm build)
✔ El entorno está perfecto.
```