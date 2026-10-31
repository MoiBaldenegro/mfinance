# mfinance

App de escritorio de finanzas personales: Tauri 2 + React 19 + TypeScript
(Vite) en `src/`, backend Rust en `src-tauri/`. Datos en
`Documents/mfinance` (override con `MFINANCE_DATA_DIR`).

## Comandos

| Comando | Acción |
|---------|--------|
| `pnpm check` | Todo: tipos + tests JS + tokens + tests Rust |
| `pnpm tauri dev` | App completa con hot reload |
| `pnpm tauri build` | Instalador de producción |
| `pnpm test` | Tests JS (`node:test`) |
| `cargo test --manifest-path src-tauri/Cargo.toml` | Tests del backend |

## Arquitectura

Hexagonal en ambos lados; detalle en `docs/architecture.md`.

- `src/domain/` es puro: sin React ni `@tauri-apps/api`.
- `invoke()` solo en `src/adapters/`. Los componentes nunca importan
  adapters: reciben los puertos del composition root (`src/app/`).
- Estilos en `src/styles/`, nunca CSS en `.tsx`. Valores visuales solo desde
  `src/styles/tokens.css`; primitivas compartidas en `src/styles/ui/`.
- Backend: `domain/` → `application/` → `infrastructure/` → `commands/`,
  composition root en `src-tauri/src/lib.rs`.
- Archivos pequeños y con una responsabilidad (orientativo: ~100 líneas).
- Dependencias nuevas (npm/crates) se consultan antes con el usuario.

## Verificación

Antes de dar algo por terminado: `pnpm check` en verde y, si toca UI,
verlo en la app real (`pnpm tauri dev`) en tema oscuro y claro.
