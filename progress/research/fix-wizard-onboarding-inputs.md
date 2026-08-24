# Análisis: fix del wizard de onboarding — inputs congelados, lag por tecla y glitch visual

Fecha: 2026-08-24 · Autor: spec_author · Estado: análisis completo, altas 33/34

## 1. Problema reportado (requerimiento bruto del humano)

1. Paso 1: cada pulsación en el campo «nombre» dispara un ciclo de
   «guardando» con lag extremo.
2. Paso 2: los inputs están bloqueados y ya no se puede avanzar.
3. La UI se desborda y «glitchea con saltos infinitos».

## 2. Causas raíz identificadas (con evidencia)

### CR-1 — `guardando` se activa síncronamente en cada edición (síntoma 1)

`src/hooks/use-onboarding.ts` líneas 67-69:

```ts
const aplicar = useCallback((nuevos: OnboardingData) => {
  setDatos(nuevos); setGuardando(true); guardarConDebounce(nuevos);
}, [guardarConDebounce]);
```

- Cada keystroke → `act1` → `aplicar` → `setGuardando(true)` inmediato,
  aunque el IPC real solo se dispara 500 ms después de la última tecla
  (`DEBOUNCE_MS = 500` en `onboarding-estado.ts`; debounce correcto).
- `guardando` se propaga como `deshabilitado` a TODO el wizard:
  `OnboardingWizard.tsx` línea 86 (`deshabilitado={guardando}`) →
  `WizardContenido.tsx` → `OnboardingPaso1.tsx` línea 65
  (`disabled={deshabilitado}` sobre el input nombre).
- Efecto observado exactamente como lo describe el humano: primera tecla →
  el campo se deshabilita (pierde el foco), aparece el banner fijo
  «Guardando cambios…» (`OnboardingWizard.tsx` línea 96), y el campo sigue
  bloqueado hasta que expira el debounce + ida y vuelta de IPC
  (~500 ms + latencia). El debounce agrupa bien los IPC; el defecto es la
  semántica de «ocupación», no el debounce.

### CR-2 — `sig()` deja `guardando=true` para siempre si no había guardado pendiente (síntoma 2)

`src/hooks/use-onboarding.ts` líneas 76-78:

```ts
const sig = useCallback(async () => {
  if (currentStep < 5) { setStatus({...current_step: currentStep + 1}); setGuardando(true); await flushGuardado(); }
}, ...);
```

`flushGuardado()` (`onboarding-guardado.ts` líneas 35-38) es un **no-op**
cuando `timeoutId == null && flushPromise == null` (caso normal: el usuario
escribió, esperó >500 ms, el guardado ya terminó). En ese caso:

- nadie ejecuta `guardarRef.current` (único sitio que hace
  `setGuardando(false)`, línea 48), y `sig` tampoco lo hace;
- resultado: `guardando` queda `true` permanentemente → TODOS los inputs del
  paso 2 quedan `disabled={true}` (`OnboardingPasoBalance.tsx` → secciones) y
  los botones Atrás/Siguiente/Finalizar/Saltar también
  (`disabled={... || guardando}`, `OnboardingWizard.tsx` líneas 90-93).

Reproducción determinista: escribir nombre → esperar >500 ms (guardado
completa, `guardando=false`) → pulsar «Siguiente» → paso 2 congelado,
imposible avanzar. Coincide 1:1 con el síntoma 2. Nota: `comp` y `salt`
tienen el mismo defecto latente, pero ahí el IPC posterior siempre pasa por
un camino que restablece `guardando`.

### CR-3 — `<details>` controlado con bucle de toggle + desbordes (síntoma 3)

- Las tres secciones del paso 2 usan el patrón details controlado:
  `ActivosSection.tsx:36`, `PasivosSection.tsx:36`, `InversionesSection.tsx:40`:
  ```tsx
  <details open={abierto} onToggle={() => setAbierto(!abierto)}>
  ```
  React re-aplica `open={estado}` en cada render; con re-renders frecuentes
  (los flips de `guardando` de CR-1 ocurren por cada tecla) el estado de
  React pelea con el toggle nativo del navegador → bucles onToggle, secciones
  que saltan abierto/cerrado («saltos infinitos») y pérdida de scroll/foco.
- Banner «Guardando cambios…» (`position: fixed`, animación slide-in,
  `onboarding-wizard.css:222-244`) aparece/desaparece en cada tecla →
  parpadeo/glitch visible.
- `.onboarding-wizard__pasos` usa `grid-template-columns: repeat(5, 1fr)`
  con títulos `white-space: nowrap` (`onboarding-wizard.css:41-104`); sin
  contención (`min-width: 0` / wrap) desborda horizontalmente en ventanas
  estrechas. Además el wizard se monta standalone desde `App.tsx`
  (`Contenido`) sin contenedor de página con padding/scroll propio.

## 3. Decisión de descomposición: 2 features

Los síntomas 1 y 2 comparten una única causa raíz arquitectónica: la
semántica de «ocupación» (`guardando`) del hook está mal definida (se activa
por edición y no se restablece tras flush no-op). Eso es UNA feature
(33) porque el arreglo vive en el mismo módulo (`use-onboarding.ts` + lógica
extraíble a dominio testeable).

El síntoma 3 tiene una causa parcialmente independiente (patrón `<details>`
controlado y CSS sin contención) que persistiría aunque se arregle CR-1/CR-2:
otro usuario que alterne las secciones durante cualquier re-render puede
reproducir el bucle. Por tanto es UNA segunda feature (34), marcada
`depends_on: [33]` para serializar la implementación (ambas tocan el árbol
de componentes del wizard y `one_feature_at_a_time` aplica).

No se requiere backend Rust ni dependencias externas; todo el cambio es
frontend TS/TSX/CSS con lógica pura extraída a `src/domain/use-cases/onboarding/`
(testeable con node:test, patrón `onboarding-debounce.ts` / tests
estructurales tipo `estructura-integracion-27.test.mjs`).

## 4. Riesgos y trabas

- Regla ≤100 líneas: `use-onboarding.ts` ya está en 100 líneas → la lógica de
  ocupación DEBE extraerse a módulo puro nuevo (además mejora testabilidad).
  `onboarding-wizard.css` ya excede 100 líneas (244): cualquier añadido debe
  discutirse; preferir ediciones mínimas o nueva hoja importada.
- No tocar el debounce existente (`crearLogicaGuardado`): REQ-25-06 exige
  agrupar ráfagas en un solo IPC; conservar 500 ms.
- Los inputs del paso activo NO deben deshabilitarse por persistencia parcial
  (solo por operaciones bloqueantes: completar/saltar/navegación en vuelo);
  esto cambia el contrato de la prop `deshabilitado` de `WizardContenido`.
- Tests node:test existentes (`use-onboarding-hook.test.mjs`,
  `onboarding-debounce-hook.test.mjs`,
  `onboarding-paso-balance-structure.test.mjs`,
  `onboarding-integracion-estilos-hexagonal.test.mjs`) pueden fijar hoy el
  comportamiento defectuoso: habrá que actualizarlos primero (TDD rojo).
- `App.tsx` monta el wizard sin datosIniciales; no hay bucle de remontaje por
  props (descartado como causa).

## 5. Features dadas de alta

| id | name | alcance |
|----|------|---------|
| 33 | fix-onboarding-guardado-ocupacion | CR-1 + CR-2: semántica de ocupación, flush con finally, inputs nunca bloqueados por guardado parcial |
| 34 | fix-paso2-details-glitch-layout | CR-3: acordeón details sin bucle, contención overflow, banner estable |
