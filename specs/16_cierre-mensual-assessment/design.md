# Diseño — cierre-mensual-assessment

## Contexto visual

- Sección Cierre: ritual guiado de ~10 min. Fusiona extras 12 (cierre) y 13
  (consejos/assessment). Es la única UI multipaso del producto.

## Tokens usados

| Token | Uso |
|-------|-----|
| `--color-primary` | barra de progreso del wizard y botón continuar |
| `--color-positive` `--color-warn` `--color-negative` | semáforo reutilizado en el paso de repaso |
| `--color-surface` `--radius-md` | tarjeta de cada paso |
| `--space-*` | ritmo vertical entre pasos |

## Decisiones y constraints

- Wizard de 4 pasos: Repaso (flujo+patrimonio) Presupuesto siguiente
  Assessment (recomendaciones) Confirmación; barra de progreso y navegación
  atrás/continuar; estado del wizard en memoria, resultado persistido.
- Paso presupuesto pre-rellena inputs con promedio móvil de 3 meses para
  decidir rápido ("mantener" o ajustar).
- Sección Consejos independiente dentro del shell: lista priorizada con
  icono de severidad heredado del semáforo; máx. 5 visibles.
- Reglas del assessment como tabla de reglas puras testeable en backend.

## Alternativa descartada

- Página única larga con todo el ritual: pierde el carácter de ritual paso
  a paso y mezcla repaso con decisión; el wizard acota la atención.
