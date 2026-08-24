# Diseño — plan-deuda

## Contexto visual

- Sección Deuda pasa de placeholder a vista de decisión: el usuario debe
  entender de un vistazo a qué deuda atacar y qué gana haciéndolo.

## Tokens usados

| Token | Uso |
|-------|-----|
| `--color-primary` | fila de la deuda objetivo y selector de estrategia |
| `--color-positive` | métrica intereses ahorrados |
| `--color-warn` | estado amarillo del semáforo de endeudamiento reutilizado |
| `--color-surface` `--radius-md` | tarjeta configuración y tabla deudas |
| `--space-*` | rejilla configuración + resultados |

## Decisiones y constraints

- Cabecera con toggle Avalancha/Bola de nieve + input pago extra €; debajo
  tabla de deudas ordenada según estrategia con la primera fila resaltada;
  banda inferior con tres métricas grandes (meses libres total pagado
  intereses ahorrados) y mini-gráfica Chart.js de saldo total restante.
- La estrategia activa se guarda en Settings del snapshot para persistir la
  preferencia entre sesiones.
- Cifras monetarias es-ES con €; meses con etiqueta "X meses" en español.

## Alternativa descartada

- Mostrar dos tablas simultáneas (avalancha y bola): duplica ruido visual;
  el toggle único con recálculo comunica mejor la comparación vía métricas.
