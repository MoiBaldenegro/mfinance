# Diseño — indicadores-semaforo

## Contexto visual

- Sección Indicadores pasa de placeholder a panel de salud financiera. Debe
  leerse en 5 segundos: cuatro tarjetas grandes con punto de color.

## Tokens usados

| Token | Uso |
|-------|-----|
| `--color-positive` `--color-warn` `--color-negative` | puntos del semáforo y valor asociado |
| `--color-muted` + estado neutro | tarjeta sin datos |
| `--color-surface` `--radius-md` `--shadow-card` | tarjetas |
| `--text-*` escala grande | cifra principal de cada tarjeta |
| `--space-*` | rejilla 2x2 que colapsa a columna |

## Decisiones y constraints

- Rejilla 2x2 de tarjetas (endeudamiento tasa de ahorro fondo emergencia
  ingreso pasivo); cada tarjeta: nombre, cifra grande, umbral cumplido en
  texto pequeño ("sano <15%") para educar mientras se usa.
- Los umbrales viven como constantes del dominio backend testeables, nunca
  hardcodeadas en el componente; la UI solo pinta la clasificación.
- Punto de color con forma circular + etiqueta textual (verde/amarillo/rojo
  traducido) por accesibilidad no cromática.

## Alternativa descartada

- Lista vertical compacta: pierde jerarquía visual del semáforo; la rejilla
  da igual peso a los cuatro indicadores como pide el requerimiento.
