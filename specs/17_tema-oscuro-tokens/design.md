# Diseño — tema-oscuro-tokens (feature 17)

## Contexto visual

- Toda la app (10 secciones + shell). Hoy `src/styles/tokens.css` define una
  única paleta clara en `:root`; ~75 hojas consumen solo `var()`.
- Estado deseado: dos paletas completas con los MISMOS nombres de token;
  la oscura como valores por defecto (`:root`), la clara bajo
  `:root[data-theme='claro']`. Conmutador visible en la sección Ajustes.

## Tokens usados (mismos nombres, dos juegos de valores)

| Token | Oscuro (defecto) | Claro ([data-theme='claro']) | Uso |
|-------|------------------|------------------------------|-----|
| `--color-bg` | gris muy oscuro | gris casi blanco actual | fondo app |
| `--color-surface` / `--color-surface-hover` | superficies oscuras | blancos actuales | tarjetas/paneles |
| `--color-primary` / `-hover` / `-bg` / `-contrast` | verde adaptado a fondo oscuro | verdes actuales | acciones/acentos |
| `--color-text` / `--color-muted` (+alias) | texto claro | texto oscuro actual | tipografía |
| `--color-border` | borde sutil oscuro | borde actual | líneas/divisores |
| `--color-positive/warn/negative` (+bg/hover/contrast) | semáforo legible en oscuro | valores actuales | indicadores/estados |
| `--chart-color-1..3`, `--chart-border` + nuevos `--chart-grid`, `--chart-ticks` | paleta de gráfica oscura | actual ampliada | Chart.js |
| `--shadow-card`, `--sombra-md` | sombras reforzadas | actuales | elevación |

Espaciado, radios, transiciones y tipografía NO cambian entre temas.

## Decisiones y constraints

- Dark-first: los valores de `:root` pasan a ser oscuros; sin JS la app ya
  abre oscura. `main.tsx` fija `data-theme` en `<html>` ANTES del
  `render()` leyendo la preferencia (evita destello claro).
- Persistencia fuera del snapshot: puerto de preferencia de tema en
  `src/domain/ports/` implementado por adapter sobre localStorage en
  `src/adapters/`; caso de uso puro `resolver-tema` testeable con node:test.
  No se toca `StrategySettings` ni el esquema Rust ni commands.
- Conmutador en `AjustesSection` (hoy placeholder): control accesible con
  rótulo en español y estado reflejo del tema activo; hoja
  `ajustes-section.css` ampliada desde tokens.
- Gráficas: colores SIEMPRE resueltos vía `src/lib/chart-colores.ts`
  (`getComputedStyle`); se elimina el paso de literales `'var(--chart-…)'`
  a Chart.js de `GraficaProyeccion.tsx`; al cambiar de tema los componentes
  de gráfica redibujan (re-render/redibujar leyendo tokens resueltos).
- Regla de 100 líneas: `tokens.css` (hoy 91) se reescribe compacto
  (declaraciones múltiples por línea, comentarios mínimos) para que ambas
  paletas cabgan ≤100 líneas. Prohibido repartir tokens en otras hojas:
  `audit-design-tokens.mjs` solo exime `tokens.css`.
- Sin dependencias nuevas: solo custom properties y código propio.
- Los nombres de token existentes no cambian → las hojas actuales siguen
  válidas y `tests/frontend-hexagono/ui.test.mjs` permanece verde.

## Alternativa descartada

- Añadir `theme` a `StrategySettings` del snapshot (persistencia IPC): exige
  cambiar esquema Rust, serde y contract IPC para una preferencia de
  presentación; riesgo sobre datos del usuario y alcance mayor. Descartada.
- Librerías de theming o Tailwind: dependencias nuevas sin aprobación
  humana; prohibidas por docs/architecture.md §9. Descartadas.
