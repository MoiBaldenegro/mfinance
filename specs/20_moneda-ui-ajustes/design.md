# Diseño — moneda-ui-ajustes (feature 20)

## Contexto visual

- Sección afectada: **Ajustes** (`src/components/ajustes-section/`), que hoy
  solo contiene el resumen del snapshot y el conmutador de tema (f17). Se
  añade un bloque "Moneda" con el selector MXN/USD/EUR.
- Estado deseado: al cambiar la moneda, todos los importes de las secciones
  Registro PyG Balance Deuda Inversiones Indicadores Conciliación Cierre
  Diagnóstico y Simulador se reformatean al instante; los sufijos de campos
  y cabeceras "(€)" pasan al símbolo activo.
- La elección persiste en `strategy.currency` del snapshot vía el flujo
  existente de guardado (save_state); sin commands ni esquemas nuevos.

## Tokens usados (solo tokens del proyecto)

| Token | Uso en esta feature |
|-------|---------------------|
| `--color-surface` / `--color-border` | Contenedor del bloque Moneda y borde del selector. |
| `--color-text` / `--color-muted` | Etiqueta "Moneda" y ayuda bajo el selector. |
| `--color-primary` / `--color-primary-bg` | Opción activa del selector y anillo de foco vía `--anillo-foco`. |
| `--space-2..5`, `--radio-md`, `--shadow-card` | Ritmo y forma del bloque, igual que los demás bloques de Ajustes. |
| `--transicion-rapida` | Transición del estado hover/activo de las opciones. |

## Decisiones y constraints

- Decisión 1: selector tipo grupo segmentado (tres botones) en lugar de
  `<select>`: tres opciones caben en una fila, se ve la moneda activa de un
  golpe y reutiliza patrones de botón ya tokenizados.
- Decisión 2: la moneda activa se propaga desde el snapshot cargado por UN
  único punto (hook/contexto en shell siguiendo el patrón de `estado-tema` +
  `hooks/use-tema.ts`); ningún componente hardcodea símbolo ni locale: todo
  sale de `src/domain/entities/moneda.ts` y `formato-moneda.ts`.
- Restricción aplicable: estilos en hoja propia `src/styles/ajustes-section.css`
  (ya existe) ampliada; nada de CSS inline; ≤100 líneas por archivo tocado;
  sin dependencias nuevas; textos en español.

## Alternativa descartada

- Alternativa considerada: `<select>` nativo de monedas + conversión de
  importes con tipos de cambio fijos.
- Motivo del descarte: la conversión exige tasas externas o hardcodeadas
  (fuera de alcance y sin dependencias aprobadas); el requerimiento es
  selección de moneda de visualización con re-etiquetado, no cambio de unidad.
