# Guía: configurar el auto-updater de mfinance

Plan de trabajo por pasos atómicos para activar actualizaciones automáticas en la app
(Tauri 2 + React 19 + TypeScript, backend Rust).

**Decisiones que asume esta guía**

- Servidor de actualizaciones: **GitHub Releases** (`latest.json`) del repo
  `MoiBaldenegro/mfinance`.
- Firma obligatoria con **minisign** (Tauri no permite desactivarla).
- Primera entrega: **Windows x64**. macOS/Linux quedan como fase opcional.
- UI integrada respetando la arquitectura hexagonal del proyecto: puerto en
  `src/domain/ports/`, adapter Tauri en `src/adapters/`, composición en
  `src/app/composicion.ts`.
- El updater descarga desde Rust, así que **no hace falta modificar el CSP**.

---

## Índice

1. [Fase 0 — Preparación](#fase-0--preparación)
2. [Fase 1 — Claves de firma](#fase-1--generar-y-guardar-las-claves-de-firma)
3. [Fase 2 — Plugin en Rust](#fase-2--instalar-y-registrar-el-plugin-en-rust)
4. [Fase 3 — Configuración y permisos](#fase-3--configurar-tauriconfjson-y-permisos)
5. [Fase 4 — UI hexagonal](#fase-4--integrar-la-ui-con-la-arquitectura-del-proyecto)
6. [Fase 5 — Versionado](#fase-5--versionado-coherente)
7. [Fase 6 — GitHub Actions](#fase-6--publicación-automática-en-github-releases)
8. [Fase 7 — Prueba extremo a extremo](#fase-7--prueba-de-extremo-a-extremo)
9. [Fase 8 — macOS y Linux (opcional)](#fase-8--opcional-macos-y-linux)
10. [Fase 9 — Documentación y mantenimiento](#fase-9--documentación-y-mantenimiento)

**Orden recomendado:** Fases 1 → 2 → 3 → 5 → 6 → 7 primero (updater funcionando sin
UI) y después la Fase 4 (interfaz). Así aíslas los fallos de configuración de los de
interfaz.

---

## Fase 0 — Preparación

- [ ] **1. Crear una rama de trabajo.**

```bash
git checkout -b feat/autoupdater
```

- [ ] **2. Confirmar versiones mínimas.** El plugin updater requiere Rust ≥ 1.90.

```bash
rustc --version
pnpm tauri --version
gh auth status
```

- [ ] **3. Confirmar que no hay un updater ya configurado.**

```bash
grep -R "tauri-plugin-updater\|createUpdaterArtifacts\|plugins.*updater" src-tauri package.json
```

Debe salir vacío. Si sale algo, revísalo antes de continuar.

---

## Fase 1 — Generar y guardar las claves de firma

- [ ] **4. Crear la carpeta de claves.**

```bash
mkdir -p "$HOME/.tauri"
```

- [ ] **5. Generar el par de claves.** Usa una contraseña fuerte y guárdala en tu
  gestor de contraseñas.

```bash
pnpm tauri signer generate -w "$HOME/.tauri/mfinance.key"
```

Se generan:

```text
~/.tauri/mfinance.key
~/.tauri/mfinance.key.pub
```

- [ ] **6. Leer la clave pública.** Ese contenido exacto va luego en
  `tauri.conf.json` (no la ruta del archivo).

```bash
cat "$HOME/.tauri/mfinance.key.pub"
```

- [ ] **7. Respaldar la clave privada.** Cópiala a un lugar seguro fuera del repo.
  Si la pierdes, las instalaciones existentes no podrán actualizarse.

- [ ] **8. Evitar que las claves entren a git.** Añade al final de `.gitignore`:

```gitignore
*.key
*.key.pub
```

- [ ] **9. Guardar los secretos en GitHub.**

```bash
gh secret set TAURI_SIGNING_PRIVATE_KEY < "$HOME/.tauri/mfinance.key"
gh secret set TAURI_SIGNING_PRIVATE_KEY_PASSWORD
```

El segundo comando pide la contraseña de forma interactiva.

- [ ] **10. Verificar los secretos.**

```bash
gh secret list
```

Deben aparecer `TAURI_SIGNING_PRIVATE_KEY` y
`TAURI_SIGNING_PRIVATE_KEY_PASSWORD`.

---

## Fase 2 — Instalar y registrar el plugin en Rust

- [ ] **11. Añadir el plugin updater.**

```bash
pnpm tauri add updater
```

- [ ] **12. Añadir el plugin process** (necesario para `relaunch`).

```bash
pnpm tauri add process
```

- [ ] **13. Revisar los cambios automáticos.**

```bash
git diff -- src-tauri/Cargo.toml src-tauri/src/lib.rs package.json
```

El CLI debe haber añadido:

```toml
tauri-plugin-updater = "2"
tauri-plugin-process = "2"
```

- [ ] **14. Verificar `src-tauri/src/lib.rs`.** El builder debe tener los plugins
  antes del `.setup(...)`:

```rust
tauri::Builder::default()
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(tauri_plugin_process::init())
    .setup(|app| {
        // ...
        Ok(())
    })
```

Si el CLI no los añadió, agrégalos a mano.

- [ ] **15. Compilar el backend.**

```bash
cargo check --manifest-path src-tauri/Cargo.toml
```

---

## Fase 3 — Configurar `tauri.conf.json` y permisos

- [ ] **16. Activar la generación de artefactos de actualización.** Dentro de
  `"bundle"`:

```json
"createUpdaterArtifacts": true
```

- [ ] **17. Añadir la configuración del updater.** A nivel raíz del JSON, junto a
  `"bundle"`:

```json
"plugins": {
  "updater": {
    "pubkey": "CONTENIDO_COMPLETO_DE_mfinance.key.pub",
    "endpoints": [
      "https://github.com/MoiBaldenegro/mfinance/releases/latest/download/latest.json"
    ],
    "windows": {
      "installMode": "passive"
    }
  }
}
```

Reemplaza `CONTENIDO_COMPLETO...` por el texto del paso 6. No uses una ruta de
archivo.

- [ ] **18. Dar permisos de updater y reinicio.** En
  `src-tauri/capabilities/default.json`:

```json
"permissions": [
  "core:default",
  "updater:default",
  "process:allow-restart"
]
```

- [ ] **19. Validar el JSON y la configuración.**

```bash
pnpm tauri info
```

- [ ] **20. Verificar que el backend sigue compilando.**

```bash
cargo check --manifest-path src-tauri/Cargo.toml
```

---

## Fase 4 — Integrar la UI con la arquitectura del proyecto

- [ ] **21. Crear el puerto de dominio** `src/domain/ports/actualizador-port.ts`:

```ts
export interface ActualizacionDisponible {
  readonly version: string;
  readonly notas: string | null;
  readonly fecha: string | null;
}

export interface ProgresoActualizacion {
  readonly descargado: number;
  readonly total: number | null;
}

export interface ActualizadorPort {
  versionActual(): Promise<string>;
  buscar(): Promise<ActualizacionDisponible | null>;
  descargarEInstalar(
    alProgreso: (progreso: ProgresoActualizacion) => void,
  ): Promise<void>;
  reiniciar(): Promise<void>;
}
```

- [ ] **22. Crear el adapter Tauri** `src/adapters/actualizador-tauri-adapter.ts`.
  Es el único archivo que importa el plugin:

```ts
import { getVersion } from '@tauri-apps/api/app';
import { relaunch } from '@tauri-apps/plugin-process';
import { check, type Update } from '@tauri-apps/plugin-updater';
import type {
  ActualizacionDisponible,
  ActualizadorPort,
  ProgresoActualizacion,
} from '../domain/ports/actualizador-port.ts';

let pendiente: Update | null = null;

class ActualizadorTauriAdapter implements ActualizadorPort {
  versionActual(): Promise<string> {
    return getVersion();
  }

  async buscar(): Promise<ActualizacionDisponible | null> {
    pendiente = await check();
    if (!pendiente) return null;
    return {
      version: pendiente.version,
      notas: pendiente.body ?? null,
      fecha: pendiente.date ?? null,
    };
  }

  async descargarEInstalar(
    alProgreso: (progreso: ProgresoActualizacion) => void,
  ): Promise<void> {
    if (!pendiente) throw new Error('No hay una actualización pendiente');
    let descargado = 0;
    let total: number | null = null;

    await pendiente.downloadAndInstall((evento) => {
      if (evento.event === 'Started') {
        total = evento.data.contentLength ?? null;
      } else if (evento.event === 'Progress') {
        descargado += evento.data.chunkLength;
      }
      alProgreso({ descargado, total });
    });

    pendiente = null;
  }

  async reiniciar(): Promise<void> {
    await relaunch();
  }
}

export const actualizadorPort: ActualizadorPort = new ActualizadorTauriAdapter();
```

- [ ] **23. Registrar el puerto en `src/app/puertos.ts`.** Añade el tipo y la
  propiedad:

```ts
import type { ActualizadorPort } from '../domain/ports/actualizador-port.ts';

export interface Puertos {
  // ...
  readonly actualizador: ActualizadorPort;
}
```

- [ ] **24. Inyectar el adapter en `src/app/composicion.ts`.**

```ts
import { actualizadorPort } from '../adapters/actualizador-tauri-adapter.ts';

export const puertosDeProduccion = {
  // ...
  actualizador: actualizadorPort,
} as const;
```

- [ ] **25. Crear el hook de estado** `src/hooks/use-actualizaciones.ts` con los
  estados: `inactivo`, `disponible`, `descargando`, `instalada`, `error`. La
  comprobación se dispara sola al montar el hook y los fallos de red son
  silenciosos. Debe usar `usarPuertos().actualizador` y nunca importar
  `@tauri-apps/*`.

- [ ] **26. Crear el componente**
  `src/components/actualizaciones/ActualizacionesAuto.tsx`:
  - No tiene botón de “Buscar”: la detección es automática al arrancar.
  - Si hay actualización: versión nueva, notas, “Actualizar ahora” y “Más tarde”.
  - Durante la descarga: `<progress>` nativo y sin opción de cerrar.
  - Al terminar: “Reiniciar ahora” o “Más tarde”.
  - Errores de instalación con `role="alert"`; los de la comprobación automática
    no se muestran.

- [ ] **27. Montar el componente en `App.tsx`**, una sola vez y dentro de los
  providers, para que el aviso aparezca sobre cualquier pantalla:

```tsx
<SnapshotProvider>
  <Contenido />
  <ActualizacionesAuto />
</SnapshotProvider>
```

- [ ] **28. Añadir estilos** en `src/styles/actualizaciones-auto.css`. Usa solo
  variables de `src/styles/tokens.css`; no escribas colores literales.

- [ ] **29. Pasar la auditoría de arquitectura y tokens.**

```bash
pnpm test
pnpm lint:tokens
```

Los tests de `tests/arquitectura` deben seguir en verde: `@tauri-apps/*` solo puede
aparecer dentro de `src/adapters/`.

- [ ] **30. Comprobar el arranque automático.** La app consulta el endpoint sin
  bloquear la carga y solo avisa si hay versión nueva. No descarga ni instala
  hasta que el usuario pulsa “Actualizar ahora”.

---

## Fase 5 — Versionado coherente

- [ ] **31. Subir la versión en los tres sitios.** Deben coincidir siempre:

```text
package.json                    -> "version"
src-tauri/Cargo.toml            -> [package] version
src-tauri/tauri.conf.json       -> version
```

Ejemplo:

```bash
pnpm version patch --no-git-tag-version
```

Luego edita a mano `src-tauri/Cargo.toml` y `src-tauri/tauri.conf.json` a la misma
versión.

- [ ] **32. Actualizar `Cargo.lock`.**

```bash
cargo check --manifest-path src-tauri/Cargo.toml
```

- [ ] **33. Verificar que no hay desajustes.**

```bash
node -e "const p=require('./package.json'),t=require('./src-tauri/tauri.conf.json'); console.log(p.version,t.version)"
grep '^version' src-tauri/Cargo.toml
```

- [ ] **34. Confirmar que no se commiteó ninguna clave.**

```bash
git status --short
git diff --stat
```

---

## Fase 6 — Publicación automática en GitHub Releases

- [ ] **35. Crear `.github/workflows/release.yml`.** Versión inicial solo Windows:

```yaml
name: release

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: write

jobs:
  publish:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v7

      - uses: pnpm/action-setup@v4
        with:
          version: 10

      - uses: actions/setup-node@v6
        with:
          node-version: lts/*
          cache: pnpm

      - uses: dtolnay/rust-toolchain@stable

      - uses: swatinem/rust-cache@v2
        with:
          workspaces: './src-tauri -> target'

      - run: pnpm install --frozen-lockfile

      - run: pnpm check

      - uses: tauri-apps/tauri-action@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
          TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
        with:
          tagName: v__VERSION__
          releaseName: 'mfinance v__VERSION__'
          releaseBody: 'Instalador y actualización automática de mfinance v__VERSION__.'
          releaseDraft: true
          prerelease: false
          uploadUpdaterJson: true
          updaterJsonPreferNsis: true
          args: ''
```

- [ ] **36. Commit y push de la configuración.**

```bash
git add .
git commit -m "feat: configurar auto-updater"
git push -u origin feat/autoupdater
```

- [ ] **37. Hacer push a `main`.** El push dispara el workflow y `tauri-action`
  crea el tag `v__VERSION__` y el borrador del release:

```bash
git push origin main
```

También se puede lanzar a mano desde **Actions → release → Run workflow**.

- [ ] **38. Revisar el borrador de release.** Debe contener:
  - `mfinance_..._x64-setup.exe`
  - `mfinance_..._x64-setup.nsis.zip`
  - `mfinance_..._x64-setup.nsis.zip.sig`
  - `latest.json`

- [ ] **39. Verificar que `latest.json` tenga la firma y URL correctas.** La
  `signature` debe coincidir con el contenido del `.sig`.

- [ ] **40. Publicar el release.** `latest.json` no es visible en
  `releases/latest` mientras el release sea borrador.

---

## Fase 7 — Prueba de extremo a extremo

- [ ] **41. Descargar e instalar la versión 1.0.0** desde el release publicado.

- [ ] **42. Subir la versión a 1.0.1** siguiendo la Fase 5.

- [ ] **43. Ejecutar de nuevo el workflow y publicar el release 1.0.1.**

- [ ] **44. Abrir la app 1.0.0 instalada.**
  - Al arrancar debe detectar `1.0.1` sola y mostrar el diálogo.
  - Pulsar “Actualizar ahora”, esperar la descarga y “Reiniciar ahora”.
  - La app debe mostrar `1.0.1`.

- [ ] **45. Probar casos de error:**
  - Sin conexión: la comprobación automática falla en silencio, sin interrumpir.
  - Ya actualizado: no aparece ningún aviso.
  - Firma inválida: la instalación debe rechazarse y mostrar el error.
  - Verificar que los datos de `Documents/mfinance` siguen intactos tras actualizar.

- [ ] **46. Ejecutar la verificación completa del proyecto.**

```bash
pnpm check
```

---

## Fase 8 — Opcional: macOS y Linux

- [ ] **47. Añadir la matriz al workflow** con `macos-latest`, `ubuntu-22.04` y los
  `args` de arquitectura.

- [ ] **48. Añadir dependencias de Linux:**

```yaml
- name: Dependencias Linux
  if: matrix.platform == 'ubuntu-22.04'
  run: |
    sudo apt-get update
    sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf xdg-utils
```

- [ ] **49. Configurar firma de macOS.** El updater de macOS requiere que la app
  esté firmada; sin certificado Apple, usa ad-hoc signing para que Gatekeeper no
  marque el binario como dañado.

- [ ] **50. Opcional Windows: certificado de code signing.** La firma minisign del
  updater es obligatoria, pero no evita SmartScreen. Para eso hace falta un
  certificado Authenticode aparte.

---

## Fase 9 — Documentación y mantenimiento

- [ ] **51. Documentar el proceso en `README.md`:** cómo subir versión, ejecutar el
  workflow, publicar el release y qué hacer si falla.

- [ ] **52. Regla de oro:** nunca borrar releases publicados ni regenerar la clave
  privada. Si se pierde, las instalaciones antiguas dejan de recibir
  actualizaciones.

- [ ] **53. Rotación de clave:** si algún día hace falta, primero publica una versión
  firmada con la clave vieja que incluya la nueva clave pública, y solo después
  empieza a firmar con la nueva.

- [ ] **54. Mantener `latest.json` siempre en el release más reciente publicado.** Un
  release nuevo sin `latest.json` rompe la comprobación de actualizaciones.
