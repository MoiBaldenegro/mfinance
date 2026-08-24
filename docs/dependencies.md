# Registro de dependencias aprobadas

> **Política de aprobación**: NINGÚN agente aprueba dependencias. La
> aprobación es decisión exclusiva del humano tras discusión, materializada en
> este registro. Si una feature necesita una dependencia nueva, el agente
> marca la feature `blocked` (docs/architecture.md regla 2) y espera la
> decisión humana. El validador `scripts/validate-dependencies.mjs` (integrado
> en `scripts/check-format.mjs`, ejecutado por `./init.sh`) falla si una
> dependencia de package.json (dependencies + devDependencies) o un crate de
> src-tauri/Cargo.toml ([dependencies], [build-dependencies] y
> [dev-dependencies]) no tiene su entrada aprobada aquí.

> **Procedencia**: las dependencias de este registro son las del **scaffold
> oficial de Tauri**, traídas al proyecto por el humano junto con la app y
> registradas aquí por decisión del humano al solicitar la migración del
> arnés a este stack. Quedan **sujetas a su veto en cualquier momento**: si el
> humano retira una aprobación, se elimina del proyecto y del registro.

Formato: una entrada por dependencia aprobada. `### <package>` seguido de
líneas `- clave: valor` con `version`, `scope` (dependencies |
devDependencies para npm; nombre literal de la sección TOML para crates),
`approved` (fecha de aprobación) y `motivo`.

## npm (package.json)

### react

- version: ^19.1.0
- scope: dependencies
- approved: 2026-08-21
- motivo: librería de UI del frontend React 19

### react-dom

- version: ^19.1.0
- scope: dependencies
- approved: 2026-08-21
- motivo: renderer de React que monta la UI en la webview de Tauri

### @tauri-apps/api

- version: ^2
- scope: dependencies
- approved: 2026-08-21
- motivo: API oficial de Tauri 2; provee invoke() para el adapter IPC del frontend

### chart.js

- version: ^4.5.1
- scope: dependencies
- approved: 2026-08-21
- motivo: pedido explícito del humano en el requerimiento del producto («Usa gráficas claras con Chart.js»): gráfica de barras ingresos/gastos con línea superpuesta de ahorro acumulado en la sección P&G (REQ-07-03)

### @tauri-apps/plugin-opener

- version: ^2
- scope: dependencies
- approved: 2026-08-21
- motivo: plugin oficial de Tauri 2 para abrir URLs/rutas con la app del sistema

### @types/react

- version: ^19.1.8
- scope: devDependencies
- approved: 2026-08-21
- motivo: tipos oficiales de React para TypeScript

### @types/react-dom

- version: ^19.1.6
- scope: devDependencies
- approved: 2026-08-21
- motivo: tipos oficiales de react-dom para TypeScript

### @vitejs/plugin-react

- version: ^4.6.0
- scope: devDependencies
- approved: 2026-08-21
- motivo: plugin oficial de Vite con soporte React (fast refresh) para el dev server

### typescript

- version: ~5.8.3
- scope: devDependencies
- approved: 2026-08-21
- motivo: compilador TS; valida tipos en el build (tsc && vite build)

### vite

- version: ^7.0.4
- scope: devDependencies
- approved: 2026-08-21
- motivo: bundler y dev server del frontend (puerto fijo 1420)

### @tauri-apps/cli

- version: ^2
- scope: devDependencies
- approved: 2026-08-21
- motivo: CLI oficial de Tauri 2 (pnpm tauri dev / build)

## crates (src-tauri/Cargo.toml)

### tauri

- version: 2
- scope: dependencies
- approved: 2026-08-21
- motivo: runtime del backend Rust de la app de escritorio

### tauri-plugin-opener

- version: 2
- scope: dependencies
- approved: 2026-08-21
- motivo: lado Rust del plugin opener registrado en el composition root

### tauri-build

- version: 2
- scope: build-dependencies
- approved: 2026-08-21
- motivo: build script oficial que genera los artefactos de Tauri al compilar

### serde

- version: 1
- scope: dependencies
- approved: 2026-08-21
- motivo: serialización/deserialización de datos entre commands e IPC (derive)

### serde_json

- version: 1
- scope: dependencies
- approved: 2026-08-21
- motivo: formato JSON de la serialización en el puente IPC de Tauri

### pdf-extract

- version: =0.12
- scope: dependencies
- approved: 2026-08-22
- motivo: librería de parseo PDF para la feature 12 diagnostico-pdf, elegida tras evaluar los tres candidatos (pdf-extract vs lopdf en Rust y pdfjs-dist en npm; informes en progress/research/pdf-evaluacion-crates-rust.md, pdf-evaluacion-pdfjs-dist.md y pdf-parsing-extractos-bancarios.md). Costo: 0 (crate gratuito); licencia MIT única. Cobertura: extracción de texto de PDFs digitales con capa de texto vía extract_text_from_mem_by_pages (caso objetivo: extractos bancarios descargados del portal del banco); NO hace OCR sobre escaneos (se detectan con el umbral de ilegibilidad de 60 caracteres/página y se informan como archivo ilegible sin abortar el lote), y los pánicos documentados ante PDFs malformados (issue #141) se contienen con catch_unwind por archivo. Veredicto literal del humano como aprobación explícita: «Usa el crate pdf-extract en Rust invocado mediante un comando Tauri (#[tauri::command]). Mantendrás el frontend en React limpio, ligero y con un rendimiento nativo.» El crate vive SOLO bajo src-tauri/src/infrastructure/ detrás del puerto PdfMovimientosExtractor; versión clavada (=0.12) por semver 0.x.
