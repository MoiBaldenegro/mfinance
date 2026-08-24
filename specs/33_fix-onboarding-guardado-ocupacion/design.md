# Diseño — fix-onboarding-guardado-ocupacion (feature 33)

## Contexto visual

- Wizard de onboarding (`OnboardingWizard`): el indicador «Guardando
  cambios…» (toast fijo inferior derecho) aparece en cada pulsación del
  Paso 1 y todos los inputs se deshabilitan mientras `guardando === true`.
- Estado deseado: el toast solo se ve mientras hay IPC de persistencia en
  vuelo; los inputs del paso activo permanecen habilitados durante la
  edición y la persistencia parcial; la ocupación solo bloquea botones de
  navegación/finalización durante su propia operación.

## Tokens usados

| Token | Uso |
|-------|-----|
| `--transicion-normal` | animación slide-in del toast existente (sin cambios) |

No se introducen estilos nuevos; el cambio es de semántica de estado.

## Decisiones y constraints

- Decisión 1: extraer la semántica de ocupación a un módulo puro nuevo
  `src/domain/use-cases/onboarding/onboarding-ocupacion.ts` (máquina mínima:
  editar → ocupación false; expiración debounce → ocupación true hasta fin de
  IPC; flush siempre restablece, incluso sin pendiente o con error).
  Motivo: `use-onboarding.ts` ya tiene 100 líneas (regla dura) y el módulo
  puro es testeable con node:test sin React.
- Decisión 2: repartir la prop `deshabilitado` en dos conceptos:
  `ocupadoPersistencia` (no deshabilita inputs) vs operación bloqueante de
  navegación/completar/saltar (sí deshabilita botones durante su vuelo).
- Restricción: conservar `crearLogicaGuardado` y `DEBOUNCE_MS = 500`
  (REQ-25-06); un solo IPC por ráfaga.
- Restricción: tests node:test existentes que fijen el comportamiento roto
  se actualizan primero (TDD rojo → verde).

## Alternativa descartada

- Deshabilitar solo el input en foco durante el guardado: mantiene el defecto
  de pérdida de foco por tecla y complica el contrato de props; descartada.
