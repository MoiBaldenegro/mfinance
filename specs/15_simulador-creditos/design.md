# Diseño — simulador-creditos

## Contexto visual

- Nueva vista de laboratorio de crédito: configurar préstamo hipotético,
  jugar con extras y ver el ahorro antes de comprometerse. Reutiliza el
  motor de F9 pero opera en modo sandbox.

## Tokens usados

| Token | Uso |
|-------|-----|
| `--color-primary` | panel escenario optimizado |
| `--color-surface` `--radius-md` | paneles base/optimizado |
| `--color-positive` | cifras de ahorro |
| `--space-*` | rejilla dos columnas que colapsa |

## Decisiones y constraints

- Formulario compacto arriba (importe plazo tasa); dos tarjetas comparadas
  (Base | Optimizado) con métricas grandes; acordeón con tabla de
  amortización colapsada por defecto para no abrumar.
- Badge "sandbox" visible: deja claro que nada toca el balance real.
- Selector de estrategia reutiliza el componente/tokens de F9.

## Alternativa descartada

- Gráfica comparativa de saldos por mes: útil pero secundaria; las cifras
  de ahorro responden antes a la pregunta del usuario. Queda como mejora.
