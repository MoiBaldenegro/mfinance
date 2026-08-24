# Diseño — pyg-automatico

## Contexto visual

- Sección P&G del shell pasa de placeholder a vista analítica: es la primera
  pantalla donde aparece Chart.js y el patrón tabla+gráfica que reutilizarán
  Balance e Inversiones.

## Tokens usados

| Token | Uso |
|-------|-----|
| `--color-primary` | barras de ingresos |
| `--color-negative` | barras de gastos |
| `--color-warn` / `--color-positive` | línea de ahorro acumulado según signo |
| `--color-surface` + `--radius-md` | contenedor de gráfica |
| `--text-*` | jerarquía título sección vs cifras de tabla |
| `--space-*` | separación tarjeta tabla / tarjeta gráfica |

## Decisiones y constraints

- Dos tarjetas apiladas: arriba la tabla compacta (scroll vertical si hay
  muchos meses) y debajo la gráfica; en pantallas anchas quedan lado a lado.
- Colores de series leídos de tokens via getComputedStyle al montar el chart
  para prohibir hex sueltos en componentes.
- Chart.js se registra una sola vez en un módulo `src/lib/chart-setup.ts`
  (registro de controladores bar+line) para mantener los bundles pequeños.
- Cifras con formato español (es-ES, símbolo €) mediante Intl.NumberFormat.

## Alternativa descartada

- Gráfica SVG artesanal sin librería: evitaría dependencia pero el humano
  pidió explícitamente Chart.js y duplicaría esfuerzo frente al estándar.
