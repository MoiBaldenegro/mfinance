# CHECKPOINTS — Criterios objetivos de "estado final correcto"

> Auto-evaluación antes de dar una tarea por terminada. Si algo de aquí no se
> cumple, la tarea NO está `done`.

## Arquitectura (docs/architecture.md)

- [x] Los estilos están en `src/styles/*.css`; ningún `.astro` contiene `<style>`.
- [x] No hay lógica JS en archivos de UI; el frontmatter solo importa y pasa datos.
- [x] Ningún componente lee JSON directamente: todo pasa por
      `src/domain/repositories`.
- [x] Colores, espaciados, radios y sombras vienen de `src/styles/tokens.css`;
      no hay valores hardcodeados.
- [x] Ningún archivo del proyecto supera las 100 líneas (o hay discusión
      registrada con estado `blocked`).
- [x] No se añadieron dependencias externas sin discusión previa.

## Datos

- [x] `src/data/*.json` es válido y sus entidades lo tipan.
- [x] Los repositorios validan y lanzan errores nombrados (`*Error`), sin
      fallos silenciosos.

## Verificación

- [x] `./init.sh` termina en verde (entorno, formato, tests al 100%, build).
      ← verificado por el reviewer de la feature 25 (2026-08-13): suite
      158/158, harness-kit 7/7, build OK con rutas /posts.
- [ ] La página se ve correcta en desktop y móvil (≤768px) sin errores en consola.
      ← pendiente inspección visual en navegador (no verificada por el reviewer).

## Harness

- [ ] `feature_list.json` tiene la tarea en `done` (y ninguna otra a medias).
      ← features 22-24 `done`; feature 25 `in_progress` a la espera de que el
      líder la marque `done` tras la revisión APPROVED.
- [x] `progress/current.md` documenta la sesión y `progress/history.md` está
      al día.
- [x] No quedan archivos temporales, `print()` de debug ni TODOs sin contexto.