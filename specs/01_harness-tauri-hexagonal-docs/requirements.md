# Requisitos — harness-tauri-hexagonal-docs

REQ-01-01 La documentación del arnés SHALL eliminar toda referencia a Astro de AGENTS.md CLAUDE.md README.md CHECKPOINTS.md docs/ y las definiciones de agentes spec_author.
REQ-01-02 docs/architecture.md SHALL describir la arquitectura hexagonal del backend Rust con las capas domain application infrastructure y commands y el composition root con inyección de dependencias en src-tauri/src/lib.rs.
REQ-01-03 docs/architecture.md SHALL describir la arquitectura hexagonal del frontend TS con src/domain/entities src/domain/ports src/domain/use-cases src/adapters src/components y estilos desde src/styles/tokens.css.
REQ-01-04 docs/architecture.md SHALL definir un adapter Tauri IPC dentro de src/adapters que implemente los puertos del dominio mediante invoke de @tauri-apps/api.
REQ-01-05 docs/architecture.md SHALL establecer que las dependencias apuntan hacia el dominio y que el dominio carece de dependencias de framework y de tauri.
REQ-01-06 docs/architecture.md SHALL establecer que los puertos los define el núcleo y que los adapters los implementan.
REQ-01-07 docs/architecture.md SHALL prohibir que los componentes de UI invoquen invoke directamente exigiendo el paso por puertos y casos de uso.
REQ-01-08 AGENTS.md y CLAUDE.md SHALL quedar sincronizados entre sí describiendo pnpm dev con vite en el puerto 1420 pnpm tauri dev pnpm tauri build pnpm test con node:test y cargo check y cargo test en src-tauri.
REQ-01-09 docs/conventions.md SHALL definir el naming de archivos .tsx .ts .rs y .css y la estructura hexagonal de carpetas de ambos lados.
REQ-01-10 docs/verification.md SHALL documentar la verificación mediante ./init.sh y cargo check y cargo test en src-tauri sin mencionar astro dev logs ni localhost:4321.
REQ-01-11 CHECKPOINTS.md SHALL reflejar criterios de verificación del stack Tauri y de la arquitectura hexagonal.
REQ-01-12 IF una coincidencia de grep -ri astro persiste en los archivos adaptados, THEN el revisor SHALL rechazar el cierre de la feature hasta eliminarla.
