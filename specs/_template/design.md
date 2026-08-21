# Plantilla de diseño (SOLO si la feature toca UI/presentación)

> **No crear `design.md` si la feature no toca UI ni presentación.** Esta
> plantilla se copia a `specs/<NN>_<name>/design.md` únicamente cuando la
> feature afecta a la interfaz (componentes de UI del stack, estilos, layout,
> responsive, tipografía visible, etc.). La decisión la toma el spec_author.
> Si no toca UI, la carpeta `specs/<NN>_<name>/` contiene solo
> `requirements.md`.

## Contexto visual

- ¿Qué pantalla, sección o componente se ve afectado?
- ¿Estado actual y estado deseado?

## Tokens usados (solo de los tokens del diseño del proyecto)

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-...` | ... | ... |
| `--text-...`  | ... | ... |

## Decisiones y constraints

- Decisión 1: ... (y por qué).
- Restricción del proyecto aplicable (estático por defecto, sin dependencias,
  ≤100 líneas por archivo, estilos separados de la UI, tokens).

## Alternativa descartada

- Alternativa considerada: ...
- Motivo del descarte: ...