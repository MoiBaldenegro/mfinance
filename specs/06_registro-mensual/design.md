# Diseño — registro-mensual

## Contexto visual

- Sección Registro del shell (F5) pasa de placeholder a pantalla completa.
- Objetivo: capturar un mes completo en menos de 2 minutos con claridad de
  subtotales en vivo.

## Tokens usados (de tokens.css, sin valores nuevos salvo semánticos)

| Token | Uso |
|-------|-----|
| `--color-surface` + `--radius-md` + `--shadow-card` | tarjetas Ingresos y Gastos |
| `--color-positive` | totales de ingresos |
| `--color-negative` | totales de gastos |
| `--color-primary` | botón confirmar y mes activo del selector |
| `--space-*` | rejilla del formulario (2 columnas de campos) |

## Decisiones y constraints

- Dos tarjetas lado a lado (Ingresos | Gastos) que apilan en columna bajo
  ancho estrecho; fila de totales + botón confirmar al pie.
- Campos numéricos con step 0.01 y sufijo €; etiqueta por fuente/categoría
  fija en español; inputs controlados desde estado local hasta confirmar.
- El selector de mes usa input type=month nativo más botones ‹ › para no
  añadir dependencias de calendario.
- Errores de validación inline en rojo (`--color-negative`) junto al campo.

## Alternativa descartada

- Tabla única editable estilo spreadsheet: más densa pero confunde ingresos
  con gastos y complica la validación inline por campo.
