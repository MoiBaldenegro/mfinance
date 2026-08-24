# Diseño — fix-paso2-details-glitch-layout (feature 34)

## Contexto visual

- Paso 2 (Balance inicial): tres acordeones `<details open={abierto}
  onToggle={...}>` (ActivosSection, PasivosSection, InversionesSection) que
  entran en bucles de toggle ante re-renders frecuentes: secciones que saltan
  abierto/cerrado solas («saltos infinitos»).
- Barra de progreso de 5 pasos con títulos `nowrap` que desborda en ventanas
  estrechas; el wizard se monta sin contenedor de página con scroll propio.

## Tokens usados

| Token | Uso |
|-------|-----|
| `--space-*` | espaciados existentes (sin valores crudos nuevos) |
| `--color-border`, `--radius-lg` | bordes de secciones (sin cambios) |

## Decisiones y constraints

- Decisión 1: convertir los acordeones a details no controlado
  (`<details open>` inicial sin prop re-aplicada por React) o sincronizar con
  ref/`defaultOpen`; eliminar el patrón `open={estado}` + `onToggle={() =>
  setAbierto(!abierto)}` simultáneo en las tres secciones. El estado abierto/
  cerrado pasa a ser del DOM salvo necesidad demostrada de estado React.
- Decisión 2: contención del progreso: `min-width: 0` en las columnas o
  flex-wrap/títulos con wrap controlado en `.onboarding-wizard__pasos`
  (ediciones mínimas en `onboarding-wizard.css`, que ya excede 100 líneas:
  sin añadidos innecesarios; si hace falta CSS nuevo, hoja separada).
- Decisión 3: dar contención vertical/padding al área central del wizard
  cuando se monta standalone (clase contenedora en `OnboardingWizard` o hoja
  `app.css`) para evitar saltos de layout con el toast.
- Restricción: solo tokens.css, estilos fuera de los `.tsx`.

## Alternativa descartada

- Sustituir `<details>` por div+aria-expanded gestionado en React: más código
  y pierde la semántica nativa; el details no controlado resuelve el bucle
  con menos superficie (precedente de minimalismo del arnés).
