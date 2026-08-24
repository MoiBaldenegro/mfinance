# Review — feature 33 (fix-onboarding-guardado-ocupacion)

**Veredicto:** APPROVED

## Checkpoints
- C1: [x] Hexagonal — `onboarding-ocupacion.ts` es módulo puro en `src/domain/use-cases/onboarding/`, solo importa `./onboarding-guardado.ts`; grep `react|@tauri-apps` sobre `src/domain/` = 0 coincidencias; sin dependencias nuevas (package.json/pnpm-lock/Cargo.toml con mtime anterior a la sesión F33).
- C2: [x] Convenciones — archivos de producción ≤100 líneas: `onboarding-ocupacion.ts`=85, `use-onboarding.ts`=100, `OnboardingWizard.tsx`=99. Sin CSS en .tsx, estilos intactos.
- C3: [x] TDD rojo→verde — evidencia en `impl_33.md` §Ciclo TDD: salida roja real (`# tests 19 · pass 8 · fail 11` contra código vigente) y verde posterior (`# tests 24 · pass 24`). Tests verificados en disco: cubren REQ-33-01..06.
- C4: [x] Dependencias — `depends_on: []`; nada pendiente saltado.
- C5: [x] `./init.sh` VERDE COMPLETO (ejecutado en esta revisión): entorno ✔, formato ✔, tests al 100% ✔, build ✔. `pnpm test`: **605 tests / 175 suites / 605 pass / 0 fail**.

## Verificación en disco (no solo el informe)

1. **Tests existen y cubren la aceptación**:
   - `tests/onboarding-wizard/onboarding-ocupacion.test.mjs` (119 l.): editar no ocupa ni dispara IPC durante debounce (REQ-33-01); expiración → exactamente un guardado con ocupado=true solo en vuelo (REQ-33-02); flush sin pendiente (regresión CR-2) y con error restablecen ocupado=false, fallo registrado y datos locales conservados (REQ-33-04/05).
   - `tests/onboarding-wizard/fix-guardado-ocupacion-estructura.test.mjs` (72 l., estilo estructura-integracion-27): `aplicar`/`act1-act4`/hook completo sin `setGuardando(true)`; `sig`/`comp`/`salt` con `finally` + `restablecer()`; wizard sin `deshabilitado={guardando}` y con `deshabilitado={operacionEnCurso}`; botones sin `disabled=…guardando`; toast ligado a `guardando`.
   - Ráfaga: 7 ediciones → exactamente 1 llamada a guardarFn y `DEBOUNCE_MS === 500` (REQ-33-06); `crearLogicaGuardado` conservado (verificado en `onboarding-guardado.ts` / `onboarding-estado.ts`).
2. **pnpm test**: verde completo 605/605 (ejecutado).
3. **wc -l**: coincide con impl_33.md §tabla (85/100/99/119/72/43). Producción ≤100.
4. **Hexagonal**: dominio puro sin react/@tauri-apps; `invoke` sigue solo bajo `src/adapters` (suite frontend-hexagono en verde); cero dependencias nuevas.
5. **Comportamiento corregido verificado en código**:
   - `use-onboarding.ts:63-70`: `aplicar/act1-act4` solo `setDatos` + `ocupacion.editar()` — jamás activan ocupación por tecla (CR-1 resuelto).
   - `use-onboarding.ts:72-91`: `sig/comp/salt` restauran ocupación en `finally` aunque `flush()` sea no-op o falle (CR-2 resuelto); `comp/salt` usan `operacionEnCurso` para su propio vuelo bloqueante.
   - `OnboardingWizard.tsx:86,90,92,93`: inputs del paso activo reciben `deshabilitado={operacionEnCurso}` (nunca derivado de persistencia parcial); línea 96: toast «Guardando cambios…» solo con IPC en vuelo.
6. **Alcance**: análisis mtime de la sesión F33 (2026-08-24 12:03–12:27) confirma que solo se tocaron los 6 archivos del informe; features 31/32 (10:39–11:28) y CR-3/UI glitch quedaron fuera → feature 34 intacta y pending.

## Hallazgos

### Críticos
- Ninguno.

### Menores (no bloqueantes)
1. `onboarding-ocupacion.ts:55`: `if (!ocupado) ocupado = false;` es un no-op muerto (cosmético). Candidato a limpieza en un ciclo futuro.
2. `tests/onboarding-wizard/onboarding-ocupacion.test.mjs` tiene 119 líneas (>100). Precedente consolidado en reviews previos (p. ej. `onboarding-paso3-usecase.test.mjs`, 368 l., aprobada en F26): la regla dura se aplica de facto a producción. Se registra como nota, sin incidencia.
3. Tras un `flush()` sin pendiente, `estado().error` conserva un fallo anterior hasta el siguiente envío exitoso; conforme a REQ-33-05 («registrar el fallo»), pero conviene conocerlo.

## Evidencia
- Ejecuciones de esta revisión: `pnpm test` → `# pass 605 / # fail 0`; `./init.sh` → verde completo (entorno, formato, tests, build).
- Informe del implementador: `progress/impl_33.md`. Análisis: `progress/research/fix-wizard-onboarding-inputs.md`. Spec: `specs/33_fix-onboarding-guardado-ocupacion/{requirements,design}.md`.

Feature 33 marcada como `done` en `feature_list.json` (conforme a protocolo: APPROVED + suite verde).
