# Diseño — refino-visual-secciones (feature 18)

## Contexto visual

- Segunda fase de la sesión de estilos: sobre el sistema dual de la feature
  17, se eleva el atractivo de Registro PyG Balance Deuda Inversiones
  Indicadores Conciliación Cierre Diagnóstico y Ajustes más la shell
  (HeaderBar SectionTabs).
- Estado actual: hojas funcionales correctas pero planas; estados de foco
  irregulares; estados vacíos con estilos dispersos por sección.

## Tokens usados

| Token | Uso en el refino |
|-------|------------------|
| `--space-1..8` / `--espacio-1..8` | ritmo vertical y padding consistente |
| `--fuente-tamano-xs..xl`, `--fuente-peso-*`, `--font-sans` | jerarquía tipográfica de títulos datos y métricas |
| `--radio-md/lg/full`, `--shadow-card`, `--sombra-md` | tarjetas paneles chips y elevación por tema |
| `--color-primary*`, `--color-border`, `--color-surface*` | acciones bordes y superficies |
| `--color-positive/warn/negative` (+variantes) | semáforo badges y diferencias |
| `--transicion-rapida/normal` | hover focus y cambios suaves |
| `--chart-grid`, `--chart-ticks` | ejes y rejilla coherentes con el tema |

## Decisiones y constraints

- Solo cosmética: se editan hojas CSS y classNames; ninguna lógica de
  use-cases, puertos, adapters ni backend cambia. Los `.tsx` solo ajustan
  clases si un patrón lo requiere (p. ej. clase común de estado vacío).
- Estados interactivos uniformes: `:hover`, `:focus-visible` y activo con
  tokens en pestañas botones campos filas clicables.
- Patrón común de estados vacío/carga: clase u hoja compartida reutilizada
  por las secciones que hoy muestran mensajes sueltos.
- Ambos temas revisados: contraste legible texto/superficie en oscuro y
  claro sin tocar nombres de token.
- Reglas duras: nada fuera de tokens para valores visuales
  (`audit-design-tokens.mjs` OK), CSS separado de los `.tsx`
  (`tests/frontend-hexagono` verde), ≤100 líneas por archivo tocado,
  sin dependencias nuevas.

## Alternativa descartada

- Rediseño de layout/navegación (sidebar, reorganizar secciones) dentro de
  esta pasada: amplía alcance y riesgo sin pedirlo la petición; se queda en
  refinamiento del sistema visual existente.
