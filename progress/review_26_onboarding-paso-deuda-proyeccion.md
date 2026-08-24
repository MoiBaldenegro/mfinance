# Review — feature 26

**Veredicto:** APPROVED *(Ronda 2 — re-review; el veredicto de Ronda 1 fue CHANGES_REQUESTED, histórico íntegro al final)*

---

# RONDA 2 — Re-review tras fix bloqueante transversal (2026-08-23)

## Checkpoints

- C1: [x] Arquitectura hexagonal — refactor ronda 2 respeta capas: `validarPaso.ts` importa solo tipos de dominio (`Paso1Data`, dirección componentes→dominio correcta); `WizardErrorCarga.tsx` es UI pura sin lógica ni CSS embebido (reutiliza clases BEM existentes `.onboarding-wizard--error/__error/__reintentar`, verificadas en `src/styles/onboarding-wizard.css` líneas 9/19/24); grep confirma 0 usos de `invoke()` fuera de `src/adapters/`, 0 imports de `react`/`@tauri-apps/api` bajo `src/domain/`, 0 casts `as any` en `src/components|hooks|domain`.
- C2: [x] Tests TDD — evidencia rojo→verde documentada en impl_26 §«Ronda 2» (518/519 rojo por REQ-24-14 → 519/519 verde). **Sin ediciones de tests en esta ronda**: mtimes de todos los `tests/**/*.mjs` ≤ 15:55, ventana del refactor 18:05–18:07; ningún test posterior a 17:00.
- C3: [x] `./init.sh` VERDE COMPLETO (bloqueante de Ronda 1 RESUELTO) — ejecutado en esta revisión: herramientas ✔, formato ✔, tests node:test al 100% ✔, build producción ✔. Suite completa: `# tests 519 / # pass 519 / # fail 0`. Test antes fallador en solitario (`node --test tests/onboarding-wizard/onboarding-integracion-estilos-hexagonal.test.mjs`): 10/10 ok.
- C4: [x] Dependencias en `done` — `depends_on: [25, 9, 14]` → 25=done, 9=done, 14=done (verificado sobre `feature_list.json`).
- C5: [x] ≤100 líneas — wc -l real coincide con impl_26 §Ronda 2: `OnboardingWizard.tsx`=100 (≤100 regla dura; <170 umbral test REQ-24-14), `validarPaso.ts`=19, `WizardErrorCarga.tsx`=20. Resto de archivos F26 ≤100 (TSX 61/43/72/66; CSS 93/74/88/53; hook 36; use-case 21).
- C6: [x] Estilos tokens — suite completa verde incluye audit-design-tokens; sin CSS embebido en los `.tsx` tocados (el único `style={}` es el binding pre-existente de la custom property `--progreso`, basado en token, sin valores literales).

## Verificación específica solicitada

1. **Bloqueante ronda 1 RESUELTO**: sí. El único fallo (subtest REQ-24-14, `OnboardingWizard.tsx` 188 > 170) desapareció tras el refactor; `./init.sh` termina verde completo.
2. **Refactor sin cambio de comportamiento ni contratos**: confirmado por tres vías — (a) ningún `tests/**` modificado en la ventana ronda 2 (mtimes); (b) la suite funcional completa pasa sin ediciones; (c) los tres archivos extraídos son estructuralmente inertes respecto a contratos: función pura tipada contra entidad de dominio, componente de error sin puertos, y render inline que preserva los marcadores exigidos por los tests (`keyPaso === 'paso3'`, `currentStep === 3`, `snapshotPort={snapshotPort}`, textos Atrás/Siguiente/Saltar/Finalizar, `/4` de progreso). Fix de tipos latente `PasoInfo = (typeof PASOS)[number]` es solo-tipos, cero impacto runtime.
3. **wc -l real vs informe**: coincidencia exacta (100/19/20). Nota menor: `OnboardingPasoPlaceholder.tsx` (17 líneas, mencionado en la orden de re-review como extraído) tiene mtime 13:49 — pre-existe de F24/F25, y el informe no lo reclama como creación de ronda 2. Sin incidencia.
4. **Criterios de aceptación F26 siguen cubiertos**: verificado en código — radio Avalancha/Bola de nieve default `Avalanche` (DeudaSection líneas 27-34), pago extra ≥0 con `Math.max(0, …)` + `formatoMoneda` (líneas 18-21, 39), tabla supuestos con clamp `Math.max(-0.5, Math.min(1, …))` = -50%..+100% (ProyeccionSection línea 18), botón «Restablecer a 0%» (línea 69), vista previa PyG+patrimonio vía `snapshotPort.pygProyeccion()/balanceFuturo()` sin duplicar motores F9/F14 (padre líneas 42-43), persistencia debounce vía `crearLogicaGuardado(DEBOUNCE_MS)` en `use-onboarding.ts`, paso opcional (`pasoValido` retorna `true` en step 3, wizard línea 47).
5. **Nota conocida `OnboardingPaso1.tsx` (159 líneas)**: confirmado con wc -l. Es deuda **pre-existente de F24** (aprobada en su propio review; mtime anterior a la sesión F26), no rompe `./init.sh` (159 < 170) y no fue creada ni modificada por la feature 26. **No es bloqueante para la 26** → se registra como **deuda técnica documentada**: viola la regla dura de ≤100 líneas (AGENTS.md §7 / architecture.md principio 10) y debería resolverse en un ciclo futuro (refactor equivalente al de esta ronda o discusión con estado `blocked`). Queda anotada aquí y en este mismo párrafo como registro para el líder/humano.

