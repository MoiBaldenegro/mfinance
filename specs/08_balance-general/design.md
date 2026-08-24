# Diseño — balance-general

## Contexto visual

- Sección Balance pasa de placeholder a vista CRUD + analítica. Es la
  primera UI con listas editables (patrón para Inversiones y Deuda).

## Tokens usados

| Token | Uso |
|-------|-----|
| `--color-surface` `--radius-md` `--shadow-card` | tabla activos y tabla pasivos |
| `--color-positive` | tarjeta total activos y patrimonio positivo |
| `--color-negative` | tarjeta total pasivos y patrimonio negativo |
| `--color-primary` | botones añadir/guardar |
| `--space-*` | rejilla dos columnas Activos|Pasivos |

## Decisiones y constraints

- Rejilla de dos columnas que colapsa a una bajo 900px: Activos a la
  izquierda Pasivos a la derecha; fila de tres tarjetas resumen encima;
  gráfica de evolución del patrimonio al pie ocupando todo el ancho.
- Edición en línea con inputs numéricos y acciones confirmar/cancelar por
  fila; sin modales para mantener el flujo rápido y el código pequeño.
- Categoría de activo como select fijo (liquido/inversion/propiedad) que
  alimenta después el indicador de fondo de emergencia (F10).
- Tasa de interés mostrada en % con dos decimales.

## Alternativa descartada

- Formulario modal para altas: más clicks y estado extra; la edición inline
  cubre el caso con menos código dentro del límite de líneas.
