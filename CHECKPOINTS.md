# CHECKPOINTS — Criterios objetivos de "estado final correcto"

> Auto-evaluación antes de dar una tarea por terminada. Si algo de aquí no se
> cumple, la tarea NO está `done`.

## Arquitectura hexagonal (docs/architecture.md)

- [x] Las dependencias apuntan hacia el dominio en ambos lados: `src/domain/`
      no importa de React ni de `@tauri-apps/api`; `src-tauri/src/domain/` no
      depende del crate `tauri`.
- [x] Los puertos están definidos por el núcleo y los adapters los implementan;
      el adapter Tauri IPC es el único sitio que usa `invoke()`.
- [x] Ningún componente `.tsx` contiene CSS: los estilos viven en
      `src/styles/*.css` y salen de `src/styles/tokens.css`.
- [x] No hay lógica de negocio en la UI ni en los commands: vive en use-cases.
- [x] Colores, espaciados, radios y sombras vienen de tokens; nada hardcodeado.
- [x] Ningún archivo supera las 100 líneas (o hay discusión registrada con
      estado `blocked`).
- [x] No se añadieron dependencias externas (npm o crates) sin aprobación.

## Verificación

- [x] `./init.sh` termina en verde (entorno, formato, tests al 100%, build).
- [ ] `cargo check --manifest-path src-tauri/Cargo.toml` compila sin errores
      cuando la feature toca backend Rust.
- [ ] `cargo test --manifest-path src-tauri/Cargo.toml` pasa al 100% cuando la
      feature toca dominio o casos de uso Rust.
- [ ] La app arranca (`pnpm tauri dev`) y la ventana muestra la UI correcta,
      sin errores en consola, cuando la feature toca UI.

## Harness

- [ ] `feature_list.json` tiene la tarea en `done` (y ninguna otra a medias).
- [x] `progress/current.md` documenta la sesión y `progress/history.md` está
      al día.
- [x] No quedan archivos temporales, `print()`/`dbg!` de debug ni TODOs sin
      contexto.
