# Implementación — feature 36

## Alcance

Recuperación desde el error de carga del perfil activo sin mostrar snapshots
anteriores, reutilizando el puerto y la gestión de perfiles existentes.

## Evidencia TDD

### Rojo, antes del código de producción

Comando:

```text
node --test tests/recuperacion-error-perfil/*.test.mjs
```

Resultado observado contra el código inicial: `7 tests`, `4 failed`, `3 passed`.
Fallaron los contratos porque `ErrorScreen` no tenía «Gestionar perfiles», no
existía `PerfilProvider` y `AppShell` todavía alojaba exclusivamente el
contexto de perfiles.

### Verde

Comando de tests de feature:

```text
node --test tests/recuperacion-error-perfil/*.test.mjs
```

Resultado: `7 tests`, `7 passed`, `0 failed`.

Comandos de verificación final:

```text
pnpm test
```

Resultado: `628 tests`, `628 passed`, `0 failed`.

```text
pnpm build
```

Resultado: TypeScript y Vite completados correctamente.

```text
./init.sh
```

Resultado: herramientas, formato, tests al 100% y build de producción en
verde.

## Cambios

- `src/components/shell/PerfilProvider.tsx`: proveedor común que carga y
  conserva lista/activo mediante `cargarPerfiles(perfilPort)` fuera de
  `AppShell`.
- `src/App.tsx`: monta `PerfilProvider` por fuera de `SnapshotProvider`, por
  lo que la gestión sobrevive a estados `cargando` y `error`.
- `src/components/error-screen/ErrorScreen.tsx`: añade «Gestionar perfiles»,
  conserva título, motivo y «Reintentar», y muestra la gestión existente sin
  recibir snapshots.
- `src/components/shell/AppShell.tsx`: elimina estado duplicado y publica la
  shell con el contexto común.
- `src/components/shell/SnapshotProvider.tsx`: invalida inmediatamente el
  snapshot al iniciar una recarga para no renderizar datos anteriores.
- `src/styles/perfil-provider.css`: hoja asociada al nuevo componente según
  la convención del proyecto.
- `tests/recuperacion-error-perfil/*.test.mjs`: contratos TDD de pantalla,
  proveedor y flujo selección-confirmación-recarga.

No se añadieron commands, dependencias ni cambios de backend. Los archivos
tocados cumplen el límite de 100 líneas; `SnapshotProvider.tsx` queda en 100.
La feature continúa `in_progress`; no se marca `done` sin
`progress/review_36.md` con veredicto `APPROVED`.
