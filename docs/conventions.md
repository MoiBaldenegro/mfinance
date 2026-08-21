# Convenciones — Reglas de estilo, nombres y estructura

> Complementa `docs/architecture.md`. Aquí viven las decisiones concretas de
> estilo y nombres. Si algo contradice a `architecture.md`, manda la arquitectura.

## Nombres

| Qué | Convención | Ejemplo |
|-----|-----------|---------|
| Carpetas | kebab-case | `src/domain/use-cases/`, `src-tauri/src/infrastructure/` |
| Archivos `.tsx` (componentes React) | PascalCase, uno por componente | `AccountList.tsx`, `AppLayout.tsx` |
| Archivos `.ts` | PascalCase para clases/entidades/puertos, camelCase para utilidades | `Account.ts`, `AccountRepository.ts`, `formatAmount.ts` |
| Archivos `.rs` | Rust estándar: `snake_case` para módulos y funciones, `PascalCase` para tipos y traits | `account.rs`, `account_repository.rs`, trait `AccountStore` |
| Archivos `.css` | kebab-case, nombre del componente | `account-list.css`, `app-layout.css` |
| Archivos de `scripts/` | kebab-case, prefijo de verbo, ruta `scripts/<slug>.mjs` | `scripts/check-format.mjs` |
| Tipos e interfaces TS | PascalCase | `Account`, `MovementKind` |
| Traits Rust | PascalCase, sustantivo de capacidad | `AccountStore`, `RateProvider` |
| Funciones | camelCase en TS / snake_case en Rust, verbo primero | `getAccounts()` / `get_accounts()` |
| Errores | Clase/variante PascalCase + sufijo `Error`, nombre en español | `AccountDataError` |
| Custom properties | `--grupo-nombre`, kebab-case | `--color-accent`, `--shadow-card` |
| Clases CSS | BEM ligero: bloque, `--` para variantes | `.account-list`, `.account-list__item--active` |
| Mensajes de error/UI | Español | `accounts.json: la cuenta "x" tiene un saldo inválido` |

## Estructura hexagonal de carpetas

Frontend (`src/`) — dependencias siempre hacia el dominio:

- `src/domain/entities/` — una entidad = un archivo.
- `src/domain/ports/` — un puerto = una interfaz; definidos por el núcleo.
- `src/domain/use-cases/` — un caso de uso = un archivo; orquesta vía puertos.
- `src/adapters/` — implementa puertos; el adapter Tauri IPC es el único sitio
  que usa `invoke()`.
- `src/components/` — UI `.tsx`; cada uno importa su hoja de `src/styles/`.
- `src/styles/` — `tokens.css` + una hoja por componente.

Backend (`src-tauri/src/`) — dependencias siempre hacia el dominio:

- `src-tauri/src/domain/` — entidades y traits-puerto en Rust puro (sin
  dependencia de `tauri`); testeable aislado con `cargo test`.
- `src-tauri/src/application/` — casos de uso que orquestan el dominio.
- `src-tauri/src/infrastructure/` — adapters de salida que implementan puertos.
- `src-tauri/src/commands/` — handlers `#[tauri::command]` finos que delegan
  en application.
- `src-tauri/src/lib.rs` — composition root: construye adapters e inyecta
  dependencias.

Otras reglas de estructura:

- **Un script = un archivo** en `scripts/`, nombrado `scripts/<slug>.mjs`
  (kebab-case con prefijo de verbo). Verbos admitidos (lista cerrada):
  `check-`, `validate-`, `generate-`, `build-`, `deploy-`, `audit-`. Un verbo
  nuevo se añade a esta lista como extensión de contrato, nunca en silencio.
  Todo script nuevo se declara en la spec de la feature con su ruta completa.
- **Una spec por feature** en `specs/<NN>_<name>/`: `requirements.md`
  (SIEMPRE, EARS estricto) y `design.md` (solo si la feature toca UI).
  `<NN>` = id con padding a 2 dígitos; plantillas en `specs/_template/`.

## Orden dentro de un componente `.tsx`

1. Imports (estilos, dominio, tipos).
2. Props tipadas (`readonly`), sin lógica de negocio.
3. Marcado JSX semántico; los datos llegan de casos de uso/puertos.
4. Sin estilos inline ni CSS embebido: la hoja vive en `src/styles/`.

## Dependencias

- **Ningún agente aprueba dependencias**: la aprobación es decisión exclusiva del humano,
  tras discusión, y queda materializada en el registro. Si una feature necesita
  una dependencia nueva (paquete npm o crate), el agente marca la feature
  `blocked` y espera la decisión.
- La aprobación se materializa en `docs/dependencies.md` con formato de
  bloques: `### <package>` seguido de líneas `- clave: valor` con `version`,
  `scope`, `approved` y `motivo`.
- El validador `scripts/validate-dependencies.mjs` (integrado en
  `scripts/check-format.mjs`) falla si una dependencia no tiene su entrada
  aprobada en el registro.

## Commits

- Mensajes en inglés, verbos imperativos, concisos: `add account list`,
  `fix amount rounding`.
- Un commit por feature o fix; sin cambios no relacionados mezclados.
