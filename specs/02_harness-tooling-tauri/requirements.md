# Requisitos — harness-tooling-tauri

REQ-02-01 package.json SHALL declarar el script test con node --test en forma bare que descubra la suite bajo tests/.
REQ-02-02 WHEN se ejecuta pnpm test, el arnés SHALL ejecutar la suite node:test de tests/ en verde.
REQ-02-03 ./init.sh SHALL comprobar rustc y cargo instalados antes de lanzar el build.
REQ-02-04 IF rustc o cargo no están instalados, THEN ./init.sh SHALL abortar con un error nombrado que indique cómo instalar la toolchain Rust.
REQ-02-05 scripts/validate-dependencies.mjs SHALL validar también los crates de src-tauri/Cargo.toml contra docs/dependencies.md cubriendo dependencies build-dependencies y dev-dependencies.
REQ-02-06 docs/dependencies.md SHALL registrar las dependencias npm vigentes react react-dom @tauri-apps/api @tauri-apps/plugin-opener @types/react @types/react-dom @vitejs/plugin-react typescript vite y @tauri-apps/cli con las versiones reales del package.json.
REQ-02-07 docs/dependencies.md SHALL registrar los crates vigentes tauri tauri-plugin-opener tauri-build serde y serde_json con las versiones reales del Cargo.toml.
REQ-02-08 docs/dependencies.md SHALL incluir una nota explícita de procedencia del scaffold oficial Tauri traído por el humano sujeta a su veto.
REQ-02-09 ./init.sh SHALL terminar en verde completo validando formato tests y build del proyecto Tauri.
REQ-02-10 IF una dependencia npm o un crate carece de entrada aprobada en docs/dependencies.md, THEN scripts/validate-dependencies.mjs SHALL fallar nombrando la dependencia ausente.
