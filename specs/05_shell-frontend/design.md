# Diseño — shell-frontend

## Contexto visual

- Estado actual: App.tsx del scaffold Tauri (demo React) sin producto.
- Estado deseado: esqueleto navegable de mfinance en español. Layout con
  cabecera fija (nombre app + mes de trabajo actual) y navegación por
  pestañas/secciones; el área central muestra la sección activa o placeholder.
- La navegación define el mapa mental del producto: Registro PyG Balance
  Deuda Inversiones Indicadores Conciliación Cierre Ajustes.

## Tokens usados (se crean en esta feature)

| Token | Valor orientativo | Uso |
|-------|-------------------|-----|
| `--color-bg` | gris casi blanco | fondo app |
| `--color-surface` | blanco | tarjetas y paneles |
| `--color-primary` | verde financiero oscuro | acentos y navegación activa |
| `--color-text` / `--color-muted` | gris oscuro / gris medio | texto principal y secundario |
| `--space-*` (1..8) | escala 4px base | paddings y gaps |
| `--radius-md` | 10px | tarjetas |
| `--shadow-card` | sombra sutil | elevación de paneles |
| `--font-sans` | pila system-ui | tipografía única |

Semántica de color reservada para futuras features: `--color-positive`
(verde semáforo) `--color-warn` (amarillo) `--color-negative` (rojo).

## Decisiones y constraints

- Navegación por pestañas horizontales scrollables (9 secciones): simple,
  escalable y sin dependencias de router externas.
- Estado global mínimo: un contexto React con snapshot + acciones de
  recarga; los placeholders leen solo el nombre de sección.
- Cada sección es una carpeta propia bajo `src/components/` con su hoja CSS
  en `src/styles/`; ningún `.tsx` contiene CSS.
- Español en todos los rótulos visibles desde el primer commit.
- ≤100 líneas por archivo: la navegación se deriva de un array declarativo.

## Alternativa descartada

- Sidebar vertical estilo dashboard: ocupa ancho permanente que penaliza las
  tablas y gráficas de los módulos posteriores en ventanas de escritorio
  pequeñas; se reevaluará si el humano lo pide.
