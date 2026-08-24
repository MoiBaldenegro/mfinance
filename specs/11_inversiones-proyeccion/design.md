# Diseño — inversiones-proyeccion

## Contexto visual

- Sección Inversiones pasa de placeholder a vista de cartera + horizonte
  temporal. Fusiona módulos 6 (aportes) y 11 (simulador) del requerimiento.

## Tokens usados

| Token | Uso |
|-------|-----|
| `--color-primary` `--color-warn` `--color-positive` | series de renta fija renta variable y finca raíz |
| `--color-surface` `--radius-md` | tabla de cartera |
| `--text-*` grande | cifras 5/10/20 años |
| `--space-*` | rejilla tabla arriba gráfica debajo |

## Decisiones y constraints

- Tabla de tres filas fijas (familias) con columnas aporte mensual valor
  actual y tasa esperada editable; debajo tarjetas de horizonte 5/10/20
  años; gráfica de barras agrupadas por familia al pie.
- Un color por familia consistente entre tabla chips y chart.
- Tasa esperada con input numérico % step 0.1 y validación inline.

## Alternativa descartada

- Curva compuesta continua (línea año a año): más vistosa pero el
  requerimiento pide hitos 5/10/20; las barras por hito son más legibles.
