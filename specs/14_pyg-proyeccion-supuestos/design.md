# Diseño — pyg-proyeccion-supuestos

## Contexto visual

- Nueva vista de "escenario": sobre el histórico real se proyectan 12 meses
  modificables ("qué puede ir pasando"). Es la primera UI con parámetros de
  simulación persistentes en Settings.

## Tokens usados

| Token | Uso |
|-------|-----|
| `--color-primary` | barras/segmento histórico |
| `--color-muted` con patrón punteado | meses proyectados |
| `--color-warn` | chips de supuesto activo distinto de cero |
| `--color-surface` `--radius-md` | panel de supuestos |
| `--space-*` | rejilla supuestos arriba resultado abajo |

## Decisiones y constraints

- Panel superior: slider/input por variable (ingresos +X% mensual; gasto
  vivienda alimentacion transporte ocio otros ±Y%) con valores por defecto 0.
- Debajo, gráfica Chart.js única donde los 12 meses proyectados usan estilo
  punteado y tono apagado respecto al histórico sólido.
- Botón restablecer a la derecha del panel; cambios aplican al confirmar
  (no en vivo) para evitar recalculos confusos mientras se escribe.

## Decisión sobre «pagos actuales» (REQ-14-02, ronda 2 de review)

«Pagos actuales» = la categoría **cuotas_deuda del último registro mensual**
registrado por el usuario: es el pago real que destina cada mes a sus deudas
y ya vive en el snapshot. Reglas del motor (`engine_balance.rs`):

1. Cuota total mensual = gasto `cuotas_deuda` del último mes registrado;
   sin registros o sin categoría → 0.0 (no se inventa amortización).
2. La cuota se reparte entre pasivos **proporcionalmente al saldo pendiente**.
3. En cada pasivo se cubre primero el interés mensual (saldo·tasa/12); solo
   el resto amortiza principal (nunca por debajo de cero).
4. El ahorro PyG engorda activos y las cuotas ya están descontadas como
   gasto, así que la reducción de pasivos es el efecto neto correcto.

Descartado el horizonte lineal fijo de 60 meses (saldo/60) que usaba el
primer borrador: era una constante mágica ajena a los pagos reales.

## Alternativa descartada

- Supuestos globales únicos (una sola %): más simple pero el requerimiento
  pide jugar con categorías por separado ("qué puede ir pasando").