## Conclusión Ronda 2

El único bloqueante de Ronda 1 estaba correctamente identificado como transversal y quedó resuelto sin tocar tests ni contratos. La feature 26 cumple todos sus criterios de aceptación, `./init.sh` está verde completo (formato + 519/519 tests + build) y las dependencias están en `done`. **APPROVED.**

---

# Ronda 1 — HISTORIAL (verbatim, sin modificar)

**Veredicto:** CHANGES_REQUESTED

## Checkpoints
- C1: [x] Arquitectura hexagonal — dominios puros, puertos/adapters, invoke solo en adapters
- C2: [x] Tests TDD — tests escritos antes (rojo→verde), suites 117-126, 123-126 pasan
- C3: [ ] `./init.sh` verde completo — **FALLA** por issue pre-existente de feature 24 (OnboardingWizard.tsx 188 líneas > 170 threshold en test REQ-24-14). No introducido por feature 26.
- C4: [x] Reutilización F9/F14 — `snapshotPort` expone `planDeuda()` (F9) y `pygProyeccion()`/`balanceFuturo()` (F14) vía puertos; test 125 pasa
- C5: [x] ≤100 líneas — todos los archivos nuevos de feature 26 ≤100 líneas (TSX: 61, 43, 73, 67; CSS: 93, 74, 88, 53)
- C6: [x] Estilos tokens — `audit-design-tokens` OK (test 126), 0 valores hardcodeados en componentes

## Cambios requeridos
1. **Bloqueante transversal:** `./init.sh` no termina verde debido a test pre-existente de feature 24 (`OnboardingWizard.tsx` 188 líneas). Este fallo **no fue introducido por feature 26** — viene de feature 24 (onboarding-wizard-shell-basicos) y está documentado en `progress/current.md` como "1 pre-existing failure in OnboardingWizard.tsx line count". La feature 26 en sí cumple todos sus criterios de aceptación.

2. **Verificación específica del fix crítico (ítems 1 y 2 del request):**
   - ✅ `OnboardingWizard` importa `snapshotPort` desde `../../adapters/snapshot-ipc-adapter.ts` (línea 11) y lo pasa correctamente a `OnboardingPasoDeudaProyeccion` como prop `snapshotPort={snapshotPort}` (línea 72). **Sin casts `as any`**.
   - ✅ `PreviewSection.tsx` **no contiene casts `as any` innecesarios** — solo imports de dominio y tipos.

3. **Evidencia de cumplimiento feature 26:**
   - `OnboardingPasoDeudaProyeccion` (61 líneas) compone `DeudaSection`, `ProyeccionSection`, `PreviewSection`
   - `DeudaSection`: radio buttons Avalancha/Bola de nieve + campo pago extra ≥0 con formateo moneda
   - `ProyeccionSection`: tabla supuestos con variables del paso 1 + balance, clamp -50%..+100%, botón "Restablecer a 0%", reutiliza `formatearVariacion`/`parsearVariacion` de F14
   - `PreviewSection`: PyG 12m + Patrimonio 12m solo lectura, distingue histórico/proyectado, usa `filasDeTablaProyeccion` de F14
   - Persistencia debounce 500ms en `onboarding_data.deuda` y `onboarding_data.proyeccion` vía hook `useOnboarding`
   - Paso opcional: no bloquea "Siguiente", muestra estado vacío si sin datos

## Conclusión
La implementación de **feature 26 es correcta y completa** según sus criterios de aceptación. El único obstáculo para `APPROVED` es el fallo pre-existente de feature 24 en `./init.sh`, que escapa al alcance de esta feature. Una vez resuelto ese issue transversal (refactor OnboardingWizard.tsx ≤170 líneas o ajuste de threshold en test), `init.sh` pasará y feature 26 quedaría `APPROVED`.
