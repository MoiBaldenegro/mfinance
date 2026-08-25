# Review — feature 37

**Veredicto:** APPROVED

## Checkpoints
- C1: [x] Arquitectura respetada: `ErrorScreen.tsx:13-31` solo expone la
  transición y no importa/renderiza `GestionPerfiles`; `App.tsx:35-40`
  sustituye el error por `AjustesRecuperacion`. `PerfilProvider` queda fuera
  de `SnapshotProvider` (`App.tsx:57-63`), `invoke()` sigue limitado a
  `src/adapters/`, y no hay cambios de backend, commands o dependencias.
- C2: [x] La pantalla separada (`AjustesRecuperacion.tsx:6-21`) muestra
  únicamente Ajustes y gestión de perfiles, sin `FinanceSnapshot`; los estilos
  están en hojas separadas y usan tokens. Los archivos de producción tocados
  quedan en 100 líneas o menos, incluido `SnapshotProvider.tsx`.
- C3: [x] La evidencia TDD está documentada en `progress/impl_37.md:11-32`:
  11 tests, 6 fallos y 5 éxitos antes del código, y 11/11 después. La evidencia
  final de suite, build e `./init.sh` está en `impl_37.md:34-51`.
- C4: [x] `feature_list.json:684-687` declara `depends_on: [36]` y la feature
  36 está en `done` (`feature_list.json:650-667`). El flujo conserva
  seleccionar → confirmar → recargar (`activar-perfil.ts:21-23` y
  `cambiar-perfil.ts:31-39`); los rechazos no fijan activo ni recargan.
- C5: [x] Verificado `./init.sh`, `pnpm test`, `pnpm build` y
  `node scripts/audit-design-tokens.mjs`: todo verde. La feature permanece
  `in_progress` en el backlog únicamente hasta el cierre normal del líder.

## Verificación funcional

- `ErrorScreen` conserva motivo y `Reintentar` (`ErrorScreen.tsx:16-24`) y
  ofrece «Regresar a Ajustes» (`ErrorScreen.tsx:25-31`) sin incrustar gestión.
- Durante `cargando`/`error`, `Contenido` no monta `AppShell` ni secciones
  financieras (`App.tsx:34-40`); la recuperación no recibe snapshot y no llama
  a `recargar` (`AjustesRecuperacion.tsx:6-21`).
- Lista y activo proceden del contexto común (`PerfilProvider.tsx:12-34`), y
  `SeccionActivaProvider` conserva `ajustes` al remontar `AppShell`
  (`App.tsx:57-63`, `AppShell.tsx:48-61`).
- La guardia de `activarPerfil` (`activar-perfil.ts:15-27`) evita activaciones
  duplicadas en vuelo; la carga posterior solo nace de una selección confirmada
  o de `Reintentar`. El manejo de rechazo conserva el activo y publica el
  error nombrado mediante `GestionPerfiles.tsx:45-48` y
  `cambiar-perfil.ts:31-39`.

## Cambios requeridos

Ninguno.
